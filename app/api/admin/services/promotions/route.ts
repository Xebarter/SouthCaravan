import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabaseClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

function hasAdminAccess(user: { app_metadata?: Record<string, unknown> } | null | undefined) {
  const meta = user?.app_metadata ?? {}
  if ((meta as any).role === 'admin') return true
  const roles = Array.isArray((meta as any).roles) ? (meta as any).roles : []
  return roles.includes('admin')
}

async function requireAdmin() {
  const supabase = await getServerSupabaseClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) {
    return { ok: false as const, status: 401, message: 'Unauthorized' }
  }

  const { data: adminUser, error: adminUserError } = await supabaseAdmin.auth.admin.getUserById(data.user.id)
  if (adminUserError) return { ok: false as const, status: 500, message: adminUserError.message }
  if (hasAdminAccess(adminUser.user)) return { ok: true as const, userId: data.user.id }

  const { data: roleRow, error: roleError } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', data.user.id)
    .eq('role', 'admin')
    .maybeSingle()

  if (roleError) return { ok: false as const, status: 500, message: roleError.message }
  if (!roleRow) return { ok: false as const, status: 403, message: 'Forbidden' }

  return { ok: true as const, userId: data.user.id }
}

function isMissingTableError(error: any) {
  const msg = String(error?.message ?? '').toLowerCase()
  return msg.includes('does not exist') && msg.includes('service_promotion_requests')
}

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })

  const { data, error } = await supabaseAdmin
    .from('service_promotion_requests')
    .select('id,provider_user_id,offering_id,kind,status,message,admin_note,reviewed_at,created_at,updated_at')
    .order('created_at', { ascending: false })

  if (error) {
    if (isMissingTableError(error)) return NextResponse.json({ requests: [], needsSetup: true })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const list = (data ?? []) as any[]
  const offeringIds = [...new Set(list.map((r) => r.offering_id).filter(Boolean).map(String))]
  const providerIds = [...new Set(list.map((r) => r.provider_user_id).filter(Boolean).map(String))]

  const offeringById = new Map<string, any>()
  if (offeringIds.length > 0) {
    const { data: offerings, error: offErr } = await supabaseAdmin
      .from('service_offerings')
      .select('id,title,category,subcategory,currency,rate,provider_user_id,is_featured,is_ad')
      .in('id', offeringIds)
    if (offErr) return NextResponse.json({ error: offErr.message }, { status: 500 })
    for (const o of offerings ?? []) offeringById.set(String(o.id), o)
  }

  const providerById = new Map<string, any>()
  if (providerIds.length > 0) {
    const { data: providers, error: provErr } = await supabaseAdmin
      .from('vendors')
      .select('id,email,name,company_name')
      .in('id', providerIds)
    if (provErr) return NextResponse.json({ error: provErr.message }, { status: 500 })
    for (const p of providers ?? []) providerById.set(String(p.id), p)
  }

  const enriched = list.map((r) => ({
    ...r,
    offering: offeringById.get(String(r.offering_id)) ?? null,
    provider: providerById.get(String(r.provider_user_id)) ?? null,
  }))

  return NextResponse.json({ requests: enriched })
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })

  const body = await req.json().catch(() => null)
  const id = String(body?.id ?? '').trim()
  const status = String(body?.status ?? '').trim().toLowerCase()
  const adminNote = typeof body?.adminNote === 'string' ? body.adminNote : ''

  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
  if (status !== 'approved' && status !== 'rejected') {
    return NextResponse.json({ error: 'status must be approved or rejected' }, { status: 422 })
  }

  const { data: current, error: curErr } = await supabaseAdmin
    .from('service_promotion_requests')
    .select('id,offering_id,provider_user_id,kind,status')
    .eq('id', id)
    .maybeSingle()

  if (curErr) return NextResponse.json({ error: curErr.message }, { status: 500 })
  if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (String(current.status).toLowerCase() !== 'pending') {
    return NextResponse.json({ error: 'Only pending requests can be updated' }, { status: 409 })
  }

  const { error: updErr } = await supabaseAdmin
    .from('service_promotion_requests')
    .update({
      status,
      admin_note: adminNote,
      reviewed_by: auth.userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })

  if (status === 'approved') {
    // Apply the promotion flag to the offering.
    const patch: Record<string, any> =
      current.kind === 'ad' ? { is_ad: true } : { is_featured: true }

    const { error: offerErr } = await supabaseAdmin
      .from('service_offerings')
      .update(patch)
      .eq('id', current.offering_id)
      .eq('provider_user_id', current.provider_user_id)

    if (offerErr) return NextResponse.json({ error: offerErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

