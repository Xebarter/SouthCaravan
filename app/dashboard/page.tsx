import { redirect } from 'next/navigation'
import { getServerSupabaseClient } from '@/lib/supabase/server'

function inferPrimaryPortal(user: any): 'admin' | 'vendor' | 'services' | 'buyer' {
  const meta = user?.app_metadata ?? {}
  const scalar = typeof meta.role === 'string' ? meta.role : ''
  const roles = Array.isArray(meta.roles) ? meta.roles : []
  const merged = [scalar, ...roles].map((r: any) => String(r || '').toLowerCase()).filter(Boolean)

  if (merged.includes('admin')) return 'admin'
  if (merged.includes('vendor')) return 'vendor'
  if (merged.includes('services')) return 'services'
  return 'buyer'
}

export default async function DashboardPage() {
  const supabase = await getServerSupabaseClient()
  const { data } = await supabase.auth.getUser()
  const user = data.user

  if (!user) redirect('/login?next=/dashboard')

  const primary = inferPrimaryPortal(user)
  if (primary === 'admin') redirect('/admin')
  if (primary === 'vendor') redirect('/vendor')
  if (primary === 'services') redirect('/services')
  redirect('/buyer')
}
