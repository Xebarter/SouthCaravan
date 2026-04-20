'use client'

import { Toaster as Sonner, ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--success-bg': 'var(--success-surface)',
          '--success-border': 'var(--success-border)',
          '--success-text': 'var(--success-text)',
          '--error-bg': 'color-mix(in srgb, var(--destructive) 8%, var(--background))',
          '--error-border': 'color-mix(in srgb, var(--destructive) 35%, var(--border))',
          '--error-text': 'var(--destructive)',
          '--warning-bg': 'var(--warning-surface)',
          '--warning-border': 'var(--warning-border)',
          '--warning-text': 'var(--warning-text)',
          '--info-bg': 'var(--info-surface)',
          '--info-border': 'var(--info-border)',
          '--info-text': 'var(--info-text)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
