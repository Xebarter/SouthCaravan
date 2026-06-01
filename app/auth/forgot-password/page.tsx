'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

import {
  AuthAlert,
  AuthCard,
  AuthCardBody,
  AuthCardHero,
  AuthField,
  AuthFooterLinks,
  AuthPageBackground,
  AuthSuccessState,
  AuthTrustLine,
  authPrimaryButtonClassName,
  authTextButtonClassName,
} from '@/components/auth-chrome'
import { getBrowserSupabaseClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Enter your email address.')
      return
    }

    setLoading(true)
    try {
      const supabase = getBrowserSupabaseClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      if (resetError) throw resetError
      setSubmitted(true)
    } catch {
      setError('Could not send the reset link. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <AuthPageBackground>
        <AuthCard>
          <AuthSuccessState
            title="Check your email"
            description={
              <>
                We sent a password reset link to{' '}
                <span className="font-medium text-foreground">{email}</span>.
              </>
            }
          >
            <Link href="/auth" className={authPrimaryButtonClassName}>
              Back to sign in
            </Link>
          </AuthSuccessState>
          <div className="border-t border-border/50 px-6 pb-7 sm:px-10">
            <AuthFooterLinks />
          </div>
        </AuthCard>
      </AuthPageBackground>
    )
  }

  return (
    <AuthPageBackground>
      <AuthCard>
        <AuthCardHero
          title="Reset password"
          action={
            <Link href="/auth" className={authTextButtonClassName}>
              Back
            </Link>
          }
        />
        <AuthCardBody className="border-t pt-6">
          {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <AuthField
              id="forgot-email"
              label="Email"
              hideLabel
              type="email"
              autoComplete="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <button type="submit" className={authPrimaryButtonClassName} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                'Send reset link'
              )}
            </button>
          </form>

          <AuthTrustLine />
          <AuthFooterLinks />
        </AuthCardBody>
      </AuthCard>
    </AuthPageBackground>
  )
}
