import { NextResponse } from 'next/server'

export async function POST() {
  // Best-effort endpoint used by portal onboarding to provision vendor-side data.
  // If your Supabase schema has vendor/profile tables, hook the upsert logic here.
  return new NextResponse(null, { status: 204 })
}

