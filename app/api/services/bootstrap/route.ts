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
    const emailPrefix = email.split('@')[0] || 'Service Provider'
    const company = typeof user.user_metadata?.company === 'string' ? user.user_metadata.company : ''

    await supabaseAdmin
      .from('user_roles')
      .upsert({ user_id: user.id, role: 'services' }, { onConflict: 'user_id,role' })

    const { data: existing, error: selectError } = await supabaseAdmin
      .from('vendors')
      .select('id,is_verified,verified_at')
      .eq('id', user.id)
      .maybeSingle()

    if (selectError) return NextResponse.json({ error: selectError.message }, { status: 500 })
    if (existing?.id) {
      return NextResponse.json(
        {
          ok: true,
          vendor: {
            id: String(existing.id),
            is_verified: Boolean((existing as any).is_verified),
            verified_at: (existing as any).verified_at ?? null,
          },
          existed: true,
        },
        { status: 200 },
      )
    }

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('vendors')
      .insert({
      id: user.id,
      name: emailPrefix,
      email,
      company_name: company || emailPrefix,
      is_verified: false,
      verified_at: null,
    })
      .select('id,is_verified,verified_at')
      .single()
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

    return NextResponse.json(
      {
        ok: true,
        vendor: {
          id: String(inserted?.id ?? user.id),
          is_verified: Boolean(inserted?.is_verified),
          verified_at: inserted?.verified_at ?? null,
        },
        created: true,
      },
      { status: 201 },
    )
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Bootstrap failed' }, { status: 500 })
  }
}

