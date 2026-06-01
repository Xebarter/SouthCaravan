'use client'

import type { ComponentProps } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogOverlay, DialogPortal, DialogTitle } from '@/components/ui/dialog'
import { getSellPortalPrompt, type SellPortal } from '@/lib/portal-sell-prompt'
import { cn } from '@/lib/utils'

const ease = 'ease-[cubic-bezier(0.16,1,0.3,1)]'

function SellDialogContent({
  className,
  children,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPortal>
      <DialogOverlay
        className={cn(
          'bg-black/35 backdrop-blur-[8px]',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 duration-300',
          ease,
        )}
      />
      <DialogPrimitive.Content
        data-portal-sell-confirm=""
        className={cn(
          'fixed top-[50%] left-[50%] z-50 w-[min(calc(100vw-2.5rem),17.5rem)] -translate-x-1/2 -translate-y-1/2',
          'rounded-2xl border border-border/50 bg-background/90 p-5 shadow-[0_20px_60px_-24px_rgba(0,0,0,0.35)] backdrop-blur-2xl',
          'outline-none',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
          'data-[state=open]:zoom-in-[0.97] data-[state=closed]:zoom-out-[0.97]',
          'data-[state=open]:slide-in-from-bottom-2 data-[state=closed]:slide-out-to-bottom-1',
          'duration-300',
          ease,
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

export function PortalSellConfirmDialog({
  portal,
  open,
  onOpenChange,
  busy,
  onConfirm,
}: {
  portal: SellPortal
  open: boolean
  onOpenChange: (open: boolean) => void
  busy: boolean
  onConfirm: () => void
}) {
  const prompt = getSellPortalPrompt(portal)
  const Icon = prompt.icon

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <SellDialogContent aria-describedby="sell-dialog-hint">
        <p id="sell-dialog-hint" className="sr-only">
          {prompt.hint}
        </p>

        <div className="flex flex-col items-center pt-1 text-center">
          <div
            className={cn(
              'mb-4 flex h-11 w-11 items-center justify-center rounded-full',
              prompt.accent,
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
          </div>

          <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
            {prompt.title}
          </DialogTitle>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            className="h-10 rounded-xl border-border/80 text-sm font-medium"
            onClick={() => onOpenChange(false)}
          >
            No
          </Button>
          <Button
            type="button"
            disabled={busy}
            className={cn(
              'h-10 rounded-xl text-sm font-semibold shadow-sm',
              'transition-transform active:scale-[0.98]',
            )}
            onClick={() => {
              void onConfirm()
            }}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Yes'}
          </Button>
        </div>
      </SellDialogContent>
    </Dialog>
  )
}
