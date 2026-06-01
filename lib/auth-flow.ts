import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

import {
  grantPortalAccess,
  persistPortalSession,
  type GrantablePortal,
} from '@/lib/portal-session'

export type PortalRole = 'buyer' | 'vendor' | 'services' | 'admin' | 'auto'

export function getDefaultNext(role: PortalRole) {
  if (role === 'admin') return '/admin'
  if (role === 'vendor') return '/vendor'
  if (role === 'services') return '/services'
  if (role === 'buyer') return '/buyer'
  return '/dashboard'
}

export function safeNextPath(input: string | null | undefined, role: PortalRole) {
  const fallback = getDefaultNext(role)
  const raw = (input ?? '').trim()
  if (!raw) return fallback
  if (!raw.startsWith('/')) return fallback
  if (raw === '/auth' || raw.startsWith('/auth?') || raw === '/login' || raw.startsWith('/login?')) {
    return fallback
  }
  return raw
}

export function hasAdminAccess(user: any) {
  const meta = user?.app_metadata ?? {}
  if (meta.role === 'admin') return true
  const roles = Array.isArray(meta.roles) ? meta.roles : []
  return roles.includes('admin')
}

export function inferPrimaryPortal(user: any): PortalRole {
  const meta = user?.app_metadata ?? {}
  const scalar = typeof meta.role === 'string' ? meta.role : ''
  const roles = Array.isArray(meta.roles) ? meta.roles : []
  const merged = [scalar, ...roles].map((r: any) => String(r || '').toLowerCase()).filter(Boolean)

  if (merged.includes('admin')) return 'admin'
  if (merged.includes('vendor')) return 'vendor'
  if (merged.includes('services')) return 'services'
  if (merged.includes('buyer')) return 'buyer'
  return 'buyer'
}

export function isGrantablePortal(role: PortalRole): role is GrantablePortal {
  return role === 'buyer' || role === 'vendor' || role === 'services'
}

export type FinalizeAuthResult =
  | { ok: true }
  | { ok: false; error: string; adminDenied?: boolean }

/**
 * Shared post-authentication routing: portal grants, admin checks, and redirect.
 * Used after password sign-in and when an OAuth session is detected on /auth.
 */
export async function finalizeAuthenticatedSession(
  user: any,
  role: PortalRole,
  next: string,
  router: AppRouterInstance,
  options?: {
    refreshSession?: () => Promise<void>
    signOut?: () => Promise<void>
  },
): Promise<FinalizeAuthResult> {
  if (role === 'auto') {
    router.replace(next || '/dashboard')
    return { ok: true }
  }

  if (role === 'admin') {
    if (!hasAdminAccess(user)) {
      await options?.signOut?.()
      return { ok: false, error: 'Admin access denied. This account is not an admin.', adminDenied: true }
    }
    router.replace(next)
    return { ok: true }
  }

  if (isGrantablePortal(role)) {
    const granted = await grantPortalAccess(role)
    if (!granted.ok) {
      return { ok: false, error: granted.error || 'Failed to enable dashboard access.' }
    }
    await options?.refreshSession?.()
    const email = typeof user?.email === 'string' ? user.email : ''
    if (email) {
      await persistPortalSession(role, email)
    }
  }

  router.replace(next)
  return { ok: true }
}
