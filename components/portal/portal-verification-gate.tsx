'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth-context'

type Portal = 'vendor' | 'services'

type BootstrapResponse =
  | { ok: true; portal: Portal; vendor: { id: string; is_verified: boolean; verified_at: string | null } }
  | { error: string }

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

  const [status, setStatus] = useState<
    | { kind: 'loading' }
    | { kind: 'verified' }
    | { kind: 'pending' }
    | { kind: 'error'; message: string }
  >({ kind: 'loading' })

  const portalLabel = portal === 'services' ? 'Service provider' : 'Vendor'
  const portalHome = portal === 'services' ? '/services' : '/vendor'

  const nextHref = useMemo(() => {
    const next = pathname?.startsWith(portalHome) ? pathname : portalHome
    return `/auth?role=${encodeURIComponent(portal)}&next=${encodeURIComponent(next)}`
  }, [pathname, portal, portalHome])

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.replace(nextHref)
      return
    }

    let cancelled = false
    ;(async () => {
      setStatus({ kind: 'loading' })
      try {
        const res = await fetch('/api/vendor/bootstrap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ portal }),
        })
        const json = (await res.json().catch(() => ({}))) as BootstrapResponse
        if (cancelled) return
        if (!res.ok) {
          setStatus({ kind: 'error', message: 'Could not load account status.' })
          return
        }
        if (!('ok' in json) || json.ok !== true) {
          setStatus({ kind: 'error', message: 'Could not load account status.' })
          return
        }
        setStatus(json.vendor?.is_verified ? { kind: 'verified' } : { kind: 'pending' })
      } catch (e: any) {
        if (!cancelled) setStatus({ kind: 'error', message: e?.message || 'Could not load account status.' })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isLoading, user, router, nextHref, portal])

  if (status.kind === 'verified') return <>{children}</>

  const title =
    status.kind === 'pending'
      ? `${portalLabel} dashboard pending verification`
      : status.kind === 'error'
        ? `${portalLabel} dashboard unavailable`
        : `Loading ${portalLabel.toLowerCase()} dashboard…`

  const description =
    status.kind === 'pending'
      ? 'An admin must verify your account before this dashboard becomes active.'
      : status.kind === 'error'
        ? status.message
        : 'Checking your account status…'

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <Card className="w-full max-w-xl border-border/60">
        <CardHeader>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {status.kind === 'loading' ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Please wait…
            </div>
          ) : null}

          <div className="flex flex-col sm:flex-row gap-2">
            <Button asChild variant="outline" className="sm:flex-1">
              <Link href="/">Back to shop</Link>
            </Button>
            <Button
              type="button"
              className="sm:flex-1"
              onClick={() => {
                setStatus({ kind: 'loading' })
                router.refresh()
              }}
            >
              Refresh status
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

