import type { SupabaseClient } from '@supabase/supabase-js'

import { type PortalRole, safeNextPath } from '@/lib/auth-flow'

export type GoogleAuthMode = 'signin' | 'signup'

export function buildGoogleOAuthRedirectUrl(role: PortalRole, next: string, mode?: GoogleAuthMode) {
  const url = new URL('/auth', typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
  url.searchParams.set('role', role)
  url.searchParams.set('next', safeNextPath(next, role))
  if (mode === 'signup') {
    url.searchParams.set('mode', 'signup')
  }
  return url.toString()
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
