import { NextRequest, NextResponse } from 'next/server';
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

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';

  const baseQuery = supabaseAdmin
    .from('products')
    .select(
      'id, vendor_id, name, category, subcategory, sub_subcategory, images, in_stock, is_featured',
    )
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(12);

  const escaped = q.replace(/[%_]/g, '');
  const queryBuilder =
    q.length < 1
      ? baseQuery
      : baseQuery.or(
          [
            `name.ilike.%${escaped}%`,
            `description.ilike.%${escaped}%`,
            `category.ilike.%${escaped}%`,
            `subcategory.ilike.%${escaped}%`,
            `sub_subcategory.ilike.%${escaped}%`,
          ].join(','),
        );

  const { data, error } = await queryBuilder;

  if (error) {
    console.error('[search GET]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const filtered = await filterProductsByVerifiedVendor((data ?? []) as any[]);

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

  const qLower = q.trim().toLowerCase();
  const scoreText = (value: string) => {
    if (!qLower) return 0;
    const v = value.toLowerCase();
    if (v === qLower) return 200;
    if (v.startsWith(qLower)) return 160;
    if (v.includes(qLower)) return 110;
    return 0;
  };

  const suggestionsMap = new Map<string, CategorySuggestion>();

  for (const item of filtered as any[]) {
    const category = item.category ?? null;
    const subcategory = item.subcategory ?? null;
    const subSubcategory = item.sub_subcategory ?? null;
    const image = item.images?.[0] ?? null;

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
      {
        type: 'subSubcategory',
        value: subSubcategory,
        parentCategory: category,
        parentSubcategory: subcategory,
        context: [subcategory, category].filter(Boolean).join(' • ') || null,
      },
    ];

    for (const c of candidates) {
      if (!c.value) continue;
      const s = scoreText(c.value);

      // If user typed something, only include suggestions that match it.
      if (qLower && s <= 0) continue;

      const key = `${c.type}::${c.value}::${c.parentCategory ?? ''}::${c.parentSubcategory ?? ''}`;
      const existing = suggestionsMap.get(key);

      if (existing) {
        if (!existing.image && image) existing.image = image;
        continue;
      }

      const label = c.value;
      suggestionsMap.set(key, {
        type: c.type,
        value: c.value,
        parentCategory: c.parentCategory,
        parentSubcategory: c.parentSubcategory,
        label,
        context: c.context,
        image,
      });
    }
  }

  const categories = Array.from(suggestionsMap.values())
    .sort((a, b) => {
      const sa = scoreText(a.value);
      const sb = scoreText(b.value);
      if (sb !== sa) return sb - sa;
      // Prefer more specific suggestions (subcategory over category, etc.)
      const priority = (t: CategorySuggestionType) =>
        t === 'subSubcategory' ? 3 : t === 'subcategory' ? 2 : 1;
      const pa = priority(a.type);
      const pb = priority(b.type);
      if (pb !== pa) return pb - pa;
      return a.label.localeCompare(b.label);
    })
    .slice(0, 8);

  return NextResponse.json({ products, categories });
}
