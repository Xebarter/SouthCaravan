import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabaseClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

function hasVendorAccess(user: any) {
  const meta = user?.app_metadata ?? {}
  if (meta.role === 'vendor') return true
  const roles = Array.isArray(meta.roles) ? meta.roles : []
  return roles.includes('vendor')
}

async function getAuthedVendorId(): Promise<
  | { ok: true; vendorId: string }
  | { ok: false; response: NextResponse }
> {
  const supabase = await getServerSupabaseClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  if (!hasVendorAccess(data.user)) {
    return { ok: false, response: NextResponse.json({ error: 'Vendor role required' }, { status: 403 }) }
  }
  return { ok: true, vendorId: data.user.id }
}

const ALLOWED_STATUSES = new Set(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'])

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const auth = await getAuthedVendorId()
  if (!auth.ok) return auth.response

  const { orderId } = await params
  const id = (orderId ?? '').trim()
  if (!id) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })

  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', id)
    .eq('vendor_user_id', auth.vendorId)
    .maybeSingle()

  if (error) {
    console.error('[vendor/orders/:id GET]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: items, error: itemsErr } = await supabaseAdmin
    .from('order_items')
    .select('*')
    .eq('order_id', id)
    .order('created_at', { ascending: true })

  if (itemsErr) {
    console.error('[vendor/orders/:id GET items]', itemsErr)
    return NextResponse.json({ error: itemsErr.message }, { status: 500 })
  }

  const buyerId = order.buyer_id as string
  const { data: buyer } = await supabaseAdmin
    .from('customers')
    .select('id,email,name,phone')
    .eq('id', buyerId)
    .maybeSingle()

  const productIds = [...new Set((items ?? []).map((it: any) => it.product_id).filter(Boolean))]
  const productsById = new Map<string, { id: string; name: string }>()
  if (productIds.length > 0) {
    const { data: products, error: prodErr } = await supabaseAdmin
      .from('products')
      .select('id,name')
      .in('id', productIds)
    if (prodErr) {
      console.error('[vendor/orders/:id GET products]', prodErr)
      return NextResponse.json({ error: prodErr.message }, { status: 500 })
    }
    for (const p of products ?? []) productsById.set(p.id, { id: p.id, name: p.name })
  }

  const lineItems = (items ?? []).map((it: any) => ({
    id: it.id,
    productId: it.product_id,
    productName: productsById.get(it.product_id)?.name ?? null,
    quantity: it.quantity,
    unitPrice: Number(it.unit_price ?? 0),
    subtotal: Number(it.subtotal ?? 0),
    createdAt: it.created_at,
  }))

  return NextResponse.json({
    order: {
      id: order.id,
      buyerId: order.buyer_id,
      vendorUserId: order.vendor_user_id,
      status: order.status,
      totalAmount: Number(order.total_amount ?? 0),
      shippingAddress: order.shipping_address ?? '',
      notes: order.notes ?? '',
      estimatedDelivery: order.estimated_delivery ?? null,
      createdAt: order.created_at,
      buyer: buyer
        ? { id: buyer.id, email: buyer.email, name: buyer.name ?? null, phone: buyer.phone ?? null }
        : null,
      items: lineItems,
    },
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const auth = await getAuthedVendorId()
  if (!auth.ok) return auth.response

  const { orderId } = await params
  const id = (orderId ?? '').trim()
  if (!id) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })

  const body = await req.json().catch(() => null)
  const status = typeof body?.status === 'string' ? body.status.trim().toLowerCase() : ''
  if (!ALLOWED_STATUSES.has(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 422 })
  }

  const { data: updated, error } = await supabaseAdmin
    .from('orders')
    .update({ status })
    .eq('id', id)
    .eq('vendor_user_id', auth.vendorId)
    .select('id,status,updated_at')
    .maybeSingle()

  if (error) {
    console.error('[vendor/orders/:id PATCH]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ ok: true, order: updated })
}

