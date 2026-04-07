'use client'

import * as React from 'react'
import Link from 'next/link'

export const authFieldClassName =
  'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30'

export const authPrimaryButtonClassName =
  'inline-flex w-full items-center justify-center rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition disabled:opacity-60 disabled:pointer-events-none'

export const authSecondaryButtonClassName =
  'inline-flex w-full items-center justify-center rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-accent transition disabled:opacity-60 disabled:pointer-events-none'

export const authCardClassName =
  'w-full max-w-md rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-sm'

export function AuthPageBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center px-4 py-10">
      {children}
    </div>
  )
}

export function AuthBrandBanner() {
  return (
    <div className="mb-5 text-center">
      <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm">
          SC
        </span>
        <span>SouthCaravan</span>
      </Link>
      <p className="mt-1 text-xs text-muted-foreground">Sign in to continue to your dashboard.</p>
    </div>
  )
}

