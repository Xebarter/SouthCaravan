import { supabaseAdmin } from '@/lib/supabase-admin'

export async function getVendorVerificationStatus(userId: string): Promise<{
  exists: boolean
  isVerified: boolean
}> {
  const id = String(userId || '').trim()
  if (!id) return { exists: false, isVerified: false }

  const { data, error } = await supabaseAdmin
    .from('vendors')
    .select('id,is_verified')
    .eq('id', id)
    .maybeSingle()

  if (error) return { exists: false, isVerified: false }
  if (!data?.id) return { exists: false, isVerified: false }
  return { exists: true, isVerified: Boolean((data as any).is_verified) }
}

