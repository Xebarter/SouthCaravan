import { supabaseAdmin } from '@/lib/supabase-admin'

export type VendorPortal = 'vendor' | 'services'

type VerificationRow = {
  id: string
  is_verified: boolean | null
  services_verified: boolean | null
}

export async function getPortalVerificationStatus(
  userId: string,
  portal: VendorPortal,
): Promise<{ exists: boolean; isVerified: boolean }> {
  const id = String(userId || '').trim()
  if (!id) return { exists: false, isVerified: false }

  const { data, error } = await supabaseAdmin
    .from('vendors')
    .select('id,is_verified,services_verified')
    .eq('id', id)
    .maybeSingle()

  if (error || !data?.id) return { exists: false, isVerified: false }

  const row = data as VerificationRow
  const isVerified =
    portal === 'services' ? Boolean(row.services_verified) : Boolean(row.is_verified)

  return { exists: true, isVerified }
}

/** Marketplace / vendor dashboard verification. */
export async function getVendorVerificationStatus(userId: string): Promise<{
  exists: boolean
  isVerified: boolean
}> {
  return getPortalVerificationStatus(userId, 'vendor')
}

/** Services dashboard verification. */
export async function getServicesVerificationStatus(userId: string): Promise<{
  exists: boolean
  isVerified: boolean
}> {
  return getPortalVerificationStatus(userId, 'services')
}

export async function getFullVerificationStatus(userId: string): Promise<{
  exists: boolean
  marketplaceVerified: boolean
  servicesVerified: boolean
}> {
  const id = String(userId || '').trim()
  if (!id) {
    return { exists: false, marketplaceVerified: false, servicesVerified: false }
  }

  const { data, error } = await supabaseAdmin
    .from('vendors')
    .select('id,is_verified,services_verified')
    .eq('id', id)
    .maybeSingle()

  if (error || !data?.id) {
    return { exists: false, marketplaceVerified: false, servicesVerified: false }
  }

  const row = data as VerificationRow
  return {
    exists: true,
    marketplaceVerified: Boolean(row.is_verified),
    servicesVerified: Boolean(row.services_verified),
  }
}
