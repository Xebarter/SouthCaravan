import { NextRequest, NextResponse } from 'next/server';
import { normalizeOfferingImageUrls } from '@/lib/service-offering-images';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { filterProductsByVerifiedVendor } from '@/lib/vendor-verification';

type CategorySuggestionType = 'category' | 'subcategory' | 'subSubcategory';

type CategorySuggestion = {
  type: CategorySuggestionType;
  value: string;
  parentCategory: string | null;
  parentSubcategory: string | null;
  label: string;
  context: string | null;
  image: string | null;
};

function isMissingServiceOfferingsTable(error: { message?: string } | null) {
  const msg = String(error?.message ?? '').toLowerCase();
  return msg.includes('does not exist') && msg.includes('service_offerings');
}

function buildCategorySuggestions(
  items: Array<{
    category: string | null;
    subcategory: string | null;
    subSubcategory?: string | null;
    image: string | null;
  }>,
  qLower: string,
  scoreText: (value: string) => number,
  includeSubSubcategory: boolean,
): CategorySuggestion[] {
  const suggestionsMap = new Map<string, CategorySuggestion>();

  for (const item of items) {
    const category = item.category ?? null;
    const subcategory = item.subcategory ?? null;
    const subSubcategory = item.subSubcategory ?? null;
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
        context: null,
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

    for (const c of candidates) {
      if (!c.value) continue;
      const s = scoreText(c.value);
      if (qLower && s <= 0) continue;

      const key = `${c.type}::${c.value}::${c.parentCategory ?? ''}::${c.parentSubcategory ?? ''}`;
      const existing = suggestionsMap.get(key);

      if (existing) {
        if (!existing.image && image) existing.image = image;
        continue;
      }

      suggestionsMap.set(key, {
        type: c.type,
        value: c.value,
        parentCategory: c.parentCategory,
        parentSubcategory: c.parentSubcategory,
        label: c.value,
        context: c.context,
        image,
      });
    }
  }

  return Array.from(suggestionsMap.values()).sort((a, b) => {
    const sa = scoreText(a.value);
    const sb = scoreText(b.value);
    if (sb !== sa) return sb - sa;
    const priority = (t: CategorySuggestionType) =>
      t === 'subSubcategory' ? 3 : t === 'subcategory' ? 2 : 1;
    const pa = priority(a.type);
    const pb = priority(b.type);
    if (pb !== pa) return pb - pa;
    return a.label.localeCompare(b.label);
  });
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  const escaped = q.replace(/[%_]/g, '');

  const productBaseQuery = supabaseAdmin
    .from('products')
    .select(
      'id, vendor_id, name, category, subcategory, sub_subcategory, images, in_stock, is_featured',
    )
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(12);

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
    .limit(12);

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
    console.error('[search GET products]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (serviceResult.error && !isMissingServiceOfferingsTable(serviceResult.error)) {
    console.error('[search GET services]', serviceResult.error.message);
  }

  const filtered = await filterProductsByVerifiedVendor((data ?? []) as any[]);
  const serviceRows =
    serviceResult.error && !isMissingServiceOfferingsTable(serviceResult.error)
      ? []
      : (serviceResult.data ?? []);

  const products = filtered.map((item: any) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    subcategory: item.subcategory,
    subSubcategory: item.sub_subcategory,
    image: item.images?.[0] ?? null,
    inStock: item.in_stock,
    featured: item.is_featured,
  }));

  const services = (serviceRows as any[]).map((item) => {
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

  const qLower = q.trim().toLowerCase();
  const scoreText = (value: string) => {
    if (!qLower) return 0;
    const v = value.toLowerCase();
    if (v === qLower) return 200;
    if (v.startsWith(qLower)) return 160;
    if (v.includes(qLower)) return 110;
    return 0;
  };

  const categories = buildCategorySuggestions(
    (filtered as any[]).map((item) => ({
      category: item.category ?? null,
      subcategory: item.subcategory ?? null,
      subSubcategory: item.sub_subcategory ?? null,
      image: item.images?.[0] ?? null,
    })),
    qLower,
    scoreText,
    true,
  ).slice(0, 8);

  const serviceCategories = buildCategorySuggestions(
    (serviceRows as any[]).map((item) => ({
      category: item.category ?? null,
      subcategory: item.subcategory ?? null,
      image: normalizeOfferingImageUrls(item.images)[0] ?? null,
    })),
    qLower,
    scoreText,
    false,
  ).slice(0, 8);

  return NextResponse.json({ products, services, categories, serviceCategories });
}
