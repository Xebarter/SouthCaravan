import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin-require';
import { supabaseAdmin } from '@/lib/supabase-admin';

const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const { id } = await params;
  const vendorId = decodeURIComponent(id).trim();
  if (!vendorId) {
    return NextResponse.json({ error: 'Vendor id is required' }, { status: 400 });
  }

  const { data: vendor, error: vendorError } = await supabaseAdmin
    .from('vendors')
    .select(
      'id, name, email, company_name, is_verified, verified_at, services_verified, services_verified_at, created_at, updated_at',
    )
    .eq('id', vendorId)
    .maybeSingle();

  if (vendorError) {
    return NextResponse.json({ error: vendorError.message }, { status: 500 });
  }
  if (!vendor) {
    return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
  }

  const [
    profileResult,
    productsResult,
    ordersResult,
    quotesResult,
    authResult,
    rolesResult,
  ] = await Promise.all([
    supabaseAdmin
      .from('vendor_profiles')
      .select(
        'user_id, company_name, description, public_email, contact_email, phone, website, address, city, state, zip_code, country, logo_url, created_at, updated_at',
      )
      .eq('user_id', vendorId)
      .maybeSingle(),
    supabaseAdmin
      .from('products')
      .select('id, name, price, unit, category, subcategory, in_stock, is_featured, images, created_at, updated_at')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })
      .limit(50),
    supabaseAdmin
      .from('orders')
      .select('id, buyer_id, status, total_amount, created_at, updated_at, estimated_delivery')
      .eq('vendor_user_id', vendorId)
      .order('created_at', { ascending: false })
      .limit(25),
    supabaseAdmin
      .from('quotes')
      .select('id, buyer_id, rfq_request_id, status, total_amount, valid_until, created_at, updated_at, responded_at')
      .eq('vendor_user_id', vendorId)
      .order('created_at', { ascending: false })
      .limit(15),
    supabaseAdmin.auth.admin.getUserById(vendorId),
    supabaseAdmin.from('user_roles').select('role').eq('user_id', vendorId),
  ]);

  if (profileResult.error) {
    return NextResponse.json({ error: profileResult.error.message }, { status: 500 });
  }
  if (productsResult.error) {
    return NextResponse.json({ error: productsResult.error.message }, { status: 500 });
  }
  if (ordersResult.error) {
    return NextResponse.json({ error: ordersResult.error.message }, { status: 500 });
  }
  if (quotesResult.error) {
    return NextResponse.json({ error: quotesResult.error.message }, { status: 500 });
  }

  const products = productsResult.data ?? [];
  const orders = ordersResult.data ?? [];
  const quotes = quotesResult.data ?? [];

  const buyerIds = [
    ...new Set([
      ...orders.map((o) => String(o.buyer_id ?? '')).filter(Boolean),
      ...quotes.map((q) => String(q.buyer_id ?? '')).filter(Boolean),
    ]),
  ];

  let buyersById: Record<string, { id: string; name: string; email: string }> = {};
  if (buyerIds.length > 0) {
    const { data: buyers } = await supabaseAdmin
      .from('customers')
      .select('id, name, email')
      .in('id', buyerIds);
    buyersById = Object.fromEntries(
      (buyers ?? []).map((b) => [String(b.id), { id: String(b.id), name: b.name ?? '', email: b.email ?? '' }]),
    );
  }

  const ordersByStatus: Record<string, number> = {};
  for (const s of ORDER_STATUSES) ordersByStatus[s] = 0;
  let revenue = 0;
  for (const o of orders) {
    const status = String(o.status ?? 'pending').toLowerCase();
    if (status in ordersByStatus) ordersByStatus[status] += 1;
    revenue += Number(o.total_amount ?? 0);
  }

  const { count: totalProductCount } = await supabaseAdmin
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('vendor_id', vendorId);

  const { count: totalOrderCount } = await supabaseAdmin
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('vendor_user_id', vendorId);

  const { count: totalQuoteCount } = await supabaseAdmin
    .from('quotes')
    .select('id', { count: 'exact', head: true })
    .eq('vendor_user_id', vendorId);

  const enrichedOrders = orders.map((o) => ({
    ...o,
    buyer: buyersById[String(o.buyer_id)] ?? null,
  }));

  const enrichedQuotes = quotes.map((q) => ({
    ...q,
    buyer: buyersById[String(q.buyer_id)] ?? null,
  }));

  const authUser = authResult.error ? null : authResult.data?.user ?? null;

  return NextResponse.json({
    vendor: {
      ...vendor,
      is_verified: Boolean(vendor.is_verified),
      services_verified: Boolean((vendor as { services_verified?: boolean }).services_verified),
      services_verified_at:
        (vendor as { services_verified_at?: string | null }).services_verified_at ?? null,
    },
    profile: profileResult.data ?? null,
    auth: authUser
      ? {
          email: authUser.email ?? null,
          last_sign_in_at: authUser.last_sign_in_at ?? null,
          created_at: authUser.created_at ?? null,
        }
      : null,
    roles: (rolesResult.data ?? []).map((r) => r.role),
    stats: {
      product_count: totalProductCount ?? products.length,
      products_in_stock: products.filter((p) => p.in_stock).length,
      products_featured: products.filter((p) => p.is_featured).length,
      order_count: totalOrderCount ?? orders.length,
      quote_count: totalQuoteCount ?? quotes.length,
      revenue,
      orders_by_status: ordersByStatus,
    },
    products,
    orders: enrichedOrders,
    quotes: enrichedQuotes,
  });
}
