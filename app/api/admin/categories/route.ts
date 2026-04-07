import { NextRequest, NextResponse } from 'next/server';
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

async function seedDefaultCategoriesIfEmpty() {
  const { count, error: countError } = await supabaseAdmin
    .from('product_categories')
    .select('id', { count: 'exact', head: true });

  if (countError || (count ?? 0) > 0) return;

  for (let i = 0; i < DEFAULT_MARKETPLACE_TAXONOMY.length; i += 1) {
    const section = DEFAULT_MARKETPLACE_TAXONOMY[i];
    const { data: parent } = await supabaseAdmin
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

    if (!parent?.id) continue;
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
    .select('id, name, slug, level, parent_id, is_active, sort_order, created_at')
    .order('level', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ categories: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });

  const name = String(body.name ?? '').trim();
  const level = Number(body.level);
  const parentId = body.parentId ? String(body.parentId) : null;
  const sortOrder = Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0;
  const isActive = body.isActive === undefined ? true : Boolean(body.isActive);

  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 422 });
  if (![1, 2, 3].includes(level)) return NextResponse.json({ error: 'level must be 1, 2, or 3' }, { status: 422 });
  if (level > 1 && !parentId) return NextResponse.json({ error: 'parentId is required for levels 2 and 3' }, { status: 422 });

  if (parentId) {
    const { data: parent } = await supabaseAdmin
      .from('product_categories')
      .select('id, level')
      .eq('id', parentId)
      .single();
    if (!parent) return NextResponse.json({ error: 'Invalid parentId' }, { status: 422 });
    if (parent.level !== level - 1) {
      return NextResponse.json({ error: `Parent for level ${level} must be level ${level - 1}` }, { status: 422 });
    }
  }

  const { data, error } = await supabaseAdmin
    .from('product_categories')
    .insert({
      name,
      slug: slugify(name),
      level,
      parent_id: parentId,
      is_active: isActive,
      sort_order: sortOrder,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ category: data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const patch: Record<string, unknown> = {};
  if (typeof body.name === 'string') {
    patch.name = body.name.trim();
    patch.slug = slugify(body.name);
  }
  if (typeof body.isActive === 'boolean') patch.is_active = body.isActive;
  if (Number.isFinite(Number(body.sortOrder))) patch.sort_order = Number(body.sortOrder);
  if (body.parentId === null || typeof body.parentId === 'string') patch.parent_id = body.parentId;

  const { data, error } = await supabaseAdmin
    .from('product_categories')
    .update(patch)
    .eq('id', body.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ category: data });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id query param is required' }, { status: 400 });

  const { error } = await supabaseAdmin.from('product_categories').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
