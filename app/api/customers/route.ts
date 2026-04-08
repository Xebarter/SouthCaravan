import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const email = url.searchParams.get('email')?.trim() || ''
  if (!email) {
    return NextResponse.json({ error: 'Missing email' }, { status: 400 })
  }

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase.from('customers').select('*').eq('email', email).maybeSingle()
    if (error) throw error
    return NextResponse.json({ customer: data ?? null })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to fetch customer' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const id = body?.id
    const email = (body?.email ?? '').trim()
    const name = body?.name ?? null
    const phone = body?.phone ?? null

    if (!id || !email) {
      return NextResponse.json({ error: 'Missing id or email' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const payload = { id, email, name, phone }
    const { data, error } = await supabase.from('customers').upsert(payload).select('*').single()
    if (error) throw error
    return NextResponse.json({ customer: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to create customer' }, { status: 500 })
  }
}

