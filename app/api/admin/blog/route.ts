import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const BUCKET = 'blog-images';

async function ensureBucket() {
  const { error } = await supabaseAdmin.storage.createBucket(BUCKET, { public: true });
  if (error && !error.message.includes('already exists')) {
    console.error('[blog ensureBucket]', error.message);
  }
}

async function uploadCoverImage(file: File): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
  if (file.size > MAX_BYTES) {
    return { ok: false, error: 'Cover image must be under 5 MB.' };
  }
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `covers/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = await file.arrayBuffer();

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (error) return { ok: false, error: error.message };

  const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(data.path);
  return { ok: true, url: urlData.publicUrl };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function estimateReadTime(content: string): number {
  const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

/** GET /api/admin/blog  — list all posts (admin, no status filter) */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const categoryId = searchParams.get('category_id');
  const search = searchParams.get('search')?.trim();
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('blog_posts')
    .select(`
      *,
      category:blog_categories(id, name, slug, color),
      tags:blog_post_tags(tag:blog_tags(id, name, slug))
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('status', status);
  if (categoryId) query = query.eq('category_id', categoryId);
  if (search) query = query.textSearch('search_vector', search, { type: 'websearch' });

  const { data: posts, error, count } = await query;

  if (error) {
    console.error('[admin/blog GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Flatten tag structure
  const normalized = (posts ?? []).map((p) => ({
    ...p,
    tags: (p.tags ?? []).map((t: { tag: unknown }) => t.tag),
  }));

  return NextResponse.json({ posts: normalized, total: count ?? 0, page, limit });
}

/** POST /api/admin/blog  — create a new post */
export async function POST(req: NextRequest) {
  const contentType = req.headers.get('content-type') ?? '';
  let body: Record<string, unknown>;

  if (contentType.includes('multipart/form-data')) {
    const fd = await req.formData();
    body = Object.fromEntries(fd.entries());
  } else {
    body = await req.json().catch(() => ({}));
  }

  const title = (body.title as string | undefined)?.trim();
  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 422 });

  const content = (body.content as string | undefined) ?? '';
  const excerpt = (body.excerpt as string | undefined)?.trim() ?? '';
  const status = (body.status as string | undefined) ?? 'draft';
  const authorName = (body.author_name as string | undefined)?.trim() || 'SouthCaravan Team';
  const authorAvatar = (body.author_avatar as string | undefined)?.trim() || null;
  const categoryId = (body.category_id as string | undefined)?.trim() || null;
  const metaTitle = (body.meta_title as string | undefined)?.trim() || null;
  const metaDescription = (body.meta_description as string | undefined)?.trim() || null;
  const featured = body.featured === true || body.featured === 'true';
  const allowComments = body.allow_comments !== false && body.allow_comments !== 'false';
  const scheduledFor = (body.scheduled_for as string | undefined)?.trim() || null;
  const tagIds: string[] = body.tag_ids
    ? (Array.isArray(body.tag_ids) ? body.tag_ids : JSON.parse(body.tag_ids as string))
    : [];

  // Generate unique slug
  let slug = (body.slug as string | undefined)?.trim() || slugify(title);
  const { data: existing } = await supabaseAdmin
    .from('blog_posts')
    .select('slug')
    .eq('slug', slug)
    .maybeSingle();
  if (existing) slug = `${slug}-${Date.now()}`;

  // Handle cover image upload
  let coverImageUrl: string | null = (body.cover_image as string | undefined)?.trim() || null;
  const coverFile = body.cover_image_file as File | undefined;
  if (coverFile && coverFile.size > 0) {
    await ensureBucket();
    const result = await uploadCoverImage(coverFile);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 422 });
    coverImageUrl = result.url;
  }

  const publishedAt = status === 'published' ? new Date().toISOString() : null;
  const readTimeMins = estimateReadTime(content);

  const { data: post, error } = await supabaseAdmin
    .from('blog_posts')
    .insert({
      title,
      slug,
      excerpt,
      content,
      cover_image: coverImageUrl,
      cover_image_alt: (body.cover_image_alt as string | undefined)?.trim() || null,
      status,
      author_name: authorName,
      author_avatar: authorAvatar,
      category_id: categoryId,
      meta_title: metaTitle,
      meta_description: metaDescription,
      featured,
      allow_comments: allowComments,
      read_time_mins: readTimeMins,
      published_at: publishedAt,
      scheduled_for: scheduledFor,
    })
    .select()
    .single();

  if (error) {
    console.error('[admin/blog POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Insert tags
  if (tagIds.length > 0) {
    await supabaseAdmin.from('blog_post_tags').insert(
      tagIds.map((tagId) => ({ post_id: post.id, tag_id: tagId })),
    );
  }

  return NextResponse.json({ post }, { status: 201 });
}

/** PATCH /api/admin/blog  — update a post (JSON body with id) */
export async function PATCH(req: NextRequest) {
  const contentType = req.headers.get('content-type') ?? '';
  let body: Record<string, unknown>;

  if (contentType.includes('multipart/form-data')) {
    const fd = await req.formData();
    body = Object.fromEntries(fd.entries());
  } else {
    body = await req.json().catch(() => ({}));
  }

  const id = (body.id as string | undefined)?.trim();
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const patchData: Record<string, unknown> = {};

  if (typeof body.title === 'string' && body.title.trim()) patchData.title = body.title.trim();
  if (typeof body.slug === 'string' && body.slug.trim()) {
    const { data: conflict } = await supabaseAdmin
      .from('blog_posts')
      .select('id')
      .eq('slug', body.slug.trim())
      .neq('id', id)
      .maybeSingle();
    if (conflict) return NextResponse.json({ error: 'slug already in use' }, { status: 422 });
    patchData.slug = body.slug.trim();
  }
  if (typeof body.content === 'string') {
    patchData.content = body.content;
    patchData.read_time_mins = estimateReadTime(body.content);
  }
  if (typeof body.excerpt === 'string') patchData.excerpt = body.excerpt.trim();
  if (typeof body.status === 'string') {
    patchData.status = body.status;
    if (body.status === 'published') {
      const { data: cur } = await supabaseAdmin.from('blog_posts').select('published_at').eq('id', id).single();
      if (!cur?.published_at) patchData.published_at = new Date().toISOString();
    }
  }
  if (typeof body.author_name === 'string') patchData.author_name = body.author_name.trim();
  if (typeof body.author_avatar === 'string') patchData.author_avatar = body.author_avatar.trim() || null;
  if ('category_id' in body) patchData.category_id = body.category_id || null;
  if (typeof body.meta_title === 'string') patchData.meta_title = body.meta_title.trim() || null;
  if (typeof body.meta_description === 'string') patchData.meta_description = body.meta_description.trim() || null;
  if (typeof body.featured === 'boolean') patchData.featured = body.featured;
  if (body.featured === 'true') patchData.featured = true;
  if (body.featured === 'false') patchData.featured = false;
  if (typeof body.allow_comments === 'boolean') patchData.allow_comments = body.allow_comments;
  if ('scheduled_for' in body) patchData.scheduled_for = body.scheduled_for || null;
  if (typeof body.cover_image === 'string') patchData.cover_image = body.cover_image.trim() || null;
  if (typeof body.cover_image_alt === 'string') patchData.cover_image_alt = body.cover_image_alt.trim() || null;

  const coverFile = body.cover_image_file as File | undefined;
  if (coverFile && coverFile.size > 0) {
    await ensureBucket();
    const result = await uploadCoverImage(coverFile);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 422 });
    patchData.cover_image = result.url;
  }

  const { data: post, error } = await supabaseAdmin
    .from('blog_posts')
    .update(patchData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[admin/blog PATCH]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Replace tags if provided
  if ('tag_ids' in body) {
    const tagIds: string[] = Array.isArray(body.tag_ids)
      ? body.tag_ids
      : JSON.parse((body.tag_ids as string) || '[]');
    await supabaseAdmin.from('blog_post_tags').delete().eq('post_id', id);
    if (tagIds.length > 0) {
      await supabaseAdmin.from('blog_post_tags').insert(
        tagIds.map((tagId) => ({ post_id: id, tag_id: tagId })),
      );
    }
  }

  return NextResponse.json({ post });
}

/** DELETE /api/admin/blog?id=xxx */
export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const { data: post } = await supabaseAdmin
    .from('blog_posts')
    .select('cover_image')
    .eq('id', id)
    .maybeSingle();

  const { error } = await supabaseAdmin.from('blog_posts').delete().eq('id', id);
  if (error) {
    console.error('[admin/blog DELETE]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Clean up cover image from storage
  if (post?.cover_image) {
    const marker = `/object/public/${BUCKET}/`;
    const idx = post.cover_image.indexOf(marker);
    if (idx >= 0) {
      const storagePath = decodeURIComponent(post.cover_image.slice(idx + marker.length).split(/[?#]/)[0]);
      await supabaseAdmin.storage.from(BUCKET).remove([storagePath]);
    }
  }

  return NextResponse.json({ success: true });
}
