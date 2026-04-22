import { NextResponse } from 'next/server'
import { getServerSupabaseClient } from '@/lib/supabase/server'

export function hasServicesAccess(user: any) {
  const meta = user?.app_metadata ?? {}
  if (meta.role === 'services') return true
  const roles = Array.isArray(meta.roles) ? meta.roles : []
  return roles.includes('services')
}

export async function getAuthedServicesUserId(): Promise<
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse }
> {
  const supabase = await getServerSupabaseClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  if (!hasServicesAccess(data.user)) {
    return { ok: false, response: NextResponse.json({ error: 'Services role required' }, { status: 403 }) }
  }
  return { ok: true, userId: data.user.id }
}

