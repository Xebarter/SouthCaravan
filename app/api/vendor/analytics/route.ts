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

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key: string) {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'short' })
}

export async function GET(req: NextRequest) {
  const auth = await getAuthedVendorId()
  if (!auth.ok) return auth.response

  const url = new URL(req.url)
  const period = (url.searchParams.get('period') ?? '30D').toUpperCase()

  let since: Date | null = null
  const now = new Date()
  if (period === '7D') since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  else if (period === '30D') since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  else if (period === '90D') since = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
  else since = null

  let q = supabaseAdmin
    .from('orders')
    .select('id,buyer_id,status,total_amount,created_at')
    .eq('vendor_user_id', auth.vendorId)
    .order('created_at', { ascending: true })

  if (since) q = q.gte('created_at', since.toISOString())

  const { data: orders, error } = await q
  if (error) {
    console.error('[vendor/analytics GET orders]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = orders ?? []
  const totalRevenue = rows.reduce((sum, o: any) => sum + Number(o.total_amount ?? 0), 0)
  const totalOrders = rows.length
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const uniqueBuyers = new Set(rows.map((o: any) => o.buyer_id).filter(Boolean)).size

  const orderStatusCounts: Record<string, number> = {}
  for (const o of rows as any[]) {
    const s = String(o.status ?? 'unknown')
    orderStatusCounts[s] = (orderStatusCounts[s] ?? 0) + 1
  }

  const monthTotals = new Map<string, number>()
  for (const o of rows as any[]) {
    const key = monthKey(new Date(o.created_at))
    monthTotals.set(key, (monthTotals.get(key) ?? 0) + Number(o.total_amount ?? 0))
  }
  const sortedKeys = [...monthTotals.keys()].sort()
  const lastSix = sortedKeys.slice(-6)
  const monthlyRevenue = lastSix.map((key) => ({ month: monthLabel(key), revenue: Math.round(monthTotals.get(key) ?? 0) }))
  if (monthlyRevenue.length === 0) monthlyRevenue.push({ month: '—', revenue: 0 })

  // Top products by revenue (from order_items).
  const orderIds = rows.map((o: any) => o.id)
  const revenueByProduct = new Map<string, number>()
  if (orderIds.length > 0) {
    const { data: items, error: itemsErr } = await supabaseAdmin
      .from('order_items')
      .select('product_id,subtotal,order_id')
      .in('order_id', orderIds)

    if (itemsErr) {
      console.error('[vendor/analytics GET items]', itemsErr)
      return NextResponse.json({ error: itemsErr.message }, { status: 500 })
    }

    for (const it of items ?? []) {
      const pid = it.product_id
      if (!pid) continue
      revenueByProduct.set(pid, (revenueByProduct.get(pid) ?? 0) + Number(it.subtotal ?? 0))
    }
  }

  const topProductIds = [...revenueByProduct.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id)

  const productsById = new Map<string, { id: string; name: string }>()
  if (topProductIds.length > 0) {
    const { data: products, error: prodErr } = await supabaseAdmin
      .from('products')
      .select('id,name')
      .in('id', topProductIds)
      .eq('vendor_id', auth.vendorId)

    if (prodErr) {
      console.error('[vendor/analytics GET products]', prodErr)
      return NextResponse.json({ error: prodErr.message }, { status: 500 })
    }
    for (const p of products ?? []) productsById.set(p.id, { id: p.id, name: p.name })
  }

  const topProducts = topProductIds.map((id) => ({
    id,
    name: productsById.get(id)?.name ?? 'Unknown product',
    revenue: Math.round(revenueByProduct.get(id) ?? 0),
  }))

  return NextResponse.json({
    period,
    totalRevenue,
    totalOrders,
    avgOrderValue,
    uniqueBuyers,
    orderStatusCounts,
    monthlyRevenue,
    topProducts,
  })
}

