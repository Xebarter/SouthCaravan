import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAuthedServicesUserId } from '@/lib/services-auth'
import { MAX_PRODUCT_IMAGE_BYTES, productImageMaxSizeLabel } from '@/lib/product-image-limits'
import { MAX_SERVICE_OFFERING_IMAGES, normalizeOfferingImageUrls } from '@/lib/service-offering-images'

const BUCKET = 'product-images'

function isMissingTableError(error: any) {
  const msg = String(error?.message ?? '').toLowerCase()
  return msg.includes('does not exist') && msg.includes('service_offerings')
}

async function ensureBucket() {
  const { error } = await supabaseAdmin.storage.createBucket(BUCKET, { public: true })
  if (error && !error.message.includes('already exists')) {
    console.error('[service-offering-images ensureBucket]', error.message)
  }
}

type UploadImageResult = { ok: true; url: string } | { ok: false; error: string }

async function uploadImage(file: File, offeringId: string): Promise<UploadImageResult> {
  if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
    return {
      ok: false,
      error: `Image "${file.name}" is too large (max ${productImageMaxSizeLabel()} per file).`,
    }
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `service-offerings/${offeringId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const buffer = await file.arrayBuffer()

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type || 'image/jpeg', upsert: false })

  if (error) {
    console.error('[service-offering-images upload]', error.message)
    return { ok: false, error: `Could not upload "${file.name}": ${error.message}` }
  }

  const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(data.path)
  return { ok: true, url: urlData.publicUrl }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await getAuthedServicesUserId()
  if (!auth.ok) return auth.response

  const { id: offeringId } = await ctx.params
  if (!offeringId) {
    return NextResponse.json({ error: 'Offering id required' }, { status: 400 })
  }

  const { data: existing, error: fetchErr } = await supabaseAdmin
    .from('service_offerings')
    .select('id,provider_user_id,images')
    .eq('id', offeringId)
    .eq('provider_user_id', auth.userId)
    .maybeSingle()

  if (fetchErr) {
    if (isMissingTableError(fetchErr)) {
      return NextResponse.json(
        { error: 'Services tables are not set up yet. Run the SQL migration in supabase/services.sql.' },
        { status: 503 },
      )
    }
    console.error('[service-offering-images GET offering]', fetchErr)
    return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  }

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const currentUrls = normalizeOfferingImageUrls((existing as any).images)
  const remainingSlots = MAX_SERVICE_OFFERING_IMAGES - currentUrls.length
  if (remainingSlots <= 0) {
    return NextResponse.json(
      { error: `Maximum ${MAX_SERVICE_OFFERING_IMAGES} images per listing.` },
      { status: 422 },
    )
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Expected multipart form data' }, { status: 400 })
  }

  const imageFiles = formData.getAll('images') as File[]
  const files = imageFiles.filter((f) => f && typeof f === 'object' && f.size > 0)
  if (files.length === 0) {
    return NextResponse.json({ error: 'No image files provided' }, { status: 400 })
  }

  const toUpload = files.slice(0, remainingSlots)
  if (files.length > remainingSlots) {
    // proceed with partial; client can show message from response
  }

  await ensureBucket()
  const newUrls: string[] = []
  for (const file of toUpload) {
    const result = await uploadImage(file, offeringId)
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 422 })
    newUrls.push(result.url)
  }

  const merged = normalizeOfferingImageUrls([...currentUrls, ...newUrls])

  const { data: updated, error: updateErr } = await supabaseAdmin
    .from('service_offerings')
    .update({ images: merged } as any)
    .eq('id', offeringId)
    .eq('provider_user_id', auth.userId)
    .select(
      'id,provider_user_id,category,subcategory,title,description,pricing_type,rate,currency,is_active,is_featured,featured_sort_order,is_ad,ad_sort_order,images,created_at,updated_at',
    )
    .maybeSingle()

  if (updateErr) {
    if (isMissingTableError(updateErr)) {
      return NextResponse.json(
        { error: 'Services tables are not set up yet. Run the SQL migration in supabase/services.sql.' },
        { status: 503 },
      )
    }
    console.error('[service-offering-images PATCH]', updateErr)
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  return NextResponse.json({
    offering: updated,
    urls: newUrls,
    truncated: files.length > remainingSlots,
  })
}
