import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthedServicesUserId } from '@/lib/services-auth'

function isMissingTableError(error: any) {
  const msg = String(error?.message ?? '').toLowerCase()
  return msg.includes('does not exist') && msg.includes('service_offerings')
}

export async function GET() {
  const auth = await getAuthedServicesUserId()
  if (!auth.ok) return auth.response

  const { data, error } = await supabaseAdmin
    .from('service_offerings')
    .select(
      'id,provider_user_id,category,subcategory,title,description,pricing_type,rate,currency,is_active,is_featured,featured_sort_order,is_ad,ad_sort_order,created_at,updated_at',
    )
    .eq('provider_user_id', auth.userId)
    .order('created_at', { ascending: false })

  if (error) {
    if (isMissingTableError(error)) return NextResponse.json({ offerings: [], needsSetup: true })
    console.error('[services/offerings GET]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ offerings: data ?? [] })
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

  const payload = {
    provider_user_id: auth.userId,
    category: String(body?.category ?? '').trim(),
    subcategory: String(body?.subcategory ?? '').trim(),
    title: String(body?.title ?? '').trim(),
    description: String(body?.description ?? '').trim(),
    pricing_type: String(body?.pricing_type ?? 'fixed').trim(),
    rate: Number(body?.rate ?? 0),
    currency: String(body?.currency ?? 'USD').trim(),
    is_active: Boolean(body?.is_active ?? true),
  }

  if (!payload.category || !payload.subcategory || !payload.title) {
    return NextResponse.json(
      { error: 'category, subcategory, and title are required' },
      { status: 400 },
    )
  }

  const { data, error } = await supabaseAdmin
    .from('service_offerings')
    .insert(payload as any)
    .select(
      'id,provider_user_id,category,subcategory,title,description,pricing_type,rate,currency,is_active,is_featured,featured_sort_order,is_ad,ad_sort_order,created_at,updated_at',
    )
    .single()

  if (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json(
        { error: 'Services tables are not set up yet. Run the SQL migration in supabase/services.sql.' },
        { status: 503 },
      )
    }
    console.error('[services/offerings POST]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ offering: data }, { status: 201 })
}

