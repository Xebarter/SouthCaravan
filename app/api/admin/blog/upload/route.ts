import { NextRequest, NextResponse } from 'next/server'

import { uploadBlogImage } from '@/lib/blog-image-upload'

/** POST /api/admin/blog/upload — inline images for blog post content */
export async function POST(req: NextRequest) {
  try {
    const fd = await req.formData()
    const file = fd.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'file is required' }, { status: 422 })
    }

    const result = await uploadBlogImage(file, 'content')
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ url: result.url })
  } catch (err) {
    console.error('[admin/blog/upload POST]', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
