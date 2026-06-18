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

/** Filtered category views must not compete with the homepage for brand searches. */
export function shouldNoIndexCategorySearch(pathname: string, search: string): boolean {
  if (pathname !== '/categories') return false
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  return params.has('category') || params.has('subcategory') || params.has('type')
}
