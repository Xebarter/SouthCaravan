import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const PORTALS = ['buyer', 'vendor', 'services', 'admin'] as const
type Portal = (typeof PORTALS)[number]

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const email = String(body?.email ?? '').trim().toLowerCase()
    const portal = String(body?.portal ?? 'buyer') as Portal

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { registered: false, authExists: false },
        { status: 400 }
      )
    }
    if (!PORTALS.includes(portal)) {
      return NextResponse.json(
        { registered: false, authExists: false },
        { status: 400 }
      )
    }

    const admin = createAdminClient()
    const { data, error } = await admin.rpc('auth_email_portal_status', {
      check_email: email,
      portal,
    })

    if (error) {
      // Fail open: allow UI to attempt signup if the check is unavailable.
      return NextResponse.json(
        { registered: false, authExists: false },
        { status: 200 }
      )
    }

    // The RPC returns a single-row table: [{ auth_exists, has_role }]
    const row = Array.isArray(data) ? data[0] : data
    const authExists = Boolean(row?.auth_exists)
    const hasRole = Boolean(row?.has_role)

    return NextResponse.json({
      registered: hasRole,
      authExists,
    })
  } catch {
    return NextResponse.json(
      { registered: false, authExists: false },
      { status: 200 }
    )
  }
}
