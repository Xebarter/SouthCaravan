/** URL prefixes that must not appear in Google search results. */
const NOINDEX_PREFIXES = [
  '/cart',
  '/checkout',
  '/auth',
  '/login',
  '/signup',
  '/dashboard',
  '/admin',
  '/buyer',
  '/vendor/orders',
  '/vendor/products',
  '/vendor/quotes',
  '/vendor/messages',
  '/vendor/analytics',
  '/vendor/settings',
  '/services/dashboard',
  '/services/requests',
  '/services/offerings',
  '/services/messages',
  '/services/analytics',
  '/services/settings',
  '/api',
] as const

export function shouldNoIndexPath(pathname: string): boolean {
  if (pathname === '/vendor') return false
  if (pathname.startsWith('/vendor/')) {
    const segment = pathname.split('/').filter(Boolean)[1]
    const vendorConsoleSegments = new Set([
      'orders',
      'products',
      'quotes',
      'messages',
      'analytics',
      'settings',
    ])
    if (segment && vendorConsoleSegments.has(segment)) return true
    return false
  }
  return NOINDEX_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}
