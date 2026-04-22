/**
 * Services console lives under `/services` with fixed segments.
 */
const SERVICES_CONSOLE_ROOT_SEGMENTS = new Set([
  'dashboard',
  'requests',
  'offerings',
  'messages',
  'analytics',
  'settings',
])

export function isServicesConsolePath(pathname: string): boolean {
  if (pathname === '/services') return true
  if (!pathname.startsWith('/services/')) return false
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length < 2 || parts[0] !== 'services') return false
  return SERVICES_CONSOLE_ROOT_SEGMENTS.has(parts[1])
}

