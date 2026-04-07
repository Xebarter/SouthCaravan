import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { getSupabasePublicEnv } from '@/lib/supabase/env'

export async function getServerSupabaseClient() {
  const cookieStore = await cookies()
  const { url, anonKey } = getSupabasePublicEnv()

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const cookie of cookiesToSet) {
            cookieStore.set(cookie)
          }
        } catch {
          // Server Components cannot set cookies. (This is fine in read-only contexts.)
        }
      },
    },
  })
}

