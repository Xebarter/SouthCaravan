import { getServerSupabaseClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

function hasAdminAccess(user: { app_metadata?: Record<string, unknown> } | null | undefined) {
  const meta = user?.app_metadata ?? {}
  if (meta.role === 'admin') return true
  const roles = Array.isArray(meta.roles) ? meta.roles : []
  return roles.includes('admin')
}

export async function requireAdmin() {
  const supabase = await getServerSupabaseClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) {
    return { ok: false as const, status: 401, message: 'Unauthorized' }
  }

  const { data: adminUser, error: adminUserError } = await supabaseAdmin.auth.admin.getUserById(data.user.id)
  if (adminUserError) {
    return { ok: false as const, status: 500, message: adminUserError.message }
  }
  if (hasAdminAccess(adminUser.user)) {
    return { ok: true as const, userId: data.user.id }
  }

  const { data: roleRow, error: roleError } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', data.user.id)
    .eq('role', 'admin')
    .maybeSingle()

  if (roleError) return { ok: false as const, status: 500, message: roleError.message }
  if (!roleRow) return { ok: false as const, status: 403, message: 'Forbidden' }

  return { ok: true as const, userId: data.user.id }
}
