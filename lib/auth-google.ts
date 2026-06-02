import type { SupabaseClient } from '@supabase/supabase-js'

import { type PortalRole, safeNextPath } from '@/lib/auth-flow'

export type GoogleAuthMode = 'signin' | 'signup'

const POST_AUTH_NEXT_KEY = 'sc_post_auth_next'
const POST_AUTH_ROLE_KEY = 'sc_post_auth_role'
const POST_AUTH_SET_AT_KEY = 'sc_post_auth_set_at'

export function buildGoogleOAuthRedirectUrl(role: PortalRole, next: string, mode?: GoogleAuthMode) {
  const url = new URL('/auth', typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
  url.searchParams.set('role', role)
  url.searchParams.set('next', safeNextPath(next, role))
  if (mode === 'signup') {
    url.searchParams.set('mode', 'signup')
  }
  return url.toString()
}

function rememberPostAuthDestination(role: PortalRole, next: string) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(POST_AUTH_NEXT_KEY, safeNextPath(next, role))
    window.localStorage.setItem(POST_AUTH_ROLE_KEY, role)
    window.localStorage.setItem(POST_AUTH_SET_AT_KEY, String(Date.now()))
  } catch {
    // non-fatal
  }
}

/**
 * Starts the Supabase Google OAuth flow. After redirect, middleware exchanges the
 * auth code and /auth finalizes portal access using the preserved role/next params.
 */
export async function startGoogleSignIn(
  supabase: SupabaseClient,
  opts: { role: PortalRole; next: string; mode?: GoogleAuthMode },
) {
  const redirectTo = buildGoogleOAuthRedirectUrl(opts.role, opts.next, opts.mode)
  rememberPostAuthDestination(opts.role, opts.next)

  const shouldAttachPortalRole =
    opts.role !== 'admin' && opts.role !== 'auto'

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      ...(shouldAttachPortalRole ? { data: { role: opts.role } } : {}),
      queryParams: {
        access_type: 'online',
        prompt: 'select_account',
      },
    },
  })

  if (error) throw error
}
