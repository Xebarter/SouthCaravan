'use client'

import * as React from 'react'
import Link from 'next/link'
import { SiteLogoMark } from '@/components/site-logo'

export const authFieldClassName =
  'w-full h-11 rounded-md border border-input bg-background px-3 text-base sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30'

export const authPrimaryButtonClassName =
  'inline-flex w-full h-11 items-center justify-center rounded-md bg-primary px-3 text-base sm:text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition disabled:opacity-60 disabled:pointer-events-none'

export const authSecondaryButtonClassName =
  'inline-flex w-full h-11 items-center justify-center rounded-md border border-border bg-background px-3 text-base sm:text-sm font-medium text-foreground hover:bg-accent transition disabled:opacity-60 disabled:pointer-events-none'

export const authCardClassName =
  'w-full max-w-[420px] rounded-2xl border border-border bg-card p-5 sm:p-7 shadow-sm'

export function AuthPageBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[calc(100svh-4rem)] bg-background px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100svh-8rem)] w-full max-w-[520px] items-start justify-center sm:items-center">
        {children}
      </div>
    </div>
  )
}

export function AuthBrandBanner() {
  return (
    <div className="mb-5 text-center">
      <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl" aria-label="SouthCaravan home">
        <SiteLogoMark size={36} className="h-9 w-9 shrink-0 rounded-lg object-contain" />
        <span>SouthCaravan</span>
      </Link>
      <p className="mt-1 text-xs text-muted-foreground">Sign in to continue</p>
    </div>
  )
}

