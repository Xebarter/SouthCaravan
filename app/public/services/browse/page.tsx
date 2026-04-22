import { redirect } from 'next/navigation'

type PageProps = {
  searchParams: Promise<{ category?: string; subcategory?: string }>
}

/** Legacy URLs redirect to the unified `/categories` experience (same as products). */
export default async function PublicServicesBrowseRedirect(props: PageProps) {
  const sp = await props.searchParams
  const category = String(sp.category ?? '').trim()
  const subcategory = String(sp.subcategory ?? '').trim()

  const p = new URLSearchParams()
  p.set('type', 'services')
  if (category) p.set('category', category)
  if (subcategory) p.set('subcategory', subcategory)
  redirect(`/categories?${p.toString()}`)
}
