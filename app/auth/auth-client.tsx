'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, UserPlus } from 'lucide-react'

import {
  AuthAlert,
  AuthBrandBanner,
  AuthCard,
  AuthCardBody,
  AuthField,
  AuthFooterLinks,
  AuthModeToggle,
  AuthPageBackground,
  AuthPageHeader,
  AuthPasswordField,
  AuthPortalBadge,
  authPrimaryButtonClassName,
  authSecondaryButtonClassName,
  authTextButtonClassName,
} from '@/components/auth-chrome'
import { getBrowserSupabaseClient } from '@/lib/supabase/client'
import {
  grantPortalAccess,
  persistPortalSession,
  type GrantablePortal,
} from '@/lib/portal-session'

type PortalRole = 'buyer' | 'vendor' | 'services' | 'admin' | 'auto'
type Mode = 'signin' | 'signup' | 'forgot'
type PortalMatch = PortalRole | 'unknown'

function getDefaultNext(role: PortalRole) {
  if (role === 'admin') return '/admin'
  if (role === 'vendor') return '/vendor'
  if (role === 'services') return '/services'
  if (role === 'buyer') return '/buyer'
  // Auto always routes through dashboard for server-side role routing.
  return '/dashboard'
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

function inferPrimaryPortal(user: any): PortalRole {
  const meta = user?.app_metadata ?? {}
  const scalar = typeof meta.role === 'string' ? meta.role : ''
  const roles = Array.isArray(meta.roles) ? meta.roles : []
  const merged = [scalar, ...roles].map((r: any) => String(r || '').toLowerCase()).filter(Boolean)

  if (merged.includes('admin')) return 'admin'
  if (merged.includes('vendor')) return 'vendor'
  if (merged.includes('services')) return 'services'
  if (merged.includes('buyer')) return 'buyer'
  return 'buyer'
}

function portalLabel(role: PortalRole): string {
  if (role === 'services') return 'service provider'
  if (role === 'auto') return 'account'
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
  if (role === 'auto') return false
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

function isGrantablePortal(role: PortalRole): role is GrantablePortal {
  return role === 'buyer' || role === 'vendor' || role === 'services'
}

function inferPortalFromLocalStorage(): PortalMatch {
  try {
    const vendor = localStorage.getItem('currentVendorName')
    if (vendor) return 'vendor'
    const service = localStorage.getItem('currentServiceProviderName')
    if (service) return 'services'
    const buyer = localStorage.getItem('currentBuyerName')
    if (buyer) return 'buyer'
  } catch { }
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
    } catch { }
  }
}

export default function AuthClient() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const role = (searchParams.get('role') as PortalRole) || 'auto'
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
  const [needsRoleUpgrade, setNeedsRoleUpgrade] = React.useState<{
    email: string
    portal: PortalRole
  } | null>(null)
  const [sessionConflict, setSessionConflict] = React.useState<{
    activePortal: PortalMatch
    requestedPortal: PortalRole
  } | null>(null)
  const [existingSession, setExistingSession] = React.useState<boolean | null>(null)

  React.useEffect(() => {
    setError('')
    setMessage('')
    setSessionConflict(null)
    setNeedsRoleUpgrade(null)
  }, [mode])

  React.useEffect(() => {
    if (errorParam === 'admin_required') {
      setError('Admin access required. Please sign in with an admin account.')
    }
  }, [errorParam])

  React.useEffect(() => {
    // Allow deep links like /auth?mode=signup, but admin is always sign-in only.
    if (role === 'admin' || role === 'auto') {
      setMode('signin')
      return
    }
    if (requestedMode === 'signup' || requestedMode === 'forgot' || requestedMode === 'signin') {
      setMode(requestedMode)
    }
  }, [requestedMode, role])

  React.useEffect(() => {
    let cancelled = false
      ; (async () => {
        try {
          const supabase = getBrowserSupabaseClient()
          const { data } = await supabase.auth.getUser()
          if (cancelled) return
          const user = data.user
          if (!user) {
            setExistingSession(false)
            return
          }

          setExistingSession(true)

          // Generic login: if already signed in, route to the right portal/dashboard.
          if (role === 'auto') {
            const primary = inferPrimaryPortal(user)
            router.replace(next || getDefaultNext(primary))
            return
          }

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

          // Portal access is not exclusive: a single account can enter any dashboard.
          // Grant the requested portal membership automatically (idempotent).
          if (isGrantablePortal(role)) {
            const granted = await grantPortalAccess(role)
            if (cancelled) return
            if (!granted.ok) {
              setExistingSession(false)
              setError(granted.error || 'Failed to enable dashboard access.')
              return
            }
            await supabase.auth.refreshSession().catch(() => {})
            if (user.email) {
              await persistPortalSession(role, user.email)
            }
          }

          router.replace(next)
        } catch {
          setExistingSession(false)
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
    const trimmedEmail = email.trim()
    const supabase = getBrowserSupabaseClient()
    const signIn = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    })

    if (!signIn.error) {
      const user = (await supabase.auth.getUser()).data.user

      // Generic login: don't grant portals. Just route through /dashboard (or next).
      if (role === 'auto') {
        router.replace(next || '/dashboard')
        return { ok: true as const }
      }

      // Admin uses auth.users.app_metadata, not user_roles.
      if (role === 'admin') {
        if (!hasAdminAccess(user)) {
          await supabase.auth.signOut()
          setError('Admin access denied. This account is not an admin.')
          return { ok: false as const }
        }
      } else if (isGrantablePortal(role)) {
        const granted = await grantPortalAccess(role)
        if (!granted.ok) {
          setError(granted.error || 'Failed to enable dashboard access.')
          return { ok: false as const }
        }
      }

      if (isGrantablePortal(role)) {
        await persistPortalSession(role, trimmedEmail)
      }
      router.replace(next)
      return { ok: true as const }
    }

    if (role === 'admin') {
      setError('Invalid admin credentials.')
      return { ok: false as const }
    }

    const msg = (signIn.error.message || '').toLowerCase()
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
      // auth record (impossible). They just need to sign in with the right
      // password; portal access will be enabled after sign-in.
      setError(
        'This email already has a SouthCaravan account. Sign in with your correct password to continue.'
      )
      return { ok: false as const }
    }

    // No auth user exists for this email — seamlessly create one.
    const signUp = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: { data: { role } },
    })

    if (signUp.error) throw signUp.error

    if (!signUp.data.session) {
      setMode('signin')
      setMessage('Account created. Sign in with your email and password to continue.')
      return { ok: false as const }
    }

    // Session established: record the portal role before continuing.
    if (!isGrantablePortal(role)) {
      router.replace(next)
      return { ok: true as const }
    }

    const granted = await grantPortalAccess(role)
    if (!granted.ok) {
      setError(granted.error || 'Failed to add portal access.')
      return { ok: false as const }
    }

    await persistPortalSession(role, trimmedEmail)
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

      await persistPortalSession(upgradedRole, upgradedEmail)
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
    if (role === 'admin' || role === 'auto') {
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
    const signUp = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: { data: { role } },
    })

    if (signUp.error) throw signUp.error

    if (!signUp.data.session) {
      setMode('signin')
      setMessage('Account created. Sign in with your email and password to continue.')
      return { ok: false as const }
    }

    if (isGrantablePortal(role)) {
      const granted = await grantPortalAccess(role)
      if (!granted.ok) {
        setError(granted.error || 'Failed to add portal access.')
        return { ok: false as const }
      }
      await persistPortalSession(role, trimmedEmail)
    }

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

  const showModeToggle =
    role !== 'admin' && !sessionConflict && !needsRoleUpgrade && mode !== 'forgot'

  const pageTitle =
    mode === 'forgot'
      ? 'Reset password'
      : mode === 'signup'
        ? 'Create account'
        : 'Sign in'

  const pageSubtitle =
    mode === 'forgot'
      ? 'Enter your email for a reset link.'
      : mode === 'signup'
        ? 'One account for all workspaces.'
        : undefined

  if (existingSession === null) {
    return (
      <AuthPageBackground>
        <AuthCard>
          <AuthBrandBanner />
          <AuthCardBody className="flex flex-col items-center gap-3 py-10">
            <Loader2 className="h-7 w-7 animate-spin text-primary" aria-hidden />
            <p className="text-sm text-muted-foreground">Checking session…</p>
          </AuthCardBody>
        </AuthCard>
      </AuthPageBackground>
    )
  }

  if (existingSession && !sessionConflict && mode !== 'forgot') {
    return (
      <AuthPageBackground>
        <AuthCard>
          <AuthBrandBanner />
          <AuthCardBody className="flex flex-col items-center gap-3 py-10">
            <Loader2 className="h-7 w-7 animate-spin text-primary" aria-hidden />
            <p className="text-sm text-muted-foreground">Opening dashboard…</p>
          </AuthCardBody>
        </AuthCard>
      </AuthPageBackground>
    )
  }

  return (
    <AuthPageBackground>
      <AuthCard>
        <AuthBrandBanner />
        <AuthCardBody>
          <AuthPageHeader
            title={pageTitle}
            subtitle={pageSubtitle}
            portal={role}
            action={
              mode === 'forgot' ? (
                <button type="button" className={authTextButtonClassName} onClick={() => setMode('signin')}>
                  Back
                </button>
              ) : null
            }
          />

          {showModeToggle ? (
            <AuthModeToggle
              mode={mode === 'signup' ? 'signup' : 'signin'}
              onSignIn={() => setMode('signin')}
              onSignUp={() => setMode('signup')}
              disabled={busy}
            />
          ) : role === 'admin' ? (
            <div className="mb-6">
              <AuthPortalBadge portal="admin" />
            </div>
          ) : null}

          {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}
          {message ? <AuthAlert variant="success">{message}</AuthAlert> : null}

        {needsRoleUpgrade ? (
          <div className="space-y-4" role="group" aria-labelledby="role-upgrade-title">
            <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-muted/30 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <UserPlus className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <h2 id="role-upgrade-title" className="text-sm font-semibold text-foreground">
                  Add {portalTitleCase(needsRoleUpgrade.portal)} access
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{needsRoleUpgrade.email}</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              className={authPrimaryButtonClassName}
              disabled={busy}
              onClick={handleConfirmRoleUpgrade}
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enabling…
                </>
              ) : (
                'Continue'
              )}
            </button>
            <button
              type="button"
              className={authSecondaryButtonClassName}
              disabled={busy}
              onClick={handleCancelRoleUpgrade}
            >
              Cancel
            </button>
          </div>
        ) : sessionConflict ? (
          <div className="space-y-3">
            <AuthAlert variant="info">
              Signed in as <span className="font-semibold">{sessionConflict.activePortal}</span>.
              Sign out to open <span className="font-semibold">{sessionConflict.requestedPortal}</span>.
            </AuthAlert>
            <button
              className={authPrimaryButtonClassName}
              disabled={busy}
              onClick={handleSignOutAndContinue}
              type="button"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing out…
                </>
              ) : (
                'Sign out & continue'
              )}
            </button>
            {sessionConflict.activePortal !== 'unknown' ? (
              <button
                type="button"
                className={authSecondaryButtonClassName}
                disabled={busy}
                onClick={() =>
                  window.location.replace(getDefaultNext(sessionConflict.activePortal as PortalRole))
                }
              >
                Stay here
              </button>
            ) : null}
          </div>
        ) : mode === 'forgot' ? (
          <div className="space-y-4">
            <AuthField
              id="auth-email-forgot"
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
            />
            <button className={authPrimaryButtonClassName} disabled={busy} onClick={handleForgot} type="button">
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                'Send reset link'
              )}
            </button>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <AuthField
              id="auth-email"
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
            />
            <AuthPasswordField
              id="auth-password"
              label="Password"
              value={password}
              onChange={setPassword}
              show={showPassword}
              onToggleShow={() => setShowPassword((v) => !v)}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              disabled={busy}
            />
            {mode === 'signin' ? (
              <div className="flex justify-end">
                <button
                  type="button"
                  className={authTextButtonClassName}
                  disabled={busy}
                  onClick={() => setMode('forgot')}
                >
                  Forgot password?
                </button>
              </div>
            ) : null}
            <button className={authPrimaryButtonClassName} disabled={busy} type="submit">
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {mode === 'signup' ? 'Creating…' : 'Signing in…'}
                </>
              ) : mode === 'signup' ? (
                'Create account'
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        )}

          <AuthFooterLinks />
        </AuthCardBody>
      </AuthCard>
    </AuthPageBackground>
  )
}

