import { NextResponse } from 'next/server'
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
  return msg.includes('does not exist') && (msg.includes('service_offerings') || msg.includes('service_requests'))
}

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })

  const { data: roles, error: rolesErr } = await supabaseAdmin
    .from('user_roles')
    .select('user_id')
    .eq('role', 'services')

  if (rolesErr) return NextResponse.json({ error: rolesErr.message }, { status: 500 })

  const ids = (roles ?? []).map((r: any) => String(r.user_id))
  if (ids.length === 0) return NextResponse.json({ providers: [] })

  const { data: providers, error: providersErr } = await supabaseAdmin
    .from('vendors')
    .select('id,email,name,company_name,created_at')
    .in('id', ids)
    .order('created_at', { ascending: false })

  if (providersErr) return NextResponse.json({ error: providersErr.message }, { status: 500 })

  // Counts (best-effort if services tables not created yet).
  const offeringsCount = new Map<string, { total: number; featured: number; ads: number }>()
  const openRequestsCount = new Map<string, number>()

  const { data: offerings, error: offersErr } = await supabaseAdmin
    .from('service_offerings')
    .select('provider_user_id,is_featured,is_ad')
    .in('provider_user_id', ids)

  if (offersErr && !isMissingTableError(offersErr)) {
    return NextResponse.json({ error: offersErr.message }, { status: 500 })
  }
  for (const row of (offerings ?? []) as any[]) {
    const pid = String(row.provider_user_id)
    const cur = offeringsCount.get(pid) ?? { total: 0, featured: 0, ads: 0 }
    cur.total += 1
    if (row.is_featured) cur.featured += 1
    if (row.is_ad) cur.ads += 1
    offeringsCount.set(pid, cur)
  }

  const { data: requests, error: reqErr } = await supabaseAdmin
    .from('service_requests')
    .select('provider_user_id,status')
    .in('provider_user_id', ids)

  if (reqErr && !isMissingTableError(reqErr)) {
    return NextResponse.json({ error: reqErr.message }, { status: 500 })
  }
  for (const row of (requests ?? []) as any[]) {
    if (String(row.status).toLowerCase() !== 'open') continue
    const pid = String(row.provider_user_id)
    openRequestsCount.set(pid, (openRequestsCount.get(pid) ?? 0) + 1)
  }

  const enriched = (providers ?? []).map((p: any) => {
    const c = offeringsCount.get(String(p.id)) ?? { total: 0, featured: 0, ads: 0 }
    return {
      user_id: String(p.id),
      email: p.email ?? '',
      name: p.name ?? '',
      company_name: p.company_name ?? '',
      created_at: p.created_at,
      offerings_count: c.total,
      featured_count: c.featured,
      ads_count: c.ads,
      open_requests: openRequestsCount.get(String(p.id)) ?? 0,
    }
  })

  return NextResponse.json({ providers: enriched })
}

