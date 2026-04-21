export type RfqDraftLine = {
  productId: string;
  name: string;
  quantity: number;
  targetUnitPrice: number | null;
  image?: string;
  unit?: string;
  minimumOrder?: number;
  listPrice?: number;
};

const STORAGE_KEY = 'sc_rfq_draft_v1';

export function loadRfqDraft(): RfqDraftLine[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((row) => row && typeof row.productId === 'string')
      .map((row) => ({
        productId: String(row.productId),
        name: typeof row.name === 'string' ? row.name : 'Product',
        quantity: Number.isFinite(Number(row.quantity)) ? Math.max(1, Math.floor(Number(row.quantity))) : 1,
        targetUnitPrice:
          row.targetUnitPrice === null || row.targetUnitPrice === undefined || row.targetUnitPrice === ''
            ? null
            : Number(row.targetUnitPrice),
        image: typeof row.image === 'string' ? row.image : undefined,
        unit: typeof row.unit === 'string' ? row.unit : undefined,
        minimumOrder: Number.isFinite(Number(row.minimumOrder)) ? Number(row.minimumOrder) : undefined,
        listPrice: Number.isFinite(Number(row.listPrice)) ? Number(row.listPrice) : undefined,
      }));
  } catch {
    return [];
  }
}

export function saveRfqDraft(lines: RfqDraftLine[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    /* ignore quota */
  }
}

export function clearRfqDraft() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function upsertDraftLine(line: RfqDraftLine): RfqDraftLine[] {
  const prev = loadRfqDraft();
  const idx = prev.findIndex((p) => p.productId === line.productId);
  const min = line.minimumOrder && line.minimumOrder > 1 ? line.minimumOrder : 1;
  const qty = Math.max(min, line.quantity);
  if (idx >= 0) {
    const merged = [...prev];
    merged[idx] = {
      ...merged[idx],
      quantity: merged[idx]!.quantity + qty,
      targetUnitPrice: line.targetUnitPrice ?? merged[idx]!.targetUnitPrice,
    };
    saveRfqDraft(merged);
    return merged;
  }
  const next = [...prev, { ...line, quantity: qty }];
  saveRfqDraft(next);
  return next;
}

/** Replace quantity for this SKU (used when buyer arrives from a product page). */
export function setDraftLine(line: RfqDraftLine): RfqDraftLine[] {
  const prev = loadRfqDraft().filter((p) => p.productId !== line.productId);
  const min = line.minimumOrder && line.minimumOrder > 1 ? line.minimumOrder : 1;
  const next = [...prev, { ...line, quantity: Math.max(min, line.quantity) }];
  saveRfqDraft(next);
  return next;
}
