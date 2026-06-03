'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useMemo } from 'react'
import {
  ArrowLeft,
  BarChart3,
  BriefcaseBusiness,
  Inbox,
  LayoutDashboard,
  MessageSquare,
  Settings,
  ShoppingBag,
} from 'lucide-react'

import {
  DashboardConsoleChrome,
  type SidebarNavItem,
} from '@/components/dashboard/dashboard-workspace-sidebar'
import { useAuth } from '@/lib/auth-context'
import { PORTAL_DESTINATIONS } from '@/lib/portal-session'

const NAV_ITEMS: SidebarNavItem[] = [
  { href: '/services/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/services/requests', label: 'Requests', icon: Inbox },
  { href: '/services/offerings', label: 'Offerings', icon: BriefcaseBusiness },
  { href: '/services/messages', label: 'Messages', icon: MessageSquare },
  { href: '/services/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/services/settings', label: 'Settings', icon: Settings },
]

export function ServicesConsoleShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  const displayName = useMemo(
    () => user?.name ?? user?.company ?? 'Service Provider',
    [user],
  )
  const email = (user?.email ?? '').trim()

  const handleLogout = () => {
    logout()
    router.replace('/')
  }

  return (
    <DashboardConsoleChrome
      portal="services"
      sheetTitle="Service provider workspace menu"
      displayName={displayName}
      displayEmail={email || undefined}
      pathname={pathname}
      navItems={NAV_ITEMS}
      footerActions={[
        { label: 'Buyer workspace', icon: ShoppingBag, href: PORTAL_DESTINATIONS.buyer },
        { label: 'Shop', icon: ArrowLeft, href: '/' },
      ]}
      onSignOut={handleLogout}
    >
      {children}
    </DashboardConsoleChrome>
  )
}
