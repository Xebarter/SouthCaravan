import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

function hasAdminAccess(user: { app_metadata?: any } | null | undefined) {
  const meta = user?.app_metadata ?? {};
  if (meta.role === 'admin') return true;
  const roles = Array.isArray(meta.roles) ? meta.roles : [];
  return roles.includes('admin');
}

async function requireAdmin() {
  const supabase = await getServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { ok: false as const, status: 401, message: 'Unauthorized' };
  }

  const { data: adminUser, error: adminUserError } = await supabaseAdmin.auth.admin.getUserById(data.user.id);
  if (adminUserError) {
    return { ok: false as const, status: 500, message: adminUserError.message };
  }
  if (hasAdminAccess(adminUser.user)) {
    return { ok: true as const, userId: data.user.id };
  }

  // Back-compat: allow admin via user_roles row if project uses that path.
  const { data: roleRow, error: roleError } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', data.user.id)
    .eq('role', 'admin')
    .maybeSingle();

  if (roleError) return { ok: false as const, status: 500, message: roleError.message };
  if (!roleRow) return { ok: false as const, status: 403, message: 'Forbidden' };

  return { ok: true as const, userId: data.user.id };
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const status = (searchParams.get('status') ?? 'all').toLowerCase();
  const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? 50), 1), 200);

  let query = supabaseAdmin
    .from('vendors')
    .select('id, name, email, company_name, is_verified, verified_at, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status === 'pending') query = query.eq('is_verified', false);
  if (status === 'verified') query = query.eq('is_verified', true);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ vendors: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const patch: Record<string, unknown> = {};
  if (typeof body.companyName === 'string') patch.company_name = body.companyName.trim();
  if (typeof body.name === 'string') patch.name = body.name.trim();
  if (typeof body.email === 'string') patch.email = body.email.trim();

  if (typeof body.isVerified === 'boolean') {
    patch.is_verified = body.isVerified;
    patch.verified_at = body.isVerified ? new Date().toISOString() : null;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No valid fields to patch' }, { status: 422 });
  }

  const { data, error } = await supabaseAdmin
    .from('vendors')
    .update(patch)
    .eq('id', String(body.id))
    .select('id, name, email, company_name, is_verified, verified_at, created_at, updated_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ vendor: data });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id query param is required' }, { status: 400 });

  const { error } = await supabaseAdmin.from('vendors').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

