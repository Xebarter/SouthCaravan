'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, MailCheck, UserPlus } from 'lucide-react'

import {
  AuthBrandBanner,
  AuthPageBackground,
  authCardClassName,
  authFieldClassName,
  authPrimaryButtonClassName,
  authSecondaryButtonClassName,
  authTextButtonClassName,
} from '@/components/auth-chrome'
import { getBrowserSupabaseClient } from '@/lib/supabase/client'

type PortalRole = 'buyer' | 'vendor' | 'services' | 'admin'
type Mode = 'signin' | 'signup' | 'forgot'
type PortalMatch = PortalRole | 'unknown'

function getDefaultNext(role: PortalRole) {
  if (role === 'buyer') return '/'
  if (role === 'vendor') return '/vendor/orders'
  if (role === 'services') return '/services/orders'
  if (role === 'admin') return '/admin'
  return '/'
}

function safeNextPath(input: string | null | undefined, role: PortalRole) {
  const fallback = getDefaultNext(role)
  const raw = (input ?? '').trim()
  if (!raw) return fallback

  // Only allow internal absolute paths.
  if (!raw.startsWith('/')) return fallback

  // Avoid redirect loops back to auth/login entrypoints.
  if (raw === '/auth' || raw.startsWith('/auth?') || raw === '/login' || raw.startsWith('/login?')) {
    return fallback
  }

  return raw
}

function hasAdminAccess(user: any) {
  const meta = user?.app_metadata ?? {}
  if (meta.role === 'admin') return true
  const roles = Array.isArray(meta.roles) ? meta.roles : []
  return roles.includes('admin')
}

function portalLabel(role: PortalRole): string {
  if (role === 'services') return 'service provider'
  return role
}

function portalTitleCase(role: PortalRole): string {
  const label = portalLabel(role)
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function userRequestedPortalAtSignup(user: any, role: PortalRole): boolean {
  if (!user || role === 'admin') return false
  const metaRole = typeof user?.user_metadata?.role === 'string' ? user.user_metadata.role : ''
  return metaRole.toLowerCase() === role
}

async function fetchHasPortalAccess(role: PortalRole): Promise<boolean> {
  if (role === 'admin') return true
  try {
    const res = await fetch(`/api/auth/portal-access?portal=${encodeURIComponent(role)}`, {
      method: 'GET',
      cache: 'no-store',
    })
    if (!res.ok) return false
    const json = await res.json().catch(() => ({}))
    return Boolean(json?.has)
  } catch {
    return false
  }
}

async function fetchEmailStatus(
  email: string,
  role: PortalRole
): Promise<{ registered: boolean; authExists: boolean }> {
  try {
    const res = await fetch('/api/auth/check-email-registered', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, portal: role }),
    })
    const json = await res.json().catch(() => ({}))
    return {
      registered: Boolean(json?.registered),
      authExists: Boolean(json?.authExists),
    }
  } catch {
    return { registered: false, authExists: false }
  }
}

async function grantPortalAccess(
  role: PortalRole
): Promise<{ ok: boolean; error?: string }> {
  if (role === 'admin') {
    return { ok: false, error: 'Admin access cannot be granted through this flow.' }
  }
  try {
    const res = await fetch('/api/auth/portal-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ portal: role }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok || !json?.ok) {
      return { ok: false, error: json?.error || 'Failed to add portal access.' }
    }
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Failed to add portal access.' }
  }
}

function inferPortalFromLocalStorage(): PortalMatch {
  try {
    const vendor = localStorage.getItem('currentVendorName')
    if (vendor) return 'vendor'
    const service = localStorage.getItem('currentServiceProviderName')
    if (service) return 'services'
    const buyer = localStorage.getItem('currentBuyerName')
    if (buyer) return 'buyer'
  } catch {}
  return 'unknown'
}

function clearPortalHints() {
  const keys = [
    'currentVendorId',
    'currentVendorName',
    'currentServiceProviderName',
    'currentServiceProviderServices',
    'currentBuyerName',
    'currentBuyerEmail',
    'currentBuyerId',
    'currentBuyerPhone',
    'buyerProfile',
  ]
  for (const key of keys) {
    try {
      localStorage.removeItem(key)
    } catch {}
  }
}

async function persistSessionProfile(role: PortalRole, email: string) {
  const emailPrefix = email.split('@')[0] || 'user'

  if (role === 'vendor') {
    try {
      const supabase = getBrowserSupabaseClient()
      const { data } = await supabase.auth.getUser()
      if (data.user?.id) localStorage.setItem('currentVendorId', data.user.id)
    } catch {
      localStorage.setItem('currentVendorId', 'self')
    }
    localStorage.setItem('currentVendorName', `${emailPrefix} (vendor)`)
    try {
      await fetch('/api/vendor/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portal: 'vendor' }),
      })
    } catch {}
    return
  }

  if (role === 'services') {
    localStorage.setItem('currentServiceProviderName', `${emailPrefix} (service provider)`)
    try {
      const supabase = getBrowserSupabaseClient()
      const { data } = await supabase.auth.getUser()
      if (data.user?.id) localStorage.setItem('currentVendorId', data.user.id)
    } catch {
      localStorage.setItem('currentVendorId', 'self')
    }
    localStorage.setItem('currentVendorName', `${emailPrefix} (service provider)`)
    try {
      await fetch('/api/vendor/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portal: 'services' }),
      })
    } catch {}
    return
  }

  if (role === 'buyer') {
    localStorage.setItem('currentBuyerName', `${emailPrefix} (buyer)`)
    localStorage.setItem('currentBuyerEmail', email)
    try {
      const res = await fetch(`/api/customers?email=${encodeURIComponent(email)}`)
      if (res.ok) {
        const json = await res.json().catch(() => ({}))
        const customer = json?.customer
        if (customer?.id) localStorage.setItem('currentBuyerId', String(customer.id))
        if (customer?.phone) localStorage.setItem('currentBuyerPhone', String(customer.phone))
      }
    } catch {}
    return
  }
}

function countDigits(value: string) {
  return (value.match(/\d/g) ?? []).length
}

async function gateBuyerPhoneIfNeeded(email: string): Promise<{ needsPhone: boolean; customer?: any }> {
  const res = await fetch(`/api/customers?email=${encodeURIComponent(email)}`)
  const json = await res.json().catch(() => ({}))
  const customer = json?.customer
  const phone = typeof customer?.phone === 'string' ? customer.phone : ''
  const valid = countDigits(phone) >= 9
  return { needsPhone: !valid, customer }
}

export default function AuthClient() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const role = (searchParams.get('role') as PortalRole) || 'buyer'
  const next = safeNextPath(searchParams.get('next'), role)
  const errorParam = searchParams.get('error') || ''
  const requestedMode = (searchParams.get('mode') as Mode) || 'signin'

  const [mode, setMode] = React.useState<Mode>('signin')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [message, setMessage] = React.useState<string>('')
  const [error, setError] = React.useState<string>('')
  const [needsBuyerPhone, setNeedsBuyerPhone] = React.useState(false)
  const [buyerPhone, setBuyerPhone] = React.useState('')
  const [buyerCustomer, setBuyerCustomer] = React.useState<any>(null)
  const [accountCreated, setAccountCreated] = React.useState(false)
  const [needsRoleUpgrade, setNeedsRoleUpgrade] = React.useState<{
    email: string
    portal: PortalRole
  } | null>(null)
  const [sessionConflict, setSessionConflict] = React.useState<{
    activePortal: PortalMatch
    requestedPortal: PortalRole
  } | null>(null)

  React.useEffect(() => {
    setError('')
    setMessage('')
    setNeedsBuyerPhone(false)
    setBuyerPhone('')
    setBuyerCustomer(null)
    setSessionConflict(null)
    setAccountCreated(false)
    setNeedsRoleUpgrade(null)
  }, [mode])

  React.useEffect(() => {
    if (errorParam === 'admin_required') {
      setError('Admin access required. Please sign in with an admin account.')
    }
  }, [errorParam])

  React.useEffect(() => {
    // Allow deep links like /auth?mode=signup, but admin is always sign-in only.
    if (role === 'admin') {
      setMode('signin')
      return
    }
    if (requestedMode === 'signup' || requestedMode === 'forgot' || requestedMode === 'signin') {
      setMode(requestedMode)
    }
  }, [requestedMode, role])

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const supabase = getBrowserSupabaseClient()
        const { data } = await supabase.auth.getUser()
        if (cancelled) return
        const user = data.user
        if (!user) return

        // Admin uses auth metadata; everyone else uses user_roles.
        if (role === 'admin') {
          if (hasAdminAccess(user)) {
            router.replace(next)
            return
          }
          const active = inferPortalFromLocalStorage()
          setSessionConflict({ activePortal: active, requestedPortal: role })
          return
        }

        let hasAccess = await fetchHasPortalAccess(role)
        if (cancelled) return
        if (hasAccess) {
          router.replace(next)
          return
        }

        // If the user originally requested this portal during sign-up (via
        // user_metadata.role), grant it automatically on their first session.
        // This fixes the "vendor signed up but no vendor access yet" loop that
        // can happen after email confirmation.
        if (userRequestedPortalAtSignup(user, role)) {
          const granted = await grantPortalAccess(role)
          if (cancelled) return
          if (granted.ok) {
            hasAccess = await fetchHasPortalAccess(role)
            if (cancelled) return
            if (hasAccess) {
              router.replace(next)
              return
            }
          }
        }

        // Signed in but no role for this portal: offer to add it. This is
        // the same path used after a fresh password sign-in.
        setNeedsRoleUpgrade({ email: user.email ?? '', portal: role })
      } catch {
        // Ignore (treat as not signed in)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [role, next])

  const handleSignOutAndContinue = async () => {
    setBusy(true)
    try {
      clearPortalHints()
      const supabase = getBrowserSupabaseClient()
      await supabase.auth.signOut()
      setSessionConflict(null)
    } catch (e: any) {
      setError(e?.message || 'Failed to sign out.')
    } finally {
      setBusy(false)
    }
  }

  const handleForgot = async () => {
    setError('')
    setMessage('')
    if (!email.trim()) {
      setError('Enter your email first.')
      return
    }
    setBusy(true)
    try {
      const supabase = getBrowserSupabaseClient()
      const origin = window.location.origin
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${origin}/auth/reset-password`,
      })
      if (error) throw error
      setMessage('Password reset link sent. Check your email.')
    } catch (e: any) {
      setError(e?.message || 'Failed to send reset link.')
    } finally {
      setBusy(false)
    }
  }

  const handleSignIn = async () => {
    const trimmedEmail = email.trim()
    const supabase = getBrowserSupabaseClient()
    const signIn = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    })

    if (!signIn.error) {
      const user = (await supabase.auth.getUser()).data.user

      // Admin uses auth.users.app_metadata, not user_roles.
      if (role === 'admin') {
        if (!hasAdminAccess(user)) {
          await supabase.auth.signOut()
          setError('Admin access denied. This account is not an admin.')
          return { ok: false as const }
        }
      } else {
        const hasAccess = await fetchHasPortalAccess(role)
        if (!hasAccess) {
          if (role === 'buyer') {
            // Buyer access is granted automatically on successful sign-in:
            // the user proved their identity and chose the buyer portal.
            const granted = await grantPortalAccess('buyer')
            if (!granted.ok) {
              setNeedsRoleUpgrade({ email: trimmedEmail, portal: role })
              return { ok: false as const }
            }
          } else {
            // If they requested this portal during sign-up (user_metadata.role),
            // grant it automatically on sign-in; otherwise require explicit
            // upgrade confirmation.
            if (userRequestedPortalAtSignup(user, role)) {
              const granted = await grantPortalAccess(role)
              if (!granted.ok) {
                setNeedsRoleUpgrade({ email: trimmedEmail, portal: role })
                return { ok: false as const }
              }
            } else {
              setNeedsRoleUpgrade({ email: trimmedEmail, portal: role })
              return { ok: false as const }
            }
          }
        }
      }

      if (role === 'buyer') {
        const gate = await gateBuyerPhoneIfNeeded(trimmedEmail)
        if (gate.needsPhone) {
          setBuyerCustomer(gate.customer ?? null)
          setNeedsBuyerPhone(true)
          return { ok: false as const }
        }
      }

      await persistSessionProfile(role, trimmedEmail)
      router.replace(next)
      return { ok: true as const }
    }

    const msg = (signIn.error.message || '').toLowerCase()
    if (msg.includes('email') && msg.includes('confirm')) {
      setError('Email not confirmed. Please verify your email and try again.')
      return { ok: false as const }
    }

    if (role === 'admin') {
      setError('Invalid admin credentials.')
      return { ok: false as const }
    }

    if (!msg.includes('invalid login credentials')) {
      setError(signIn.error.message)
      return { ok: false as const }
    }

    // Invalid credentials. Use richer status to decide the next step.
    const status = await fetchEmailStatus(trimmedEmail, role)
    if (status.registered) {
      setError('Check your password or use “Forgot password”.')
      return { ok: false as const }
    }
    if (status.authExists) {
      // Email owns a SouthCaravan account that does NOT include this portal.
      // We must not silently sign them up — that would create a duplicate
      // auth record (impossible) or a fake confirmation (misleading). Tell
      // the user to sign in with their real password; the role-upgrade flow
      // will then kick in automatically.
      setError(
        `This email already has a SouthCaravan account. Sign in with your correct password to add ${portalLabel(role)} access.`
      )
      return { ok: false as const }
    }

    // No auth user exists for this email — seamlessly create one.
    const origin = window.location.origin
    const signUp = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        emailRedirectTo:
          role === 'buyer'
            ? `${origin}/auth?role=buyer&next=${encodeURIComponent(next)}`
            : undefined,
        data: { role },
      },
    })

    if (signUp.error) throw signUp.error

    if (!signUp.data.session) {
      setAccountCreated(true)
      return { ok: false as const }
    }

    // Session established: record the portal role before continuing.
    const granted = await grantPortalAccess(role)
    if (!granted.ok) {
      setError(granted.error || 'Failed to add portal access.')
      return { ok: false as const }
    }

    if (role === 'buyer') {
      const gate = await gateBuyerPhoneIfNeeded(trimmedEmail)
      if (gate.needsPhone) {
        setBuyerCustomer(gate.customer ?? null)
        setNeedsBuyerPhone(true)
        return { ok: false as const }
      }
    }

    await persistSessionProfile(role, trimmedEmail)
    router.replace(next)
    return { ok: true as const }
  }

  const handleConfirmRoleUpgrade = async () => {
    if (!needsRoleUpgrade) return
    setError('')
    setBusy(true)
    try {
      const granted = await grantPortalAccess(needsRoleUpgrade.portal)
      if (!granted.ok) {
        setError(granted.error || 'Failed to add portal access.')
        return
      }

      const upgradedRole = needsRoleUpgrade.portal
      const upgradedEmail = needsRoleUpgrade.email
      setNeedsRoleUpgrade(null)

      if (upgradedRole === 'buyer') {
        const gate = await gateBuyerPhoneIfNeeded(upgradedEmail)
        if (gate.needsPhone) {
          setBuyerCustomer(gate.customer ?? null)
          setNeedsBuyerPhone(true)
          return
        }
      }

      await persistSessionProfile(upgradedRole, upgradedEmail)
      router.replace(next)
    } catch (e: any) {
      setError(e?.message || 'Failed to add portal access.')
    } finally {
      setBusy(false)
    }
  }

  const handleCancelRoleUpgrade = async () => {
    setBusy(true)
    try {
      clearPortalHints()
      const supabase = getBrowserSupabaseClient()
      await supabase.auth.signOut()
    } catch {
      // Best-effort sign-out.
    } finally {
      setNeedsRoleUpgrade(null)
      setPassword('')
      setBusy(false)
    }
  }

  const handleSignUp = async () => {
    if (role === 'admin') {
      setError('Admin accounts cannot be created here.')
      return { ok: false as const }
    }

    const trimmedEmail = email.trim()
    const status = await fetchEmailStatus(trimmedEmail, role)

    if (status.registered) {
      setError(`This email already has ${portalLabel(role)} access. Please sign in instead.`)
      return { ok: false as const }
    }

    if (status.authExists) {
      // Email has a SouthCaravan auth account, but not for this portal.
      // We can't issue a second auth user for the same email, so flip to
      // sign-in mode: once they authenticate, the role-upgrade card will
      // invite them to add this portal to their existing account.
      setMode('signin')
      setPassword('')
      setMessage(
        `This email already has a SouthCaravan account. Sign in below to add ${portalLabel(role)} access.`
      )
      return { ok: false as const }
    }

    const supabase = getBrowserSupabaseClient()
    const origin = window.location.origin
    const signUp = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        emailRedirectTo:
          role === 'buyer'
            ? `${origin}/auth?role=buyer&next=${encodeURIComponent(next)}`
            : undefined,
        data: { role },
      },
    })

    if (signUp.error) throw signUp.error

    if (!signUp.data.session) {
      setAccountCreated(true)
      return { ok: false as const }
    }

    // Session established (email confirmations disabled, or already verified
    // on re-use). Record the portal role before redirecting.
    const granted = await grantPortalAccess(role)
    if (!granted.ok) {
      setError(granted.error || 'Failed to add portal access.')
      return { ok: false as const }
    }

    if (role === 'buyer') {
      const gate = await gateBuyerPhoneIfNeeded(trimmedEmail)
      if (gate.needsPhone) {
        setBuyerCustomer(gate.customer ?? null)
        setNeedsBuyerPhone(true)
        return { ok: false as const }
      }
    }

    await persistSessionProfile(role, trimmedEmail)
    router.replace(next)
    return { ok: true as const }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!email.trim() || !password) {
      setError('Enter your email and password.')
      return
    }

    setBusy(true)
    try {
      if (mode === 'signup') {
        await handleSignUp()
      } else {
        await handleSignIn()
      }
    } catch (e: any) {
      setError(e?.message || 'Authentication failed.')
    } finally {
      setBusy(false)
    }
  }

  const handleSaveBuyerPhone = async () => {
    setError('')
    setMessage('')
    const phone = buyerPhone.trim()
    if (countDigits(phone) < 9) {
      setError('Enter a valid phone number (at least 9 digits).')
      return
    }
    setBusy(true)
    try {
      const supabase = getBrowserSupabaseClient()
      const { data } = await supabase.auth.getUser()
      const user = data.user
      if (!user?.id || !user.email) {
        setError('You must be signed in to save your phone number.')
        return
      }

      if (buyerCustomer?.id) {
        const res = await fetch(`/api/customers/${encodeURIComponent(String(buyerCustomer.id))}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone }),
        })
        if (!res.ok) throw new Error('Failed to save phone number.')
      } else {
        const res = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name ?? user.email.split('@')[0],
            phone,
          }),
        })
        if (!res.ok) throw new Error('Failed to create customer profile.')
      }

      await persistSessionProfile('buyer', user.email)
      router.replace(next)
    } catch (e: any) {
      setError(e?.message || 'Failed to save your phone number.')
    } finally {
      setBusy(false)
    }
  }

  if (accountCreated) {
    return (
      <AuthPageBackground>
        <div
          className={authCardClassName}
          role="status"
          aria-live="polite"
        >
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 ring-8 ring-primary/5">
              <MailCheck className="h-8 w-8 text-primary" aria-hidden="true" />
            </div>
            <p className="text-[17px] font-medium leading-relaxed text-foreground">
              Account created. Please verify your email to proceed.
            </p>
            <Link
              href="/"
              className={`${authPrimaryButtonClassName} mt-8 w-full sm:w-auto sm:min-w-[220px]`}
            >
              Return to Shop
            </Link>
          </div>
        </div>
      </AuthPageBackground>
    )
  }

  return (
    <AuthPageBackground>
      <div className={authCardClassName}>
        <AuthBrandBanner />

        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {mode === 'forgot' ? 'Reset password' : mode === 'signup' ? 'Create account' : 'Sign in'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === 'forgot'
                ? 'We’ll email you a reset link.'
                : mode === 'signup'
                  ? 'Create a SouthCaravan account in seconds.'
                  : 'Use your SouthCaravan account'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Portal: <span className="font-medium text-foreground">{role}</span>
            </p>
          </div>
          {mode === 'forgot' ? (
            <button type="button" className={authTextButtonClassName} onClick={() => setMode('signin')}>
              Back
            </button>
          ) : null}
        </div>

        {role !== 'admin' &&
        !sessionConflict &&
        !needsBuyerPhone &&
        !needsRoleUpgrade &&
        mode !== 'forgot' ? (
          <div className="mb-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={mode === 'signin' ? authPrimaryButtonClassName : authSecondaryButtonClassName}
              disabled={busy}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={mode === 'signup' ? authPrimaryButtonClassName : authSecondaryButtonClassName}
              disabled={busy}
            >
              Sign up
            </button>
          </div>
        ) : null}

        {error ? (
          <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="mb-3 rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm text-foreground">
            {message}
          </div>
        ) : null}

        {needsRoleUpgrade ? (
          <div className="space-y-4" role="group" aria-labelledby="role-upgrade-title">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-4 ring-primary/5">
                <UserPlus className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h2
                  id="role-upgrade-title"
                  className="text-[15px] font-semibold text-foreground"
                >
                  Create your {portalLabel(needsRoleUpgrade.portal)} account
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{needsRoleUpgrade.email}</span>{' '}
                  is registered with SouthCaravan, but it doesn’t have{' '}
                  {portalLabel(needsRoleUpgrade.portal)} access yet. A separate{' '}
                  {portalLabel(needsRoleUpgrade.portal)} account is required — having one
                  role doesn’t grant access to others.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className={`${authPrimaryButtonClassName} w-full sm:flex-1`}
                disabled={busy}
                onClick={handleConfirmRoleUpgrade}
              >
                {busy
                  ? 'Creating…'
                  : `Create ${portalTitleCase(needsRoleUpgrade.portal)} account`}
              </button>
              <button
                type="button"
                className={`${authSecondaryButtonClassName} w-full sm:w-auto`}
                disabled={busy}
                onClick={handleCancelRoleUpgrade}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : sessionConflict ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm text-foreground">
              You’re already signed in{sessionConflict.activePortal !== 'unknown' ? (
                <> to the <span className="font-semibold">{sessionConflict.activePortal}</span> portal</>
              ) : null}
              . To continue to <span className="font-semibold">{sessionConflict.requestedPortal}</span>, sign out first.
            </div>
            <button
              className={authPrimaryButtonClassName}
              disabled={busy}
              onClick={handleSignOutAndContinue}
              type="button"
            >
              {busy ? 'Signing out…' : 'Sign out and continue'}
            </button>
            {sessionConflict.activePortal !== 'unknown' ? (
              <button
                type="button"
                className={authSecondaryButtonClassName}
                disabled={busy}
                onClick={() => window.location.replace(getDefaultNext(sessionConflict.activePortal as PortalRole))}
              >
                Stay in current portal
              </button>
            ) : null}
          </div>
        ) : needsBuyerPhone ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm text-foreground">
              Add your mobile number so service providers can contact you.
            </div>
            <input
              className={authFieldClassName}
              type="tel"
              placeholder="e.g. +233 55 123 4567"
              value={buyerPhone}
              onChange={(e) => setBuyerPhone(e.target.value)}
              disabled={busy}
            />
            <button className={authPrimaryButtonClassName} disabled={busy} onClick={handleSaveBuyerPhone} type="button">
              {busy ? 'Saving…' : 'Save and continue'}
            </button>
          </div>
        ) : mode === 'forgot' ? (
          <div className="space-y-3">
            <input
              className={authFieldClassName}
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
            />
            <div className="flex items-center justify-end">
              <button className={authPrimaryButtonClassName} disabled={busy} onClick={handleForgot} type="button">
                {busy ? 'Sending…' : 'Send'}
              </button>
            </div>
          </div>
        ) : (
          <form className="space-y-3" onSubmit={handleSubmit}>
            <input
              className={authFieldClassName}
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
            />
            <div className="relative">
              <input
                className={`${authFieldClassName} pr-10`}
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={busy}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition disabled:opacity-60"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                disabled={busy}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <button type="button" className={authTextButtonClassName} disabled={busy} onClick={() => setMode('forgot')}>
                Forgot password?
              </button>
              <button className={authPrimaryButtonClassName} disabled={busy} type="submit">
                {busy ? 'Working…' : mode === 'signup' ? 'Create account' : 'Next'}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <Link href="/privacy" className="hover:text-foreground hover:underline underline-offset-4">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-foreground hover:underline underline-offset-4">
            Terms
          </Link>
          <Link href="/help" className="hover:text-foreground hover:underline underline-offset-4">
            Help
          </Link>
        </div>
      </div>
    </AuthPageBackground>
  )
}

