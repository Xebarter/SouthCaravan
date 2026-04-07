import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { DEFAULT_MARKETPLACE_TAXONOMY } from '@/lib/default-marketplace-taxonomy';

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export async function POST() {
  // Delete all existing taxonomy entries (children cascade)
  const { error: deleteError } = await supabaseAdmin
    .from('product_categories')
    .delete()
    .not('id', 'is', null);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  let insertedTopLevel = 0;
  let insertedSubcategories = 0;

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

    if (parentError || !parent?.id) {
      return NextResponse.json(
        { error: parentError?.message ?? `Failed to create top-level category ${section.title}` },
        { status: 500 },
      );
    }
    insertedTopLevel += 1;

    for (let j = 0; j < section.items.length; j += 1) {
      const item = section.items[j];
      const { error: subError } = await supabaseAdmin
        .from('product_categories')
        .insert({
          name: item,
          slug: slugify(item),
          level: 2,
          parent_id: parent.id,
          is_active: true,
          sort_order: j,
        });

      if (subError) {
        return NextResponse.json(
          { error: subError.message ?? `Failed to create subcategory ${item}` },
          { status: 500 },
        );
      }
      insertedSubcategories += 1;
    }
  }

  return NextResponse.json({
    success: true,
    insertedTopLevel,
    insertedSubcategories,
  });
}
