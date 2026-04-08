import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const phone = body?.phone ?? null

    const supabase = createAdminClient()
    const { data, error } = await supabase.from('customers').update({ phone }).eq('id', id).select('*').single()
    if (error) throw error
    return NextResponse.json({ customer: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to update customer' }, { status: 500 })
  }
}

