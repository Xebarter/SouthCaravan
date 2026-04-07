/**
 * Vendor console lives under `/vendor` with fixed segments. Public storefront
 * pages use `/vendor/:vendorProfileId` where the second segment is not a
 * reserved console path (e.g. `/vendor/vendor-1`).
 */
const VENDOR_CONSOLE_ROOT_SEGMENTS = new Set([
  'products',
  'orders',
  'messages',
  'analytics',
  'settings',
]);

export function isVendorConsolePath(pathname: string): boolean {
  if (pathname === '/vendor') return true;
  if (!pathname.startsWith('/vendor/')) return false;
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length < 2 || parts[0] !== 'vendor') return false;
  return VENDOR_CONSOLE_ROOT_SEGMENTS.has(parts[1]);
}
