type Portal = 'vendor' | 'services'
type CachedVerification = 'verified' | 'pending'

const memory = new Map<string, CachedVerification>()

function cacheKey(portal: Portal, userId: string) {
  return `sc_portal_verification:${portal}:${userId}`
}

export function readPortalVerificationCache(
  portal: Portal,
  userId: string,
): CachedVerification | null {
  const id = String(userId || '').trim()
  if (!id) return null

  const mem = memory.get(cacheKey(portal, id))
  if (mem) return mem

  if (typeof window === 'undefined') return null

  try {
    const raw = window.sessionStorage.getItem(cacheKey(portal, id))
    if (raw === 'verified' || raw === 'pending') {
      memory.set(cacheKey(portal, id), raw)
      return raw
    }
  } catch {
    // non-fatal
  }

  return null
}

export function writePortalVerificationCache(
  portal: Portal,
  userId: string,
  status: CachedVerification,
) {
  const id = String(userId || '').trim()
  if (!id) return

  memory.set(cacheKey(portal, id), status)

  if (typeof window === 'undefined') return

  try {
    window.sessionStorage.setItem(cacheKey(portal, id), status)
  } catch {
    // non-fatal
  }
}

export function clearPortalVerificationCache(portal: Portal, userId: string) {
  const id = String(userId || '').trim()
  if (!id) return

  memory.delete(cacheKey(portal, id))

  if (typeof window === 'undefined') return

  try {
    window.sessionStorage.removeItem(cacheKey(portal, id))
  } catch {
    // non-fatal
  }
}
