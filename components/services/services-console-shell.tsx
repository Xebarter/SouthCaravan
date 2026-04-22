'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import {
  BarChart3,
  BriefcaseBusiness,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  Inbox,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/services/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/services/requests', label: 'Requests', icon: Inbox },
  { href: '/services/offerings', label: 'Offerings', icon: BriefcaseBusiness },
  { href: '/services/messages', label: 'Messages', icon: MessageSquare },
  { href: '/services/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/services/settings', label: 'Settings', icon: Settings },
] as const

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function ServicesIdentity({ name, email }: { name: string; email: string }) {
  const showEmail = email.trim().length > 0
  return (
    <div className="hidden sm:flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-secondary/60 transition-colors">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
        {getInitials(name || 'Services')}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium leading-tight">{name || 'Service Provider'}</p>
        {showEmail ? (
          <p className="truncate text-[11px] text-muted-foreground leading-tight">{email}</p>
        ) : (
          <p className="truncate text-[11px] text-muted-foreground leading-tight">Signed in</p>
        )}
      </div>
    </div>
  )
}

function ServicesSidebar({
  pathname,
  onNavigate,
  name,
  email,
}: {
  pathname: string
  onNavigate?: () => void
  name: string
  email: string
}) {
  const storefrontHref = '/services' // placeholder; can later point to a public provider page

  return (
    <aside className="flex h-full flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center gap-3 border-b border-border px-5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
          {getInitials(name || 'SP')}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight">{name || 'Service Provider'}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {email || 'Services Console'}
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4 shrink-0 transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                )}
              />
              {item.label}
              {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border p-3">
        <div className="mb-2 rounded-lg px-3 py-2">
          <p className="text-xs text-muted-foreground">SouthCaravan</p>
          <p className="text-sm font-semibold">Services Console</p>
        </div>
        <Link
          href={storefrontHref}
          onClick={onNavigate}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          View site
        </Link>
      </div>
    </aside>
  )
}

export function ServicesConsoleShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const displayName = useMemo(() => user?.name ?? user?.company ?? 'Service Provider', [user])
  const email = (user?.email ?? '').trim()

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden shrink-0"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="text-sm font-semibold truncate">
            {NAV_ITEMS.find((n) => pathname === n.href || pathname.startsWith(`${n.href}/`))
              ?.label ?? 'Services'}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex text-xs">
            <Link href="/">View site</Link>
          </Button>
          <ServicesIdentity name={displayName} email={email} />
          {user ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Log out</span>
            </Button>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)]">
        <div className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-16 h-[calc(100vh-4rem)]">
            <ServicesSidebar pathname={pathname} name={displayName} email={email} />
          </div>
        </div>

        <main className="flex-1 min-w-0 overflow-x-hidden">{children}</main>
      </div>

      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          />
          <div className="absolute left-0 top-0 flex h-full w-[76vw] max-w-xs flex-col bg-background shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-border px-5">
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{displayName}</p>
                {email ? (
                  <p className="text-[11px] text-muted-foreground truncate">{email}</p>
                ) : null}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ServicesSidebar
                pathname={pathname}
                name={displayName}
                email={email}
                onNavigate={() => setMenuOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

