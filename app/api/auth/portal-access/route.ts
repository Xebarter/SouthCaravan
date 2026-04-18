import { NextResponse } from 'next/server'
import { getServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const GRANTABLE_PORTALS = ['buyer', 'vendor', 'services'] as const
type GrantablePortal = (typeof GRANTABLE_PORTALS)[number]

function isGrantablePortal(value: unknown): value is GrantablePortal {
  return typeof value === 'string' && (GRANTABLE_PORTALS as readonly string[]).includes(value)
}

/**
 * GET /api/auth/portal-access?portal=<buyer|vendor|services>
 *
 * Returns whether the currently-authenticated user has been granted the
 * requested portal role. Admin is intentionally not queryable here — the
 * sign-in flow determines admin status from auth.users.app_metadata.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const portal = url.searchParams.get('portal') ?? ''

  if (!isGrantablePortal(portal)) {
    return NextResponse.json({ error: 'Invalid portal' }, { status: 400 })
  }

  try {
    const supabase = await getServerSupabaseClient()
    const { data: userData, error: authErr } = await supabase.auth.getUser()
    if (authErr || !userData.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()
    const { data, error } = await admin.rpc('user_has_portal_role', {
      p_user_id: userData.user.id,
      p_portal: portal,
    })
    if (error) throw error

    return NextResponse.json({
      has: Boolean(data),
      email: userData.user.email ?? '',
      portal,
    })
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'Failed to check portal access' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/auth/portal-access  { portal: 'buyer' | 'vendor' | 'services' }
 *
 * Grants the portal role to the currently-authenticated user. Idempotent:
 * safe to call repeatedly. Also ensures the matching profile row exists
 * (public.customers for buyer, public.vendors for vendor/services).
 *
 * The caller must be signed in (cookie-based session); password ownership
 * is therefore already proven.
 */
export async function POST(request: Request) {
  let body: any = {}
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  const portal = body?.portal
  if (!isGrantablePortal(portal)) {
    return NextResponse.json({ error: 'Invalid portal' }, { status: 400 })
  }

  try {
    const supabase = await getServerSupabaseClient()
    const { data: userData, error: authErr } = await supabase.auth.getUser()
    if (authErr || !userData.user?.id || !userData.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = userData.user
    const admin = createAdminClient()

    // 1. Record role membership (idempotent via composite primary key).
    const { error: roleErr } = await admin
      .from('user_roles')
      .upsert(
        { user_id: user.id, role: portal },
        { onConflict: 'user_id,role' }
      )
    if (roleErr) throw roleErr

    // 2. Ensure the profile row exists for this portal.
    if (portal === 'buyer') {
      const name =
        (typeof user.user_metadata?.name === 'string' && user.user_metadata.name.trim()) ||
        user.email.split('@')[0] ||
        'Buyer'
      const { error: profileErr } = await admin
        .from('customers')
        .upsert(
          { id: user.id, email: user.email, name },
          { onConflict: 'id' }
        )
      if (profileErr) throw profileErr
    } else if (portal === 'vendor' || portal === 'services') {
      const emailPrefix = user.email.split('@')[0] || 'Account'
      const company =
        (typeof user.user_metadata?.company === 'string' && user.user_metadata.company.trim()) ||
        emailPrefix
      const { error: profileErr } = await admin
        .from('vendors')
        .upsert(
          {
            id: user.id,
            email: user.email,
            name: emailPrefix,
            company_name: company,
          },
          { onConflict: 'id' }
        )
      if (profileErr) throw profileErr
    }

    return NextResponse.json({ ok: true, portal })
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'Failed to grant portal access' },
      { status: 500 }
    )
  }
}
