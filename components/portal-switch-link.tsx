'use client'

import { useEffect, useState, type MouseEvent, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

import { PortalSellConfirmDialog } from '@/components/portal-sell-confirm-dialog'
import { useAuth } from '@/lib/auth-context'
import { setPortalSellConfirmOpen } from '@/lib/portal-sell-confirm-guard'
import { isSellPortal } from '@/lib/portal-sell-prompt'
import {
  PORTAL_DESTINATIONS,
  grantPortalAccess,
  portalAuthHref,
  switchToPortal,
  type GrantablePortal,
} from '@/lib/portal-session'

type PortalSwitchLinkProps = {
  portal: GrantablePortal
  children: ReactNode
  className?: string
  /** Override destination when signed out (e.g. sign-up URL). */
  authHref?: string
  onNavigate?: () => void
}

export function PortalSwitchLink({
  portal,
  children,
  className,
  authHref,
  onNavigate,
}: PortalSwitchLinkProps) {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [busy, setBusy] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const needsSellConfirm = isSellPortal(portal)
  const destination = PORTAL_DESTINATIONS[portal]

  useEffect(() => {
    router.prefetch(destination)
  }, [router, destination])

  useEffect(() => {
    if (!needsSellConfirm) return
    setPortalSellConfirmOpen(confirmOpen)
    return () => setPortalSellConfirmOpen(false)
  }, [confirmOpen, needsSellConfirm])

  const handleConfirm = async () => {
    const destination = authHref ?? portalAuthHref(portal)

    if (!user) {
      setConfirmOpen(false)
      // Full navigation — do not call onNavigate first or the menu unmount kills this flow.
      window.location.assign(destination)
      return
    }

    setBusy(true)
    try {
      await switchToPortal(portal, {
        navigate: (href) => {
          setConfirmOpen(false)
          router.push(href)
          onNavigate?.()
        },
      })
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Could not open dashboard.'
      window.alert(message)
    } finally {
      setBusy(false)
    }
  }

  const openBuyerWorkspace = async () => {
    if (!user) {
      window.location.assign(authHref ?? portalAuthHref('buyer'))
      return
    }

    setBusy(true)
    try {
      void grantPortalAccess('buyer')
      router.push(PORTAL_DESTINATIONS.buyer)
      onNavigate?.()
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Could not open buyer workspace.'
      window.alert(message)
    } finally {
      setBusy(false)
    }
  }

  const handleTriggerClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (isLoading || busy) {
      event.preventDefault()
      return
    }

    if (portal === 'buyer' && user) {
      event.preventDefault()
      void openBuyerWorkspace()
      return
    }

    if (needsSellConfirm) {
      event.preventDefault()
      setConfirmOpen(true)
      return
    }

    event.preventDefault()
    void handleConfirm()
  }

  if (isLoading) {
    return (
      <span className={className} aria-disabled>
        {children}
      </span>
    )
  }

  return (
    <>
      <button
        type="button"
        className={className}
        disabled={busy}
        onClick={handleTriggerClick}
      >
        {children}
      </button>

      {needsSellConfirm ? (
        <PortalSellConfirmDialog
          portal={portal}
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          busy={busy}
          onConfirm={() => handleConfirm()}
        />
      ) : null}
    </>
  )
}
