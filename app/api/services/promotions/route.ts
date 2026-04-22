import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthedServicesUserId } from '@/lib/services-auth'

function isMissingTableError(error: any) {
  const msg = String(error?.message ?? '').toLowerCase()
  return msg.includes('does not exist') && msg.includes('service_promotion_requests')
}

export async function GET() {
  const auth = await getAuthedServicesUserId()
  if (!auth.ok) return auth.response

  const { data, error } = await supabaseAdmin
    .from('service_promotion_requests')
    .select('id,offering_id,provider_user_id,kind,status,message,admin_note,reviewed_at,created_at,updated_at')
    .eq('provider_user_id', auth.userId)
    .order('created_at', { ascending: false })

  if (error) {
    if (isMissingTableError(error)) return NextResponse.json({ requests: [], needsSetup: true })
    console.error('[services/promotions GET]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ requests: data ?? [] })
}

export async function POST(req: NextRequest) {
  const auth = await getAuthedServicesUserId()
  if (!auth.ok) return auth.response

  let body: any = {}
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  const offeringId = String(body?.offeringId ?? '').trim()
  const kind = String(body?.kind ?? '').trim().toLowerCase()
  const message = String(body?.message ?? '').trim()

  if (!offeringId) return NextResponse.json({ error: 'offeringId is required' }, { status: 400 })
  if (kind !== 'featured' && kind !== 'ad') {
    return NextResponse.json({ error: 'kind must be featured or ad' }, { status: 422 })
  }

  // Ensure the offering belongs to the provider.
  const { data: offering, error: offeringErr } = await supabaseAdmin
    .from('service_offerings')
    .select('id,provider_user_id')
    .eq('id', offeringId)
    .maybeSingle()

  if (offeringErr) return NextResponse.json({ error: offeringErr.message }, { status: 500 })
  if (!offering || String(offering.provider_user_id) !== auth.userId) {
    return NextResponse.json({ error: 'Offering not found' }, { status: 404 })
  }

  // Avoid duplicate pending requests for the same offering + kind.
  const { data: existing, error: existingErr } = await supabaseAdmin
    .from('service_promotion_requests')
    .select('id,status')
    .eq('offering_id', offeringId)
    .eq('provider_user_id', auth.userId)
    .eq('kind', kind)
    .eq('status', 'pending')
    .maybeSingle()

  if (existingErr) {
    if (isMissingTableError(existingErr)) {
      return NextResponse.json(
        { error: 'Services tables are not set up yet. Run the SQL migration in supabase/services.sql.' },
        { status: 503 },
      )
    }
    return NextResponse.json({ error: existingErr.message }, { status: 500 })
  }

  if (existing?.id) {
    return NextResponse.json({ ok: true, existed: true, requestId: existing.id }, { status: 200 })
  }

  const { data, error } = await supabaseAdmin
    .from('service_promotion_requests')
    .insert({
      provider_user_id: auth.userId,
      offering_id: offeringId,
      kind,
      message,
      status: 'pending',
    })
    .select('id,offering_id,provider_user_id,kind,status,message,created_at,updated_at')
    .single()

  if (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json(
        { error: 'Services tables are not set up yet. Run the SQL migration in supabase/services.sql.' },
        { status: 503 },
      )
    }
    console.error('[services/promotions POST]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ request: data }, { status: 201 })
}

