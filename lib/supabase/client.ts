'use client'

import { createBrowserClient } from '@supabase/ssr'
import { getSupabasePublicEnv } from '@/lib/supabase/env'

let browserClient: ReturnType<typeof createBrowserClient> | null = null

export function getBrowserSupabaseClient() {
  if (browserClient) return browserClient
  const { url, anonKey } = getSupabasePublicEnv()
  browserClient = createBrowserClient(url, anonKey)
  return browserClient
}

