import { PRODUCT_TAXONOMY } from '@/lib/product-taxonomy';
import { normalizeOfferingImageUrls } from '@/lib/service-offering-images';
import { DEFAULT_SERVICES_TAXONOMY } from '@/lib/services-taxonomy';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { filterProductsByVerifiedVendor } from '@/lib/vendor-verification';
import {
  type CategorySuggestion,
  type CategorySuggestionType,
  type SearchProductResult,
  type SearchServiceResult,
  type SiteSearchResults,
  escapeIlikePattern,
  scoreSearchText,
} from '@/lib/site-search-utils';

function isMissingServiceOfferingsTable(error: { message?: string } | null) {
  const msg = String(error?.message ?? '').toLowerCase();
  return msg.includes('does not exist') && msg.includes('service_offerings');
}

function categoryPriority(type: CategorySuggestionType) {
  return type === 'subSubcategory' ? 3 : type === 'subcategory' ? 2 : 1;
}

function mergeCategorySuggestions(
  lists: CategorySuggestion[],
  query: string,
  limit: number,
): CategorySuggestion[] {
  const map = new Map<string, CategorySuggestion>();

  for (const suggestion of lists) {
    const key = `${suggestion.kind}::${suggestion.type}::${suggestion.value}::${suggestion.parentCategory ?? ''}::${suggestion.parentSubcategory ?? ''}`;
    const existing = map.get(key);
    if (existing) {
      if (!existing.image && suggestion.image) existing.image = suggestion.image;
      continue;
    }
    map.set(key, suggestion);
  }

  return Array.from(map.values())
    .sort((a, b) => {
      const sa = scoreSearchText(query, a.value);
      const sb = scoreSearchText(query, b.value);
      if (sb !== sa) return sb - sa;
      const pa = categoryPriority(a.type);
      const pb = categoryPriority(b.type);
      if (pb !== pa) return pb - pa;
      if (a.kind !== b.kind) return a.kind === 'product' ? -1 : 1;
      return a.label.localeCompare(b.label);
    })
    .slice(0, limit);
}

function buildInventoryCategorySuggestions(
  kind: 'product' | 'service',
  items: Array<{
    category: string | null;
    subcategory: string | null;
    subSubcategory?: string | null;
    image: string | null;
  }>,
  query: string,
  includeSubSubcategory: boolean,
): CategorySuggestion[] {
  const qLower = query.trim().toLowerCase();
  const map = new Map<string, CategorySuggestion>();

  for (const item of items) {
    const category = item.category?.trim() || null;
    const subcategory = item.subcategory?.trim() || null;
    const subSubcategory = item.subSubcategory?.trim() || null;
    const image = item.image;

    const candidates: Array<{
      type: CategorySuggestionType;
      value: string | null;
      parentCategory: string | null;
      parentSubcategory: string | null;
      context: string | null;
    }> = [
      {
        type: 'category',
        value: category,
        parentCategory: null,
        parentSubcategory: null,
        context: kind === 'service' ? 'Services' : 'Products',
      },
      {
        type: 'subcategory',
        value: subcategory,
        parentCategory: category,
        parentSubcategory: null,
        context: category,
      },
    ];

    if (includeSubSubcategory) {
      candidates.push({
        type: 'subSubcategory',
        value: subSubcategory,
        parentCategory: category,
        parentSubcategory: subcategory,
        context: [subcategory, category].filter(Boolean).join(' • ') || null,
      });
    }

    for (const candidate of candidates) {
      if (!candidate.value) continue;
      if (qLower && scoreSearchText(query, candidate.value) <= 0) continue;

      const key = `${kind}::${candidate.type}::${candidate.value}::${candidate.parentCategory ?? ''}::${candidate.parentSubcategory ?? ''}`;
      const existing = map.get(key);
      if (existing) {
        if (!existing.image && image) existing.image = image;
        continue;
      }

      map.set(key, {
        kind,
        type: candidate.type,
        value: candidate.value,
        parentCategory: candidate.parentCategory,
        parentSubcategory: candidate.parentSubcategory,
        label: candidate.value,
        context: candidate.context,
        image,
      });
    }
  }

  return Array.from(map.values());
}

function searchProductTaxonomy(query: string): CategorySuggestion[] {
  const qLower = query.trim().toLowerCase();
  if (!qLower) return [];

  const results: CategorySuggestion[] = [];

  for (const node of PRODUCT_TAXONOMY) {
    if (scoreSearchText(query, node.category) > 0) {
      results.push({
        kind: 'product',
        type: 'category',
        value: node.category,
        parentCategory: null,
        parentSubcategory: null,
        label: node.category,
        context: 'Product category',
        image: null,
      });
    }

    for (const sub of node.subcategories) {
      if (scoreSearchText(query, sub.name) > 0) {
        results.push({
          kind: 'product',
          type: 'subcategory',
          value: sub.name,
          parentCategory: node.category,
          parentSubcategory: null,
          label: sub.name,
          context: node.category,
          image: null,
        });
      }

      for (const subSub of sub.subSubcategories) {
        if (scoreSearchText(query, subSub) > 0) {
          results.push({
            kind: 'product',
            type: 'subSubcategory',
            value: subSub,
            parentCategory: node.category,
            parentSubcategory: sub.name,
            label: subSub,
            context: `${sub.name} • ${node.category}`,
            image: null,
          });
        }
      }
    }
  }

  return results;
}

function searchServiceTaxonomy(query: string): CategorySuggestion[] {
  const qLower = query.trim().toLowerCase();
  if (!qLower) return [];

  const results: CategorySuggestion[] = [];

  for (const section of DEFAULT_SERVICES_TAXONOMY) {
    if (scoreSearchText(query, section.title) > 0) {
      results.push({
        kind: 'service',
        type: 'category',
        value: section.title,
        parentCategory: null,
        parentSubcategory: null,
        label: section.title,
        context: 'Service category',
        image: null,
      });
    }

    for (const item of section.items) {
      if (scoreSearchText(query, item) > 0) {
        results.push({
          kind: 'service',
          type: 'subcategory',
          value: item,
          parentCategory: section.title,
          parentSubcategory: null,
          label: item,
          context: section.title,
          image: null,
        });
      }
    }
  }

  return results;
}

export async function runSiteSearch(
  query: string,
  options?: { itemLimit?: number; categoryLimit?: number },
): Promise<SiteSearchResults> {
  const q = query.trim();
  const escaped = escapeIlikePattern(q);
  const itemLimit = options?.itemLimit ?? 12;
  const categoryLimit = options?.categoryLimit ?? 10;

  const productBaseQuery = supabaseAdmin
    .from('products')
    .select(
      'id, vendor_id, name, category, subcategory, sub_subcategory, price, images, in_stock, is_featured',
    )
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(itemLimit);

  const productQueryBuilder =
    q.length < 1
      ? productBaseQuery
      : productBaseQuery.or(
          [
            `name.ilike.%${escaped}%`,
            `description.ilike.%${escaped}%`,
            `category.ilike.%${escaped}%`,
            `subcategory.ilike.%${escaped}%`,
            `sub_subcategory.ilike.%${escaped}%`,
          ].join(','),
        );

  const serviceBaseQuery = supabaseAdmin
    .from('service_offerings')
    .select(
      'id, title, description, category, subcategory, pricing_type, rate, currency, images, is_active, is_featured',
    )
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(itemLimit);

  const serviceQueryBuilder =
    q.length < 1
      ? serviceBaseQuery
      : serviceBaseQuery.or(
          [
            `title.ilike.%${escaped}%`,
            `description.ilike.%${escaped}%`,
            `category.ilike.%${escaped}%`,
            `subcategory.ilike.%${escaped}%`,
          ].join(','),
        );

  const [{ data, error }, serviceResult] = await Promise.all([
    productQueryBuilder,
    serviceQueryBuilder,
  ]);

  if (error) {
    throw new Error(error.message);
  }

  if (serviceResult.error && !isMissingServiceOfferingsTable(serviceResult.error)) {
    console.error('[runSiteSearch services]', serviceResult.error.message);
  }

  const filtered = await filterProductsByVerifiedVendor((data ?? []) as any[]);
  const serviceRows =
    serviceResult.error && !isMissingServiceOfferingsTable(serviceResult.error)
      ? []
      : (serviceResult.data ?? []);

  const products: SearchProductResult[] = filtered.map((item: any) => ({
    id: String(item.id),
    name: String(item.name ?? ''),
    category: String(item.category ?? ''),
    subcategory: String(item.subcategory ?? ''),
    subSubcategory: String(item.sub_subcategory ?? ''),
    image: item.images?.[0] ?? null,
    price: Number(item.price ?? 0),
    currency: 'USD',
    inStock: Boolean(item.in_stock),
    featured: Boolean(item.is_featured),
  }));

  const services: SearchServiceResult[] = (serviceRows as any[]).map((item) => {
    const images = normalizeOfferingImageUrls(item.images);
    const pricingType =
      String(item.pricing_type ?? 'fixed').toLowerCase() === 'hourly' ? 'hourly' : 'fixed';
    return {
      id: String(item.id),
      title: String(item.title ?? ''),
      category: String(item.category ?? ''),
      subcategory: String(item.subcategory ?? ''),
      image: images[0] ?? null,
      pricingType,
      rate: Number(item.rate ?? 0),
      currency: String(item.currency ?? 'USD').toUpperCase(),
      featured: Boolean(item.is_featured),
    };
  });

  const productInventoryCategories = buildInventoryCategorySuggestions(
    'product',
    (filtered as any[]).map((item) => ({
      category: item.category ?? null,
      subcategory: item.subcategory ?? null,
      subSubcategory: item.sub_subcategory ?? null,
      image: item.images?.[0] ?? null,
    })),
    q,
    true,
  );

  const serviceInventoryCategories = buildInventoryCategorySuggestions(
    'service',
    (serviceRows as any[]).map((item) => ({
      category: item.category ?? null,
      subcategory: item.subcategory ?? null,
      image: normalizeOfferingImageUrls(item.images)[0] ?? null,
    })),
    q,
    false,
  );

  const taxonomyCategories = q
    ? [...searchProductTaxonomy(q), ...searchServiceTaxonomy(q)]
    : [];

  const categories = mergeCategorySuggestions(
    [...productInventoryCategories, ...serviceInventoryCategories, ...taxonomyCategories],
    q,
    categoryLimit,
  );

  return { products, services, categories };
}
