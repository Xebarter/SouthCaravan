import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('blog_categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ categories: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const name = (body.name as string | undefined)?.trim();
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 422 });

  const slug = (body.slug as string | undefined)?.trim() || slugify(name);
  const { data, error } = await supabaseAdmin
    .from('blog_categories')
    .insert({
      name,
      slug,
      description: body.description?.trim() || null,
      color: body.color?.trim() || '#6366f1',
      sort_order: typeof body.sort_order === 'number' ? body.sort_order : 0,
      is_active: body.is_active !== false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ category: data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const id = (body.id as string | undefined)?.trim();
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const patch: Record<string, unknown> = {};
  if (typeof body.name === 'string' && body.name.trim()) patch.name = body.name.trim();
  if (typeof body.slug === 'string' && body.slug.trim()) patch.slug = body.slug.trim();
  if (typeof body.description === 'string') patch.description = body.description.trim() || null;
  if (typeof body.color === 'string') patch.color = body.color.trim();
  if (typeof body.sort_order === 'number') patch.sort_order = body.sort_order;
  if (typeof body.is_active === 'boolean') patch.is_active = body.is_active;

  const { data, error } = await supabaseAdmin
    .from('blog_categories')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ category: data });
}

export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const { error } = await supabaseAdmin.from('blog_categories').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
