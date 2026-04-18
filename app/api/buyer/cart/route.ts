import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAuthedBuyer } from '@/lib/api/buyer-auth';
import { resolveCoupon } from '@/lib/cart-coupons';
import { getVendorDisplayName } from '@/lib/vendor-display';
import type { CartLineItem, CartState } from '@/lib/cart-types';

type ListKind = 'cart' | 'saved';

const MAX_QTY = 999;

function asString(v: unknown) {
  return typeof v === 'string' ? v : '';
}

function clampQtyForProduct(qty: number, minOrder: number): number {
  const q = Math.floor(qty);
  if (!Number.isFinite(q) || q < 1) return Math.max(1, minOrder);
  return Math.min(MAX_QTY, Math.max(minOrder, q));
}

function skuFromSpecs(specs: unknown): string | undefined {
  if (!specs || typeof specs !== 'object' || Array.isArray(specs)) return undefined;
  const o = specs as Record<string, unknown>;
  const v = o.SKU ?? o.sku;
  return typeof v === 'string' ? v : undefined;
}

function productToLine(product: Record<string, unknown>, quantity: number): CartLineItem {
  const id = String(product.id ?? '');
  const minOrder = Math.max(1, Math.floor(Number(product.minimum_order) || 1));
  const images = Array.isArray(product.images) ? (product.images as string[]) : [];
  const image = images[0];
  return {
    id,
    name: String(product.name ?? ''),
    vendor: getVendorDisplayName((product.vendor_id as string | null) ?? null),
    price: Number(product.price),
    quantity: clampQtyForProduct(quantity, minOrder),
    image,
    sku: skuFromSpecs(product.specifications),
    minQty: minOrder,
    maxQty: MAX_QTY,
    addedAt: Date.now(),
  };
}

async function fetchProduct(
  productId: string,
): Promise<{ ok: true; product: Record<string, unknown> } | { ok: false; notFound?: boolean }> {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('id, name, price, minimum_order, unit, images, vendor_id, specifications, in_stock')
    .eq('id', productId)
    .maybeSingle();
  if (error) {
    console.error('[buyer/cart fetchProduct]', error);
    return { ok: false };
  }
  if (!data) return { ok: false, notFound: true };
  return { ok: true, product: data as Record<string, unknown> };
}

async function loadCartState(buyerId: string): Promise<CartState> {
  const { data: rows, error: rowErr } = await supabaseAdmin
    .from('cart_items')
    .select('product_id, quantity, list_kind')
    .eq('buyer_id', buyerId);

  if (rowErr) {
    console.error('[buyer/cart loadCartState rows]', rowErr);
    throw rowErr;
  }

  const list = rows ?? [];
  const ids = [...new Set(list.map((r) => r.product_id as string))];
  if (ids.length === 0) {
    const { data: meta } = await supabaseAdmin
      .from('buyer_cart_meta')
      .select('coupon_code')
      .eq('buyer_id', buyerId)
      .maybeSingle();
    return { items: [], saved: [], coupon: resolveCoupon(meta?.coupon_code ?? null) };
  }

  const { data: products, error: pErr } = await supabaseAdmin
    .from('products')
    .select('id, name, price, minimum_order, unit, images, vendor_id, specifications, in_stock')
    .in('id', ids);

  if (pErr) {
    console.error('[buyer/cart loadCartState products]', pErr);
    throw pErr;
  }

  const byId = new Map((products ?? []).map((p) => [p.id as string, p as Record<string, unknown>]));

  const items: CartLineItem[] = [];
  const saved: CartLineItem[] = [];

  for (const row of list) {
    const pid = row.product_id as string;
    const p = byId.get(pid);
    if (!p) continue;
    const line = productToLine(p, row.quantity as number);
    if (row.list_kind === 'saved') saved.push(line);
    else items.push(line);
  }

  const { data: meta } = await supabaseAdmin
    .from('buyer_cart_meta')
    .select('coupon_code')
    .eq('buyer_id', buyerId)
    .maybeSingle();

  return { items, saved, coupon: resolveCoupon(meta?.coupon_code ?? null) };
}

async function upsertRow(
  buyerId: string,
  productId: string,
  listKind: ListKind,
  quantity: number,
) {
  const { error } = await supabaseAdmin.from('cart_items').upsert(
    {
      buyer_id: buyerId,
      product_id: productId,
      list_kind: listKind,
      quantity,
    },
    { onConflict: 'buyer_id,product_id,list_kind' },
  );
  if (error) throw error;
}

async function deleteRow(buyerId: string, productId: string, listKind: ListKind) {
  const { error } = await supabaseAdmin
    .from('cart_items')
    .delete()
    .eq('buyer_id', buyerId)
    .eq('product_id', productId)
    .eq('list_kind', listKind);
  if (error) throw error;
}

async function getRowQty(
  buyerId: string,
  productId: string,
  listKind: ListKind,
): Promise<number | null> {
  const { data } = await supabaseAdmin
    .from('cart_items')
    .select('quantity')
    .eq('buyer_id', buyerId)
    .eq('product_id', productId)
    .eq('list_kind', listKind)
    .maybeSingle();
  if (!data) return null;
  return data.quantity as number;
}

export async function GET() {
  const auth = await getAuthedBuyer();
  if (!auth.ok) return auth.response;

  try {
    const state = await loadCartState(auth.buyerId);
    return NextResponse.json({ state });
  } catch (e) {
    console.error('[buyer/cart GET]', e);
    return NextResponse.json({ error: 'Failed to load cart' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await getAuthedBuyer();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const op = asString((body as Record<string, unknown>).op).trim();
  const buyerId = auth.buyerId;

  try {
    switch (op) {
      case 'add': {
        const productId = asString((body as Record<string, unknown>).productId).trim();
        const qtyRaw = Number((body as Record<string, unknown>).quantity);
        const listKind = (asString((body as Record<string, unknown>).listKind).trim() || 'cart') as ListKind;
        if (listKind !== 'cart' && listKind !== 'saved') {
          return NextResponse.json({ error: 'Invalid listKind' }, { status: 400 });
        }
        if (!productId) return NextResponse.json({ error: 'Missing productId' }, { status: 400 });

        const fp = await fetchProduct(productId);
        if (!fp.ok) {
          if (fp.notFound) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
          }
          return NextResponse.json({ error: 'Product lookup failed' }, { status: 500 });
        }
        if (!fp.product.in_stock) {
          return NextResponse.json({ error: 'Product is not available' }, { status: 409 });
        }

        const minOrder = Math.max(1, Math.floor(Number(fp.product.minimum_order) || 1));
        const addQty = clampQtyForProduct(Number.isFinite(qtyRaw) ? qtyRaw : minOrder, minOrder);

        if (listKind === 'cart') {
          await deleteRow(buyerId, productId, 'saved');
          const existing = await getRowQty(buyerId, productId, 'cart');
          const nextQty = existing != null ? clampQtyForProduct(existing + addQty, minOrder) : addQty;
          await upsertRow(buyerId, productId, 'cart', nextQty);
        } else {
          const existing = await getRowQty(buyerId, productId, 'saved');
          const nextQty = existing != null ? clampQtyForProduct(existing + addQty, minOrder) : addQty;
          await upsertRow(buyerId, productId, 'saved', nextQty);
        }

        const state = await loadCartState(buyerId);
        return NextResponse.json({ state });
      }

      case 'setQuantity': {
        const productId = asString((body as Record<string, unknown>).productId).trim();
        const qtyRaw = Number((body as Record<string, unknown>).quantity);
        const listKind = (asString((body as Record<string, unknown>).listKind).trim() || 'cart') as ListKind;
        if (!productId) return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
        if (listKind !== 'cart' && listKind !== 'saved') {
          return NextResponse.json({ error: 'Invalid listKind' }, { status: 400 });
        }

        const q = Math.floor(qtyRaw);
        if (!Number.isFinite(q) || q <= 0) {
          await deleteRow(buyerId, productId, listKind);
        } else {
          const fp = await fetchProduct(productId);
          if (!fp.ok) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
          }
          const minOrder = Math.max(1, Math.floor(Number(fp.product.minimum_order) || 1));
          const nextQty = clampQtyForProduct(q, minOrder);
          await upsertRow(buyerId, productId, listKind, nextQty);
        }

        const state = await loadCartState(buyerId);
        return NextResponse.json({ state });
      }

      case 'remove': {
        const productId = asString((body as Record<string, unknown>).productId).trim();
        const listKind = (asString((body as Record<string, unknown>).listKind).trim() || 'cart') as ListKind;
        if (!productId) return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
        await deleteRow(buyerId, productId, listKind);
        const state = await loadCartState(buyerId);
        return NextResponse.json({ state });
      }

      case 'clear': {
        await supabaseAdmin.from('cart_items').delete().eq('buyer_id', buyerId).eq('list_kind', 'cart');
        await supabaseAdmin.from('buyer_cart_meta').upsert({
          buyer_id: buyerId,
          coupon_code: null,
        });
        const state = await loadCartState(buyerId);
        return NextResponse.json({ state });
      }

      case 'saveForLater': {
        const productId = asString((body as Record<string, unknown>).productId).trim();
        if (!productId) return NextResponse.json({ error: 'Missing productId' }, { status: 400 });

        const fp = await fetchProduct(productId);
        if (!fp.ok) {
          return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        const qty = await getRowQty(buyerId, productId, 'cart');
        if (qty == null) {
          const state = await loadCartState(buyerId);
          return NextResponse.json({ state });
        }

        const savedExisting = await getRowQty(buyerId, productId, 'saved');
        await deleteRow(buyerId, productId, 'cart');
        const minOrder = Math.max(1, Math.floor(Number(fp.product.minimum_order) || 1));
        const merged =
          savedExisting != null
            ? clampQtyForProduct(savedExisting + qty, minOrder)
            : clampQtyForProduct(qty, minOrder);
        await upsertRow(buyerId, productId, 'saved', merged);

        const state = await loadCartState(buyerId);
        return NextResponse.json({ state });
      }

      case 'moveToCart': {
        const productId = asString((body as Record<string, unknown>).productId).trim();
        if (!productId) return NextResponse.json({ error: 'Missing productId' }, { status: 400 });

        const qty = await getRowQty(buyerId, productId, 'saved');
        if (qty == null) {
          const state = await loadCartState(buyerId);
          return NextResponse.json({ state });
        }

        const fp = await fetchProduct(productId);
        if (!fp.ok) {
          const state = await loadCartState(buyerId);
          return NextResponse.json({ state });
        }

        await deleteRow(buyerId, productId, 'saved');
        const minOrder = Math.max(1, Math.floor(Number(fp.product.minimum_order) || 1));
        const cartExisting = await getRowQty(buyerId, productId, 'cart');
        const nextQty =
          cartExisting != null
            ? clampQtyForProduct(cartExisting + qty, minOrder)
            : clampQtyForProduct(qty, minOrder);
        await upsertRow(buyerId, productId, 'cart', nextQty);

        const state = await loadCartState(buyerId);
        return NextResponse.json({ state });
      }

      case 'removeSaved': {
        const productId = asString((body as Record<string, unknown>).productId).trim();
        if (!productId) return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
        await deleteRow(buyerId, productId, 'saved');
        const state = await loadCartState(buyerId);
        return NextResponse.json({ state });
      }

      case 'applyCoupon': {
        const code = asString((body as Record<string, unknown>).code).trim();
        if (!code) {
          return NextResponse.json({ error: 'Enter a promo code.' }, { status: 400 });
        }
        const coupon = resolveCoupon(code);
        if (!coupon) {
          return NextResponse.json({ error: 'That code isn’t valid.' }, { status: 400 });
        }
        await supabaseAdmin.from('buyer_cart_meta').upsert({
          buyer_id: buyerId,
          coupon_code: coupon.code,
        });
        const state = await loadCartState(buyerId);
        return NextResponse.json({ state });
      }

      case 'removeCoupon': {
        await supabaseAdmin.from('buyer_cart_meta').upsert({
          buyer_id: buyerId,
          coupon_code: null,
        });
        const state = await loadCartState(buyerId);
        return NextResponse.json({ state });
      }

      case 'mergeGuest': {
        const rawItems = (body as Record<string, unknown>).items;
        if (!Array.isArray(rawItems)) {
          return NextResponse.json({ error: 'mergeGuest requires items[]' }, { status: 400 });
        }

        const rolled = new Map<string, { productId: string; quantity: number; listKind: ListKind }>();
        for (const entry of rawItems) {
          if (!entry || typeof entry !== 'object') continue;
          const o = entry as Record<string, unknown>;
          const productId = asString(o.productId).trim();
          const q = Math.floor(Number(o.quantity));
          const lk = (asString(o.listKind).trim() || 'cart') as ListKind;
          if (!productId || !Number.isFinite(q) || q < 1) continue;
          if (lk !== 'cart' && lk !== 'saved') continue;
          const key = `${productId}:${lk}`;
          const prev = rolled.get(key);
          rolled.set(key, {
            productId,
            quantity: (prev?.quantity ?? 0) + q,
            listKind: lk,
          });
        }

        for (const { productId, quantity: qSum, listKind: lk } of rolled.values()) {
          const fp = await fetchProduct(productId);
          if (!fp.ok) continue;
          if (!fp.product.in_stock) continue;
          const minOrder = Math.max(1, Math.floor(Number(fp.product.minimum_order) || 1));
          const addQty = clampQtyForProduct(qSum, minOrder);

          if (lk === 'cart') {
            await deleteRow(buyerId, productId, 'saved');
            const existing = await getRowQty(buyerId, productId, 'cart');
            const nextQty = existing != null ? clampQtyForProduct(existing + addQty, minOrder) : addQty;
            await upsertRow(buyerId, productId, 'cart', nextQty);
          } else {
            const existing = await getRowQty(buyerId, productId, 'saved');
            const nextQty = existing != null ? clampQtyForProduct(existing + addQty, minOrder) : addQty;
            await upsertRow(buyerId, productId, 'saved', nextQty);
          }
        }

        const couponCode = asString((body as Record<string, unknown>).couponCode).trim();
        if (couponCode && resolveCoupon(couponCode)) {
          await supabaseAdmin.from('buyer_cart_meta').upsert({
            buyer_id: buyerId,
            coupon_code: couponCode.toUpperCase(),
          });
        }

        const state = await loadCartState(buyerId);
        return NextResponse.json({ state });
      }

      default:
        return NextResponse.json({ error: 'Unknown op' }, { status: 400 });
    }
  } catch (e) {
    console.error('[buyer/cart POST]', op, e);
    return NextResponse.json({ error: 'Cart update failed' }, { status: 500 });
  }
}
