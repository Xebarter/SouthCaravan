export type VendorAccountType = 'marketplace_vendor' | 'service_provider' | 'hybrid'

export type AdminVendorListRow = {
  id: string
  name: string
  email: string
  company_name: string
  is_verified: boolean
  verified_at: string | null
  services_verified: boolean
  services_verified_at: string | null
  created_at: string
  profile: {
    company_name?: string
    description?: string
    public_email?: string
    phone?: string
  } | null
  product_count: number
  order_count: number
  revenue: number
  offerings_count?: number
  roles?: string[]
  account_type: VendorAccountType
}

export function vendorDisplayName(v: AdminVendorListRow) {
  return v.company_name || v.profile?.company_name || v.name || 'Account'
}

/** Marketplace vendor directory (vendor role, products, or hybrid). */
export function isMarketplaceListMember(v: AdminVendorListRow) {
  return (
    v.roles?.includes('vendor') ||
    v.product_count > 0 ||
    v.account_type === 'marketplace_vendor' ||
    v.account_type === 'hybrid'
  )
}

/** Services provider directory (services role, offerings, or hybrid). */
export function isServiceProviderListMember(v: AdminVendorListRow) {
  return (
    v.roles?.includes('services') ||
    (v.offerings_count ?? 0) > 0 ||
    v.account_type === 'service_provider' ||
    v.account_type === 'hybrid'
  )
}

export function filterByListSegment(rows: AdminVendorListRow[], segment: 'marketplace' | 'services') {
  return rows.filter(segment === 'marketplace' ? isMarketplaceListMember : isServiceProviderListMember)
}

export function filterByVerification(
  rows: AdminVendorListRow[],
  segment: 'marketplace' | 'services',
  status: 'all' | 'pending' | 'verified',
) {
  if (status === 'all') return rows
  if (segment === 'marketplace') {
    return rows.filter((v) => (status === 'verified' ? v.is_verified : !v.is_verified))
  }
  return rows.filter((v) =>
    status === 'verified' ? Boolean(v.services_verified) : !v.services_verified,
  )
}
