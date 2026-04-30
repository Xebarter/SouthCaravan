import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabaseClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getVendorVerificationStatus } from '@/lib/vendor-verification-status'

async function getAuthedVendorId(): Promise<
  | { ok: true; vendorId: string }
  | { ok: false; response: NextResponse }
> {
  const supabase = await getServerSupabaseClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  const vendorId = data.user.id
  const verification = await getVendorVerificationStatus(vendorId)
  if (!verification.isVerified) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Vendor account pending verification' }, { status: 403 }),
    }
  }
  return { ok: true, vendorId }
}

type OrderRow = {
  id: string
  buyer_id: string
  vendor_user_id: string | null
  status: string
  total_amount: number
  created_at: string
}

export async function GET(req: NextRequest) {
  const auth = await getAuthedVendorId()
  if (!auth.ok) return auth.response

  const url = new URL(req.url)
  const status = (url.searchParams.get('status') ?? '').trim().toLowerCase()

  let q = supabaseAdmin
    .from('orders')
    .select('id,buyer_id,vendor_user_id,status,total_amount,created_at')
    .eq('vendor_user_id', auth.vendorId)
    .order('created_at', { ascending: false })

  if (status && status !== 'all') {
    q = q.eq('status', status)
  }

  const { data: orders, error } = await q
  if (error) {
    console.error('[vendor/orders GET]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows: OrderRow[] = (orders ?? []) as any
  const buyerIds = [...new Set(rows.map((o) => o.buyer_id).filter(Boolean))]

  const buyersById = new Map<string, { id: string; email: string; name: string | null }>()
  if (buyerIds.length > 0) {
    const { data: buyers, error: buyersErr } = await supabaseAdmin
      .from('customers')
      .select('id,email,name')
      .in('id', buyerIds)

    if (buyersErr) {
      console.error('[vendor/orders GET buyers]', buyersErr)
      return NextResponse.json({ error: buyersErr.message }, { status: 500 })
    }

    for (const b of buyers ?? []) {
      buyersById.set(b.id, { id: b.id, email: b.email, name: b.name ?? null })
    }
  }

  const orderIds = rows.map((o) => o.id)
  const itemCounts = new Map<string, number>()
  if (orderIds.length > 0) {
    const { data: items, error: itemsErr } = await supabaseAdmin
      .from('order_items')
      .select('order_id')
      .in('order_id', orderIds)

    if (itemsErr) {
      console.error('[vendor/orders GET items]', itemsErr)
      return NextResponse.json({ error: itemsErr.message }, { status: 500 })
    }

    for (const it of items ?? []) {
      itemCounts.set(it.order_id, (itemCounts.get(it.order_id) ?? 0) + 1)
    }
  }

  const result = rows.map((o) => ({
    id: o.id,
    buyerId: o.buyer_id,
    buyer: buyersById.get(o.buyer_id) ?? null,
    status: o.status,
    totalAmount: Number(o.total_amount ?? 0),
    createdAt: o.created_at,
    itemsCount: itemCounts.get(o.id) ?? 0,
  }))

  return NextResponse.json({ orders: result })
}

