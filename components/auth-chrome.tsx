'use client'

import * as React from 'react'
import Link from 'next/link'
import { SiteLogoMark } from '@/components/site-logo'

export const authFieldClassName =
  'w-full h-14 rounded-lg border border-input bg-background px-4 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30'

export const authPrimaryButtonClassName =
  'inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition disabled:opacity-60 disabled:pointer-events-none'

export const authSecondaryButtonClassName =
  'inline-flex h-11 items-center justify-center rounded-full border border-border bg-background px-6 text-sm font-medium text-foreground hover:bg-accent transition disabled:opacity-60 disabled:pointer-events-none'

export const authTextButtonClassName =
  'inline-flex h-11 items-center justify-center rounded-full px-3 text-sm font-medium text-primary hover:bg-accent transition disabled:opacity-60 disabled:pointer-events-none'

export const authCardClassName =
  'w-full max-w-[448px] rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm'

export function AuthPageBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[calc(100svh-4rem)] bg-muted/20 px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100svh-8rem)] w-full max-w-[560px] items-start justify-center sm:items-center">
        {children}
      </div>
    </div>
  )
}

export function AuthBrandBanner() {
  return (
    <div className="mb-6 flex items-center justify-center">
      <Link href="/" className="inline-flex items-center gap-2" aria-label="SouthCaravan home">
        <SiteLogoMark size={40} className="h-10 w-10 shrink-0 rounded-xl object-contain" />
        <span className="text-[15px] font-semibold tracking-tight text-foreground">SouthCaravan</span>
      </Link>
    </div>
  )
}

