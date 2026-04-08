'use client';

import { useEffect, useState } from 'react';

type FxPayload = {
  ok: boolean;
  base: string;
  rates: Record<string, number> | null;
  time_last_update_unix: number | null;
};

export function useFxRates(base: string) {
  const [payload, setPayload] = useState<FxPayload | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const upperBase = (base || 'USD').toUpperCase();
    const cacheKey = `southcaravan_fx_latest_${upperBase}_v1`;
    const now = Date.now();
    const MAX_AGE_MS = 1000 * 60 * 60; // 1 hour

    try {
      const cachedRaw = window.sessionStorage.getItem(cacheKey);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw) as { savedAt?: number; payload?: FxPayload };
        if (cached?.payload && typeof cached.savedAt === 'number' && now - cached.savedAt < MAX_AGE_MS) {
          setPayload(cached.payload);
          return;
        }
      }
    } catch {
      // ignore
    }

    const controller = new AbortController();
    void (async () => {
      try {
        const res = await fetch(`/api/fx/latest?base=${encodeURIComponent(upperBase)}`, {
          signal: controller.signal,
        });
        const data = (await res.json()) as FxPayload;
        setPayload(data);
        try {
          window.sessionStorage.setItem(cacheKey, JSON.stringify({ savedAt: now, payload: data }));
        } catch {
          // ignore
        }
      } catch {
        // ignore
      }
    })();

    return () => controller.abort();
  }, [base]);

  return payload;
}

