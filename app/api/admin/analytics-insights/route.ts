import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabaseClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

function hasAdminAccess(user: { app_metadata?: any } | null | undefined) {
  const meta = user?.app_metadata ?? {}
  if (meta.role === 'admin') return true
  const roles = Array.isArray(meta.roles) ? meta.roles : []
  return roles.includes('admin')
}

async function requireAdmin() {
  const supabase = await getServerSupabaseClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) {
    return { ok: false as const, status: 401, message: 'Unauthorized' }
  }

  const { data: adminUser, error: adminUserError } = await supabaseAdmin.auth.admin.getUserById(data.user.id)
  if (adminUserError) {
    return { ok: false as const, status: 500, message: adminUserError.message }
  }
  if (hasAdminAccess(adminUser.user)) {
    return { ok: true as const, userId: data.user.id }
  }

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

const TABLE = 'admin_analytics_insights'

function normalizeSeverity(value: unknown) {
  const v = String(value ?? '').toLowerCase()
  if (v === 'info' || v === 'low' || v === 'medium' || v === 'high' || v === 'critical') return v
  return 'info'
}

function normalizeStatus(value: unknown) {
  const v = String(value ?? '').toLowerCase()
  if (v === 'open' || v === 'investigating' || v === 'resolved' || v === 'dismissed') return v
  return 'open'
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })

  const url = new URL(req.url)
  const status = (url.searchParams.get('status') ?? 'all').toLowerCase()
  const severity = (url.searchParams.get('severity') ?? 'all').toLowerCase()
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') ?? 200), 1), 500)

  let q = supabaseAdmin
    .from(TABLE)
    .select('id,title,summary,severity,status,region,source,metric_key,metric_value,created_at,updated_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (status !== 'all') q = q.eq('status', status)
  if (severity !== 'all') q = q.eq('severity', severity)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ insights: data ?? [] })
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })

  const body = await req.json().catch(() => null)
  const title = String(body?.title ?? '').trim()
  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 422 })

  const summary = typeof body?.summary === 'string' ? body.summary : ''
  const region = typeof body?.region === 'string' && body.region.trim() ? body.region.trim() : 'Global'
  const source = body?.source === 'system' ? 'system' : 'manual'
  const severity = normalizeSeverity(body?.severity)
  const status = normalizeStatus(body?.status)
  const metricKey = typeof body?.metricKey === 'string' ? body.metricKey.trim() : ''

  let metricValue: number | null = null
  if (body?.metricValue !== null && body?.metricValue !== undefined && body?.metricValue !== '') {
    const parsed = Number(body.metricValue)
    if (Number.isFinite(parsed)) metricValue = parsed
  }

  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .insert({
      title,
      summary,
      region,
      source,
      severity,
      status,
      metric_key: metricKey,
      metric_value: metricValue,
    })
    .select('id,title,summary,severity,status,region,source,metric_key,metric_value,created_at,updated_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ insight: data }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })

  const body = await req.json().catch(() => null)
  const id = String(body?.id ?? '').trim()
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 422 })

  const patch: Record<string, unknown> = {}
  if (typeof body?.title === 'string') patch.title = body.title.trim()
  if (typeof body?.summary === 'string') patch.summary = body.summary
  if (typeof body?.region === 'string') patch.region = body.region.trim() || 'Global'
  if (typeof body?.source === 'string') patch.source = body.source === 'system' ? 'system' : 'manual'
  if (body?.severity !== undefined) patch.severity = normalizeSeverity(body.severity)
  if (body?.status !== undefined) patch.status = normalizeStatus(body.status)
  if (typeof body?.metricKey === 'string') patch.metric_key = body.metricKey.trim()

  if (body?.metricValue !== undefined) {
    if (body.metricValue === null || body.metricValue === '') {
      patch.metric_value = null
    } else {
      const parsed = Number(body.metricValue)
      if (!Number.isFinite(parsed)) return NextResponse.json({ error: 'metricValue must be a number' }, { status: 422 })
      patch.metric_value = parsed
    }
  }

  const cleanPatch = Object.fromEntries(
    Object.entries(patch).filter(([, v]) => v !== undefined),
  )
  if (Object.keys(cleanPatch).length === 0) {
    return NextResponse.json({ error: 'No update fields provided' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .update(cleanPatch)
    .eq('id', id)
    .select('id,title,summary,severity,status,region,source,metric_key,metric_value,created_at,updated_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ insight: data })
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')?.trim()
  if (!id) return NextResponse.json({ error: 'id query param is required' }, { status: 400 })

  const { error } = await supabaseAdmin.from(TABLE).delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

