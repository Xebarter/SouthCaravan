import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthedVendor } from '@/lib/api/vendor-auth';

const BUCKET = 'vendor-logos';
const MAX_BYTES = 2 * 1024 * 1024; // 2MB

async function ensureBucket() {
  const { error } = await supabaseAdmin.storage.createBucket(BUCKET, { public: true });
  if (error && !error.message.includes('already exists')) {
    console.error('[vendor/logo ensureBucket]', error.message);
  }
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
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'Logo is too large (max 2MB).' }, { status: 422 });

  const allowed = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
  if (!allowed.has(file.type)) {
    return NextResponse.json({ error: 'Unsupported logo type (use PNG, JPG, WEBP, or GIF).' }, { status: 422 });
  }

  await ensureBucket();

  const ext = file.name.split('.').pop() ?? 'png';
  const path = `${auth.vendorId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = await file.arrayBuffer();

  const { data, error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (uploadError) {
    console.error('[vendor/logo POST] upload', uploadError.message);
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(data.path);
  const logoUrl = urlData.publicUrl;

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('vendor_profiles')
    .update({ logo_url: logoUrl })
    .eq('user_id', auth.vendorId)
    .select('*')
    .maybeSingle();

  if (profileError) {
    console.error('[vendor/logo POST] update profile', profileError);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, logoUrl, profile });
}

