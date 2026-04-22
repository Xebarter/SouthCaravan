import { supabaseAdmin } from '@/lib/supabase-admin';
import { isUuid } from '@/lib/is-uuid';

type ProductLike = { vendor_id?: string | null };

function normalizeVendorId(vendorId: unknown) {
  const v = typeof vendorId === 'string' ? vendorId.trim() : '';
  return v;
}

/**
 * Filters out products whose vendor is not verified.
 *
 * Rules:
 * - Platform/admin products (empty/non-UUID vendor_id) are allowed.
 * - Vendor products (UUID vendor_id) are allowed only if `vendors.is_verified` is true.
 */
export async function filterProductsByVerifiedVendor<T extends ProductLike>(products: T[]): Promise<T[]> {
  const vendorIds = Array.from(
    new Set(
      (products ?? [])
        .map((p) => normalizeVendorId(p?.vendor_id))
        .filter((id) => id && isUuid(id)),
    ),
  );

  if (vendorIds.length === 0) return products ?? [];

  const { data, error } = await supabaseAdmin
    .from('vendors')
    .select('id,is_verified')
    .in('id', vendorIds);

  if (error) {
    // Fail closed: if we can't verify vendors, don't list vendor-owned items.
    const allowedPlatform = (products ?? []).filter((p) => {
      const id = normalizeVendorId(p?.vendor_id);
      return !id || !isUuid(id);
    });
    return allowedPlatform;
  }

  const verified = new Set(
    (data ?? [])
      .filter((v: any) => v?.is_verified === true && typeof v?.id === 'string')
      .map((v: any) => String(v.id)),
  );

  return (products ?? []).filter((p) => {
    const id = normalizeVendorId(p?.vendor_id);
    if (!id) return true; // platform/admin
    if (!isUuid(id)) return true; // platform/admin
    return verified.has(id);
  });
}

