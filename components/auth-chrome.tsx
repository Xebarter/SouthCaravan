'use client'

import * as React from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

import { SiteLogoMark } from '@/components/site-logo'
import { cn } from '@/lib/utils'

export const authFieldClassName =
  'flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:border-primary/40 disabled:cursor-not-allowed disabled:opacity-60'

export const authPrimaryButtonClassName =
  'inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:pointer-events-none disabled:opacity-60'

export const authSecondaryButtonClassName =
  'inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:pointer-events-none disabled:opacity-60'

export const authTextButtonClassName =
  'text-sm font-medium text-primary underline-offset-4 hover:underline disabled:opacity-60'

export const authCardClassName =
  'w-full max-w-[420px] overflow-hidden rounded-2xl border border-border/80 bg-card/95 shadow-xl shadow-black/8 ring-1 ring-black/[0.04] backdrop-blur-sm'

export function AuthPageBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-[calc(100svh-4rem)] overflow-hidden bg-muted/25">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,color-mix(in_srgb,var(--primary)_12%,transparent),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] bg-[linear-gradient(to_right,color-mix(in_srgb,var(--border)_40%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_srgb,var(--border)_40%,transparent)_1px,transparent_1px)] bg-size-[28px_28px]"
        aria-hidden
      />
      <div className="relative mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-lg items-center justify-center px-4 py-10 sm:py-14">
        {children}
      </div>
    </div>
  )
}

export function AuthPageLoading() {
  return (
    <AuthPageBackground>
      <AuthCard>
        <AuthBrandBanner />
        <div className="flex flex-col items-center gap-3 py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
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
  return <div className={cn(authCardClassName, className)}>{children}</div>
}

export function AuthCardBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('px-6 py-6 sm:px-8 sm:py-7', className)}>{children}</div>
}

export function AuthBrandBanner() {
  return (
    <div className="flex flex-col items-center border-b border-border/70 bg-linear-to-b from-muted/30 to-transparent px-6 py-5 sm:px-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2.5 rounded-lg outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-primary/30"
        aria-label="SouthCaravan home"
      >
        <SiteLogoMark size={36} className="h-9 w-9 shrink-0 rounded-lg object-contain" />
        <span className="text-base font-semibold tracking-tight text-foreground">SouthCaravan</span>
      </Link>
    </div>
  )
}

type AuthPortalKey = 'buyer' | 'vendor' | 'services' | 'admin' | 'auto'

const PORTAL_BADGE: Record<
  Exclude<AuthPortalKey, 'auto'>,
  { label: string; className: string }
> = {
  buyer: {
    label: 'Buyer',
    className: 'bg-sky-500/10 text-sky-800 dark:text-sky-300 border-sky-500/20',
  },
  vendor: {
    label: 'Vendor',
    className: 'bg-violet-500/10 text-violet-800 dark:text-violet-300 border-violet-500/20',
  },
  services: {
    label: 'Services',
    className: 'bg-amber-500/10 text-amber-900 dark:text-amber-300 border-amber-500/20',
  },
  admin: {
    label: 'Admin',
    className: 'bg-rose-500/10 text-rose-800 dark:text-rose-300 border-rose-500/20',
  },
}

export function AuthPortalBadge({ portal }: { portal: AuthPortalKey }) {
  if (portal === 'auto') return null
  const meta = PORTAL_BADGE[portal]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
        meta.className,
      )}
    >
      {meta.label}
    </span>
  )
}

export function AuthPageHeader({
  title,
  subtitle,
  portal,
  action,
}: {
  title: string
  subtitle?: string
  portal?: AuthPortalKey
  action?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-3">
      <div className="min-w-0 space-y-2">
        {portal ? <AuthPortalBadge portal={portal} /> : null}
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
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
    <div className="mb-6 flex rounded-lg border border-border/80 bg-muted/40 p-0.5">
      <button
        type="button"
        disabled={disabled}
        onClick={onSignIn}
        className={cn(
          'flex-1 rounded-md py-2 text-sm font-semibold transition-colors',
          mode === 'signin'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        Sign in
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onSignUp}
        className={cn(
          'flex-1 rounded-md py-2 text-sm font-semibold transition-colors',
          mode === 'signup'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        Sign up
      </button>
    </div>
  )
}

export function AuthField({
  id,
  label,
  type = 'text',
  className,
  ...props
}: React.ComponentProps<'input'> & { label: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
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
  return (
    <div
      role="alert"
      className={cn(
        'mb-4 rounded-lg border px-3 py-2.5 text-sm leading-relaxed',
        variant === 'error' && 'border-destructive/30 bg-destructive/10 text-destructive',
        variant === 'success' && 'border-primary/25 bg-primary/5 text-foreground',
        variant === 'info' && 'border-border bg-muted/40 text-foreground',
      )}
    >
      {children}
    </div>
  )
}

export function AuthPasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggleShow,
  autoComplete,
  disabled,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  show: boolean
  onToggleShow: () => void
  autoComplete?: string
  disabled?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          placeholder="••••••••"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={cn(authFieldClassName, 'pr-10')}
        />
        <button
          type="button"
          onClick={onToggleShow}
          disabled={disabled}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}

export function AuthFooterLinks() {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-border/70 pt-5 text-xs text-muted-foreground">
      <Link href="/privacy" className="hover:text-foreground transition-colors">
        Privacy
      </Link>
      <Link href="/terms" className="hover:text-foreground transition-colors">
        Terms
      </Link>
      <Link href="/help" className="hover:text-foreground transition-colors">
        Help
      </Link>
    </div>
  )
}
