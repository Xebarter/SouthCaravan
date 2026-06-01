'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

import { getBrowserSupabaseClient } from '@/lib/supabase/client'
import {
  AuthAlert,
  AuthCard,
  AuthCardBody,
  AuthCardHero,
  AuthFooterLinks,
  AuthPageBackground,
  AuthPasswordField,
  AuthSuccessState,
  AuthTrustLine,
  authPrimaryButtonClassName,
  authTextButtonClassName,
} from '@/components/auth-chrome'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!password || !confirmPassword) {
      setError('Fill in both password fields.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 8) {
      setError('Use at least 8 characters.')
      return
    }

    setLoading(true)
    try {
      const supabase = getBrowserSupabaseClient()
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      setSuccess(true)
      setTimeout(() => {
        router.push('/auth')
      }, 2200)
    } catch {
      setError('Could not reset password. Try opening the link from your email again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <AuthPageBackground>
        <AuthCard>
          <AuthSuccessState title="Password updated" description="Redirecting to sign in…" />
        </AuthCard>
      </AuthPageBackground>
    )
  }

  return (
    <AuthPageBackground>
      <AuthCard>
        <AuthCardHero
          title="New password"
          action={
            <Link href="/auth" className={authTextButtonClassName}>
              Back
            </Link>
          }
        />
        <AuthCardBody className="border-t pt-6">
          {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <AuthPasswordField
              id="new-password"
              label="New password"
              hideLabel
              value={password}
              onChange={setPassword}
              show={showPassword}
              onToggleShow={() => setShowPassword((v) => !v)}
              autoComplete="new-password"
              disabled={loading}
            />
            <AuthPasswordField
              id="confirm-password"
              label="Confirm password"
              hideLabel
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              show={showConfirmPassword}
              onToggleShow={() => setShowConfirmPassword((v) => !v)}
              autoComplete="new-password"
              disabled={loading}
            />
            <p className="text-center text-xs text-muted-foreground">Minimum 8 characters</p>
            <button type="submit" className={authPrimaryButtonClassName} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                'Update password'
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
