import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-require'
import { clearAllCached } from '@/lib/memory-cache'
import { MAX_PRODUCT_IMAGE_BYTES, productImageMaxSizeLabel } from '@/lib/product-image-limits'
import {
  MAX_SERVICE_OFFERING_IMAGES,
  normalizeOfferingImageUrls,
} from '@/lib/service-offering-images'
import { validateServiceTaxonomy } from '@/lib/services-taxonomy'
import { supabaseAdmin } from '@/lib/supabase-admin'

const BUCKET = 'product-images'
const OFFERING_SELECT =
  'id,provider_user_id,category,subcategory,title,description,pricing_type,rate,currency,is_active,is_featured,featured_sort_order,is_ad,ad_sort_order,images,created_at,updated_at'

function isMissingTableError(error: unknown) {
  const msg = String((error as { message?: string })?.message ?? '').toLowerCase()
  return msg.includes('does not exist') && msg.includes('service_offerings')
}

async function ensureBucket() {
  const { error } = await supabaseAdmin.storage.createBucket(BUCKET, { public: true })
  if (error && !error.message.includes('already exists')) {
    console.error('[admin/services/offerings ensureBucket]', error.message)
  }
}

type UploadImageResult = { ok: true; url: string } | { ok: false; error: string }

async function uploadImage(file: File, offeringId?: string): Promise<UploadImageResult> {
  if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
    return {
      ok: false,
      error: `Image "${file.name}" is too large (max ${productImageMaxSizeLabel()} per file).`,
    }
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const prefix = offeringId ? `service-offerings/${offeringId}` : 'service-offerings/admin'
  const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const buffer = await file.arrayBuffer()

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type || 'image/jpeg', upsert: false })

  if (error) {
    console.error('[admin/services/offerings uploadImage]', error.message)
    return { ok: false, error: `Could not upload "${file.name}": ${error.message}` }
  }

  const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(data.path)
  return { ok: true, url: urlData.publicUrl }
}

function parseBoolean(value: FormDataEntryValue | string | null, fallback = false) {
  if (value === null) return fallback
  const normalized = String(value).toLowerCase()
  if (['true', '1', 'yes', 'on'].includes(normalized)) return true
  if (['false', '0', 'no', 'off'].includes(normalized)) return false
  return fallback
}

function storageObjectPathFromPublicUrl(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) return null

  try {
    const parsed = new URL(trimmed)
    const prefix = `/storage/v1/object/public/${BUCKET}/`
    const i = parsed.pathname.indexOf(prefix)
    if (i >= 0) {
      const path = decodeURIComponent(parsed.pathname.slice(i + prefix.length))
      return path || null
    }
  } catch {
    /* fall through */
  }

  const marker = `/object/public/${BUCKET}/`
  const index = trimmed.indexOf(marker)
  if (index < 0) return null
  const rest = trimmed.slice(index + marker.length).split(/[?#]/)[0]
  const path = decodeURIComponent(rest)
  return path || null
}

async function deleteStorageObjectsFromUrls(urls: string[]): Promise<{ error: string | null }> {
  const paths = urls.map(storageObjectPathFromPublicUrl).filter((path): path is string => Boolean(path))
  if (paths.length === 0) return { error: null }

  const { error } = await supabaseAdmin.storage.from(BUCKET).remove(paths)
  if (error) {
    console.error('[admin/services/offerings deleteStorage]', error.message, paths)
    return { error: error.message }
  }
  return { error: null }
}

function revalidateServicePaths(id?: string) {
  clearAllCached()
  revalidatePath('/')
  revalidatePath('/categories')
  revalidatePath('/categories?type=services')
  if (id) revalidatePath(`/public/services/${id}`)
}

async function enrichWithProviders<T extends { provider_user_id: string }>(rows: T[]) {
  const ids = [...new Set(rows.map((r) => String(r.provider_user_id)))]
  if (ids.length === 0) return rows.map((r) => ({ ...r, provider: null }))

  const { data: vendors } = await supabaseAdmin
    .from('vendors')
    .select('id,email,name,company_name')
    .in('id', ids)

  const vendorMap = new Map(
    (vendors ?? []).map((v) => [
      String(v.id),
      {
        id: String(v.id),
        email: v.email ?? '',
        name: v.name ?? '',
        company_name: v.company_name ?? '',
      },
    ]),
  )

  return rows.map((r) => ({
    ...r,
    provider: vendorMap.get(String(r.provider_user_id)) ?? null,
  }))
}

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })

  const { data, error } = await supabaseAdmin
    .from('service_offerings')
    .select(OFFERING_SELECT)
    .order('created_at', { ascending: false })

  if (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json({ offerings: [], needsSetup: true })
    }
    console.error('[admin/services/offerings GET]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const offerings = await enrichWithProviders(data ?? [])
  return NextResponse.json({ offerings })
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 })
  }

  const providerUserId = (formData.get('providerUserId') as string | null)?.trim() ?? ''
  const category = (formData.get('category') as string | null)?.trim() ?? ''
  const subcategory = (formData.get('subcategory') as string | null)?.trim() ?? ''
  const title = (formData.get('title') as string | null)?.trim() ?? ''
  const description = (formData.get('description') as string | null) ?? ''
  const pricingType = (formData.get('pricingType') as string | null)?.trim() || 'fixed'
  const rate = parseFloat((formData.get('rate') as string | null) ?? '0')
  const currency = (formData.get('currency') as string | null)?.trim() || 'USD'
  const isActive = parseBoolean(formData.get('isActive'), true)
  const isFeatured = parseBoolean(formData.get('isFeatured'), false)
  const isAd = parseBoolean(formData.get('isAd'), false)
  const featuredSortOrder = parseInt((formData.get('featuredSortOrder') as string | null) ?? '0', 10)
  const adSortOrder = parseInt((formData.get('adSortOrder') as string | null) ?? '0', 10)

  if (!providerUserId) {
    return NextResponse.json({ error: 'providerUserId is required' }, { status: 422 })
  }
  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 422 })

  const taxonomyError = validateServiceTaxonomy(category, subcategory)
  if (taxonomyError) return NextResponse.json({ error: taxonomyError }, { status: 422 })

  if (!['fixed', 'hourly'].includes(pricingType)) {
    return NextResponse.json({ error: 'pricingType must be fixed or hourly' }, { status: 422 })
  }

  const { data: providerRow } = await supabaseAdmin
    .from('user_roles')
    .select('user_id')
    .eq('user_id', providerUserId)
    .eq('role', 'services')
    .maybeSingle()

  if (!providerRow) {
    return NextResponse.json({ error: 'Invalid service provider' }, { status: 422 })
  }

  await ensureBucket()
  const imageFiles = formData.getAll('images') as File[]
  const imageUrls: string[] = []

  for (const file of imageFiles) {
    if (file.size === 0) continue
    if (imageUrls.length >= MAX_SERVICE_OFFERING_IMAGES) break
    const result = await uploadImage(file)
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 422 })
    imageUrls.push(result.url)
  }

  const { data: offering, error } = await supabaseAdmin
    .from('service_offerings')
    .insert({
      provider_user_id: providerUserId,
      category,
      subcategory,
      title,
      description,
      pricing_type: pricingType,
      rate: Number.isFinite(rate) ? rate : 0,
      currency,
      is_active: isActive,
      is_featured: isFeatured,
      featured_sort_order: Number.isFinite(featuredSortOrder) ? featuredSortOrder : 0,
      is_ad: isAd,
      ad_sort_order: Number.isFinite(adSortOrder) ? adSortOrder : 0,
      images: imageUrls,
    })
    .select(OFFERING_SELECT)
    .single()

  if (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json(
        { error: 'Services tables are not set up yet. Run supabase/services.sql.' },
        { status: 503 },
      )
    }
    console.error('[admin/services/offerings POST]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  revalidateServicePaths(offering.id)
  const [enriched] = await enrichWithProviders([offering])
  return NextResponse.json({ offering: enriched }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })

  const contentType = req.headers.get('content-type') ?? ''

  if (!contentType.includes('multipart/form-data')) {
    const body = await req.json().catch(() => null)
    if (!body?.id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const patchData: Record<string, unknown> = {}
    if (typeof body.isActive === 'boolean') patchData.is_active = body.isActive
    if (typeof body.isFeatured === 'boolean') patchData.is_featured = body.isFeatured
    if (typeof body.isAd === 'boolean') patchData.is_ad = body.isAd
    if (typeof body.featuredSortOrder === 'number') patchData.featured_sort_order = body.featuredSortOrder
    if (typeof body.adSortOrder === 'number') patchData.ad_sort_order = body.adSortOrder
    if (typeof body.category === 'string') patchData.category = body.category.trim()
    if (typeof body.subcategory === 'string') patchData.subcategory = body.subcategory.trim()
    if (typeof body.title === 'string') patchData.title = body.title.trim()
    if (typeof body.description === 'string') patchData.description = body.description
    if (typeof body.pricingType === 'string') patchData.pricing_type = body.pricingType
    if (typeof body.rate === 'number') patchData.rate = body.rate
    if (typeof body.currency === 'string') patchData.currency = body.currency.trim()
    if (typeof body.providerUserId === 'string') patchData.provider_user_id = body.providerUserId.trim()

    if (typeof patchData.category === 'string' && typeof patchData.subcategory === 'string') {
      const taxonomyError = validateServiceTaxonomy(
        patchData.category as string,
        patchData.subcategory as string,
      )
      if (taxonomyError) return NextResponse.json({ error: taxonomyError }, { status: 422 })
    }

    const { data: offering, error } = await supabaseAdmin
      .from('service_offerings')
      .update(patchData)
      .eq('id', body.id)
      .select(OFFERING_SELECT)
      .single()

    if (error) {
      if (isMissingTableError(error)) {
        return NextResponse.json({ error: 'Services tables are not set up.' }, { status: 503 })
      }
      console.error('[admin/services/offerings PATCH JSON]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    revalidateServicePaths(offering.id)
    const [enriched] = await enrichWithProviders([offering])
    return NextResponse.json({ offering: enriched })
  }

  const formData = await req.formData()
  const id = (formData.get('id') as string | null)?.trim()
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const existingImagesRaw = (formData.get('existingImages') as string | null) ?? '[]'
  let existingImages: string[] = []
  try {
    existingImages = JSON.parse(existingImagesRaw)
  } catch {
    return NextResponse.json({ error: 'existingImages must be valid JSON array' }, { status: 422 })
  }

  await ensureBucket()
  const imageFiles = formData.getAll('images') as File[]
  const uploadedUrls: string[] = []
  for (const file of imageFiles) {
    if (file.size === 0) continue
    if (existingImages.length + uploadedUrls.length >= MAX_SERVICE_OFFERING_IMAGES) break
    const result = await uploadImage(file, id)
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 422 })
    uploadedUrls.push(result.url)
  }
  const nextImages = normalizeOfferingImageUrls([...existingImages, ...uploadedUrls])

  const patchData: Record<string, unknown> = { images: nextImages }

  const providerUserId = formData.get('providerUserId') as string | null
  const category = (formData.get('category') as string | null)?.trim()
  const subcategory = (formData.get('subcategory') as string | null)?.trim()
  const title = (formData.get('title') as string | null)?.trim()
  const description = formData.get('description') as string | null
  const pricingType = formData.get('pricingType') as string | null
  const rateRaw = formData.get('rate') as string | null
  const currency = formData.get('currency') as string | null
  const isActiveRaw = formData.get('isActive')
  const isFeaturedRaw = formData.get('isFeatured')
  const isAdRaw = formData.get('isAd')
  const featuredSortOrderRaw = formData.get('featuredSortOrder') as string | null
  const adSortOrderRaw = formData.get('adSortOrder') as string | null

  if (providerUserId) patchData.provider_user_id = providerUserId.trim()
  if (title) patchData.title = title
  if (description !== null) patchData.description = description
  if (pricingType) patchData.pricing_type = pricingType
  if (rateRaw !== null && !Number.isNaN(parseFloat(rateRaw))) patchData.rate = parseFloat(rateRaw)
  if (currency) patchData.currency = currency.trim()
  if (isActiveRaw !== null) patchData.is_active = parseBoolean(isActiveRaw, true)
  if (isFeaturedRaw !== null) patchData.is_featured = parseBoolean(isFeaturedRaw, false)
  if (isAdRaw !== null) patchData.is_ad = parseBoolean(isAdRaw, false)
  if (featuredSortOrderRaw !== null && !Number.isNaN(parseInt(featuredSortOrderRaw, 10))) {
    patchData.featured_sort_order = parseInt(featuredSortOrderRaw, 10)
  }
  if (adSortOrderRaw !== null && !Number.isNaN(parseInt(adSortOrderRaw, 10))) {
    patchData.ad_sort_order = parseInt(adSortOrderRaw, 10)
  }

  if (category && subcategory) {
    const taxonomyError = validateServiceTaxonomy(category, subcategory)
    if (taxonomyError) return NextResponse.json({ error: taxonomyError }, { status: 422 })
    patchData.category = category
    patchData.subcategory = subcategory
  }

  const { data: currentOffering } = await supabaseAdmin
    .from('service_offerings')
    .select('images')
    .eq('id', id)
    .single()

  const { data: offering, error } = await supabaseAdmin
    .from('service_offerings')
    .update(patchData)
    .eq('id', id)
    .select(OFFERING_SELECT)
    .single()

  if (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json({ error: 'Services tables are not set up.' }, { status: 503 })
    }
    console.error('[admin/services/offerings PATCH FORM]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (currentOffering?.images) {
    const removedUrls = (currentOffering.images as string[]).filter((url) => !nextImages.includes(url))
    const { error: storageCleanupError } = await deleteStorageObjectsFromUrls(removedUrls)
    if (storageCleanupError) {
      console.error('[admin/services/offerings PATCH] storage cleanup', storageCleanupError)
    }
  }

  revalidateServicePaths(offering.id)
  const [enriched] = await enrichWithProviders([offering])
  return NextResponse.json({ offering: enriched })
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id query param is required' }, { status: 400 })

  const { data: offering, error: selectError } = await supabaseAdmin
    .from('service_offerings')
    .select('images')
    .eq('id', id)
    .maybeSingle()

  if (selectError) {
    console.error('[admin/services/offerings DELETE] select', selectError)
    return NextResponse.json({ error: selectError.message }, { status: 500 })
  }

  const imageUrls = Array.isArray(offering?.images) ? offering.images : []
  if (imageUrls.length > 0) {
    const { error: storageError } = await deleteStorageObjectsFromUrls(imageUrls)
    if (storageError) {
      return NextResponse.json(
        { error: `Could not delete offering images from storage: ${storageError}` },
        { status: 500 },
      )
    }
  }

  const { error } = await supabaseAdmin.from('service_offerings').delete().eq('id', id)
  if (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json({ error: 'Services tables are not set up.' }, { status: 503 })
    }
    console.error('[admin/services/offerings DELETE]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  revalidateServicePaths(id)
  return NextResponse.json({ success: true })
}
