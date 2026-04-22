'use client'

import { createBrowserClient } from '@supabase/ssr'
import { getSupabasePublicEnv } from '@/lib/supabase/env'

let browserClient: ReturnType<typeof createBrowserClient> | null = null

const SUPABASE_AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365 // 1 year

export function getBrowserSupabaseClient() {
  if (browserClient) return browserClient
  const { url, anonKey } = getSupabasePublicEnv()
  browserClient = createBrowserClient(url, anonKey, {
    cookieOptions: {
      // Ensure the auth cookie survives browser restarts.
      maxAge: SUPABASE_AUTH_COOKIE_MAX_AGE_SECONDS,
      path: '/',
      sameSite: 'lax',
    },
  })
  return browserClient
}

