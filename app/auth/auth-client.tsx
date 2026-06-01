'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, UserPlus } from 'lucide-react'

import {
  AuthAlert,
  AuthCard,
  AuthCardBody,
  AuthCardHero,
  AuthDivider,
  AuthField,
  AuthFooterLinks,
  AuthGoogleButton,
  AuthLoadingState,
  AuthModeToggle,
  AuthPageBackground,
  AuthPanel,
  AuthPasswordField,
  AuthTrustLine,
  authPrimaryButtonClassName,
  authSecondaryButtonClassName,
  authTextButtonClassName,
} from '@/components/auth-chrome'
import {
  finalizeAuthenticatedSession,
  getDefaultNext,
  hasAdminAccess,
  inferPrimaryPortal,
  safeNextPath,
  type PortalRole,
} from '@/lib/auth-flow'
import { startGoogleSignIn } from '@/lib/auth-google'
import { getBrowserSupabaseClient } from '@/lib/supabase/client'
import {
  grantPortalAccess,
  persistPortalSession,
  type GrantablePortal,
} from '@/lib/portal-session'

type Mode = 'signin' | 'signup' | 'forgot'
type PortalMatch = PortalRole | 'unknown'

function portalLabel(role: PortalRole): string {
  if (role === 'services') return 'service provider'
  if (role === 'auto') return 'account'
  return role
}

function portalTitleCase(role: PortalRole): string {
  const label = portalLabel(role)
  return label.charAt(0).toUpperCase() + label.slice(1)
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
    } else if (errorParam === 'auth_unavailable') {
      setError('Sign-in is temporarily unavailable. Please try again later.')
    }
  }, [errorParam])

  React.useEffect(() => {
    const oauthError = searchParams.get('error_description') || searchParams.get('error')
    if (oauthError && oauthError !== 'admin_required' && oauthError !== 'auth_unavailable') {
      setError(decodeURIComponent(oauthError.replace(/\+/g, ' ')))
    }
  }, [searchParams])

  React.useEffect(() => {
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

          if (role === 'auto') {
            const primary = inferPrimaryPortal(user)
            router.replace(next || getDefaultNext(primary))
            return
          }

          if (role === 'admin') {
            if (hasAdminAccess(user)) {
              router.replace(next)
              return
            }
            const active = inferPortalFromLocalStorage()
            setSessionConflict({ activePortal: active, requestedPortal: role })
            return
          }

          const result = await finalizeAuthenticatedSession(user, role, next, router, {
            refreshSession: () => supabase.auth.refreshSession().then(() => { }),
          })
          if (cancelled) return
          if (!result.ok) {
            setExistingSession(false)
            setError(result.error)
          }
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

  const handleGoogleSignIn = async () => {
    setError('')
    setMessage('')
    setBusy(true)
    try {
      const supabase = getBrowserSupabaseClient()
      await startGoogleSignIn(supabase, {
        role,
        next,
        mode: mode === 'signup' ? 'signup' : 'signin',
      })
    } catch (e: any) {
      setError(e?.message || 'Could not start Google sign-in.')
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
      const result = await finalizeAuthenticatedSession(user, role, next, router, {
        refreshSession: () => supabase.auth.refreshSession().then(() => { }),
        signOut: () => supabase.auth.signOut().then(() => { }),
      })
      if (!result.ok) {
        setError(result.error)
        return { ok: false as const }
      }
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

    const status = await fetchEmailStatus(trimmedEmail, role)
    if (status.registered) {
      setError('Check your password or use “Forgot password”.')
      return { ok: false as const }
    }
    if (status.authExists) {
      setError(
        'This email already has a SouthCaravan account. Sign in with your correct password to continue.'
      )
      return { ok: false as const }
    }

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

    const result = await finalizeAuthenticatedSession(
      (await supabase.auth.getUser()).data.user,
      role,
      next,
      router,
      {
        refreshSession: () => supabase.auth.refreshSession().then(() => { }),
      },
    )
    if (!result.ok) {
      setError(result.error)
      return { ok: false as const }
    }
    return { ok: true as const }
  }

  const handleConfirmRoleUpgrade = async () => {
    if (!needsRoleUpgrade) return
    setError('')
    setBusy(true)
    try {
      const granted = await grantPortalAccess(needsRoleUpgrade.portal as GrantablePortal)
      if (!granted.ok) {
        setError(granted.error || 'Failed to add portal access.')
        return
      }

      const upgradedRole = needsRoleUpgrade.portal
      const upgradedEmail = needsRoleUpgrade.email
      setNeedsRoleUpgrade(null)

      await persistPortalSession(upgradedRole as GrantablePortal, upgradedEmail)
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

    const result = await finalizeAuthenticatedSession(
      (await supabase.auth.getUser()).data.user,
      role,
      next,
      router,
      {
        refreshSession: () => supabase.auth.refreshSession().then(() => { }),
      },
    )
    if (!result.ok) {
      setError(result.error)
      return { ok: false as const }
    }
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

  const showGoogleAuth =
    mode !== 'forgot' && !sessionConflict && !needsRoleUpgrade

  const pageTitle =
    mode === 'forgot'
      ? 'Reset password'
      : mode === 'signup'
        ? 'Create account'
        : 'Sign in'

  if (existingSession === null) {
    return (
      <AuthPageBackground>
        <AuthCard>
          <AuthLoadingState message="Checking session…" />
        </AuthCard>
      </AuthPageBackground>
    )
  }

  if (existingSession && !sessionConflict && mode !== 'forgot') {
    return (
      <AuthPageBackground>
        <AuthCard>
          <AuthLoadingState message="Opening dashboard…" />
        </AuthCard>
      </AuthPageBackground>
    )
  }

  return (
    <AuthPageBackground>
      <AuthCard>
        <AuthCardHero
          title={pageTitle}
          portal={role}
          action={
            mode === 'forgot' ? (
              <button type="button" className={authTextButtonClassName} onClick={() => setMode('signin')}>
                Back
              </button>
            ) : null
          }
        />
        <AuthCardBody className="border-t pt-6">
          {showModeToggle ? (
            <AuthModeToggle
              mode={mode === 'signup' ? 'signup' : 'signin'}
              onSignIn={() => setMode('signin')}
              onSignUp={() => setMode('signup')}
              disabled={busy}
            />
          ) : null}

          {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}
          {message ? <AuthAlert variant="success">{message}</AuthAlert> : null}

          {needsRoleUpgrade ? (
            <AuthPanel
              icon={UserPlus}
              title={`Add ${portalTitleCase(needsRoleUpgrade.portal)} access`}
              description={
                <span className="font-medium text-foreground">{needsRoleUpgrade.email}</span>
              }
            >
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
            </AuthPanel>
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
                hideLabel
                type="email"
                autoComplete="email"
                placeholder="Email address"
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
            <div className="space-y-4">
              {showGoogleAuth ? (
                <>
                  <AuthGoogleButton disabled={busy} onClick={handleGoogleSignIn} />
                  <AuthDivider />
                </>
              ) : null}
              <form className="space-y-4" onSubmit={handleSubmit}>
                <AuthField
                  id="auth-email"
                  label="Email"
                  hideLabel
                  type="email"
                  autoComplete="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={busy}
                />
                <AuthPasswordField
                  id="auth-password"
                  label="Password"
                  hideLabel
                  value={password}
                  onChange={setPassword}
                  show={showPassword}
                  onToggleShow={() => setShowPassword((v) => !v)}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  disabled={busy}
                  labelAction={
                    mode === 'signin' ? (
                      <button
                        type="button"
                        className={authTextButtonClassName}
                        disabled={busy}
                        onClick={() => setMode('forgot')}
                      >
                        Forgot password?
                      </button>
                    ) : undefined
                  }
                />
                <div className="pt-1">
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
                </div>
              </form>
            </div>
          )}

          {!sessionConflict && !needsRoleUpgrade && mode !== 'forgot' ? <AuthTrustLine /> : null}
          <AuthFooterLinks />
        </AuthCardBody>
      </AuthCard>
    </AuthPageBackground>
  )
}
