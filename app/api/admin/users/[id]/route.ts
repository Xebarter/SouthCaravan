import { NextResponse } from 'next/server';
import { getAuthedAdmin } from '@/lib/api/admin-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import type { UserRole } from '@/lib/types';

function coerceRole(input: unknown): UserRole | null {
  const s = String(input ?? '').toLowerCase();
  if (s === 'admin' || s === 'vendor' || s === 'buyer') return s;
  return null;
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const authed = await getAuthedAdmin();
  if (!authed.ok) return authed.response;

  const { id } = await ctx.params;
  const userId = String(id ?? '').trim();
  if (!userId) return NextResponse.json({ error: 'Missing user id' }, { status: 400 });

  const body = await req.json().catch(() => null);
  const role = coerceRole(body?.role);
  const name = typeof body?.name === 'string' ? body.name.trim() : undefined;
  const company = typeof body?.company === 'string' ? body.company.trim() : undefined;

  // Load current user so we can merge metadata safely.
  const { data: current, error: getErr } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (getErr || !current?.user) {
    return NextResponse.json({ error: getErr?.message ?? 'User not found' }, { status: 404 });
  }

  const nextUserMeta = { ...(current.user.user_metadata ?? {}) } as Record<string, unknown>;
  if (name !== undefined) nextUserMeta.name = name;
  if (company !== undefined) nextUserMeta.company = company;
  if (role) nextUserMeta.role = role;

  const nextAppMeta = { ...(current.user.app_metadata ?? {}) } as Record<string, unknown>;
  if (role) nextAppMeta.role = role;

  const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    user_metadata: nextUserMeta,
    app_metadata: nextAppMeta,
  });
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  if (role) {
    // Keep the user_roles table consistent with the selected role.
    // We ensure the target role exists, and remove other portal roles.
    await supabaseAdmin.from('user_roles').delete().eq('user_id', userId).in('role', ['buyer', 'vendor', 'admin']);
    await supabaseAdmin.from('user_roles').upsert({ user_id: userId, role }, { onConflict: 'user_id,role' });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const authed = await getAuthedAdmin();
  if (!authed.ok) return authed.response;

  const { id } = await ctx.params;
  const userId = String(id ?? '').trim();
  if (!userId) return NextResponse.json({ error: 'Missing user id' }, { status: 400 });

  // Clean up portal role mappings (auth.users deletion does not cascade into public tables).
  await supabaseAdmin.from('user_roles').delete().eq('user_id', userId);
  await supabaseAdmin.from('vendor_profiles').delete().eq('user_id', userId);
  await supabaseAdmin.from('vendor_notification_prefs').delete().eq('user_id', userId);
  await supabaseAdmin.from('customer_profiles').delete().eq('user_id', userId);
  await supabaseAdmin.from('customer_notification_prefs').delete().eq('user_id', userId);

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

