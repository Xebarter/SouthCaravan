'use client';

/**
 * Cart state: guests use localStorage; signed-in buyers sync to Postgres via `/api/buyer/cart`.
 * Cross-tab: CustomEvent + storage (guest). Buyers rely on same-tab updates after each API call.
 */

import * as React from 'react';
import { useAuth } from '@/lib/auth-context';
import { resolveCoupon } from '@/lib/cart-coupons';
import type { CartLineItem, CartState } from '@/lib/cart-types';
import { checkoutTotals } from '@/lib/checkout-session';

export type { AppliedCoupon } from '@/lib/cart-coupons';
export { KNOWN_COUPONS } from '@/lib/cart-coupons';
export type { CartLineItem, CartState } from '@/lib/cart-types';

const STORAGE_KEY = 'southcaravan_cart_v1';
const CHANGE_EVENT = 'southcaravan:cart-change';

const EMPTY_STATE: CartState = { items: [], saved: [], coupon: null };

function isValidItem(x: unknown): x is CartLineItem {
  if (!x || typeof x !== 'object') return false;
  const row = x as Record<string, unknown>;
  return (
    typeof row.id === 'string' &&
    row.id.length > 0 &&
    typeof row.name === 'string' &&
    typeof row.vendor === 'string' &&
    typeof row.price === 'number' &&
    Number.isFinite(row.price) &&
    row.price >= 0 &&
    typeof row.quantity === 'number' &&
    Number.isFinite(row.quantity) &&
    row.quantity > 0
  );
}

function normalizeItem(item: CartLineItem): CartLineItem {
  const minQty = Math.max(1, Math.floor(item.minQty ?? 1));
  const maxQty = Math.max(minQty, Math.floor(item.maxQty ?? 999));
  const qty = Math.min(maxQty, Math.max(minQty, Math.floor(item.quantity)));
  return { ...item, quantity: qty, minQty, maxQty };
}

function mergeItem(existing: CartLineItem, incoming: CartLineItem): CartLineItem {
  const merged: CartLineItem = {
    ...existing,
    ...incoming,
    quantity: existing.quantity + incoming.quantity,
    addedAt: incoming.addedAt ?? existing.addedAt ?? Date.now(),
  };
  return normalizeItem(merged);
}

function reduceAdd(prev: CartState, item: CartLineItem): CartState {
  const incoming = normalizeItem({ ...item, addedAt: item.addedAt ?? Date.now() });
  const existingIdx = prev.items.findIndex((row) => row.id === incoming.id);
  const items =
    existingIdx >= 0
      ? prev.items.map((row, i) => (i === existingIdx ? mergeItem(row, incoming) : row))
      : [incoming, ...prev.items];
  const saved = prev.saved.filter((row) => row.id !== incoming.id);
  return { ...prev, items, saved };
}

function safeRead(): CartState {
  if (typeof window === 'undefined') return EMPTY_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw) as Partial<CartState> | null;
    if (!parsed || typeof parsed !== 'object') return EMPTY_STATE;

    const items = Array.isArray(parsed.items)
      ? (parsed.items as CartLineItem[]).filter(isValidItem).map(normalizeItem)
      : [];
    const saved = Array.isArray(parsed.saved)
      ? (parsed.saved as CartLineItem[]).filter(isValidItem).map(normalizeItem)
      : [];
    const rawCoupon = parsed.coupon;
    const coupon =
      rawCoupon &&
      typeof rawCoupon.code === 'string' &&
      typeof rawCoupon.rate === 'number' &&
      typeof rawCoupon.label === 'string'
        ? {
            code: rawCoupon.code.toUpperCase(),
            rate: Math.max(0, Math.min(1, rawCoupon.rate)),
            label: rawCoupon.label,
          }
        : null;
    return { items, saved, coupon };
  } catch {
    return EMPTY_STATE;
  }
}

function emitCart(state: CartState) {
  try {
    window.dispatchEvent(new CustomEvent<CartState>(CHANGE_EVENT, { detail: state }));
  } catch {
    /* noop */
  }
}

function safeWrite(state: CartState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota */
  }
  emitCart(state);
}

async function buyerCartPost(body: Record<string, unknown>): Promise<CartState> {
  const res = await fetch('/api/buyer/cart', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { state?: CartState; error?: string };
  if (!res.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Cart request failed');
  }
  if (!data.state || typeof data.state !== 'object') {
    throw new Error('Invalid cart response');
  }
  return data.state;
}

async function buyerCartGet(): Promise<CartState> {
  const res = await fetch('/api/buyer/cart', { credentials: 'include' });
  const data = (await res.json().catch(() => ({}))) as { state?: CartState; error?: string };
  if (!res.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Failed to load cart');
  }
  if (!data.state || typeof data.state !== 'object') {
    throw new Error('Invalid cart response');
  }
  return data.state;
}

// ---------------------------------------------------------------
// Imperative API (guest = localStorage; buyer = server + event)
// ---------------------------------------------------------------

export function getCartState(): CartState {
  return safeRead();
}

export function setCartState(
  update: CartState | ((prev: CartState) => CartState),
): CartState {
  const prev = safeRead();
  const nextRaw = typeof update === 'function' ? update(prev) : update;
  const next: CartState = {
    items: nextRaw.items.filter(isValidItem).map(normalizeItem),
    saved: nextRaw.saved.filter(isValidItem).map(normalizeItem),
    coupon: nextRaw.coupon,
  };
  safeWrite(next);
  return next;
}

/** Add line: uses DB when logged in as buyer (cookies); otherwise localStorage. */
export async function addToCart(item: CartLineItem): Promise<void> {
  if (typeof window === 'undefined') return;
  const res = await fetch('/api/buyer/cart', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      op: 'add',
      productId: item.id,
      quantity: item.quantity,
    }),
  });

  if (res.ok) {
    const data = (await res.json()) as { state: CartState };
    emitCart(data.state);
    return;
  }

  if (res.status === 401 || res.status === 403) {
    safeWrite(reduceAdd(safeRead(), item));
    return;
  }

  const j = (await res.json().catch(() => ({}))) as { error?: string };
  throw new Error(typeof j.error === 'string' ? j.error : 'Could not add to cart');
}

export function removeFromCart(id: string): CartState {
  return setCartState((prev) => ({
    ...prev,
    items: prev.items.filter((row) => row.id !== id),
  }));
}

export function updateQuantity(id: string, quantity: number): CartState {
  return setCartState((prev) => {
    const qty = Math.floor(quantity);
    if (qty <= 0) {
      return { ...prev, items: prev.items.filter((row) => row.id !== id) };
    }
    return {
      ...prev,
      items: prev.items.map((row) =>
        row.id === id ? normalizeItem({ ...row, quantity: qty }) : row,
      ),
    };
  });
}

export function clearCart(): CartState {
  return setCartState((prev) => ({ ...prev, items: [], coupon: null }));
}

export function saveForLater(id: string): CartState {
  return setCartState((prev) => {
    const target = prev.items.find((row) => row.id === id);
    if (!target) return prev;
    return {
      ...prev,
      items: prev.items.filter((row) => row.id !== id),
      saved: [target, ...prev.saved.filter((row) => row.id !== id)],
    };
  });
}

export function moveSavedToCart(id: string): CartState {
  return setCartState((prev) => {
    const target = prev.saved.find((row) => row.id === id);
    if (!target) return prev;
    const existing = prev.items.find((row) => row.id === id);
    const items = existing
      ? prev.items.map((row) => (row.id === id ? mergeItem(row, target) : row))
      : [normalizeItem({ ...target, addedAt: Date.now() }), ...prev.items];
    return {
      ...prev,
      items,
      saved: prev.saved.filter((row) => row.id !== id),
    };
  });
}

export function removeSaved(id: string): CartState {
  return setCartState((prev) => ({
    ...prev,
    saved: prev.saved.filter((row) => row.id !== id),
  }));
}

export function applyCoupon(code: string): { state: CartState; ok: boolean; error?: string } {
  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    return { state: safeRead(), ok: false, error: 'Enter a promo code.' };
  }
  const coupon = resolveCoupon(normalized);
  if (!coupon) {
    return { state: safeRead(), ok: false, error: 'That code isn’t valid.' };
  }
  const state = setCartState((prev) => ({ ...prev, coupon }));
  return { state, ok: true };
}

export function removeCoupon(): CartState {
  return setCartState((prev) => ({ ...prev, coupon: null }));
}

// ---------------------------------------------------------------
// React hook
// ---------------------------------------------------------------

type CartDerived = {
  itemCount: number;
  distinctCount: number;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  freeShippingThreshold: number;
  freeShippingRemaining: number;
};

export type UseCartReturn = {
  hydrated: boolean;
  /** True when cart loads from `/api/buyer/cart` (buyer session). */
  serverBacked: boolean;
  state: CartState;
  derived: CartDerived;

  add: (item: CartLineItem) => Promise<void>;
  remove: (id: string) => Promise<void>;
  setQuantity: (id: string, quantity: number) => Promise<void>;
  increment: (id: string, step?: number) => Promise<void>;
  decrement: (id: string, step?: number) => Promise<void>;
  clear: () => Promise<void>;
  saveForLater: (id: string) => Promise<void>;
  moveSavedToCart: (id: string) => Promise<void>;
  removeSaved: (id: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<{ ok: boolean; error?: string }>;
  removeCoupon: () => Promise<void>;
};

const FREE_SHIPPING_THRESHOLD = 500;

function deriveTotals(state: CartState): CartDerived {
  const rawSubtotal = state.items.reduce((sum, row) => sum + row.price * row.quantity, 0);
  const discount = state.coupon
    ? Math.min(rawSubtotal, rawSubtotal * state.coupon.rate)
    : 0;
  const { subtotal, shipping, tax, total } = checkoutTotals(state.items, discount);
  const afterDiscount = Math.max(0, subtotal - discount);
  const freeShippingRemaining =
    afterDiscount >= FREE_SHIPPING_THRESHOLD || afterDiscount === 0
      ? 0
      : FREE_SHIPPING_THRESHOLD - afterDiscount;
  const itemCount = state.items.reduce((sum, row) => sum + row.quantity, 0);
  return {
    itemCount,
    distinctCount: state.items.length,
    subtotal,
    discount,
    shipping,
    tax,
    total,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
    freeShippingRemaining,
  };
}

function isBuyerRole(user: { role: string } | null): boolean {
  return user?.role === 'buyer';
}

export function useCart(): UseCartReturn {
  const { user, isLoading: authLoading } = useAuth();
  const [state, setState] = React.useState<CartState>(EMPTY_STATE);
  const [hydrated, setHydrated] = React.useState(false);
  const [serverBacked, setServerBacked] = React.useState(false);

  const serverCartMode = !authLoading && isBuyerRole(user);

  React.useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    (async () => {
      if (serverCartMode) {
        try {
          const guest = safeRead();
          const hasGuest =
            guest.items.length > 0 || guest.saved.length > 0 || guest.coupon != null;

          if (hasGuest) {
            const mergeBody = {
              op: 'mergeGuest' as const,
              items: [
                ...guest.items.map((i) => ({
                  productId: i.id,
                  quantity: i.quantity,
                  listKind: 'cart' as const,
                })),
                ...guest.saved.map((i) => ({
                  productId: i.id,
                  quantity: i.quantity,
                  listKind: 'saved' as const,
                })),
              ],
              couponCode: guest.coupon?.code ?? null,
            };
            const res = await fetch('/api/buyer/cart', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(mergeBody),
            });
            if (res.ok) {
              try {
                localStorage.removeItem(STORAGE_KEY);
              } catch {
                /* noop */
              }
              const data = (await res.json()) as { state: CartState };
              if (!cancelled) {
                setState(data.state);
                setServerBacked(true);
              }
            } else {
              const data = await buyerCartGet();
              if (!cancelled) {
                setState(data);
                setServerBacked(true);
              }
            }
          } else {
            const data = await buyerCartGet();
            if (!cancelled) {
              setState(data);
              setServerBacked(true);
            }
          }
        } catch (e) {
          console.error('[useCart] buyer hydrate', e);
          if (!cancelled) {
            setState(EMPTY_STATE);
            setServerBacked(true);
          }
        }
      } else {
        if (!cancelled) {
          setState(safeRead());
          setServerBacked(false);
        }
      }
      if (!cancelled) setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, serverCartMode, user?.id]);

  React.useEffect(() => {
    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<CartState>).detail;
      if (detail) setState(detail);
      else if (!serverCartMode) setState(safeRead());
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && !serverCartMode) setState(safeRead());
    };

    window.addEventListener(CHANGE_EVENT, onChange as EventListener);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange as EventListener);
      window.removeEventListener('storage', onStorage);
    };
  }, [serverCartMode]);

  const derived = React.useMemo(() => deriveTotals(state), [state]);

  const api = React.useMemo<UseCartReturn>(() => {
    return {
      hydrated,
      serverBacked,
      state,
      derived,

      add: async (item) => {
        if (serverCartMode) {
          setState(
            await buyerCartPost({
              op: 'add',
              productId: item.id,
              quantity: item.quantity,
            }),
          );
          return;
        }
        safeWrite(reduceAdd(safeRead(), item));
      },

      remove: async (id) => {
        if (serverCartMode) {
          setState(await buyerCartPost({ op: 'remove', productId: id, listKind: 'cart' }));
          return;
        }
        removeFromCart(id);
      },

      setQuantity: async (id, quantity) => {
        if (serverCartMode) {
          setState(
            await buyerCartPost({ op: 'setQuantity', productId: id, quantity, listKind: 'cart' }),
          );
          return;
        }
        updateQuantity(id, quantity);
      },

      increment: async (id, step = 1) => {
        const target = state.items.find((row) => row.id === id);
        if (!target) return;
        const s = Math.max(1, Math.floor(step));
        const q = target.quantity + s;
        if (serverCartMode) {
          setState(
            await buyerCartPost({ op: 'setQuantity', productId: id, quantity: q, listKind: 'cart' }),
          );
          return;
        }
        updateQuantity(id, q);
      },

      decrement: async (id, step = 1) => {
        const target = state.items.find((row) => row.id === id);
        if (!target) return;
        const s = Math.max(1, Math.floor(step));
        const q = target.quantity - s;
        if (serverCartMode) {
          setState(
            await buyerCartPost({ op: 'setQuantity', productId: id, quantity: q, listKind: 'cart' }),
          );
          return;
        }
        updateQuantity(id, q);
      },

      clear: async () => {
        if (serverCartMode) {
          setState(await buyerCartPost({ op: 'clear' }));
          return;
        }
        clearCart();
      },

      saveForLater: async (id) => {
        if (serverCartMode) {
          setState(await buyerCartPost({ op: 'saveForLater', productId: id }));
          return;
        }
        saveForLater(id);
      },

      moveSavedToCart: async (id) => {
        if (serverCartMode) {
          setState(await buyerCartPost({ op: 'moveToCart', productId: id }));
          return;
        }
        moveSavedToCart(id);
      },

      removeSaved: async (id) => {
        if (serverCartMode) {
          setState(await buyerCartPost({ op: 'removeSaved', productId: id }));
          return;
        }
        removeSaved(id);
      },

      applyCoupon: async (code) => {
        if (serverCartMode) {
          const res = await fetch('/api/buyer/cart', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ op: 'applyCoupon', code }),
          });
          const data = (await res.json().catch(() => ({}))) as { state?: CartState; error?: string };
          if (!res.ok) {
            return { ok: false, error: typeof data.error === 'string' ? data.error : 'Invalid code' };
          }
          if (data.state) setState(data.state);
          return { ok: true };
        }
        const result = applyCoupon(code);
        return { ok: result.ok, error: result.error };
      },

      removeCoupon: async () => {
        if (serverCartMode) {
          setState(await buyerCartPost({ op: 'removeCoupon' }));
          return;
        }
        removeCoupon();
      },
    };
  }, [hydrated, serverBacked, state, derived, serverCartMode]);

  return api;
}
