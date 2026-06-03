import { supabaseAdmin } from '@/lib/supabase-admin'

export const BLOG_IMAGES_BUCKET = 'blog-images'

export async function ensureBlogImagesBucket() {
  const { error } = await supabaseAdmin.storage.createBucket(BLOG_IMAGES_BUCKET, { public: true })
  if (error && !error.message.includes('already exists')) {
    console.error('[blog-images ensureBucket]', error.message)
  }
}

export async function uploadBlogImage(
  file: File,
  folder: 'covers' | 'content' = 'content',
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const MAX_BYTES = 5 * 1024 * 1024
  if (file.size > MAX_BYTES) {
    return { ok: false, error: 'Image must be under 5 MB.' }
  }
  if (!file.type.startsWith('image/')) {
    return { ok: false, error: 'File must be an image.' }
  }

  await ensureBlogImagesBucket()

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'].includes(ext) ? ext : 'jpg'
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`
  const buffer = await file.arrayBuffer()

  const { data, error } = await supabaseAdmin.storage
    .from(BLOG_IMAGES_BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: false })

  if (error) return { ok: false, error: error.message }

  const { data: urlData } = supabaseAdmin.storage.from(BLOG_IMAGES_BUCKET).getPublicUrl(data.path)
  return { ok: true, url: urlData.publicUrl }
}
