/** Root element for the vendor/services confirmation dialog (portaled to document body). */
export const PORTAL_SELL_CONFIRM_ROOT_ATTR = 'data-portal-sell-confirm'

/** Set on document.body while the confirmation dialog is open. */
export const PORTAL_SELL_CONFIRM_OPEN_ATTR = 'data-portal-sell-confirm-open'

export function setPortalSellConfirmOpen(open: boolean): void {
  if (typeof document === 'undefined') return
  if (open) {
    document.body.setAttribute(PORTAL_SELL_CONFIRM_OPEN_ATTR, '')
  } else {
    document.body.removeAttribute(PORTAL_SELL_CONFIRM_OPEN_ATTR)
  }
}

export function isPortalSellConfirmOpen(): boolean {
  if (typeof document === 'undefined') return false
  return document.body.hasAttribute(PORTAL_SELL_CONFIRM_OPEN_ATTR)
}

export function isPortalSellConfirmTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof Element)) return false
  return Boolean(target.closest(`[${PORTAL_SELL_CONFIRM_ROOT_ATTR}]`))
}
