import { NextResponse } from 'next/server'
import { getServerSupabaseClient } from '@/lib/supabase/server'
import { getVendorVerificationStatus } from '@/lib/vendor-verification-status'

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
  const userId = data.user.id
  const verification = await getVendorVerificationStatus(userId)
  if (!verification.isVerified) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Service provider account pending verification' }, { status: 403 }),
    }
  }
  return { ok: true, userId }
}

