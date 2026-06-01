import { isServicesConsolePath } from '@/lib/services-console-path'
import { isVendorConsolePath } from '@/lib/vendor-console-path'

export type DashboardConsoleKind = 'buyer' | 'vendor' | 'services'

export function getDashboardConsoleKind(pathname: string): DashboardConsoleKind | null {
  if (pathname === '/buyer' || pathname.startsWith('/buyer/')) {
    if (pathname.startsWith('/buyer/services')) return null
    return 'buyer'
  }
  if (isVendorConsolePath(pathname)) return 'vendor'
  if (isServicesConsolePath(pathname)) return 'services'
  return null
}

export function isAnyDashboardConsolePath(pathname: string): boolean {
  return getDashboardConsoleKind(pathname) !== null
}

export function getMessagesHrefForPath(pathname: string, fallbackRole: string): string {
  const kind = getDashboardConsoleKind(pathname)
  if (kind === 'vendor') return '/vendor/messages'
  if (kind === 'services') return '/services/messages'
  if (kind === 'buyer') return '/buyer/messages'
  if (fallbackRole === 'admin') return '/admin'
  if (fallbackRole === 'vendor') return '/vendor/messages'
  if (fallbackRole === 'services') return '/services/messages'
  return '/buyer/messages'
}
