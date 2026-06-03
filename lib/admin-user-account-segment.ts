import type { UserRole } from '@/lib/types';

export type AdminUserAccountSegment =
  | 'admin'
  | 'buyer'
  | 'marketplace_vendor'
  | 'service_provider'
  | 'hybrid';

export const ACCOUNT_SEGMENT_META: Record<
  AdminUserAccountSegment,
  { label: string; shortLabel: string; badgeClass: string; description: string }
> = {
  admin: {
    label: 'Admin',
    shortLabel: 'Admin',
    badgeClass: 'bg-purple-500/10 text-purple-700 border-purple-500/25 dark:text-purple-300',
    description: 'Platform administrator',
  },
  buyer: {
    label: 'Buyer',
    shortLabel: 'Buyer',
    badgeClass: 'bg-sky-500/10 text-sky-700 border-sky-500/25 dark:text-sky-300',
    description: 'Marketplace customer / RFQ buyer',
  },
  marketplace_vendor: {
    label: 'Marketplace vendor',
    shortLabel: 'Vendor',
    badgeClass: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/25 dark:text-emerald-300',
    description: 'Sells products on the marketplace',
  },
  service_provider: {
    label: 'Service provider',
    shortLabel: 'Services',
    badgeClass: 'bg-violet-500/10 text-violet-700 border-violet-500/25 dark:text-violet-300',
    description: 'Offers services on the services portal',
  },
  hybrid: {
    label: 'Vendor & services',
    shortLabel: 'Hybrid',
    badgeClass: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/25 dark:text-indigo-300',
    description: 'Both marketplace vendor and service provider',
  },
};

export function normalizePortalRoles(roles: Iterable<string>): Set<string> {
  const set = new Set<string>();
  for (const r of roles) {
    const key = String(r ?? '').toLowerCase().trim();
    if (key === 'admin' || key === 'buyer' || key === 'vendor' || key === 'services') {
      set.add(key);
    }
  }
  return set;
}

export function classifyAccountSegment(
  rolesInput: Iterable<string>,
  hints?: { hasVendorRecord?: boolean; hasServiceOfferings?: boolean },
): AdminUserAccountSegment {
  const roles = normalizePortalRoles(rolesInput);
  if (hints?.hasVendorRecord) roles.add('vendor');
  if (hints?.hasServiceOfferings) roles.add('services');

  if (roles.has('admin')) return 'admin';

  const hasVendor = roles.has('vendor');
  const hasServices = roles.has('services');

  if (hasVendor && hasServices) return 'hybrid';
  if (hasVendor) return 'marketplace_vendor';
  if (hasServices) return 'service_provider';
  return 'buyer';
}

/** Primary portal role for auth / legacy single-role fields. */
export function primaryRoleFromRoles(rolesInput: Iterable<string>): UserRole {
  const roles = normalizePortalRoles(rolesInput);
  if (roles.has('admin')) return 'admin';
  if (roles.has('vendor')) return 'vendor';
  if (roles.has('services')) return 'services';
  if (roles.has('buyer')) return 'buyer';
  return 'buyer';
}

export function portalRoleBadges(rolesInput: Iterable<string>): { role: string; label: string }[] {
  const roles = normalizePortalRoles(rolesInput);
  const order = ['admin', 'vendor', 'services', 'buyer'] as const;
  const labels: Record<string, string> = {
    admin: 'Admin',
    vendor: 'Vendor',
    services: 'Services',
    buyer: 'Buyer',
  };
  return order.filter((r) => roles.has(r)).map((role) => ({ role, label: labels[role] }));
}
