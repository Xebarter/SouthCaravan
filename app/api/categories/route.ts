import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { DEFAULT_MARKETPLACE_TAXONOMY } from '@/lib/default-marketplace-taxonomy';

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  level: number;
  parent_id: string | null;
  is_active: boolean;
  sort_order: number;
};

function buildCategoryTree(rows: CategoryRow[]) {
  const level1 = rows.filter((row) => row.level === 1);
  const level2 = rows.filter((row) => row.level === 2);
  const level3 = rows.filter((row) => row.level === 3);

  return level1.map((category) => {
    const subcategories = level2
      .filter((sub) => sub.parent_id === category.id)
      .map((subcategory) => ({
        id: subcategory.id,
        name: subcategory.name,
        slug: subcategory.slug,
        subSubcategories: level3
          .filter((leaf) => leaf.parent_id === subcategory.id)
          .map((leaf) => ({ id: leaf.id, name: leaf.name, slug: leaf.slug })),
      }));

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      subcategories,
    };
  });
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

async function seedDefaultCategoriesIfEmpty() {
  const { count, error: countError } = await supabaseAdmin
    .from('product_categories')
    .select('id', { count: 'exact', head: true });

  if (countError || (count ?? 0) > 0) return;

  for (let i = 0; i < DEFAULT_MARKETPLACE_TAXONOMY.length; i += 1) {
    const section = DEFAULT_MARKETPLACE_TAXONOMY[i];
    const { data: parent, error: parentError } = await supabaseAdmin
      .from('product_categories')
      .insert({
        name: section.title,
        slug: slugify(section.title),
        level: 1,
        parent_id: null,
        is_active: true,
        sort_order: i,
      })
      .select('id')
      .single();

    if (parentError || !parent?.id) continue;

    for (let j = 0; j < section.items.length; j += 1) {
      const item = section.items[j];
      await supabaseAdmin.from('product_categories').insert({
        name: item,
        slug: slugify(item),
        level: 2,
        parent_id: parent.id,
        is_active: true,
        sort_order: j,
      });
    }
  }
}

export async function GET() {
  await seedDefaultCategoriesIfEmpty();

  const { data, error } = await supabaseAdmin
    .from('product_categories')
    .select('id, name, slug, level, parent_id, is_active, sort_order')
    .eq('is_active', true)
    .order('level', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as CategoryRow[];
  return NextResponse.json({
    rows,
    tree: buildCategoryTree(rows),
  });
}
