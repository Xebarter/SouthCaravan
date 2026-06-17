import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

function hasAdminAccess(user: { app_metadata?: Record<string, unknown> } | null | undefined) {
  const meta = user?.app_metadata ?? {};
  if ((meta as { role?: string }).role === 'admin') return true;
  const roles = Array.isArray((meta as { roles?: string[] }).roles) ? (meta as { roles?: string[] }).roles : [];
  return roles.includes('admin');
}

async function requireAdmin() {
  const supabase = await getServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { ok: false as const, status: 401, message: 'Unauthorized' };
  }

  const { data: adminUser, error: adminUserError } = await supabaseAdmin.auth.admin.getUserById(data.user.id);
  if (adminUserError) return { ok: false as const, status: 500, message: adminUserError.message };
  if (hasAdminAccess(adminUser.user)) return { ok: true as const, userId: data.user.id };

  const { data: roleRow, error: roleError } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', data.user.id)
    .eq('role', 'admin')
    .maybeSingle();

  if (roleError) return { ok: false as const, status: 500, message: roleError.message };
  if (!roleRow) return { ok: false as const, status: 403, message: 'Forbidden' };

  return { ok: true as const, userId: data.user.id };
}

function isMissingTableError(error: unknown) {
  const msg = String((error as { message?: string })?.message ?? '').toLowerCase();
  return msg.includes('does not exist') && msg.includes('product_promotion_requests');
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const { data, error } = await supabaseAdmin
    .from('product_promotion_requests')
    .select('id,vendor_user_id,product_id,kind,status,message,admin_note,reviewed_at,created_at,updated_at')
    .order('created_at', { ascending: false });

  if (error) {
    if (isMissingTableError(error)) return NextResponse.json({ requests: [], needsSetup: true });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const list = (data ?? []) as Array<Record<string, unknown>>;
  const productIds = [...new Set(list.map((r) => r.product_id).filter(Boolean).map(String))];
  const vendorIds = [...new Set(list.map((r) => r.vendor_user_id).filter(Boolean).map(String))];

  const productById = new Map<string, Record<string, unknown>>();
  if (productIds.length > 0) {
    const { data: products, error: prodErr } = await supabaseAdmin
      .from('products')
      .select('id,name,category,subcategory,price,unit,vendor_id,is_featured,images')
      .in('id', productIds);
    if (prodErr) return NextResponse.json({ error: prodErr.message }, { status: 500 });
    for (const p of products ?? []) productById.set(String(p.id), p);
  }

  const vendorById = new Map<string, Record<string, unknown>>();
  if (vendorIds.length > 0) {
    const { data: vendors, error: vendErr } = await supabaseAdmin
      .from('vendors')
      .select('id,email,name,company_name')
      .in('id', vendorIds);
    if (vendErr) return NextResponse.json({ error: vendErr.message }, { status: 500 });
    for (const v of vendors ?? []) vendorById.set(String(v.id), v);
  }

  const enriched = list.map((r) => ({
    ...r,
    product: productById.get(String(r.product_id)) ?? null,
    vendor: vendorById.get(String(r.vendor_user_id)) ?? null,
  }));

  return NextResponse.json({ requests: enriched });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const body = await req.json().catch(() => null);
  const id = String(body?.id ?? '').trim();
  const status = String(body?.status ?? '').trim().toLowerCase();
  const adminNote = typeof body?.adminNote === 'string' ? body.adminNote : '';

  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
  if (status !== 'approved' && status !== 'rejected') {
    return NextResponse.json({ error: 'status must be approved or rejected' }, { status: 422 });
  }

  const { data: current, error: curErr } = await supabaseAdmin
    .from('product_promotion_requests')
    .select('id,product_id,vendor_user_id,kind,status')
    .eq('id', id)
    .maybeSingle();

  if (curErr) return NextResponse.json({ error: curErr.message }, { status: 500 });
  if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (String(current.status).toLowerCase() !== 'pending') {
    return NextResponse.json({ error: 'Only pending requests can be updated' }, { status: 409 });
  }

  const { error: updErr } = await supabaseAdmin
    .from('product_promotion_requests')
    .update({
      status,
      admin_note: adminNote,
      reviewed_by: auth.userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  if (status === 'approved' && current.kind === 'featured') {
    const { error: prodErr } = await supabaseAdmin
      .from('products')
      .update({ is_featured: true })
      .eq('id', current.product_id)
      .eq('vendor_id', current.vendor_user_id);

    if (prodErr) return NextResponse.json({ error: prodErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
