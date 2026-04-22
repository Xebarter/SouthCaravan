import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthedServicesUserId } from '@/lib/services-auth'
import { normalizeOfferingImageUrls } from '@/lib/service-offering-images'

function isMissingTableError(error: any) {
  const msg = String(error?.message ?? '').toLowerCase()
  return msg.includes('does not exist') && msg.includes('service_offerings')
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await getAuthedServicesUserId()
  if (!auth.ok) return auth.response

  const { id } = await ctx.params
  let body: any = {}
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  const updates: Record<string, any> = {}
  if (body.category != null) updates.category = String(body.category).trim()
  if (body.subcategory != null) updates.subcategory = String(body.subcategory).trim()
  if (body.title != null) updates.title = String(body.title).trim()
  if (body.description != null) updates.description = String(body.description).trim()
  if (body.pricing_type != null) updates.pricing_type = String(body.pricing_type).trim()
  if (body.rate != null) updates.rate = Number(body.rate ?? 0)
  if (body.currency != null) updates.currency = String(body.currency).trim()
  if (body.is_active != null) updates.is_active = Boolean(body.is_active)
  if (body.images != null) updates.images = normalizeOfferingImageUrls(body.images)

  const { data, error } = await supabaseAdmin
    .from('service_offerings')
    .update(updates as any)
    .eq('id', id)
    .eq('provider_user_id', auth.userId)
    .select(
      'id,provider_user_id,category,subcategory,title,description,pricing_type,rate,currency,is_active,is_featured,featured_sort_order,is_ad,ad_sort_order,images,created_at,updated_at',
    )
    .maybeSingle()

  if (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json(
        { error: 'Services tables are not set up yet. Run the SQL migration in supabase/services.sql.' },
        { status: 503 },
      )
    }
    console.error('[services/offerings PATCH]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ offering: data })
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await getAuthedServicesUserId()
  if (!auth.ok) return auth.response

  const { id } = await ctx.params

  const { error } = await supabaseAdmin
    .from('service_offerings')
    .delete()
    .eq('id', id)
    .eq('provider_user_id', auth.userId)

  if (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json(
        { error: 'Services tables are not set up yet. Run the SQL migration in supabase/services.sql.' },
        { status: 503 },
      )
    }
    console.error('[services/offerings DELETE]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

