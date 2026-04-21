import { NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

function hasAdminAccess(user: { app_metadata?: any } | null | undefined) {
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

  // Back-compat: allow admin via user_roles row if project uses that path.
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

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const [{ count: vendorCount, error: vendorCountError }, { count: userCount, error: userCountError }] =
    await Promise.all([
      supabaseAdmin.from('vendors').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('customers').select('id', { count: 'exact', head: true }),
    ]);

  if (vendorCountError) return NextResponse.json({ error: vendorCountError.message }, { status: 500 });
  if (userCountError) return NextResponse.json({ error: userCountError.message }, { status: 500 });

  const { data: featuredProducts, error: featuredError } = await supabaseAdmin
    .from('products')
    .select('id, name, price, category, is_featured')
    .order('created_at', { ascending: false })
    .limit(6);

  if (featuredError) return NextResponse.json({ error: featuredError.message }, { status: 500 });

  const { count: featuredCount, error: featuredCountError } = await supabaseAdmin
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('is_featured', true);

  if (featuredCountError) return NextResponse.json({ error: featuredCountError.message }, { status: 500 });

  const { data: pendingVendors, error: pendingError } = await supabaseAdmin
    .from('vendors')
    .select('id, company_name, email, created_at, is_verified')
    .eq('is_verified', false)
    .order('created_at', { ascending: true })
    .limit(10);

  if (pendingError) return NextResponse.json({ error: pendingError.message }, { status: 500 });

  const { data: orders, error: ordersError } = await supabaseAdmin
    .from('orders')
    .select('total_amount');

  if (ordersError) return NextResponse.json({ error: ordersError.message }, { status: 500 });

  const totalGMV = (orders ?? []).reduce((sum, row) => sum + Number(row.total_amount ?? 0), 0);

  const { data: categories, error: categoriesError } = await supabaseAdmin
    .from('product_categories')
    .select('id, name, sort_order, is_active, level')
    .eq('level', 1)
    .order('sort_order', { ascending: true })
    .limit(6);

  if (categoriesError) return NextResponse.json({ error: categoriesError.message }, { status: 500 });

  return NextResponse.json({
    totals: {
      totalGMV,
      vendorCount: vendorCount ?? 0,
      userCount: userCount ?? 0,
      featuredCount: featuredCount ?? 0,
      pendingVendorCount: pendingVendors?.length ?? 0,
    },
    featuredProducts: featuredProducts ?? [],
    pendingVendors: pendingVendors ?? [],
    topCategories: categories ?? [],
  });
}

