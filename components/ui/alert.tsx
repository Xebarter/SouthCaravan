import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const alertVariants = cva(
  'relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start transition-colors duration-200 ease-out [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current',
  {
    variants: {
      variant: {
        default:
          'bg-card text-card-foreground border-border [&_[data-slot=alert-description]]:text-muted-foreground',
        destructive:
          'border-destructive/30 bg-destructive/5 text-destructive [&>svg]:text-destructive [&_[data-slot=alert-description]]:opacity-90',
        success:
          'border-success-border bg-success-surface text-success-text [&>svg]:text-success [&_[data-slot=alert-description]]:opacity-90',
        warning:
          'border-warning-border bg-warning-surface text-warning-text [&>svg]:text-warning [&_[data-slot=alert-description]]:opacity-90',
        info:
          'border-info-border bg-info-surface text-info-text [&>svg]:text-trust [&_[data-slot=alert-description]]:opacity-90',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        'col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight',
        className,
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        'col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed',
        className,
      )}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription }
