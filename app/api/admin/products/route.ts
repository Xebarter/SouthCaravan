import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { MAX_PRODUCT_IMAGE_BYTES, productImageMaxSizeLabel } from '@/lib/product-image-limits';

const BUCKET = 'product-images';

async function ensureBucket() {
  const { error } = await supabaseAdmin.storage.createBucket(BUCKET, { public: true });
  // Ignore "already exists" error
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

function parseBoolean(value: FormDataEntryValue | string | null, fallback = false) {
  if (value === null) return fallback;
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

  if (error) {
    return 'Could not validate category taxonomy';
  }

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

/** Resolve storage object path from a public bucket URL (handles query/hash, pathname vs full URL). */
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

export async function POST(req: NextRequest) {
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
  const isFeatured = parseBoolean(formData.get('isFeatured'), false);
  const vendorId = (formData.get('vendorId') as string | null)?.trim() || null;
  const specificationsRaw = (formData.get('specifications') as string | null) ?? '{}';

  let specifications: Record<string, string> = {};
  try {
    specifications = JSON.parse(specificationsRaw);
  } catch {
    return NextResponse.json({ error: 'specifications must be valid JSON' }, { status: 422 });
  }

  // Upload images
  await ensureBucket();
  const imageFiles = formData.getAll('images') as File[];
  const imageUrls: string[] = [];

  for (const file of imageFiles) {
    if (file.size === 0) continue;
    const result = await uploadImage(file);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }
    imageUrls.push(result.url);
  }

  const { data: product, error } = await supabaseAdmin
    .from('products')
    .insert({
      vendor_id: vendorId,
      name,
      description,
      category,
      subcategory: subcategory || 'General',
      sub_subcategory: subSubcategory || 'General',
      price,
      minimum_order: minimumOrder,
      unit,
      images: imageUrls,
      in_stock: inStock,
      is_featured: isFeatured,
      specifications,
    })
    .select()
    .single();

  if (error) {
    console.error('[admin/products POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ product }, { status: 201 });
}

export async function GET() {
  const { data: products, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[admin/products GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ products });
}

export async function PATCH(req: NextRequest) {
  const contentType = req.headers.get('content-type') ?? '';

  if (!contentType.includes('multipart/form-data')) {
    const body = await req.json().catch(() => null);
    if (!body?.id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const patchData: Record<string, unknown> = {};
    if (typeof body.isFeatured === 'boolean') patchData.is_featured = body.isFeatured;
    if (typeof body.inStock === 'boolean') patchData.in_stock = body.inStock;
    if (typeof body.category === 'string') patchData.category = body.category;
    if (typeof body.subcategory === 'string') patchData.subcategory = body.subcategory;
    if (typeof body.subSubCategory === 'string') patchData.sub_subcategory = body.subSubCategory;
    if (typeof body.name === 'string') patchData.name = body.name;
    if (typeof body.description === 'string') patchData.description = body.description;
    if (typeof body.price === 'number') patchData.price = body.price;
    if (typeof body.minimumOrder === 'number') patchData.minimum_order = body.minimumOrder;
    if (typeof body.unit === 'string') patchData.unit = body.unit;
    if (typeof body.vendorId === 'string' || body.vendorId === null) patchData.vendor_id = body.vendorId;
    if (body.specifications && typeof body.specifications === 'object') patchData.specifications = body.specifications;

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

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .update(patchData)
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      console.error('[admin/products PATCH JSON]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ product });
  }

  const formData = await req.formData();
  const id = (formData.get('id') as string | null)?.trim();
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const existingImagesRaw = (formData.get('existingImages') as string | null) ?? '[]';
  let existingImages: string[] = [];
  try {
    existingImages = JSON.parse(existingImagesRaw);
  } catch {
    return NextResponse.json({ error: 'existingImages must be valid JSON array' }, { status: 422 });
  }

  await ensureBucket();
  const imageFiles = formData.getAll('images') as File[];
  const uploadedUrls: string[] = [];
  for (const file of imageFiles) {
    if (file.size === 0) continue;
    const result = await uploadImage(file);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }
    uploadedUrls.push(result.url);
  }
  const nextImages = [...existingImages, ...uploadedUrls];

  const name = (formData.get('name') as string | null)?.trim();
  const category = (formData.get('category') as string | null)?.trim();
  const subcategory = (formData.get('subcategory') as string | null)?.trim();
  const subSubcategory = (formData.get('subSubCategory') as string | null)?.trim();
  const description = formData.get('description') as string | null;
  const vendorIdRaw = formData.get('vendorId') as string | null;
  const priceRaw = formData.get('price') as string | null;
  const minimumOrderRaw = formData.get('minimumOrder') as string | null;
  const unit = formData.get('unit') as string | null;
  const inStockRaw = formData.get('inStock');
  const isFeaturedRaw = formData.get('isFeatured');
  const specificationsRaw = formData.get('specifications') as string | null;

  const patchData: Record<string, unknown> = { images: nextImages };
  if (name) patchData.name = name;
  if (description !== null) patchData.description = description;
  if (vendorIdRaw !== null) patchData.vendor_id = vendorIdRaw.trim() || null;
  if (priceRaw !== null && !Number.isNaN(parseFloat(priceRaw))) patchData.price = parseFloat(priceRaw);
  if (minimumOrderRaw !== null && !Number.isNaN(parseInt(minimumOrderRaw, 10))) {
    patchData.minimum_order = parseInt(minimumOrderRaw, 10);
  }
  if (unit) patchData.unit = unit;
  if (inStockRaw !== null) patchData.in_stock = parseBoolean(inStockRaw, true);
  if (isFeaturedRaw !== null) patchData.is_featured = parseBoolean(isFeaturedRaw, false);

  if (category) {
    const taxonomyError = await validateTaxonomy(category, subcategory || undefined, subSubcategory || undefined);
    if (taxonomyError) return NextResponse.json({ error: taxonomyError }, { status: 422 });
    patchData.category = category;
    patchData.subcategory = subcategory || 'General';
    patchData.sub_subcategory = subSubcategory || 'General';
  }

  if (specificationsRaw !== null) {
    try {
      patchData.specifications = JSON.parse(specificationsRaw);
    } catch {
      return NextResponse.json({ error: 'specifications must be valid JSON' }, { status: 422 });
    }
  }

  const { data: currentProduct } = await supabaseAdmin
    .from('products')
    .select('images')
    .eq('id', id)
    .single();

  const { data: product, error } = await supabaseAdmin
    .from('products')
    .update(patchData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[admin/products PATCH FORM]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (currentProduct?.images) {
    const removedUrls = currentProduct.images.filter((url: string) => !nextImages.includes(url));
    const { error: storageCleanupError } = await deleteStorageObjectsFromUrls(removedUrls);
    if (storageCleanupError) {
      console.error('[admin/products PATCH FORM] removed image storage cleanup', storageCleanupError);
    }
  }

  return NextResponse.json({ product });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id query param is required' }, { status: 400 });
  }

  const { data: product, error: selectError } = await supabaseAdmin
    .from('products')
    .select('images')
    .eq('id', id)
    .maybeSingle();

  if (selectError) {
    console.error('[admin/products DELETE] select', selectError);
    return NextResponse.json({ error: selectError.message }, { status: 500 });
  }

  const imageUrls = Array.isArray(product?.images) ? product.images : [];

  // Remove files from Storage (storage.objects) before deleting the product row so blobs are not orphaned.
  if (imageUrls.length > 0) {
    const { error: storageError } = await deleteStorageObjectsFromUrls(imageUrls);
    if (storageError) {
      return NextResponse.json(
        { error: `Could not delete product images from storage: ${storageError}` },
        { status: 500 },
      );
    }
  }

  const { error } = await supabaseAdmin.from('products').delete().eq('id', id);

  if (error) {
    console.error('[admin/products DELETE]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
