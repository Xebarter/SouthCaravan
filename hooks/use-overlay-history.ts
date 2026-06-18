'use client';

import { useEffect, useRef } from 'react';

/**
 * Binds a mobile overlay (drawer, menu, modal) to the browser back stack so
 * hardware back closes the overlay instead of leaving the page or exiting the app.
 */
export function useOverlayHistory(
  open: boolean,
  overlayId: string,
  onClose: () => void,
  enabled = true,
) {
  const pushedRef = useRef(false);
  const closingFromPopRef = useRef(false);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    if (open && !pushedRef.current) {
      window.history.pushState({ scOverlay: overlayId }, '', window.location.href);
      pushedRef.current = true;
      return;
    }

    if (!open && pushedRef.current && !closingFromPopRef.current) {
      pushedRef.current = false;
      if ((window.history.state as { scOverlay?: string } | null)?.scOverlay === overlayId) {
        closingFromPopRef.current = true;
        window.history.back();
      }
    }
  }, [open, enabled, overlayId]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const onPopState = () => {
      if (!pushedRef.current) return;
      pushedRef.current = false;
      closingFromPopRef.current = true;
      onCloseRef.current();
      window.setTimeout(() => {
        closingFromPopRef.current = false;
      }, 0);
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [enabled, overlayId]);
}
