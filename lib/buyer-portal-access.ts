import type { User, UserRole } from '@/lib/types';

const PORTAL_ROLES: UserRole[] = ['admin', 'vendor', 'services', 'buyer'];

/** Any signed-in account may use the buyer workspace (shop, RFQs, orders). */
export function canAccessBuyerWorkspace(user: User | null | undefined): boolean {
  return Boolean(user?.id);
}

export function collectPortalRolesFromAuthUser(supabaseUser: {
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
} | null | undefined): UserRole[] {
  if (!supabaseUser) return [];

  const appMeta = supabaseUser.app_metadata ?? {};
  const userMeta = supabaseUser.user_metadata ?? {};
  const merged = new Set<string>();

  if (typeof appMeta.role === 'string') merged.add(appMeta.role.toLowerCase());
  if (typeof userMeta.role === 'string') merged.add(userMeta.role.toLowerCase());
  const appRoles = Array.isArray(appMeta.roles) ? appMeta.roles : [];
  for (const r of appRoles) merged.add(String(r).toLowerCase());

  return PORTAL_ROLES.filter((r) => merged.has(r));
}

export function primaryPortalRole(roles: Iterable<UserRole>): UserRole {
  const set = new Set(roles);
  if (set.has('admin')) return 'admin';
  if (set.has('vendor')) return 'vendor';
  if (set.has('services')) return 'services';
  if (set.has('buyer')) return 'buyer';
  return 'buyer';
}

export function hasPortalRole(user: User | null | undefined, portal: UserRole): boolean {
  if (!user) return false;
  if (portal === 'buyer') return canAccessBuyerWorkspace(user);
  return (user.roles ?? [user.role]).includes(portal);
}
