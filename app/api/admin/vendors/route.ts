import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

function hasAdminAccess(user: { app_metadata?: Record<string, unknown> } | null | undefined) {
  const meta = user?.app_metadata ?? {};
  if (meta.role === 'admin') return true;
  const roles = Array.isArray(meta.roles) ? meta.roles : [];
  return roles.includes('admin');
}

async function requireAdmin() {
  const supabase = await getServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { ok: false as const, status: 401, message: 'Unauthorized' };
  }

  const { data: adminUser, error: adminUserError } = await supabaseAdmin.auth.admin.getUserById(data.user.id);
  if (adminUserError) {
    return { ok: false as const, status: 500, message: adminUserError.message };
  }
  if (hasAdminAccess(adminUser.user)) {
    return { ok: true as const, userId: data.user.id };
  }

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

type VendorProfileRow = {
  user_id: string;
  company_name: string;
  description: string;
  public_email: string;
  contact_email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  logo_url: string;
  created_at: string;
  updated_at: string;
};

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const status = (searchParams.get('status') ?? 'all').toLowerCase();
  const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? 100), 1), 500);

  let query = supabaseAdmin
    .from('vendors')
    .select('id, name, email, company_name, is_verified, verified_at, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status === 'pending') {
    query = query.or('is_verified.eq.false,is_verified.is.null');
  }
  if (status === 'verified') query = query.eq('is_verified', true);

  const { data: vendors, error: vendorsError } = await query;
  if (vendorsError) return NextResponse.json({ error: vendorsError.message }, { status: 500 });

  const [{ count: total, error: totalErr }, { count: verified, error: verErr }, { count: pending, error: pendErr }] =
    await Promise.all([
      supabaseAdmin.from('vendors').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('vendors').select('id', { count: 'exact', head: true }).eq('is_verified', true),
      supabaseAdmin.from('vendors').select('id', { count: 'exact', head: true }).or('is_verified.eq.false,is_verified.is.null'),
    ]);

  if (totalErr) return NextResponse.json({ error: totalErr.message }, { status: 500 });
  if (verErr) return NextResponse.json({ error: verErr.message }, { status: 500 });
  if (pendErr) return NextResponse.json({ error: pendErr.message }, { status: 500 });

  const { data: orders, error: ordersError } = await supabaseAdmin.from('orders').select('total_amount');
  if (ordersError) return NextResponse.json({ error: ordersError.message }, { status: 500 });
  const platformGmv = (orders ?? []).reduce((sum, row) => sum + Number(row.total_amount ?? 0), 0);

  const list = vendors ?? [];
  const ids = list.map((v) => v.id);

  let profileById = new Map<string, VendorProfileRow>();
  if (ids.length > 0) {
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('vendor_profiles')
      .select(
        'user_id, company_name, description, public_email, contact_email, phone, website, address, city, state, zip_code, country, logo_url, created_at, updated_at',
      )
      .in('user_id', ids);

    if (profilesError) return NextResponse.json({ error: profilesError.message }, { status: 500 });
    profileById = new Map((profiles ?? []).map((p) => [p.user_id, p as VendorProfileRow]));
  }

  const productCounts = new Map<string, number>();
  const { data: productRows, error: productsError } = await supabaseAdmin.from('products').select('vendor_id');
  if (productsError) return NextResponse.json({ error: productsError.message }, { status: 500 });
  for (const row of productRows ?? []) {
    if (row.vendor_id == null || row.vendor_id === '') continue;
    const key = String(row.vendor_id);
    productCounts.set(key, (productCounts.get(key) ?? 0) + 1);
  }

  const orderStats = new Map<string, { count: number; revenue: number }>();
  const { data: orderRows, error: orderRowsError } = await supabaseAdmin
    .from('orders')
    .select('vendor_user_id, total_amount');
  if (orderRowsError) return NextResponse.json({ error: orderRowsError.message }, { status: 500 });
  for (const row of orderRows ?? []) {
    if (!row.vendor_user_id) continue;
    const key = String(row.vendor_user_id);
    const cur = orderStats.get(key) ?? { count: 0, revenue: 0 };
    cur.count += 1;
    cur.revenue += Number(row.total_amount ?? 0);
    orderStats.set(key, cur);
  }

  const enriched = list.map((v) => {
    const idStr = String(v.id);
    const os = orderStats.get(idStr) ?? { count: 0, revenue: 0 };
    return {
      ...v,
      is_verified: Boolean(v.is_verified),
      profile: profileById.get(idStr) ?? null,
      product_count: productCounts.get(idStr) ?? 0,
      order_count: os.count,
      revenue: os.revenue,
    };
  });

  return NextResponse.json({
    stats: {
      total: total ?? 0,
      verified: verified ?? 0,
      pending: pending ?? 0,
      platformGmv,
    },
    vendors: enriched,
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const body = await req.json().catch(() => null);
  if (!body?.id || !body?.email) {
    return NextResponse.json({ error: 'id (auth user uuid) and email are required' }, { status: 400 });
  }

  const id = String(body.id).trim();
  const email = String(body.email).trim().toLowerCase();
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const companyName = typeof body.companyName === 'string' ? body.companyName.trim() : '';

  const uuidRe =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRe.test(id)) {
    return NextResponse.json({ error: 'id must be a valid UUID matching an auth user' }, { status: 422 });
  }

  const { data: authUser, error: authLookupError } = await supabaseAdmin.auth.admin.getUserById(id);
  if (authLookupError) return NextResponse.json({ error: authLookupError.message }, { status: 500 });
  if (!authUser?.user) return NextResponse.json({ error: 'No auth user found for this id' }, { status: 422 });

  const authEmail = authUser.user.email?.toLowerCase();
  if (authEmail && authEmail !== email) {
    return NextResponse.json(
      { error: `Email must match the auth account (${authUser.user.email})` },
      { status: 422 },
    );
  }

  const { data: existing } = await supabaseAdmin.from('vendors').select('id').eq('id', id).maybeSingle();
  if (existing?.id) {
    return NextResponse.json({ error: 'This user is already registered as a vendor' }, { status: 409 });
  }

  const { data: emailTaken } = await supabaseAdmin.from('vendors').select('id').eq('email', email).maybeSingle();
  if (emailTaken?.id) {
    return NextResponse.json({ error: 'A vendor with this email already exists' }, { status: 409 });
  }

  const insertRow = {
    id,
    email,
    name: name || email.split('@')[0] || 'Vendor',
    company_name: companyName || name || email.split('@')[0] || 'Company',
    is_verified: false,
    verified_at: null as string | null,
  };

  const { data: vendor, error: insertError } = await supabaseAdmin
    .from('vendors')
    .insert(insertRow)
    .select('id, name, email, company_name, is_verified, verified_at, created_at, updated_at')
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  const { error: roleError } = await supabaseAdmin.from('user_roles').upsert(
    { user_id: id, role: 'vendor' },
    { onConflict: 'user_id,role' },
  );
  if (roleError) {
    await supabaseAdmin.from('vendors').delete().eq('id', id);
    return NextResponse.json({ error: roleError.message }, { status: 500 });
  }

  return NextResponse.json({ vendor }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const vendorId = String(body.id);

  const patch: Record<string, unknown> = {};
  if (typeof body.companyName === 'string') patch.company_name = body.companyName.trim();
  if (typeof body.name === 'string') patch.name = body.name.trim();
  if (typeof body.email === 'string') patch.email = body.email.trim().toLowerCase();

  if (typeof body.isVerified === 'boolean') {
    patch.is_verified = body.isVerified;
    patch.verified_at = body.isVerified ? new Date().toISOString() : null;
  }

  if (Object.keys(patch).length > 0) {
    const { error: vendorError } = await supabaseAdmin.from('vendors').update(patch).eq('id', vendorId);
    if (vendorError) return NextResponse.json({ error: vendorError.message }, { status: 500 });
  }

  const profileBody = body.profile;
  if (profileBody && typeof profileBody === 'object') {
    const p = profileBody as Record<string, unknown>;
    const profilePatch: Record<string, unknown> = {};

    if (typeof p.companyName === 'string') profilePatch.company_name = String(p.companyName).trim();
    if (typeof p.description === 'string') profilePatch.description = String(p.description);
    if (typeof p.publicEmail === 'string') profilePatch.public_email = String(p.publicEmail).trim();
    if (typeof p.contactEmail === 'string') profilePatch.contact_email = String(p.contactEmail).trim();
    if (typeof p.phone === 'string') profilePatch.phone = String(p.phone).trim();
    if (typeof p.website === 'string') profilePatch.website = String(p.website).trim();
    if (typeof p.address === 'string') profilePatch.address = String(p.address);
    if (typeof p.city === 'string') profilePatch.city = String(p.city);
    if (typeof p.state === 'string') profilePatch.state = String(p.state);
    if (typeof p.zipCode === 'string') profilePatch.zip_code = String(p.zipCode);
    if (typeof p.country === 'string') profilePatch.country = String(p.country);
    if (typeof p.logoUrl === 'string') profilePatch.logo_url = String(p.logoUrl).trim();

    if (Object.keys(profilePatch).length > 0) {
      const { data: existingProfile } = await supabaseAdmin
        .from('vendor_profiles')
        .select('*')
        .eq('user_id', vendorId)
        .maybeSingle();

      const defaults = {
        user_id: vendorId,
        company_name: '',
        description: '',
        public_email: '',
        contact_email: '',
        phone: '',
        website: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        country: '',
        logo_url: '',
      };

      const merged = {
        ...defaults,
        ...(existingProfile ?? {}),
        ...profilePatch,
        user_id: vendorId,
      };

      const { error: profileError } = await supabaseAdmin.from('vendor_profiles').upsert(merged, {
        onConflict: 'user_id',
      });
      if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });
    }
  }

  if (
    Object.keys(patch).length === 0 &&
    (!profileBody || typeof profileBody !== 'object' || Object.keys(profileBody as object).length === 0)
  ) {
    return NextResponse.json({ error: 'No valid fields to patch' }, { status: 422 });
  }

  const { data: vendor, error: selectError } = await supabaseAdmin
    .from('vendors')
    .select('id, name, email, company_name, is_verified, verified_at, created_at, updated_at')
    .eq('id', vendorId)
    .single();

  if (selectError) return NextResponse.json({ error: selectError.message }, { status: 500 });

  return NextResponse.json({ vendor });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id query param is required' }, { status: 400 });

  await supabaseAdmin.from('vendor_profiles').delete().eq('user_id', id);
  await supabaseAdmin.from('user_roles').delete().eq('user_id', id).eq('role', 'vendor');

  const { error } = await supabaseAdmin.from('vendors').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
