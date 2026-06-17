import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSupabaseClient } from '@/lib/supabase/server';
import { getVendorVerificationStatus } from '@/lib/vendor-verification-status';

function isMissingTableError(error: unknown) {
  const msg = String((error as { message?: string })?.message ?? '').toLowerCase();
  return msg.includes('does not exist') && msg.includes('product_promotion_requests');
}

async function getAuthedVendorId(): Promise<
  | { ok: true; vendorId: string }
  | { ok: false; response: NextResponse }
> {
  const supabase = await getServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  const vendorId = data.user.id;
  const verification = await getVendorVerificationStatus(vendorId);
  if (!verification.isVerified) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Vendor account pending verification' }, { status: 403 }),
    };
  }
  return { ok: true, vendorId };
}

export async function GET() {
  const auth = await getAuthedVendorId();
  if (!auth.ok) return auth.response;

  const { data, error } = await supabaseAdmin
    .from('product_promotion_requests')
    .select('id,product_id,vendor_user_id,kind,status,message,admin_note,reviewed_at,created_at,updated_at')
    .eq('vendor_user_id', auth.vendorId)
    .order('created_at', { ascending: false });

  if (error) {
    if (isMissingTableError(error)) return NextResponse.json({ requests: [], needsSetup: true });
    console.error('[vendor/products/promotions GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ requests: data ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await getAuthedVendorId();
  if (!auth.ok) return auth.response;

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const productId = String(body?.productId ?? '').trim();
  const kind = String(body?.kind ?? 'featured').trim().toLowerCase();
  const message = String(body?.message ?? '').trim();

  if (!productId) return NextResponse.json({ error: 'productId is required' }, { status: 400 });
  if (kind !== 'featured') {
    return NextResponse.json({ error: 'kind must be featured' }, { status: 422 });
  }

  const { data: product, error: productErr } = await supabaseAdmin
    .from('products')
    .select('id,vendor_id,is_featured')
    .eq('id', productId)
    .maybeSingle();

  if (productErr) return NextResponse.json({ error: productErr.message }, { status: 500 });
  if (!product || String(product.vendor_id) !== auth.vendorId) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  if (product.is_featured) {
    return NextResponse.json({ error: 'Product is already featured' }, { status: 409 });
  }

  const { data: existing, error: existingErr } = await supabaseAdmin
    .from('product_promotion_requests')
    .select('id,status')
    .eq('product_id', productId)
    .eq('vendor_user_id', auth.vendorId)
    .eq('kind', kind)
    .eq('status', 'pending')
    .maybeSingle();

  if (existingErr) {
    if (isMissingTableError(existingErr)) {
      return NextResponse.json(
        { error: 'Product promotion requests are not set up yet. Run supabase/product-promotions.sql.' },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: existingErr.message }, { status: 500 });
  }

  if (existing?.id) {
    return NextResponse.json({ ok: true, existed: true, requestId: existing.id }, { status: 200 });
  }

  const { data, error } = await supabaseAdmin
    .from('product_promotion_requests')
    .insert({
      vendor_user_id: auth.vendorId,
      product_id: productId,
      kind,
      message,
      status: 'pending',
    })
    .select('id,product_id,vendor_user_id,kind,status,message,created_at,updated_at')
    .single();

  if (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json(
        { error: 'Product promotion requests are not set up yet. Run supabase/product-promotions.sql.' },
        { status: 503 },
      );
    }
    console.error('[vendor/products/promotions POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ request: data }, { status: 201 });
}
