import { supabaseAdmin } from '@/lib/supabase-admin';
import { isUuid } from '@/lib/is-uuid';

let cachedAt = 0;
let cachedPrimary: string | null | undefined = undefined;
const CACHE_MS = 5 * 60 * 1000;

function isAdminAuthUser(user: { app_metadata?: Record<string, unknown> }): boolean {
  const app = user.app_metadata ?? {};
  if (app.role === 'admin') return true;
  const roles = Array.isArray(app.roles) ? app.roles : [];
  return roles.includes('admin');
}

/**
 * All auth users that look like admins (JWT app_metadata).
 * Used only when PLATFORM_RFQ_RECIPIENT_USER_ID is not set.
 */
async function discoverAdminUserIds(): Promise<string[]> {
  const ids: string[] = [];
  let page = 1;
  const perPage = 200;

  for (;;) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data?.users ?? [];
    for (const u of users) {
      if (u?.id && isAdminAuthUser(u as any)) ids.push(u.id);
    }
    if (users.length < perPage) break;
    page += 1;
    if (page > 40) break;
  }

  return [...new Set(ids)].sort();
}

/**
 * The auth user id that receives RFQs for platform (admin-created) products.
 * Set PLATFORM_RFQ_RECIPIENT_USER_ID in the server environment for a stable inbox;
 * otherwise the first discovered admin (sorted UUID) is used.
 */
export async function getPlatformRfqRecipientUserId(): Promise<
  { ok: true; userId: string } | { ok: false; error: string }
> {
  const envId = process.env.PLATFORM_RFQ_RECIPIENT_USER_ID?.trim();
  if (envId && isUuid(envId)) return { ok: true, userId: envId };

  const now = Date.now();
  if (cachedPrimary !== undefined && now - cachedAt < CACHE_MS) {
    if (cachedPrimary === null) {
      return {
        ok: false,
        error:
          'Platform RFQs are not configured: set PLATFORM_RFQ_RECIPIENT_USER_ID to an admin user UUID, or ensure an admin account exists.',
      };
    }
    return { ok: true, userId: cachedPrimary };
  }

  try {
    const ids = await discoverAdminUserIds();
    cachedAt = now;
    if (ids.length === 0) {
      cachedPrimary = null;
      return {
        ok: false,
        error:
          'No admin user found for platform RFQs. Set PLATFORM_RFQ_RECIPIENT_USER_ID to an admin auth user UUID.',
      };
    }
    cachedPrimary = ids[0]!;
    return { ok: true, userId: cachedPrimary };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Could not resolve platform RFQ recipient' };
  }
}

/** True if this catalog row can be included in an RFQ (vendor-owned UUID or platform / admin listing). */
export function productIsRfqRoutable(product: { vendor_id?: string | null }): boolean {
  const v = product.vendor_id == null ? '' : String(product.vendor_id).trim();
  if (v === '') return true;
  return isUuid(v);
}
