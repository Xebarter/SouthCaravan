'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  ShieldCheck,
} from 'lucide-react'

import { SiteLogoMark } from '@/components/site-logo'
import { cn } from '@/lib/utils'

export const authFieldClassName =
  'flex h-12 w-full rounded-lg border border-border bg-card px-4 text-[15px] text-foreground shadow-sm transition-[border-color,box-shadow] placeholder:text-muted-foreground hover:border-muted-foreground/35 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60'

export const authPrimaryButtonClassName =
  'inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition hover:bg-[var(--primary-hover)] hover:shadow-lg hover:shadow-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60'

export const authSecondaryButtonClassName =
  'inline-flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted/40 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60'

export const authTextButtonClassName =
  'text-sm font-medium text-[var(--link)] transition hover:text-[var(--link-hover)] hover:underline disabled:opacity-60'

export const authCardClassName =
  'relative w-full overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_1px_3px_rgba(15,23,42,0.06),0_8px_24px_rgba(15,23,42,0.08)]'

/** Fills the main column below the site header — use with auth entry routes (no footer). */
export function AuthPageBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-muted/40">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_50%_-30%,color-mix(in_srgb,var(--primary)_8%,transparent),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_100%_100%,color-mix(in_srgb,var(--trust)_6%,transparent),transparent_50%)]"
        aria-hidden
      />
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 py-5 sm:py-8">
        <div className="max-h-full w-full max-w-[452px] overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  )
}

export function AuthPageLoading({ message = 'Loading…' }: { message?: string }) {
  return (
    <AuthPageBackground>
      <AuthCard>
        <AuthLoadingState message={message} />
      </AuthCard>
    </AuthPageBackground>
  )
}

export function AuthCard({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn(authCardClassName, className)}>
      <div
        className="h-1 w-full bg-linear-to-r from-primary via-primary/80 to-[var(--trust)]"
        aria-hidden
      />
      {children}
    </div>
  )
}

export function AuthCardBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('border-t border-border/50 px-6 pb-7 pt-6 sm:px-10 sm:pb-8', className)}>
      {children}
    </div>
  )
}

type AuthPortalKey = 'buyer' | 'vendor' | 'services' | 'admin' | 'auto'

const PORTAL_META: Record<
  Exclude<AuthPortalKey, 'auto'>,
  { label: string; className: string }
> = {
  buyer: {
    label: 'Buyer',
    className: 'border-sky-500/25 bg-sky-500/10 text-sky-900',
  },
  vendor: {
    label: 'Vendor',
    className: 'border-violet-500/25 bg-violet-500/10 text-violet-900',
  },
  services: {
    label: 'Services',
    className: 'border-amber-500/25 bg-amber-500/10 text-amber-950',
  },
  admin: {
    label: 'Admin',
    className: 'border-rose-500/25 bg-rose-500/10 text-rose-900',
  },
}

export function AuthPortalBadge({ portal }: { portal: AuthPortalKey }) {
  if (portal === 'auto') return null
  const meta = PORTAL_META[portal]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium',
        meta.className,
      )}
    >
      {meta.label}
    </span>
  )
}

export function AuthCardHero({
  title,
  portal,
  action,
}: {
  title: string
  portal?: AuthPortalKey
  action?: React.ReactNode
}) {
  return (
    <div className="relative px-6 pb-1 pt-8 text-center sm:px-10 sm:pt-9">
      {action ? (
        <div className="absolute right-4 top-4 sm:right-6 sm:top-5">{action}</div>
      ) : null}
      <Link
        href="/"
        className="mx-auto inline-flex rounded-2xl bg-muted/50 p-3 ring-1 ring-border/60 outline-none transition hover:bg-muted/80 focus-visible:ring-2 focus-visible:ring-primary/30"
        aria-label="SouthCaravan home"
      >
        <SiteLogoMark size={44} className="h-11 w-11 object-contain" />
      </Link>
      <h1 className="mt-5 text-[1.65rem] font-semibold tracking-tight text-foreground">{title}</h1>
      {portal && portal !== 'auto' ? (
        <div className="mt-3 flex justify-center">
          <AuthPortalBadge portal={portal} />
        </div>
      ) : null}
    </div>
  )
}

export function AuthModeToggle({
  mode,
  onSignIn,
  onSignUp,
  disabled,
}: {
  mode: 'signin' | 'signup'
  onSignIn: () => void
  onSignUp: () => void
  disabled?: boolean
}) {
  return (
    <div className="relative mb-6 grid grid-cols-2 rounded-full border border-border/70 bg-muted/50 p-1">
      <div
        className={cn(
          'pointer-events-none absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-card shadow-sm ring-1 ring-black/[0.04] transition-transform duration-200 ease-out',
          mode === 'signup' ? 'translate-x-[calc(100%+4px)]' : 'translate-x-0',
        )}
        aria-hidden
      />
      <button
        type="button"
        disabled={disabled}
        onClick={onSignIn}
        className={cn(
          'relative z-10 rounded-full py-2 text-sm font-semibold transition-colors',
          mode === 'signin' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        Sign in
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onSignUp}
        className={cn(
          'relative z-10 rounded-full py-2 text-sm font-semibold transition-colors',
          mode === 'signup' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        Create account
      </button>
    </div>
  )
}

export function AuthField({
  id,
  label,
  type = 'text',
  hideLabel,
  className,
  ...props
}: React.ComponentProps<'input'> & { label: string; hideLabel?: boolean }) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className={cn('text-sm font-medium text-foreground', hideLabel && 'sr-only')}
      >
        {label}
      </label>
      <input id={id} type={type} className={cn(authFieldClassName, className)} {...props} />
    </div>
  )
}

export function AuthAlert({
  variant,
  children,
}: {
  variant: 'error' | 'success' | 'info'
  children: React.ReactNode
}) {
  const Icon = variant === 'error' ? AlertCircle : variant === 'success' ? CheckCircle2 : ShieldCheck
  return (
    <div
      role="alert"
      className={cn(
        'mb-4 flex gap-2.5 rounded-lg border px-3.5 py-3 text-sm leading-relaxed',
        variant === 'error' && 'border-destructive/25 bg-destructive/8 text-destructive',
        variant === 'success' && 'border-success-border bg-success-surface text-success-text',
        variant === 'info' && 'border-info-border bg-info-surface text-info-text',
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

export function AuthPasswordField({
  id,
  label,
  labelAction,
  placeholder,
  value,
  onChange,
  show,
  onToggleShow,
  autoComplete,
  disabled,
  hideLabel,
}: {
  id: string
  label: string
  labelAction?: React.ReactNode
  placeholder?: string
  value: string
  onChange: (value: string) => void
  show: boolean
  onToggleShow: () => void
  autoComplete?: string
  disabled?: boolean
  hideLabel?: boolean
}) {
  return (
    <div className="space-y-1.5">
      {!hideLabel ? (
        <div className="flex items-center justify-between gap-2">
          <label htmlFor={id} className="text-sm font-medium text-foreground">
            {label}
          </label>
          {labelAction}
        </div>
      ) : (
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          placeholder={placeholder ?? 'Enter your password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={cn(authFieldClassName, 'pr-11')}
        />
        <button
          type="button"
          onClick={onToggleShow}
          disabled={disabled}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {hideLabel && labelAction ? <div className="flex justify-end">{labelAction}</div> : null}
    </div>
  )
}

export function AuthPanel({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <div className="space-y-4">
      <div className="flex gap-3.5 rounded-xl border border-border/80 bg-muted/30 p-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 pt-0.5 text-left">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description ? (
            <div className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</div>
          ) : null}
        </div>
      </div>
      {children}
    </div>
  )
}

export function AuthLoadingState({ message }: { message: string }) {
  return (
    <>
      <AuthCardHero title="Sign in" />
      <AuthCardBody className="flex flex-col items-center gap-4 border-t-0 pt-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
        </div>
        <p className="text-sm text-muted-foreground">{message}</p>
      </AuthCardBody>
    </>
  )
}

export function AuthSuccessState({
  title,
  description,
  children,
}: {
  title: string
  description?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <>
      <AuthCardHero title={title} />
      <AuthCardBody className="space-y-5 border-t-0 pt-2 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-surface ring-4 ring-success-border/40">
          <CheckCircle2 className="h-7 w-7 text-success" aria-hidden />
        </div>
        {description ? (
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
        {children}
      </AuthCardBody>
    </>
  )
}

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

export function AuthDivider({ label = 'or sign in with email' }: { label?: string }) {
  return (
    <div className="relative my-5">
      <div className="absolute inset-0 flex items-center" aria-hidden>
        <div className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-card px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      </div>
    </div>
  )
}

export function AuthGoogleButton({
  disabled,
  onClick,
  label = 'Continue with Google',
}: {
  disabled?: boolean
  onClick: () => void
  label?: string
}) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={authSecondaryButtonClassName}>
      <GoogleMark className="h-5 w-5 shrink-0" />
      <span>{label}</span>
    </button>
  )
}

export function AuthTrustLine() {
  return (
    <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
      <Lock className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
      Encrypted sign-in · SOC-ready infrastructure
    </p>
  )
}

export function AuthFooterLinks() {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 border-t border-border/50 pt-5 text-xs text-muted-foreground">
      <Link href="/privacy" className="transition hover:text-foreground">
        Privacy Policy
      </Link>
      <Link href="/terms" className="transition hover:text-foreground">
        Terms of Service
      </Link>
      <Link href="/help" className="transition hover:text-foreground">
        Help Center
      </Link>
    </div>
  )
}

export type { AuthPortalKey }
