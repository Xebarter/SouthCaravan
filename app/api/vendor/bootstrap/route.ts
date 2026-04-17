import { NextResponse } from 'next/server'
import { getServerSupabaseClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST() {
  try {
    const supabase = await getServerSupabaseClient()
    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user?.id || !data.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = data.user
    const email = user.email
    const emailPrefix = email.split('@')[0] || 'Vendor'
    const company = typeof user.user_metadata?.company === 'string' ? user.user_metadata.company : ''

    const { data: existing, error: selectError } = await supabaseAdmin
      .from('vendors')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (selectError) {
      return NextResponse.json({ error: selectError.message }, { status: 500 })
    }

    if (existing?.id) {
      return NextResponse.json({ ok: true, existed: true }, { status: 200 })
    }

    const { error: insertError } = await supabaseAdmin.from('vendors').insert({
      id: user.id,
      name: emailPrefix,
      email,
      company_name: company || emailPrefix,
    })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, created: true }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Bootstrap failed' }, { status: 500 })
  }
}

