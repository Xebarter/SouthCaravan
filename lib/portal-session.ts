import { getBrowserSupabaseClient } from '@/lib/supabase/client'

export type GrantablePortal = 'buyer' | 'vendor' | 'services'

export const PORTAL_DESTINATIONS: Record<GrantablePortal, string> = {
  buyer: '/buyer',
  vendor: '/vendor',
  services: '/services/dashboard',
}

export type GrantPortalAccessResult = {
  ok: boolean
  error?: string
  email?: string
  userId?: string
}

export type SwitchToPortalOptions = {
  /** Client navigation (e.g. router.push) — faster than a full document reload. */
  navigate?: (href: string) => void
}

export function portalAuthHref(portal: GrantablePortal): string {
  const next = PORTAL_DESTINATIONS[portal]
  return `/auth?role=${portal}&next=${encodeURIComponent(next)}`
}

export async function grantPortalAccess(
  portal: GrantablePortal,
): Promise<GrantPortalAccessResult> {
  try {
    const res = await fetch('/api/auth/portal-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ portal }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok || !json?.ok) {
      return { ok: false, error: json?.error || 'Failed to add portal access.' }
    }
    return {
      ok: true,
      email: typeof json.email === 'string' ? json.email : undefined,
      userId: typeof json.userId === 'string' ? json.userId : undefined,
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to add portal access.'
    return { ok: false, error: message }
  }
}

/** Immediate localStorage hints — no network. */
export function applyPortalLocalHints(
  portal: GrantablePortal,
  email: string,
  userId?: string,
): void {
  const emailPrefix = email.split('@')[0] || 'user'

  if (portal === 'vendor') {
    if (userId) localStorage.setItem('currentVendorId', userId)
    localStorage.setItem('currentVendorName', `${emailPrefix} (vendor)`)
    return
  }

  if (portal === 'services') {
    localStorage.setItem('currentServiceProviderName', `${emailPrefix} (service provider)`)
    if (userId) localStorage.setItem('currentVendorId', userId)
    localStorage.setItem('currentVendorName', `${emailPrefix} (service provider)`)
    return
  }

  if (portal === 'buyer') {
    localStorage.setItem('currentBuyerName', `${emailPrefix} (buyer)`)
    localStorage.setItem('currentBuyerEmail', email)
    if (userId) localStorage.setItem('currentBuyerId', userId)
  }
}

function refreshPortalSessionInBackground(
  portal: GrantablePortal,
  email: string,
  userId?: string,
): void {
  void (async () => {
    try {
      const supabase = getBrowserSupabaseClient()
      await supabase.auth.refreshSession().catch(() => {})

      if (portal === 'vendor' || portal === 'services') {
        await fetch('/api/vendor/bootstrap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ portal }),
        }).catch(() => {})
        return
      }

      if (portal === 'buyer') {
        const res = await fetch(`/api/customers?email=${encodeURIComponent(email)}`).catch(
          () => null,
        )
        if (res?.ok) {
          const json = await res.json().catch(() => ({}))
          const customer = json?.customer
          if (customer?.id) localStorage.setItem('currentBuyerId', String(customer.id))
          if (customer?.phone) localStorage.setItem('currentBuyerPhone', String(customer.phone))
        } else if (userId) {
          localStorage.setItem('currentBuyerId', userId)
        }
      }
    } catch {
      /* non-fatal */
    }
  })()
}

/** Sync localStorage hints; network enrichment runs in the background. */
export async function persistPortalSession(
  portal: GrantablePortal,
  email: string,
  userId?: string,
): Promise<void> {
  applyPortalLocalHints(portal, email, userId)
  refreshPortalSessionInBackground(portal, email, userId)
}

/**
 * Grant portal access and open the target dashboard.
 * Navigates as soon as access is granted; JWT refresh and bootstrap run afterward.
 */
export async function switchToPortal(
  portal: GrantablePortal,
  options?: SwitchToPortalOptions,
): Promise<void> {
  const granted = await grantPortalAccess(portal)
  if (!granted.ok) {
    throw new Error(granted.error || 'Failed to enable dashboard access.')
  }

  const email = granted.email ?? ''
  const userId = granted.userId ?? ''
  if (email) {
    applyPortalLocalHints(portal, email, userId)
    refreshPortalSessionInBackground(portal, email, userId)
  }

  const href = PORTAL_DESTINATIONS[portal]
  const navigate = options?.navigate ?? ((url: string) => window.location.assign(url))
  navigate(href)
}
