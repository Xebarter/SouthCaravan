'use client'

import Link from 'next/link'
import { useState, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { LogOut } from 'lucide-react'

import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { useRegisterDashboardNav } from '@/components/dashboard-nav-context'
import { cn } from '@/lib/utils'

export type WorkspacePortal = 'buyer' | 'vendor' | 'services'

const PORTAL_THEME: Record<
  WorkspacePortal,
  { label: string; dot: string; badge: string }
> = {
  buyer: {
    label: 'Buyer',
    dot: 'bg-sky-500',
    badge: 'bg-sky-500/10 text-sky-800 dark:text-sky-300',
  },
  vendor: {
    label: 'Vendor',
    dot: 'bg-violet-500',
    badge: 'bg-violet-500/10 text-violet-800 dark:text-violet-300',
  },
  services: {
    label: 'Services',
    dot: 'bg-amber-500',
    badge: 'bg-amber-500/10 text-amber-900 dark:text-amber-300',
  },
}

export type SidebarNavItem = {
  href: string
  label: string
  icon: LucideIcon
  badge?: number
}

export type SidebarFooterAction = {
  label: string
  icon: LucideIcon
  href?: string
  external?: boolean
  onClick?: () => void
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

export function isDashboardNavActive(href: string, pathname: string): boolean {
  if (href === '/buyer' || href === '/services/dashboard') {
    return pathname === href
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

function SidebarNavLink({
  item,
  pathname,
  onNavigate,
}: {
  item: SidebarNavItem
  pathname: string
  onNavigate?: () => void
}) {
  const Icon = item.icon
  const isActive = isDashboardNavActive(item.href, pathname)
  const badge =
    item.badge && item.badge > 0
      ? item.badge > 99
        ? '99+'
        : String(item.badge)
      : null

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'group relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
        isActive
          ? 'bg-background text-foreground shadow-sm ring-1 ring-border/80'
          : 'text-muted-foreground hover:bg-background/60 hover:text-foreground',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-primary transition-opacity',
          isActive ? 'opacity-100' : 'opacity-0',
        )}
      />
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-colors',
          isActive
            ? 'border-primary/20 bg-primary/10 text-primary'
            : 'border-transparent bg-muted/80 text-muted-foreground group-hover:border-border/60 group-hover:bg-background group-hover:text-foreground',
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {badge ? (
        <span
          className={cn(
            'ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold tabular-nums',
            isActive
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground',
          )}
        >
          {badge}
        </span>
      ) : null}
    </Link>
  )
}

function SidebarFooterLink({
  action,
  onNavigate,
}: {
  action: SidebarFooterAction
  onNavigate?: () => void
}) {
  const Icon = action.icon
  const className =
    'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-background/70 hover:text-foreground'

  if (action.href) {
    return (
      <Link
        href={action.href}
        onClick={onNavigate}
        target={action.external ? '_blank' : undefined}
        rel={action.external ? 'noopener noreferrer' : undefined}
        className={className}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="truncate">{action.label}</span>
      </Link>
    )
  }

  return (
    <button type="button" onClick={action.onClick} className={className}>
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{action.label}</span>
    </button>
  )
}

export function DashboardWorkspaceSidebar({
  portal,
  displayName,
  displayEmail,
  pathname,
  items,
  footerActions = [],
  onSignOut,
  onNavigate,
  className,
}: {
  portal: WorkspacePortal
  displayName: string
  displayEmail?: string
  pathname: string
  items: SidebarNavItem[]
  footerActions?: SidebarFooterAction[]
  onSignOut?: () => void
  onNavigate?: () => void
  className?: string
}) {
  const theme = PORTAL_THEME[portal]

  return (
    <div
      className={cn(
        'flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border/80 bg-card/95 shadow-sm ring-1 ring-black/[0.03] backdrop-blur-sm',
        className,
      )}
    >
      <div className="border-b border-border/70 px-3 py-3">
        <div className="flex items-center gap-2">
          <span className={cn('h-2 w-2 shrink-0 rounded-full', theme.dot)} aria-hidden />
          <span
            className={cn(
              'rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
              theme.badge,
            )}
          >
            {theme.label}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-2.5">
          <div
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
              theme.badge,
            )}
          >
            {getInitials(displayName || theme.label)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {displayName || theme.label}
            </p>
            {displayEmail ? (
              <p className="truncate text-xs text-muted-foreground">{displayEmail}</p>
            ) : null}
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2 min-h-0">
        {items.map((item) => (
          <SidebarNavLink
            key={item.href}
            item={item}
            pathname={pathname}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      {(footerActions.length > 0 || onSignOut) && (
        <div className="space-y-0.5 border-t border-border/70 p-2">
          {footerActions.map((action) => (
            <SidebarFooterLink
              key={`${action.label}-${action.href ?? 'action'}`}
              action={action}
              onNavigate={onNavigate}
            />
          ))}
          {onSignOut ? (
            <button
              type="button"
              onClick={() => {
                onNavigate?.()
                onSignOut()
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-destructive/90 transition-colors hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Sign out
            </button>
          ) : null}
        </div>
      )}
    </div>
  )
}

export function DashboardConsoleChrome({
  portal,
  sheetTitle,
  displayName,
  displayEmail,
  pathname,
  navItems,
  footerActions,
  onSignOut,
  children,
}: {
  portal: WorkspacePortal
  sheetTitle: string
  displayName: string
  displayEmail?: string
  pathname: string
  navItems: SidebarNavItem[]
  footerActions?: SidebarFooterAction[]
  onSignOut?: () => void
  children: ReactNode
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useRegisterDashboardNav(() => setMobileNavOpen(true))

  const closeMobileNav = () => setMobileNavOpen(false)

  const sidebarProps = {
    portal,
    displayName,
    displayEmail,
    pathname,
    items: navItems,
    footerActions,
    onSignOut,
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col bg-muted/20 md:flex-row">
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-[min(100vw-2rem,18rem)] border-r p-2 md:hidden">
          <SheetTitle className="sr-only">{sheetTitle}</SheetTitle>
          <DashboardWorkspaceSidebar {...sidebarProps} onNavigate={closeMobileNav} />
        </SheetContent>
      </Sheet>

      <aside className="hidden w-[17.5rem] shrink-0 p-3 md:block lg:sticky lg:top-16 lg:h-[calc(100dvh-4rem)] lg:self-start">
        <div className="h-full max-h-[calc(100dvh-4rem)]">
          <DashboardWorkspaceSidebar {...sidebarProps} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex min-h-0 flex-1 flex-col overflow-auto">{children}</main>
      </div>
    </div>
  )
}
