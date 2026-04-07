type CacheEntry<T> = {
  value: T;
  expiresAtMs: number;
};

function getGlobalCache() {
  // Persist across hot-reloads during development.
  const g = globalThis as unknown as { __SC_MEMORY_CACHE__?: Map<string, CacheEntry<unknown>> };
  if (!g.__SC_MEMORY_CACHE__) g.__SC_MEMORY_CACHE__ = new Map();
  return g.__SC_MEMORY_CACHE__;
}

const memoryCache = getGlobalCache();

export async function getCached<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const existing = memoryCache.get(key) as CacheEntry<T> | undefined;
  if (existing && existing.expiresAtMs > now) return existing.value;

  const value = await loader();
  memoryCache.set(key, { value, expiresAtMs: now + ttlMs });
  return value;
}

