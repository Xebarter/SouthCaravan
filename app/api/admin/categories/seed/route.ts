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
  let insertedTopLevel = 0;
  let insertedSubcategories = 0;

  for (let i = 0; i < DEFAULT_MARKETPLACE_TAXONOMY.length; i += 1) {
    const section = DEFAULT_MARKETPLACE_TAXONOMY[i];
    const topSlug = slugify(section.title);

    let parentId: string | null = null;
    const { data: existingParent } = await supabaseAdmin
      .from('product_categories')
      .select('id')
      .eq('level', 1)
      .is('parent_id', null)
      .eq('slug', topSlug)
      .maybeSingle();

    if (existingParent?.id) {
      parentId = existingParent.id;
    } else {
      const { data: createdParent, error: createParentError } = await supabaseAdmin
        .from('product_categories')
        .insert({
          name: section.title,
          slug: topSlug,
          level: 1,
          parent_id: null,
          is_active: true,
          sort_order: i,
        })
        .select('id')
        .single();

      if (createParentError || !createdParent?.id) {
        return NextResponse.json(
          { error: createParentError?.message ?? `Failed to create top-level category ${section.title}` },
          { status: 500 },
        );
      }
      parentId = createdParent.id;
      insertedTopLevel += 1;
    }

    for (let j = 0; j < section.items.length; j += 1) {
      const item = section.items[j];
      const subSlug = slugify(item);

      const { data: existingSub } = await supabaseAdmin
        .from('product_categories')
        .select('id')
        .eq('level', 2)
        .eq('parent_id', parentId)
        .eq('slug', subSlug)
        .maybeSingle();

      if (existingSub?.id) {
        continue;
      }

      const { error: createSubError } = await supabaseAdmin
        .from('product_categories')
        .insert({
          name: item,
          slug: subSlug,
          level: 2,
          parent_id: parentId,
          is_active: true,
          sort_order: j,
        });

      if (createSubError) {
        return NextResponse.json(
          { error: createSubError.message ?? `Failed to create subcategory ${item}` },
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
