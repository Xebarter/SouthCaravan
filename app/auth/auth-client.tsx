'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, MailCheck } from 'lucide-react'

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
  if (role === 'buyer') return '/buyer'
  if (role === 'vendor') return '/vendor/orders'
  if (role === 'services') return '/services/orders'
  if (role === 'admin') return '/admin'
  return '/'
}

function hasAdminAccess(user: any) {
  const meta = user?.app_metadata ?? {}
  if (meta.role === 'admin') return true
  const roles = Array.isArray(meta.roles) ? meta.roles : []
  return roles.includes('admin')
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
      await fetch('/api/vendor/bootstrap', { method: 'POST' })
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
      await fetch('/api/vendor/bootstrap', { method: 'POST' })
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
  const router = useRouter()
  const searchParams = useSearchParams()

  const role = (searchParams.get('role') as PortalRole) || 'buyer'
  const next = searchParams.get('next') || getDefaultNext(role)
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

        const activePortal: PortalMatch = hasAdminAccess(user) ? 'admin' : inferPortalFromLocalStorage()
        if (activePortal === role) {
          router.replace(next)
          return
        }
        setSessionConflict({ activePortal, requestedPortal: role })
      } catch {
        // Ignore (treat as not signed in)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [role, next, router])

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
    const supabase = getBrowserSupabaseClient()
    const signIn = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (!signIn.error) {
      const user = (await supabase.auth.getUser()).data.user
      if (role === 'admin' && !hasAdminAccess(user)) {
        await supabase.auth.signOut()
        setError('Admin access denied. This account is not an admin.')
        return { ok: false as const }
      }

      if (role === 'buyer') {
        const gate = await gateBuyerPhoneIfNeeded(email.trim())
        if (gate.needsPhone) {
          setBuyerCustomer(gate.customer ?? null)
          setNeedsBuyerPhone(true)
          return { ok: false as const }
        }
      }

      await persistSessionProfile(role, email.trim())
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

    // In sign-in mode, we keep the “sign-in first, then maybe sign-up” behavior.
    const registeredRes = await fetch('/api/auth/check-email-registered', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), portal: role }),
    })
    const registeredJson = await registeredRes.json().catch(() => ({}))
    const registered = Boolean(registeredJson?.registered)
    if (registered) {
      setError('An account with this email already exists. Please check your password or use “Forgot password”.')
      return { ok: false as const }
    }

    const origin = window.location.origin
    const signUp = await supabase.auth.signUp({
      email: email.trim(),
      password,
      ...(role === 'buyer'
        ? {
            options: {
              emailRedirectTo: `${origin}/auth?role=buyer&next=${encodeURIComponent(next)}`,
              data: { role },
            },
          }
        : { options: { data: { role } } }),
    })

    if (signUp.error) throw signUp.error

    if (!signUp.data.session) {
      setAccountCreated(true)
      return { ok: false as const }
    }

    if (role === 'buyer') {
      const gate = await gateBuyerPhoneIfNeeded(email.trim())
      if (gate.needsPhone) {
        setBuyerCustomer(gate.customer ?? null)
        setNeedsBuyerPhone(true)
        return { ok: false as const }
      }
    }

    await persistSessionProfile(role, email.trim())
    router.replace(next)
    return { ok: true as const }
  }

  const handleSignUp = async () => {
    if (role === 'admin') {
      setError('Admin accounts cannot be created here.')
      return { ok: false as const }
    }

    const registeredRes = await fetch('/api/auth/check-email-registered', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), portal: role }),
    })
    const registeredJson = await registeredRes.json().catch(() => ({}))
    const registered = Boolean(registeredJson?.registered)
    if (registered) {
      setError('An account with this email already exists. Please sign in instead.')
      return { ok: false as const }
    }

    const supabase = getBrowserSupabaseClient()
    const origin = window.location.origin
    const signUp = await supabase.auth.signUp({
      email: email.trim(),
      password,
      ...(role === 'buyer'
        ? {
            options: {
              emailRedirectTo: `${origin}/auth?role=buyer&next=${encodeURIComponent(next)}`,
              data: { role },
            },
          }
        : { options: { data: { role } } }),
    })

    if (signUp.error) throw signUp.error

    if (!signUp.data.session) {
      setAccountCreated(true)
      return { ok: false as const }
    }

    if (role === 'buyer') {
      const gate = await gateBuyerPhoneIfNeeded(email.trim())
      if (gate.needsPhone) {
        setBuyerCustomer(gate.customer ?? null)
        setNeedsBuyerPhone(true)
        return { ok: false as const }
      }
    }

    await persistSessionProfile(role, email.trim())
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

        {role !== 'admin' && !sessionConflict && !needsBuyerPhone && mode !== 'forgot' ? (
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

        {sessionConflict ? (
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
                onClick={() => router.replace(getDefaultNext(sessionConflict.activePortal as PortalRole))}
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

