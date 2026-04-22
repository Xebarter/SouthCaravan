/** Max gallery images per service offering (upload + stored URLs). */
export const MAX_SERVICE_OFFERING_IMAGES = 10;

export function normalizeOfferingImageUrls(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== 'string') continue;
    const u = item.trim();
    if (!u || u.length > 2048) continue;
    if (!/^https?:\/\//i.test(u)) continue;
    out.push(u);
    if (out.length >= MAX_SERVICE_OFFERING_IMAGES) break;
  }
  return out;
}
