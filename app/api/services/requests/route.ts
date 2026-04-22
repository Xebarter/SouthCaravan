import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthedServicesUserId } from '@/lib/services-auth'

function isMissingTableError(error: any) {
  const msg = String(error?.message ?? '').toLowerCase()
  return msg.includes('does not exist') && msg.includes('service_requests')
}

export async function GET(req: NextRequest) {
  const auth = await getAuthedServicesUserId()
  if (!auth.ok) return auth.response

  const url = new URL(req.url)
  const status = (url.searchParams.get('status') ?? '').trim().toLowerCase()

  let q = supabaseAdmin
    .from('service_requests')
    .select(
      'id,buyer_user_id,provider_user_id,category,subcategory,title,description,status,created_at,updated_at',
    )
    .eq('provider_user_id', auth.userId)
    .order('created_at', { ascending: false })

  if (status && status !== 'all') {
    q = q.eq('status', status)
  }

  const { data, error } = await q

  if (error) {
    if (isMissingTableError(error)) return NextResponse.json({ requests: [], needsSetup: true })
    console.error('[services/requests GET]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ requests: data ?? [] })
}

