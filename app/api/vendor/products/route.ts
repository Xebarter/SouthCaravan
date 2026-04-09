import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSupabaseClient } from '@/lib/supabase/server';
import { MAX_PRODUCT_IMAGE_BYTES, productImageMaxSizeLabel } from '@/lib/product-image-limits';

const BUCKET = 'product-images';

function hasVendorAccess(user: any) {
  const meta = user?.app_metadata ?? {};
  if (meta.role === 'vendor') return true;
  const roles = Array.isArray(meta.roles) ? meta.roles : [];
  return roles.includes('vendor');
}

async function getAuthedVendorId(): Promise<
  | { ok: true; vendorId: string }
  | { ok: false; response: NextResponse }
> {
  const supabase = await getServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  if (!hasVendorAccess(data.user)) {
    return { ok: false, response: NextResponse.json({ error: 'Vendor role required' }, { status: 403 }) };
  }
  return { ok: true, vendorId: data.user.id };
}

async function ensureBucket() {
  const { error } = await supabaseAdmin.storage.createBucket(BUCKET, { public: true });
  if (error && !error.message.includes('already exists')) {
    console.error('[ensureBucket]', error.message);
  }
}

type UploadImageResult = { ok: true; url: string } | { ok: false; error: string };

async function uploadImage(file: File): Promise<UploadImageResult> {
  if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
    return {
      ok: false,
      error: `Image "${file.name}" is too large (max ${productImageMaxSizeLabel()} per file).`,
    };
  }

  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = await file.arrayBuffer();

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (error) {
    console.error('[uploadImage]', error.message);
    return {
      ok: false,
      error: `Could not upload "${file.name}": ${error.message}`,
    };
  }

  const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(data.path);
  return { ok: true, url: urlData.publicUrl };
}

function parseBoolean(value: unknown, fallback = false) {
  if (value === null || value === undefined) return fallback;
  const normalized = String(value).toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
  if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  return fallback;
}

async function validateTaxonomy(category: string, subcategory?: string, subSubcategory?: string) {
  const { data, error } = await supabaseAdmin
    .from('product_categories')
    .select('id, name, level, parent_id')
    .eq('is_active', true);

  if (error) return 'Could not validate category taxonomy';

  const rows = data ?? [];
  const categoryRow = rows.find((row) => row.level === 1 && row.name === category);
  if (!categoryRow) return 'Invalid category';

  if (!subcategory) return null;

  const subcategoryRow = rows.find(
    (row) => row.level === 2 && row.parent_id === categoryRow.id && row.name === subcategory,
  );
  if (!subcategoryRow) return 'Invalid subcategory for selected category';

  if (!subSubcategory) return null;

  const subSubcategoryRow = rows.find(
    (row) => row.level === 3 && row.parent_id === subcategoryRow.id && row.name === subSubcategory,
  );
  if (!subSubcategoryRow) return 'Invalid sub-subcategory for selected subcategory';

  return null;
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
    /* fall through */
  }

  const marker = `/object/public/${BUCKET}/`;
  const index = trimmed.indexOf(marker);
  if (index < 0) return null;
  const rest = trimmed.slice(index + marker.length).split(/[?#]/)[0];
  const path = decodeURIComponent(rest);
  return path || null;
}

async function deleteStorageObjectsFromUrls(urls: string[]): Promise<{ error: string | null }> {
  const paths = urls.map(storageObjectPathFromPublicUrl).filter((path): path is string => Boolean(path));
  if (paths.length === 0) return { error: null };

  const { error } = await supabaseAdmin.storage.from(BUCKET).remove(paths);
  if (error) {
    console.error('[deleteStorageObjectsFromUrls]', error.message, paths);
    return { error: error.message };
  }
  return { error: null };
}

export async function GET() {
  const auth = await getAuthedVendorId();
  if (!auth.ok) return auth.response;

  const { data: products, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('vendor_id', auth.vendorId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[vendor/products GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ products: products ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await getAuthedVendorId();
  if (!auth.ok) return auth.response;

  const contentType = req.headers.get('content-type') ?? '';

  if (contentType.includes('multipart/form-data')) {
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
    }

    const name = (formData.get('name') as string | null)?.trim() ?? '';
    const category = (formData.get('category') as string | null)?.trim() ?? '';
    const subcategory = (formData.get('subcategory') as string | null)?.trim() ?? '';
    const subSubcategory =
      (formData.get('subSubCategory') as string | null)?.trim() ??
      (formData.get('subSubcategory') as string | null)?.trim() ??
      '';

    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 422 });
    if (!category) return NextResponse.json({ error: 'category is required' }, { status: 422 });
    const taxonomyError = await validateTaxonomy(category, subcategory || undefined, subSubcategory || undefined);
    if (taxonomyError) return NextResponse.json({ error: taxonomyError }, { status: 422 });

    const description = (formData.get('description') as string | null) ?? '';
    const price = parseFloat((formData.get('price') as string | null) ?? '0');
    const minimumOrder = parseInt((formData.get('minimumOrder') as string | null) ?? '1', 10);
    const unit = (formData.get('unit') as string | null) ?? 'piece';
    const inStock = parseBoolean(formData.get('inStock'), true);
    const specificationsRaw = (formData.get('specifications') as string | null) ?? '{}';

    let specifications: Record<string, string> = {};
    try {
      specifications = JSON.parse(specificationsRaw);
    } catch {
      return NextResponse.json({ error: 'specifications must be valid JSON' }, { status: 422 });
    }

    await ensureBucket();
    const imageFiles = formData.getAll('images') as File[];
    const imageUrls: string[] = [];
    for (const file of imageFiles) {
      if (file.size === 0) continue;
      const result = await uploadImage(file);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 422 });
      imageUrls.push(result.url);
    }

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .insert({
        vendor_id: auth.vendorId,
        name,
        description,
        category,
        subcategory: subcategory || 'General',
        sub_subcategory: subSubcategory || 'General',
        price: Number.isFinite(price) ? price : 0,
        minimum_order: Number.isFinite(minimumOrder) ? minimumOrder : 1,
        unit,
        images: imageUrls,
        in_stock: inStock,
        is_featured: false,
        specifications,
      })
      .select()
      .single();

    if (error) {
      console.error('[vendor/products POST FORM]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ product }, { status: 201 });
  }

  const body = await req.json().catch(() => null);
  const name = (body?.name as string | undefined)?.trim() ?? '';
  const category = (body?.category as string | undefined)?.trim() ?? '';
  const subcategory = (body?.subcategory as string | undefined)?.trim() ?? '';
  const subSubCategory = (body?.subSubCategory as string | undefined)?.trim() ?? '';

  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 422 });
  if (!category) return NextResponse.json({ error: 'category is required' }, { status: 422 });
  const taxonomyError = await validateTaxonomy(category, subcategory || undefined, subSubCategory || undefined);
  if (taxonomyError) return NextResponse.json({ error: taxonomyError }, { status: 422 });

  const { data: product, error } = await supabaseAdmin
    .from('products')
    .insert({
      vendor_id: auth.vendorId,
      name,
      description: typeof body?.description === 'string' ? body.description : '',
      category,
      subcategory: subcategory || 'General',
      sub_subcategory: subSubCategory || 'General',
      price: typeof body?.price === 'number' ? body.price : Number(body?.price ?? 0) || 0,
      minimum_order:
        typeof body?.minimumOrder === 'number' ? body.minimumOrder : parseInt(String(body?.minimumOrder ?? 1), 10) || 1,
      unit: typeof body?.unit === 'string' ? body.unit : 'piece',
      images: Array.isArray(body?.images) ? body.images : [],
      in_stock: typeof body?.inStock === 'boolean' ? body.inStock : parseBoolean(body?.inStock, true),
      is_featured: false,
      specifications: body?.specifications && typeof body.specifications === 'object' ? body.specifications : {},
    })
    .select()
    .single();

  if (error) {
    console.error('[vendor/products POST JSON]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ product }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const auth = await getAuthedVendorId();
  if (!auth.ok) return auth.response;

  const contentType = req.headers.get('content-type') ?? '';
  const patchData: Record<string, unknown> = {};
  let id: string;
  let newImageFiles: File[] = [];
  let keptImages: string[] | null = null;

  if (contentType.includes('multipart/form-data')) {
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
    }

    id = ((formData.get('id') as string | null)?.trim()) ?? '';
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const name = (formData.get('name') as string | null)?.trim();
    if (name != null) patchData.name = name;
    const description = formData.get('description') as string | null;
    if (description != null) patchData.description = description;
    const category = (formData.get('category') as string | null)?.trim();
    if (category != null) patchData.category = category;
    const subcategory = (formData.get('subcategory') as string | null)?.trim();
    if (subcategory != null) patchData.subcategory = subcategory;
    const subSubCategory = (
      (formData.get('subSubCategory') as string | null) ??
      (formData.get('subSubcategory') as string | null)
    )?.trim();
    if (subSubCategory != null) patchData.sub_subcategory = subSubCategory;
    const price = formData.get('price') as string | null;
    if (price != null) patchData.price = parseFloat(price);
    const minimumOrder = formData.get('minimumOrder') as string | null;
    if (minimumOrder != null) patchData.minimum_order = parseInt(minimumOrder, 10);
    const unit = formData.get('unit') as string | null;
    if (unit != null) patchData.unit = unit;
    const inStockRaw = formData.get('inStock');
    if (inStockRaw != null) patchData.in_stock = parseBoolean(inStockRaw, true);
    const specificationsRaw = formData.get('specifications') as string | null;
    if (specificationsRaw != null) {
      try {
        patchData.specifications = JSON.parse(specificationsRaw);
      } catch {
        return NextResponse.json({ error: 'specifications must be valid JSON' }, { status: 422 });
      }
    }
    const existingImagesRaw = formData.get('existingImages') as string | null;
    if (existingImagesRaw != null) {
      try {
        keptImages = JSON.parse(existingImagesRaw);
      } catch {
        keptImages = [];
      }
    }
    newImageFiles = (formData.getAll('images') as File[]).filter((f) => f.size > 0);
  } else {
    const body = await req.json().catch(() => null);
    id = (body?.id as string | undefined)?.trim() ?? '';
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    if (typeof body.name === 'string') patchData.name = body.name;
    if (typeof body.description === 'string') patchData.description = body.description;
    if (typeof body.category === 'string') patchData.category = body.category;
    if (typeof body.subcategory === 'string') patchData.subcategory = body.subcategory;
    if (typeof body.subSubCategory === 'string') patchData.sub_subcategory = body.subSubCategory;
    if (typeof body.price === 'number') patchData.price = body.price;
    if (typeof body.minimumOrder === 'number') patchData.minimum_order = body.minimumOrder;
    if (typeof body.unit === 'string') patchData.unit = body.unit;
    if (typeof body.inStock === 'boolean') patchData.in_stock = body.inStock;
    if (body.specifications && typeof body.specifications === 'object') patchData.specifications = body.specifications;
    if (Array.isArray(body.images)) patchData.images = body.images;
  }

  delete (patchData as any).vendor_id;
  delete (patchData as any).is_featured;

  if (
    typeof patchData.category === 'string' &&
    typeof patchData.subcategory === 'string' &&
    typeof patchData.sub_subcategory === 'string'
  ) {
    const taxonomyError = await validateTaxonomy(
      patchData.category,
      patchData.subcategory,
      patchData.sub_subcategory,
    );
    if (taxonomyError) return NextResponse.json({ error: taxonomyError }, { status: 422 });
  }

  if (keptImages !== null || newImageFiles.length > 0) {
    const { data: current } = await supabaseAdmin
      .from('products')
      .select('images')
      .eq('id', id)
      .eq('vendor_id', auth.vendorId)
      .maybeSingle();

    const currentImages: string[] = Array.isArray(current?.images) ? current.images : [];
    const kept = keptImages ?? currentImages;
    const removed = currentImages.filter((url) => !kept.includes(url));
    if (removed.length > 0) {
      await deleteStorageObjectsFromUrls(removed);
    }

    await ensureBucket();
    const uploadedUrls: string[] = [];
    for (const file of newImageFiles) {
      const result = await uploadImage(file);
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 422 });
      uploadedUrls.push(result.url);
    }
    patchData.images = [...kept, ...uploadedUrls];
  }

  const { data: product, error } = await supabaseAdmin
    .from('products')
    .update(patchData)
    .eq('id', id)
    .eq('vendor_id', auth.vendorId)
    .select()
    .maybeSingle();

  if (error) {
    console.error('[vendor/products PATCH]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!product) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ product });
}

export async function DELETE(req: NextRequest) {
  const auth = await getAuthedVendorId();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id query param is required' }, { status: 400 });

  const { data: product, error: selectError } = await supabaseAdmin
    .from('products')
    .select('images')
    .eq('id', id)
    .eq('vendor_id', auth.vendorId)
    .maybeSingle();

  if (selectError) {
    console.error('[vendor/products DELETE] select', selectError);
    return NextResponse.json({ error: selectError.message }, { status: 500 });
  }
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const imageUrls = Array.isArray(product?.images) ? product.images : [];
  if (imageUrls.length > 0) {
    const { error: storageError } = await deleteStorageObjectsFromUrls(imageUrls);
    if (storageError) {
      return NextResponse.json(
        { error: `Could not delete product images from storage: ${storageError}` },
        { status: 500 },
      );
    }
  }

  const { error } = await supabaseAdmin.from('products').delete().eq('id', id).eq('vendor_id', auth.vendorId);
  if (error) {
    console.error('[vendor/products DELETE]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

