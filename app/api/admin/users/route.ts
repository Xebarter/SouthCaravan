import { NextResponse } from 'next/server';
import { getAuthedAdmin } from '@/lib/api/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import type { UserRole } from '@/lib/types';

type AdminUserRow = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  company: string | null;
  created_at: string | null;
  last_sign_in_at: string | null;
  stats?: { transactions: number; volume: number };
};

function coerceRole(input: unknown): UserRole {
  const s = String(input ?? '').toLowerCase();
  if (s === 'admin' || s === 'vendor' || s === 'buyer') return s;
  return 'buyer';
}

function nameFromUser(u: any) {
  const meta = u?.user_metadata ?? {};
  const email = typeof u?.email === 'string' ? u.email : '';
  return (
    (typeof meta.name === 'string' && meta.name) ||
    (typeof meta.full_name === 'string' && meta.full_name) ||
    (email ? email.split('@')[0] : 'User')
  );
}

function roleFromUser(u: any, rolesFromDb: string[]) {
  const appMeta = u?.app_metadata ?? {};
  const direct = appMeta?.role;
  if (direct) return coerceRole(direct);
  const arr = Array.isArray(appMeta?.roles) ? appMeta.roles : [];
  if (arr.length > 0) return coerceRole(arr[0]);
  if (rolesFromDb.includes('admin')) return 'admin';
  if (rolesFromDb.includes('vendor')) return 'vendor';
  if (rolesFromDb.includes('buyer')) return 'buyer';
  return 'buyer';
}

export async function GET(req: Request) {
  const authed = await getAuthedAdmin();
  if (!authed.ok) return authed.response;

  const { searchParams } = new URL(req.url);
  const page = Math.max(0, Number(searchParams.get('page') ?? 0) || 0);
  const pageSize = Math.min(200, Math.max(1, Number(searchParams.get('pageSize') ?? 50) || 50));
  const includeStats = (searchParams.get('includeStats') ?? '').toLowerCase() === 'true';

  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: page + 1, perPage: pageSize });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const users = Array.isArray(data?.users) ? data.users : [];
  const userIds = users.map((u: any) => String(u.id)).filter(Boolean);

  const { data: rolesRows } = await supabaseAdmin
    .from('user_roles')
    .select('user_id, role')
    .in('user_id', userIds);

  const rolesByUser = new Map<string, string[]>();
  for (const row of Array.isArray(rolesRows) ? rolesRows : []) {
    const uid = String((row as any).user_id ?? '');
    const role = String((row as any).role ?? '').toLowerCase();
    if (!uid || !role) continue;
    const list = rolesByUser.get(uid) ?? [];
    list.push(role);
    rolesByUser.set(uid, list);
  }

  let statsByUser: Record<string, { transactions: number; volume: number }> = {};
  if (includeStats && userIds.length > 0) {
    const { data: orders } = await supabaseAdmin
      .from('orders')
      .select('buyer_id, vendor_user_id, total_amount')
      .or(`buyer_id.in.(${userIds.join(',')}),vendor_user_id.in.(${userIds.join(',')})`);

    const agg: Record<string, { transactions: number; volume: number }> = {};
    for (const o of Array.isArray(orders) ? orders : []) {
      const buyerId = String((o as any).buyer_id ?? '');
      const vendorUserId = String((o as any).vendor_user_id ?? '');
      const amt = Number((o as any).total_amount ?? 0) || 0;
      for (const id of [buyerId, vendorUserId]) {
        if (!id) continue;
        agg[id] = agg[id] ?? { transactions: 0, volume: 0 };
        agg[id].transactions += 1;
        agg[id].volume += amt;
      }
    }
    statsByUser = agg;
  }

  const rows: AdminUserRow[] = users.map((u: any) => {
    const id = String(u.id);
    const roles = rolesByUser.get(id) ?? [];
    const meta = u.user_metadata ?? {};
    const company = typeof meta.company === 'string' ? meta.company : null;
    const createdAt = typeof u.created_at === 'string' ? u.created_at : null;
    const lastSignIn = typeof u.last_sign_in_at === 'string' ? u.last_sign_in_at : null;
    const row: AdminUserRow = {
      id,
      email: typeof u.email === 'string' ? u.email : '',
      name: nameFromUser(u),
      role: roleFromUser(u, roles),
      company,
      created_at: createdAt,
      last_sign_in_at: lastSignIn,
    };
    if (includeStats) row.stats = statsByUser[id] ?? { transactions: 0, volume: 0 };
    return row;
  });

  return NextResponse.json({
    users: rows,
    page,
    pageSize,
    total: typeof data?.total === 'number' ? data.total : null,
  });
}

export async function POST(req: Request) {
  const authed = await getAuthedAdmin();
  if (!authed.ok) return authed.response;

  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? '').trim().toLowerCase();
  const password = String(body?.password ?? '').trim();
  const name = String(body?.name ?? '').trim();
  const company = String(body?.company ?? '').trim();
  const role = coerceRole(body?.role);

  if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  if (!password || password.length < 8) {
    return NextResponse.json({ error: 'Password is required (min 8 chars)' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      ...(name ? { name } : {}),
      ...(company ? { company } : {}),
      role,
    },
    app_metadata: {
      role,
    },
  });

  if (error || !data?.user?.id) {
    return NextResponse.json({ error: error?.message ?? 'Could not create user' }, { status: 500 });
  }

  const userId = data.user.id;
  if (role === 'buyer' || role === 'vendor' || role === 'admin') {
    await supabaseAdmin.from('user_roles').upsert({ user_id: userId, role }, { onConflict: 'user_id,role' });
  }

  return NextResponse.json({ ok: true, id: userId });
}

