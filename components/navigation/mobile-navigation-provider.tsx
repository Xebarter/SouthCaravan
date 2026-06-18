'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

const STACK_KEY = 'sc_nav_stack_v1';
const MAX_STACK = 64;

type MobileNavigationContextValue = {
  /** Prefer browser back when there is in-app history; otherwise use fallback. */
  goBack: (fallbackHref: string) => void;
};

const MobileNavigationContext = createContext<MobileNavigationContextValue | null>(null);

function readStack(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(STACK_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function writeStack(stack: string[]) {
  try {
    sessionStorage.setItem(STACK_KEY, JSON.stringify(stack.slice(-MAX_STACK)));
  } catch {
    // non-fatal
  }
}

function currentHref(pathname: string, search: string) {
  return search ? `${pathname}?${search}` : pathname;
}

function isMobileLike() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768;
}

export function MobileNavigationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const search = searchParams.toString();
  const href = currentHref(pathname, search);

  const hrefRef = useRef(href);
  const handlingPopRef = useRef(false);

  useEffect(() => {
    hrefRef.current = href;
  }, [href]);

  // Keep an in-app navigation stack so mobile back can recover when the browser
  // history is shallow (common in installed PWAs / standalone display mode).
  useEffect(() => {
    if (typeof window === 'undefined' || !isMobileLike()) return;

    const stack = readStack();
    const top = stack[stack.length - 1];

    if (!top) {
      writeStack([href]);
      return;
    }

    if (top === href) return;

    if (handlingPopRef.current) {
      return;
    }

    // Forward navigation — append.
    writeStack([...stack, href]);
  }, [href]);

  useEffect(() => {
    if (typeof window === 'undefined' || !isMobileLike()) return;

    const onPopState = (event: PopStateEvent) => {
      if ((event.state as { scOverlay?: string } | null)?.scOverlay) {
        return;
      }

      handlingPopRef.current = true;

      const actual = window.location.pathname + window.location.search;
      const current = hrefRef.current;

      // Overlay-only history entry — URL did not change.
      if (actual === current) {
        window.setTimeout(() => {
          handlingPopRef.current = false;
        }, 0);
        return;
      }

      const stack = readStack();
      if (stack.length <= 1) {
        window.setTimeout(() => {
          handlingPopRef.current = false;
        }, 0);
        return;
      }

      const expectedPrevious = stack[stack.length - 2];
      if (actual !== expectedPrevious) {
        writeStack(stack.slice(0, -1));
        router.push(expectedPrevious);
      } else {
        writeStack(stack.slice(0, -1));
      }

      window.setTimeout(() => {
        handlingPopRef.current = false;
      }, 0);
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [router]);

  const goBack = useCallback(
    (fallbackHref: string) => {
      if (typeof window === 'undefined') return;

      const stack = readStack();
      const current = hrefRef.current;
      const currentIndex = stack.lastIndexOf(current);

      if (currentIndex > 0) {
        const previous = stack[currentIndex - 1];
        writeStack(stack.slice(0, currentIndex));
        router.push(previous);
        return;
      }

      if (window.history.length > 1) {
        window.history.back();
        return;
      }

      router.push(fallbackHref);
    },
    [router],
  );

  return (
    <MobileNavigationContext.Provider value={{ goBack }}>{children}</MobileNavigationContext.Provider>
  );
}

export function useMobileNavigation() {
  const ctx = useContext(MobileNavigationContext);
  if (!ctx) {
    throw new Error('useMobileNavigation must be used within MobileNavigationProvider');
  }
  return ctx;
}
