'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { getBrowserSupabaseClient } from '@/lib/supabase/client';
import {
  AuthAlert,
  AuthBrandBanner,
  AuthCard,
  AuthCardBody,
  AuthFooterLinks,
  AuthPageBackground,
  AuthPageHeader,
  AuthPasswordField,
  authPrimaryButtonClassName,
  authTextButtonClassName,
} from '@/components/auth-chrome';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password || !confirmPassword) {
      setError('Fill in both password fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Use at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const supabase = getBrowserSupabaseClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setSuccess(true);
      setTimeout(() => {
        router.push('/auth');
      }, 2000);
    } catch {
      setError('Could not reset password. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthPageBackground>
        <AuthCard>
          <AuthBrandBanner />
          <AuthCardBody className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Password updated</h2>
              <p className="mt-1 text-sm text-muted-foreground">Redirecting to sign in…</p>
            </div>
          </AuthCardBody>
        </AuthCard>
      </AuthPageBackground>
    );
  }

  return (
    <AuthPageBackground>
      <AuthCard>
        <AuthBrandBanner />
        <AuthCardBody>
          <AuthPageHeader title="New password" subtitle="Choose a strong password for your account." />

          {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <AuthPasswordField
              id="new-password"
              label="Password"
              value={password}
              onChange={setPassword}
              show={showPassword}
              onToggleShow={() => setShowPassword((v) => !v)}
              autoComplete="new-password"
              disabled={loading}
            />
            <AuthPasswordField
              id="confirm-password"
              label="Confirm"
              value={confirmPassword}
              onChange={setConfirmPassword}
              show={showConfirmPassword}
              onToggleShow={() => setShowConfirmPassword((v) => !v)}
              autoComplete="new-password"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
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

          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link href="/auth" className={authTextButtonClassName}>
              Back to sign in
            </Link>
          </p>

          <AuthFooterLinks />
        </AuthCardBody>
      </AuthCard>
    </AuthPageBackground>
  );
}
