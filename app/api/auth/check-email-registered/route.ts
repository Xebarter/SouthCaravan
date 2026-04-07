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
      return NextResponse.json({ registered: false }, { status: 400 })
    }
    if (!PORTALS.includes(portal)) {
      return NextResponse.json({ registered: false }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data, error } = await admin.auth.admin.getUserByEmail(email)
    if (error) {
      return NextResponse.json({ registered: false }, { status: 200 })
    }

    return NextResponse.json({ registered: Boolean(data?.user) })
  } catch {
    return NextResponse.json({ registered: false }, { status: 200 })
  }
}

