import { NextResponse } from 'next/server'
import { getServerSupabaseClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

const GRANTABLE_PORTALS = ['vendor', 'services'] as const
type VendorPortal = (typeof GRANTABLE_PORTALS)[number]

function coerceVendorPortal(value: unknown): VendorPortal {
  return value === 'services' ? 'services' : 'vendor'
}

export async function POST(request: Request) {
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

    // The caller must already be registered for the requested portal role.
    // We do NOT auto-grant roles here — that happens only through
    // /api/auth/portal-access which requires a deliberate user action.
    let requestedPortal: VendorPortal = 'vendor'
    try {
      const body = await request.json()
      requestedPortal = coerceVendorPortal(body?.portal)
    } catch {
      requestedPortal = 'vendor'
    }

    const { data: hasRole, error: roleErr } = await supabaseAdmin.rpc('user_has_portal_role', {
      p_user_id: user.id,
      p_portal: requestedPortal,
    })
    if (roleErr) {
      return NextResponse.json({ error: roleErr.message }, { status: 500 })
    }
    if (!hasRole) {
      return NextResponse.json(
        { error: `No ${requestedPortal} access for this account.` },
        { status: 403 }
      )
    }

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
      is_verified: false,
      verified_at: null,
    })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, created: true }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Bootstrap failed' }, { status: 500 })
  }
}

