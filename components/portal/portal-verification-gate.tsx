'use client'

import { useCallback, useEffect, useState, type ComponentType } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  AlertCircle,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Circle,
  Clock,
  Loader2,
  Mail,
  RefreshCw,
  ShieldCheck,
  Store,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import {
  readPortalVerificationCache,
  writePortalVerificationCache,
} from '@/lib/portal-verification-cache'
import { cn } from '@/lib/utils'

type Portal = 'vendor' | 'services'

type BootstrapResponse =
  | { ok: true; portal: Portal; vendor: { id: string; is_verified: boolean; verified_at: string | null } }
  | { error: string }

type GateStatus =
  | { kind: 'loading' }
  | { kind: 'verified' }
  | { kind: 'pending' }
  | { kind: 'error'; message: string }

type PortalTheme = {
  label: string
  workspaceLabel: string
  icon: ComponentType<{ className?: string }>
  accentBar: string
  iconWrap: string
  stepActive: string
  stepDone: string
  panelBg: string
}

const PORTAL_THEMES: Record<Portal, PortalTheme> = {
  vendor: {
    label: 'Vendor',
    workspaceLabel: 'vendor workspace',
    icon: Store,
    accentBar: 'bg-violet-600',
    iconWrap: 'bg-violet-500/12 text-violet-700 ring-violet-500/20 dark:text-violet-300',
    stepActive: 'border-violet-500/35 bg-violet-500/[0.06] text-violet-800 dark:text-violet-200',
    stepDone: 'bg-violet-500/15 text-violet-700 dark:text-violet-300',
    panelBg: 'bg-violet-500/[0.04]',
  },
  services: {
    label: 'Service provider',
    workspaceLabel: 'services workspace',
    icon: BriefcaseBusiness,
    accentBar: 'bg-amber-600',
    iconWrap: 'bg-amber-500/12 text-amber-800 ring-amber-500/20 dark:text-amber-300',
    stepActive: 'border-amber-500/35 bg-amber-500/[0.06] text-amber-900 dark:text-amber-100',
    stepDone: 'bg-amber-500/15 text-amber-800 dark:text-amber-300',
    panelBg: 'bg-amber-500/[0.04]',
  },
}

const REVIEW_STEPS = [
  { key: 'submitted', label: 'Application received', detail: 'Account registered.' },
  { key: 'review', label: 'Admin review', detail: 'Team verifies your details.' },
  { key: 'active', label: 'Workspace activated', detail: 'Dashboard and listings unlock.' },
] as const

function VerificationStepList({
  theme,
  activeIndex,
}: {
  theme: PortalTheme
  activeIndex: number
}) {
  return (
    <ol className="space-y-0">
      {REVIEW_STEPS.map((step, index) => {
        const done = index < activeIndex
        const active = index === activeIndex
        const upcoming = index > activeIndex

        return (
          <li key={step.key} className="relative flex gap-3 pb-5 last:pb-0">
            {index < REVIEW_STEPS.length - 1 ? (
              <span
                className={cn(
                  'absolute left-[15px] top-8 bottom-0 w-px',
                  done ? 'bg-border' : 'bg-border/80',
                )}
                aria-hidden
              />
            ) : null}

            <span
              className={cn(
                'relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full border',
                done && cn('border-transparent', theme.stepDone),
                active && cn('border', theme.stepActive),
                upcoming && 'border-border bg-muted/50 text-muted-foreground',
              )}
            >
              {done ? (
                <CheckCircle2 className="h-4 w-4" aria-hidden />
              ) : active ? (
                <Clock className="h-4 w-4 animate-pulse" aria-hidden />
              ) : (
                <Circle className="h-3 w-3" aria-hidden />
              )}
            </span>

            <div className="min-w-0 pt-0.5">
              <p
                className={cn(
                  'text-sm font-medium',
                  active ? 'text-foreground' : done ? 'text-foreground/90' : 'text-muted-foreground',
                )}
              >
                {step.label}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{step.detail}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function PortalVerificationStatusCard({
  portal,
  status,
  onRefresh,
}: {
  portal: Portal
  status: Exclude<GateStatus, { kind: 'verified' }>
  onRefresh: () => void
}) {
  const theme = PORTAL_THEMES[portal]
  const Icon = theme.icon
  const isLoading = status.kind === 'loading'
  const isPending = status.kind === 'pending'
  const isError = status.kind === 'error'

  const badgeLabel = isLoading ? 'Checking status' : isPending ? 'Under review' : 'Unavailable'
  const badgeVariant = isError ? 'destructive' : isPending ? 'warning' : 'info'

  const title = isPending
    ? 'Verification in progress'
    : isError
      ? 'Status unavailable'
      : 'Checking your account'

  const description = isPending
    ? `Your ${theme.workspaceLabel} awaits admin approval. Reviews usually finish within 1–2 business days.`
    : isError
      ? status.message
      : 'Checking verification status…'

  return (
    <div className="relative flex min-h-[min(70vh,40rem)] items-center justify-center px-4 py-10 sm:px-6 sm:py-14">
      <div className={cn('pointer-events-none absolute inset-0', theme.panelBg)} aria-hidden />

      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_24px_80px_-32px_rgba(0,0,0,0.18)] ring-1 ring-black/[0.03] dark:ring-white/[0.04]">
        <div className={cn('h-1 w-full', theme.accentBar)} aria-hidden />

        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div
              className={cn(
                'flex h-14 w-14 items-center justify-center rounded-2xl ring-1 ring-inset',
                theme.iconWrap,
              )}
            >
              {isLoading ? (
                <Loader2 className="h-7 w-7 animate-spin" aria-hidden />
              ) : isError ? (
                <AlertCircle className="h-7 w-7" aria-hidden />
              ) : (
                <Icon className="h-7 w-7" strokeWidth={1.75} aria-hidden />
              )}
            </div>
            <Badge
              variant={badgeVariant}
              className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
            >
              {badgeLabel}
            </Badge>
          </div>

          <div className="mt-6 space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.65rem]">
              {title}
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
              {description}
            </p>
          </div>

          {isPending ? (
            <div className="mt-8 rounded-xl border border-border/60 bg-muted/25 p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                Review progress
              </div>
              <VerificationStepList theme={theme} activeIndex={1} />
            </div>
          ) : null}

          {isPending ? (
            <div className="mt-5 flex gap-3 rounded-lg border border-border/50 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
              <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <p className="leading-relaxed">
                We&apos;ll email you when approved. Refresh this page to open your dashboard.
              </p>
            </div>
          ) : null}

          {isLoading ? (
            <div className="mt-8 flex items-center gap-2 rounded-lg border border-dashed border-border/70 bg-muted/15 px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
              Verifying your account…
            </div>
          ) : null}

          <div className="mt-8 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-10 justify-center text-muted-foreground sm:px-3"
            >
              <Link href="/">Back to marketplace</Link>
            </Button>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="h-10 gap-2"
                disabled={isLoading}
                onClick={onRefresh}
              >
                <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} aria-hidden />
                Refresh status
              </Button>
              {isPending ? (
                <Button asChild className="h-10 gap-2">
                  <Link href="/contact">
                    Contact support
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function PortalVerificationGate({
  portal,
  children,
}: {
  portal: Portal
  children: React.ReactNode
}) {
  const { user, isLoading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const portalHome = portal === 'services' ? '/services' : '/vendor'
  const userId = user?.id

  const [status, setStatus] = useState<GateStatus>(() => {
    if (!userId) return { kind: 'loading' }
    const cached = readPortalVerificationCache(portal, userId)
    if (cached === 'verified') return { kind: 'verified' }
    if (cached === 'pending') return { kind: 'pending' }
    return { kind: 'loading' }
  })

  const loadVerificationStatus = useCallback(
    async (options?: { background?: boolean }) => {
      if (!userId) return

      const cached = readPortalVerificationCache(portal, userId)
      if (!options?.background) {
        if (cached === 'verified') {
          setStatus({ kind: 'verified' })
        } else if (cached === 'pending') {
          setStatus({ kind: 'pending' })
        } else {
          setStatus((prev) =>
            prev.kind === 'verified' || prev.kind === 'pending' ? prev : { kind: 'loading' },
          )
        }
      }

      try {
        const bootstrapUrl =
          portal === 'services' ? '/api/services/bootstrap' : '/api/vendor/bootstrap'
        const res = await fetch(bootstrapUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ portal }),
        })
        const json = (await res.json().catch(() => ({}))) as BootstrapResponse
        if (!res.ok) {
          if (!options?.background || !cached) {
            setStatus({ kind: 'error', message: 'Could not load account status.' })
          }
          return
        }
        if (!('ok' in json) || json.ok !== true) {
          if (!options?.background || !cached) {
            setStatus({ kind: 'error', message: 'Could not load account status.' })
          }
          return
        }

        const nextStatus = json.vendor?.is_verified ? 'verified' : 'pending'
        writePortalVerificationCache(portal, userId, nextStatus)
        setStatus(nextStatus === 'verified' ? { kind: 'verified' } : { kind: 'pending' })
      } catch (e: unknown) {
        if (!options?.background || !cached) {
          const message = e instanceof Error ? e.message : 'Could not load account status.'
          setStatus({ kind: 'error', message })
        }
      }
    },
    [portal, userId],
  )

  const refreshStatus = () => {
    void loadVerificationStatus()
  }

  useEffect(() => {
    if (!userId) return
    const cached = readPortalVerificationCache(portal, userId)
    if (cached === 'verified') setStatus({ kind: 'verified' })
    else if (cached === 'pending') setStatus({ kind: 'pending' })
  }, [portal, userId])

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      const next = pathname?.startsWith(portalHome) ? pathname : portalHome
      const authHref = `/auth?role=${encodeURIComponent(portal)}&next=${encodeURIComponent(next)}`
      router.replace(authHref)
    }
  }, [isLoading, user, pathname, portalHome, portal, router])

  useEffect(() => {
    if (isLoading || !userId) return

    const cached = readPortalVerificationCache(portal, userId)
    void loadVerificationStatus({ background: cached === 'verified' })
  }, [isLoading, userId, portal, loadVerificationStatus])

  if (isLoading && status.kind !== 'verified' && status.kind !== 'pending') {
    return null
  }

  if (status.kind === 'verified') return <>{children}</>

  return (
    <PortalVerificationStatusCard portal={portal} status={status} onRefresh={refreshStatus} />
  )
}
