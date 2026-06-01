'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ComponentType } from 'react'
import {
  BriefcaseBusiness,
  Check,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  ShoppingBag,
  Store,
} from 'lucide-react'

import { PortalSwitchLink } from '@/components/portal-switch-link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  getDashboardConsoleKind,
  getMessagesHrefForPath,
} from '@/lib/dashboard-console-path'
import type { User } from '@/lib/types'
import {
  PORTAL_DESTINATIONS,
  portalAuthHref,
  type GrantablePortal,
} from '@/lib/portal-session'
import { cn } from '@/lib/utils'

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

function getDashboardHrefForContext(pathname: string, role: string): string {
  const kind = getDashboardConsoleKind(pathname)
  if (kind === 'buyer') return '/buyer'
  if (kind === 'vendor') return '/vendor'
  if (kind === 'services') return '/services/dashboard'
  if (role === 'admin') return '/admin'
  if (role === 'vendor') return '/vendor'
  if (role === 'services') return '/services/dashboard'
  return '/buyer'
}

const PORTAL_META: Record<
  GrantablePortal,
  {
    label: string
    icon: ComponentType<{ className?: string }>
    accent: string
  }
> = {
  buyer: {
    label: 'Buyer',
    icon: ShoppingBag,
    accent: 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
  },
  vendor: {
    label: 'Vendor',
    icon: Store,
    accent: 'bg-violet-500/10 text-violet-700 dark:text-violet-400',
  },
  services: {
    label: 'Services',
    icon: BriefcaseBusiness,
    accent: 'bg-amber-500/10 text-amber-800 dark:text-amber-400',
  },
}

const PORTALS: GrantablePortal[] = ['buyer', 'vendor', 'services']

export function ProfileMenuPanel({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'w-[min(calc(100vw-1.5rem),17.5rem)] overflow-hidden rounded-xl border border-border/80 bg-popover text-popover-foreground shadow-xl shadow-black/8 ring-1 ring-black/[0.04]',
        className,
      )}
    >
      {children}
    </div>
  )
}

function ProfileMenuItem({
  href,
  icon: Icon,
  label,
  onClick,
}: {
  href: string
  icon: ComponentType<{ className?: string }>
  label: string
  onClick?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="group mx-1 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
    >
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
      <span className="flex-1">{label}</span>
      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/35 group-hover:text-muted-foreground" />
    </Link>
  )
}

function WorkspacePortalOption({
  portal,
  isActive,
  onNavigate,
}: {
  portal: GrantablePortal
  isActive: boolean
  onNavigate?: () => void
}) {
  const meta = PORTAL_META[portal]
  const Icon = meta.icon

  const rowClass = cn(
    'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition-colors',
    isActive
      ? 'bg-primary/[0.08] text-foreground'
      : 'text-foreground hover:bg-muted/70',
  )

  const inner = (
    <>
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
          meta.accent,
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1 truncate">{meta.label}</span>
      {isActive ? (
        <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden />
      ) : (
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/35" aria-hidden />
      )}
    </>
  )

  if (isActive) {
    return (
      <div className={rowClass} aria-current="page">
        {inner}
      </div>
    )
  }

  return (
    <PortalSwitchLink portal={portal} className={rowClass} onNavigate={onNavigate}>
      {inner}
    </PortalSwitchLink>
  )
}

export function SignedInProfileMenu({
  user,
  onClose,
  onLogout,
}: {
  user: User
  onClose: () => void
  onLogout: () => void
}) {
  const pathname = usePathname()
  const activeKind = getDashboardConsoleKind(pathname)
  const dashboardHref = getDashboardHrefForContext(pathname, user.role)
  const messagesHref = getMessagesHrefForPath(pathname, user.role)

  return (
    <>
      <div className="flex items-center gap-3 border-b border-border/70 px-3 py-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={user.avatar} alt={user.name} />
          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <div className="py-1.5">
        <ProfileMenuItem
          href={dashboardHref}
          icon={LayoutDashboard}
          label="Dashboard"
          onClick={onClose}
        />
        <ProfileMenuItem
          href={messagesHref}
          icon={MessageSquare}
          label="Messages"
          onClick={onClose}
        />
      </div>

      <div className="border-t border-border/70 py-1.5">
        <div className="px-1">
          {PORTALS.map((portal) => (
            <WorkspacePortalOption
              key={portal}
              portal={portal}
              isActive={activeKind === portal}
              onNavigate={onClose}
            />
          ))}
        </div>
      </div>

      <div className="border-t border-border/70 p-1.5">
        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
          onClick={() => {
            onClose()
            onLogout()
          }}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
        </button>
      </div>
    </>
  )
}

function SignedOutPortalRow({
  portal,
  mode,
  onNavigate,
}: {
  portal: GrantablePortal
  mode: 'login' | 'join'
  onNavigate?: () => void
}) {
  const meta = PORTAL_META[portal]
  const Icon = meta.icon
  const href =
    mode === 'join'
      ? `/auth?role=${portal}&next=${encodeURIComponent(PORTAL_DESTINATIONS[portal])}&mode=signup`
      : portalAuthHref(portal)

  const rowClassName =
    'group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors hover:bg-muted/70'

  const rowContent = (
    <>
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
          meta.accent,
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1 text-left">{meta.label}</span>
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/35" />
    </>
  )

  if (portal === 'buyer') {
    return (
      <Link href={href} onClick={onNavigate} className={rowClassName}>
        {rowContent}
      </Link>
    )
  }

  return (
    <PortalSwitchLink portal={portal} authHref={href} className={rowClassName} onNavigate={onNavigate}>
      {rowContent}
    </PortalSwitchLink>
  )
}

export function SignedOutProfileMenu({
  mode,
  onModeChange,
  onClose,
}: {
  mode: 'login' | 'join'
  onModeChange: (mode: 'login' | 'join') => void
  onClose: () => void
}) {
  return (
    <>
      <div className="border-b border-border/70 p-2">
        <div className="flex rounded-lg bg-muted/40 p-0.5">
          <button
            type="button"
            className={cn(
              'flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors',
              mode === 'login'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground',
            )}
            onClick={() => onModeChange('login')}
          >
            Sign in
          </button>
          <button
            type="button"
            className={cn(
              'flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors',
              mode === 'join'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground',
            )}
            onClick={() => onModeChange('join')}
          >
            Join
          </button>
        </div>
      </div>

      <div className="py-1.5 px-1">
        {PORTALS.map((portal) => (
          <SignedOutPortalRow
            key={portal}
            portal={portal}
            mode={mode}
            onNavigate={onClose}
          />
        ))}
      </div>

      <div className="border-t border-border/70 px-2 pb-2 pt-1">
        {mode === 'login' ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-full text-xs text-muted-foreground"
            onClick={() => onModeChange('join')}
          >
            Create account
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-full text-xs text-muted-foreground"
            onClick={() => onModeChange('login')}
          >
            Sign in instead
          </Button>
        )}
      </div>
    </>
  )
}
