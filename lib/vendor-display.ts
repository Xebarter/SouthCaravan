/** Human-readable supplier label for marketplace product rows (matches product detail page). */
export function getVendorDisplayName(vendorId: string | null): string {
  if (!vendorId) return 'SouthCaravan Verified Supplier';
  return `Supplier ${vendorId.slice(0, 8).toUpperCase()}`;
}
