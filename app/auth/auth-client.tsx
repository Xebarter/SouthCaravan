'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import {
  AuthBrandBanner,
  AuthPageBackground,
  authCardClassName,
  authFieldClassName,
  authPrimaryButtonClassName,
  authSecondaryButtonClassName,
} from '@/components/auth-chrome'
import { getBrowserSupabaseClient } from '@/lib/supabase/client'

type PortalRole = 'buyer' | 'vendor' | 'services' | 'admin'
type Mode = 'signin' | 'forgot'

function getDefaultNext(role: PortalRole) {
  if (role === 'buyer') return '/buyer'
  if (role === 'vendor') return '/vendor'
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

async function persistSessionProfile(role: PortalRole, email: string) {
  const emailPrefix = email.split('@')[0] || 'user'

  if (role === 'vendor') {
    localStorage.setItem('currentVendorId', 'self')
    localStorage.setItem('currentVendorName', `${emailPrefix} (vendor)`)
    return
  }

  if (role === 'services') {
    localStorage.setItem('currentServiceProviderName', `${emailPrefix} (service provider)`)
    localStorage.setItem('currentVendorId', 'self')
    localStorage.setItem('currentVendorName', `${emailPrefix} (service provider)`)
    return
  }

  if (role === 'buyer') {
    localStorage.setItem('currentBuyerName', `${emailPrefix} (buyer)`)
    localStorage.setItem('currentBuyerEmail', email)
    return
  }
}

export default function AuthClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const role = (searchParams.get('role') as PortalRole) || 'buyer'
  const next = searchParams.get('next') || getDefaultNext(role)
  const errorParam = searchParams.get('error') || ''

  const [mode, setMode] = React.useState<Mode>('signin')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [message, setMessage] = React.useState<string>('')
  const [error, setError] = React.useState<string>('')

  React.useEffect(() => {
    setError('')
    setMessage('')
  }, [mode])

  React.useEffect(() => {
    if (errorParam === 'admin_required') {
      setError('Admin access required. Please sign in with an admin account.')
    }
  }, [errorParam])

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

  const handleSignInOrUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!email.trim() || !password) {
      setError('Enter your email and password.')
      return
    }

    const supabase = getBrowserSupabaseClient()
    setBusy(true)
    try {
      const signIn = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (!signIn.error) {
        const user = (await supabase.auth.getUser()).data.user
        if (role === 'admin' && !hasAdminAccess(user)) {
          await supabase.auth.signOut()
          setError('Admin access denied. This account is not an admin.')
          return
        }

        await persistSessionProfile(role, email.trim())
        router.replace(next)
        return
      }

      const msg = (signIn.error.message || '').toLowerCase()
      if (msg.includes('email') && msg.includes('confirm')) {
        setError('Email not confirmed. Please verify your email and try again.')
        return
      }

      if (role === 'admin') {
        setError('Invalid admin credentials.')
        return
      }

      if (!msg.includes('invalid login credentials')) {
        setError(signIn.error.message)
        return
      }

      const registeredRes = await fetch('/api/auth/check-email-registered', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), portal: role }),
      })
      const registeredJson = await registeredRes.json().catch(() => ({}))
      const registered = Boolean(registeredJson?.registered)
      if (registered) {
        setError('An account with this email already exists. Please check your password or use “Forgot password”.')
        return
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
        setMessage('Account created. Please verify your email before signing in.')
        return
      }

      await persistSessionProfile(role, email.trim())
      router.replace(next)
    } catch (e: any) {
      setError(e?.message || 'Authentication failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthPageBackground>
      <div className={authCardClassName}>
        <AuthBrandBanner />

        <div className="mb-4 flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {mode === 'forgot' ? 'Reset your password' : 'Continue to SouthCaravan'}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Portal: <span className="font-medium text-foreground">{role}</span>
            </p>
          </div>
          {mode === 'forgot' ? (
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setMode('signin')}
            >
              Back
            </button>
          ) : null}
        </div>

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

        {mode === 'forgot' ? (
          <div className="space-y-3">
            <input
              className={authFieldClassName}
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
            />
            <button className={authPrimaryButtonClassName} disabled={busy} onClick={handleForgot} type="button">
              {busy ? 'Sending…' : 'Send reset link'}
            </button>
          </div>
        ) : (
          <form className="space-y-3" onSubmit={handleSignInOrUp}>
            <input
              className={authFieldClassName}
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
            />
            <input
              className={authFieldClassName}
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
            />

            <button className={authPrimaryButtonClassName} disabled={busy} type="submit">
              {busy ? 'Working…' : 'Continue'}
            </button>

            <button
              type="button"
              className={authSecondaryButtonClassName}
              disabled={busy}
              onClick={() => setMode('forgot')}
            >
              Forgot password
            </button>
          </form>
        )}
      </div>
    </AuthPageBackground>
  )
}

