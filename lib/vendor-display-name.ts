import type { User } from '@/lib/types';

export const VENDOR_COMPANY_NAME_UPDATED_EVENT = 'vendor-company-name-updated';

export function resolveVendorSidebarDisplayName(
  profileCompanyName: string | null | undefined,
  user: User | null | undefined,
): string {
  const fromProfile = profileCompanyName?.trim();
  if (fromProfile) return fromProfile;
  return user?.name?.trim() || user?.company?.trim() || 'Vendor';
}

export function notifyVendorCompanyNameUpdated(companyName: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(VENDOR_COMPANY_NAME_UPDATED_EVENT, {
      detail: { companyName },
    }),
  );
}
