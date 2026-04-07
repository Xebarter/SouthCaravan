import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const AD_BANNER_BUCKET = 'ad-banners';

type AddPayload = {
  productId?: string;
  headline?: string;
  ctaLabel?: string;
  isActive?: boolean;
  sortOrder?: number;
};

async function ensureAdBannerBucket() {
  const { error } = await supabaseAdmin.storage.createBucket(AD_BANNER_BUCKET, { public: true });
  if (error && !error.message.includes('already exists')) {
    console.error('[ensureAdBannerBucket]', error.message);
  }
}

async function uploadBanner(file: File): Promise<string | null> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = await file.arrayBuffer();

  const { data, error } = await supabaseAdmin.storage
    .from(AD_BANNER_BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (error) {
    console.error('[uploadBanner]', error.message);
    return null;
  }

  const { data: urlData } = supabaseAdmin.storage.from(AD_BANNER_BUCKET).getPublicUrl(data.path);
  return urlData.publicUrl;
}

async function deleteStorageObjectFromUrl(url: string | null | undefined) {
  if (!url) return;
  const marker = `/object/public/${AD_BANNER_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index < 0) return;
  const path = decodeURIComponent(url.slice(index + marker.length));
  await supabaseAdmin.storage.from(AD_BANNER_BUCKET).remove([path]);
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('product_ads')
    .select(
      'id, product_id, banner_image_url, headline, cta_label, is_active, sort_order, created_at, products(id, name, price, category, in_stock, images)',
    )
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[admin/adds GET]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ adds: data ?? [] });
}

export async function POST(req: NextRequest) {
  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
  }

  const productId = (formData.get('productId') as string | null)?.trim();
  const headline = (formData.get('headline') as string | null)?.trim() ?? '';
  const ctaLabel = (formData.get('ctaLabel') as string | null)?.trim() || 'Shop now';
  const sortOrderRaw = (formData.get('sortOrder') as string | null) ?? '0';
  const isActiveRaw = ((formData.get('isActive') as string | null) ?? 'true').toLowerCase();
  const banner = formData.get('banner') as File | null;

  if (!productId) {
    return NextResponse.json({ error: 'productId is required' }, { status: 422 });
  }
  if (!banner || banner.size === 0) {
    return NextResponse.json({ error: 'banner is required' }, { status: 422 });
  }

  await ensureAdBannerBucket();
  const bannerUrl = await uploadBanner(banner);
  if (!bannerUrl) {
    return NextResponse.json({ error: 'Failed to upload banner image' }, { status: 500 });
  }

  const insertPayload = {
    product_id: productId,
    banner_image_url: bannerUrl,
    headline,
    cta_label: ctaLabel,
    is_active: ['true', '1', 'yes', 'on'].includes(isActiveRaw),
    sort_order: Number.isFinite(Number(sortOrderRaw)) ? Number(sortOrderRaw) : 0,
  };

  const { data, error } = await supabaseAdmin
    .from('product_ads')
    .insert(insertPayload)
    .select(
      'id, product_id, banner_image_url, headline, cta_label, is_active, sort_order, created_at, products(id, name, price, category, in_stock, images)',
    )
    .single();

  if (error) {
    await deleteStorageObjectFromUrl(bannerUrl);
    const duplicate = error.code === '23505';
    return NextResponse.json(
      { error: duplicate ? 'This product already has an ad slot.' : error.message },
      { status: duplicate ? 409 : 500 },
    );
  }

  return NextResponse.json({ add: data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const contentType = req.headers.get('content-type') ?? '';
  if (!contentType.includes('multipart/form-data')) {
    const body = (await req.json().catch(() => null)) as (AddPayload & { id?: string }) | null;
    const id = body?.id?.trim();

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 422 });
    }

    const patchData: Record<string, unknown> = {};
    if (typeof body?.headline === 'string') patchData.headline = body.headline.trim();
    if (typeof body?.ctaLabel === 'string') patchData.cta_label = body.ctaLabel.trim() || 'Shop now';
    if (typeof body?.isActive === 'boolean') patchData.is_active = body.isActive;
    if (typeof body?.sortOrder === 'number' && Number.isFinite(body.sortOrder)) patchData.sort_order = body.sortOrder;
    if (typeof body?.productId === 'string' && body.productId.trim()) patchData.product_id = body.productId.trim();

    if (Object.keys(patchData).length === 0) {
      return NextResponse.json({ error: 'No update fields provided' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('product_ads')
      .update(patchData)
      .eq('id', id)
      .select(
        'id, product_id, banner_image_url, headline, cta_label, is_active, sort_order, created_at, products(id, name, price, category, in_stock, images)',
      )
      .single();

    if (error) {
      const duplicate = error.code === '23505';
      return NextResponse.json(
        { error: duplicate ? 'This product already has an ad slot.' : error.message },
        { status: duplicate ? 409 : 500 },
      );
    }

    return NextResponse.json({ add: data });
  }

  const formData = await req.formData();
  const id = (formData.get('id') as string | null)?.trim();
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 422 });
  }

  const patchData: Record<string, unknown> = {};
  const headline = formData.get('headline') as string | null;
  const ctaLabel = formData.get('ctaLabel') as string | null;
  const sortOrder = formData.get('sortOrder') as string | null;
  const isActive = formData.get('isActive') as string | null;
  const productId = formData.get('productId') as string | null;
  const banner = formData.get('banner') as File | null;

  if (headline !== null) patchData.headline = headline.trim();
  if (ctaLabel !== null) patchData.cta_label = ctaLabel.trim() || 'Shop now';
  if (sortOrder !== null && Number.isFinite(Number(sortOrder))) patchData.sort_order = Number(sortOrder);
  if (isActive !== null) patchData.is_active = ['true', '1', 'yes', 'on'].includes(isActive.toLowerCase());
  if (productId !== null && productId.trim()) patchData.product_id = productId.trim();

  let previousBannerUrl: string | null = null;
  if (banner && banner.size > 0) {
    await ensureAdBannerBucket();
    const { data: current, error: currentError } = await supabaseAdmin
      .from('product_ads')
      .select('banner_image_url')
      .eq('id', id)
      .single();
    if (currentError) {
      return NextResponse.json({ error: currentError.message }, { status: 500 });
    }
    previousBannerUrl = current?.banner_image_url ?? null;
    const uploaded = await uploadBanner(banner);
    if (!uploaded) {
      return NextResponse.json({ error: 'Failed to upload banner image' }, { status: 500 });
    }
    patchData.banner_image_url = uploaded;
  }

  if (Object.keys(patchData).length === 0) {
    return NextResponse.json({ error: 'No update fields provided' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('product_ads')
    .update(patchData)
    .eq('id', id)
    .select(
      'id, product_id, banner_image_url, headline, cta_label, is_active, sort_order, created_at, products(id, name, price, category, in_stock, images)',
    )
    .single();

  if (error) {
    const newBannerUrl = typeof patchData.banner_image_url === 'string' ? patchData.banner_image_url : null;
    if (newBannerUrl) {
      await deleteStorageObjectFromUrl(newBannerUrl);
    }
    const duplicate = error.code === '23505';
    return NextResponse.json(
      { error: duplicate ? 'This product already has an ad slot.' : error.message },
      { status: duplicate ? 409 : 500 },
    );
  }

  if (previousBannerUrl) {
    await deleteStorageObjectFromUrl(previousBannerUrl);
  }

  return NextResponse.json({ add: data });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id')?.trim();

  if (!id) {
    return NextResponse.json({ error: 'id query param is required' }, { status: 400 });
  }

  const { data: current } = await supabaseAdmin
    .from('product_ads')
    .select('banner_image_url')
    .eq('id', id)
    .single();
  const { error } = await supabaseAdmin.from('product_ads').delete().eq('id', id);
  if (error) {
    console.error('[admin/adds DELETE]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (current?.banner_image_url) {
    await deleteStorageObjectFromUrl(current.banner_image_url);
  }

  return NextResponse.json({ success: true });
}
