export const SHOWCASE_KINDS = [
  { value: 'premises', label: 'Premises', hint: 'Factory exterior, reception, production floor' },
  { value: 'machinery', label: 'Machinery', hint: 'Key equipment, production lines, tooling' },
  { value: 'storage', label: 'Storage', hint: 'Warehouses, inventory areas, cold storage' },
  { value: 'team', label: 'Team', hint: 'Staff at work, leadership, training sessions' },
  { value: 'qa', label: 'Quality control', hint: 'Inspection stations, testing, certificates' },
  { value: 'packaging', label: 'Packaging', hint: 'Packing lines, labeling, palletization' },
  { value: 'logistics', label: 'Logistics', hint: 'Loading bays, fleet, export preparation' },
  { value: 'other', label: 'Other', hint: 'Anything else buyers should see' },
] as const;

export type ShowcaseKind = (typeof SHOWCASE_KINDS)[number]['value'];

export type ShowcaseImage = {
  id: string;
  url: string;
  kind: string;
  caption: string;
  sort_order: number;
};

export const SHOWCASE_MAX_IMAGES = 24;
export const SHOWCASE_RECOMMENDED_MIN = 3;
export const SHOWCASE_RECOMMENDED_MAX = 6;
export const SHOWCASE_CAPTION_MAX = 140;
export const SHOWCASE_MAX_BYTES = 6 * 1024 * 1024;

export const SHOWCASE_ACCEPT = 'image/png,image/jpeg,image/webp,image/gif';

export function getShowcaseKindLabel(kind: string) {
  return SHOWCASE_KINDS.find((k) => k.value === kind)?.label ?? 'Other';
}

export function getShowcaseKindHint(kind: string) {
  return SHOWCASE_KINDS.find((k) => k.value === kind)?.hint ?? '';
}

export function normalizeShowcaseKind(kind: string): ShowcaseKind {
  const raw = (kind ?? '').trim().toLowerCase();
  return (SHOWCASE_KINDS.some((k) => k.value === raw) ? raw : 'other') as ShowcaseKind;
}
