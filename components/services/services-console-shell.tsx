'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useMemo } from 'react'
import {
  ArrowLeft,
  BarChart3,
  BriefcaseBusiness,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
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

function ConsoleFooter({
  onNavigate,
  variant,
}: {
  onNavigate?: () => void
  variant: 'sheet' | 'sidebar'
}) {
  const router = useRouter()
  const { logout } = useAuth()

  const handleLogout = () => {
    onNavigate?.()
    logout()
    router.replace('/')
  }

  const rowPad = variant === 'sheet' ? 'py-3' : 'py-2'

  return (
    <div className="mt-auto p-3 border-t border-border/70 space-y-2">
      <Link
        href="/"
        onClick={onNavigate}
        className={cn(
          'flex items-center gap-3 rounded-2xl px-4 text-sm text-foreground hover:bg-accent/70 transition-colors',
          rowPad,
        )}
      >
        <ArrowLeft className="w-4 h-4 shrink-0" />
        <span className="truncate">Back to Shop</span>
      </Link>
      <Button
        type="button"
        onClick={handleLogout}
        variant="outline"
        className={cn(
          'w-full flex items-center gap-3 rounded-2xl px-4 text-sm border-border/70 hover:bg-muted/20',
          rowPad,
        )}
      >
        <LogOut className="w-4 h-4 shrink-0" />
        Sign out
      </Button>
    </div>
  )
}

export function ServicesConsoleShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useAuth()

  const displayName = useMemo(() => user?.name ?? user?.company ?? 'Service Provider', [user])
  const email = (user?.email ?? '').trim()

  return (
    <div className="flex flex-col md:flex-row flex-1 min-h-0 bg-linear-to-b from-background via-background to-muted/30">
      {/* Mobile workspace strip — marketplace Header/Footer wrap this (same idea as /buyer) */}
      <div className="md:hidden w-full border-b border-border/70 bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/70">
        <div className="h-14 px-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-wide text-muted-foreground truncate">Services</p>
            <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <div className="h-full flex flex-col">
                <div className="px-5 py-4 border-b border-border/70 bg-linear-to-b from-card/60 to-transparent">
                  <p className="text-xs font-medium tracking-wide text-muted-foreground">Menu</p>
                  <p className="mt-1 text-base font-semibold text-foreground truncate">{displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{email || '—'}</p>
                </div>

                <nav className="p-2 space-y-1 overflow-auto">
                  {NAV_ITEMS.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/10'
                            : 'text-foreground/90 hover:bg-accent/60 hover:text-foreground',
                        )}
                      >
                        <Icon
                          className={cn(
                            'w-4 h-4 shrink-0 transition-transform',
                            isActive ? '' : 'group-hover:scale-[1.04]',
                          )}
                        />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    )
                  })}
                </nav>

                <ConsoleFooter variant="sheet" />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Desktop sidebar — aligned with /buyer (md+, sticky under global Header) */}
      <aside
        className={cn(
          'hidden md:block w-72 p-4 bg-muted/20 shrink-0 md:w-80 lg:sticky lg:top-16 lg:bottom-auto lg:h-[calc(100dvh-5rem)]',
        )}
      >
        <div className="w-full bg-card/70 backdrop-blur border border-border/70 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-0 h-full max-h-full">
          <div className="px-5 py-4 border-b border-border/70 bg-linear-to-b from-card/70 to-transparent">
            <p className="text-xs font-medium tracking-wide text-muted-foreground">Workspace</p>
            <h2 className="mt-1 font-semibold text-foreground">Service provider</h2>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                {getInitials(displayName)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{email || '—'}</p>
              </div>
            </div>
          </div>

          <nav className="p-2 space-y-1 overflow-auto flex-1 min-h-0">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-2xl px-4 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/10'
                      : 'text-foreground/90 hover:bg-accent/60 hover:text-foreground',
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      'absolute left-1 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary-foreground/80 transition-opacity',
                      isActive ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <Icon
                    className={cn(
                      'w-4 h-4 shrink-0 transition-transform',
                      isActive ? '' : 'group-hover:scale-[1.04]',
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <ConsoleFooter variant="sidebar" />
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col md:pl-4">
        <main className="flex flex-1 overflow-auto min-h-0 flex-col">{children}</main>
      </div>
    </div>
  )
}
