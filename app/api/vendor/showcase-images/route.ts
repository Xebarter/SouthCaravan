import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthedVendor } from '@/lib/api/vendor-auth';

const BUCKET = 'vendor-showcase';
const MAX_BYTES = 6 * 1024 * 1024; // 6MB per image

function asString(v: unknown) {
  return typeof v === 'string' ? v : '';
}

function asIntStrict(v: unknown): number | null {
  if (typeof v === 'number') {
    if (!Number.isFinite(v) || !Number.isInteger(v)) return null;
    return v;
  }

  const raw = typeof v === 'string' ? v.trim() : String(v ?? '').trim();
  if (!raw) return null;
  if (!/^-?\d+$/.test(raw)) return null;

  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return null;
  return n;
}

function asKind(v: unknown) {
  const raw = asString(v).trim().toLowerCase();
  const allowed = new Set(['premises', 'machinery', 'storage', 'team', 'qa', 'packaging', 'logistics', 'other']);
  return allowed.has(raw) ? raw : 'other';
}

async function ensureBucket() {
  const { error } = await supabaseAdmin.storage.createBucket(BUCKET, { public: true });
  if (error && !error.message.includes('already exists')) {
    console.error('[vendor/showcase-images ensureBucket]', error.message);
  }
}

function storageObjectPathFromPublicUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    const pathname = parsed.pathname;
    const prefix = `/storage/v1/object/public/${BUCKET}/`;
    const i = pathname.indexOf(prefix);
    if (i >= 0) {
      const path = decodeURIComponent(pathname.slice(i + prefix.length));
      return path || null;
    }
  } catch {
    /* ignore */
  }

  const marker = `/object/public/${BUCKET}/`;
  const index = trimmed.indexOf(marker);
  if (index < 0) return null;
  const rest = trimmed.slice(index + marker.length).split(/[?#]/)[0];
  const path = decodeURIComponent(rest);
  return path || null;
}

export async function GET() {
  const auth = await getAuthedVendor();
  if (!auth.ok) return auth.response;

  const { data, error } = await supabaseAdmin
    .from('vendor_profile_showcase_images')
    .select('*')
    .eq('user_id', auth.vendorId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[vendor/showcase-images GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ images: data ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await getAuthedVendor();
  if (!auth.ok) return auth.response;

  const contentType = req.headers.get('content-type') ?? '';
  if (!contentType.includes('multipart/form-data')) {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 });
  }

  if (file.size <= 0) return NextResponse.json({ error: 'Empty file' }, { status: 422 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'Image is too large (max 6MB).' }, { status: 422 });

  const allowed = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
  if (!allowed.has(file.type)) {
    return NextResponse.json({ error: 'Unsupported image type (use PNG, JPG, WEBP, or GIF).' }, { status: 422 });
  }

  const kind = asKind(formData.get('kind'));
  const caption = asString(formData.get('caption')).trim().slice(0, 140);
  const replaceId = asString(formData.get('replaceId')).trim();

  await ensureBucket();

  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${auth.vendorId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = await file.arrayBuffer();

  const { data: up, error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (uploadError) {
    console.error('[vendor/showcase-images POST] upload', uploadError.message);
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(up.path);
  const url = urlData.publicUrl;

  // If replaceId is provided, replace the image at that id (keep sort order).
  if (replaceId) {
    const { data: existing, error: existingError } = await supabaseAdmin
      .from('vendor_profile_showcase_images')
      .select('*')
      .eq('id', replaceId)
      .eq('user_id', auth.vendorId)
      .maybeSingle();

    if (existingError) {
      console.error('[vendor/showcase-images POST] replace select', existingError);
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const oldPath = storageObjectPathFromPublicUrl(existing.url ?? '');
    if (oldPath) {
      const { error: removeError } = await supabaseAdmin.storage.from(BUCKET).remove([oldPath]);
      if (removeError) {
        console.error('[vendor/showcase-images POST] replace storage remove', removeError.message);
        return NextResponse.json({ error: removeError.message }, { status: 500 });
      }
    }

    const nextKind = asString(formData.get('kind')) ? kind : (existing.kind ?? 'other');
    const nextCaption = asString(formData.get('caption')) ? caption : (existing.caption ?? '');

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('vendor_profile_showcase_images')
      .update({ url, kind: nextKind, caption: nextCaption })
      .eq('id', replaceId)
      .eq('user_id', auth.vendorId)
      .select('*')
      .single();

    if (updateError) {
      console.error('[vendor/showcase-images POST] replace update', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, image: updated });
  }

  const { data: last } = await supabaseAdmin
    .from('vendor_profile_showcase_images')
    .select('sort_order')
    .eq('user_id', auth.vendorId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextSort = (typeof last?.sort_order === 'number' ? last.sort_order : 0) + 10;

  const { data: row, error: insertError } = await supabaseAdmin
    .from('vendor_profile_showcase_images')
    .insert({
      user_id: auth.vendorId,
      url,
      kind,
      caption,
      sort_order: nextSort,
    })
    .select('*')
    .single();

  if (insertError) {
    console.error('[vendor/showcase-images POST] insert', insertError);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, image: row });
}

export async function PATCH(req: NextRequest) {
  const auth = await getAuthedVendor();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const updates = Array.isArray((body as any).updates) ? (body as any).updates : null;
  if (!updates || updates.length === 0) {
    return NextResponse.json({ error: 'updates array is required' }, { status: 422 });
  }

  const results: any[] = [];
  for (const u of updates) {
    const id = asString(u?.id).trim();
    if (!id) continue;
    const patch: Record<string, unknown> = {};
    if (u?.kind != null) patch.kind = asKind(u.kind);
    if (u?.caption != null) patch.caption = asString(u.caption).trim().slice(0, 140);
    if (u?.sortOrder != null) {
      const sortOrder = asIntStrict(u.sortOrder);
      if (sortOrder === null || sortOrder < 0) {
        return NextResponse.json({ error: 'sortOrder must be a non-negative integer' }, { status: 422 });
      }
      patch.sort_order = sortOrder;
    }
    if (Object.keys(patch).length === 0) continue;

    const { data, error } = await supabaseAdmin
      .from('vendor_profile_showcase_images')
      .update(patch)
      .eq('id', id)
      .eq('user_id', auth.vendorId)
      .select('*')
      .maybeSingle();
    if (error) {
      console.error('[vendor/showcase-images PATCH]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: `Image not found: ${id}` }, { status: 404 });
    }

    results.push(data);
  }

  return NextResponse.json({ ok: true, images: results });
}

export async function DELETE(req: NextRequest) {
  const auth = await getAuthedVendor();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const id = asString(searchParams.get('id')).trim();
  if (!id) return NextResponse.json({ error: 'id query param is required' }, { status: 400 });

  const { data: row, error: selectError } = await supabaseAdmin
    .from('vendor_profile_showcase_images')
    .select('id,url')
    .eq('id', id)
    .eq('user_id', auth.vendorId)
    .maybeSingle();

  if (selectError) {
    console.error('[vendor/showcase-images DELETE] select', selectError);
    return NextResponse.json({ error: selectError.message }, { status: 500 });
  }
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const path = storageObjectPathFromPublicUrl(row.url ?? '');
  if (path) {
    const { error: storageError } = await supabaseAdmin.storage.from(BUCKET).remove([path]);
    if (storageError) {
      console.error('[vendor/showcase-images DELETE] storage', storageError.message);
      return NextResponse.json({ error: storageError.message }, { status: 500 });
    }
  }

  const { error: delError } = await supabaseAdmin
    .from('vendor_profile_showcase_images')
    .delete()
    .eq('id', id)
    .eq('user_id', auth.vendorId);

  if (delError) {
    console.error('[vendor/showcase-images DELETE] delete row', delError);
    return NextResponse.json({ error: delError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

