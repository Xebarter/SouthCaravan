'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Package, ShoppingBag, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Money } from '@/components/money';
import { addToCart } from '@/lib/cart-store';
import { setCheckoutLineItems, type CheckoutLineItem } from '@/lib/checkout-session';
import { cn } from '@/lib/utils';

type SupplierCardProduct = {
  id: string;
  name: string;
  price: number;
  minimumOrder: number;
  unit: string;
  imageUrl: string;
  inStock: boolean;
  category: string;
  subcategory: string;
};

export function SupplierProductCard({
  product,
  vendorLabel,
}: {
  product: SupplierCardProduct;
  vendorLabel: string;
}) {
  const router = useRouter();
  const href = `/product/${encodeURIComponent(product.id)}`;
  const stockLabel = product.inStock ? 'Available' : 'Unavailable';

  const handleBuyNow = async () => {
    if (!product.inStock) return;
    const qty = Math.max(1, Math.floor(product.minimumOrder || 1));
    const line: CheckoutLineItem = {
      id: product.id,
      name: product.name,
      vendor: vendorLabel,
      price: Number(product.price || 0),
      quantity: qty,
      image: product.imageUrl || undefined,
    };
    setCheckoutLineItems([line]);
    router.push('/checkout');
  };

  const handleAddToCart = async () => {
    if (!product.inStock) return;
    const qty = Math.max(1, Math.floor(product.minimumOrder || 1));
    try {
      await addToCart({
        id: product.id,
        name: product.name,
        vendor: vendorLabel,
        price: Number(product.price || 0),
        quantity: qty,
        image: product.imageUrl || undefined,
        minQty: qty,
      });
      toast.success('Added to cart');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not add to cart';
      toast.error(msg);
    }
  };

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm',
        'transition-shadow hover:shadow-md',
      )}
    >
      <Link href={href} className="block">
        <div className="relative h-44 w-full bg-slate-100">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name || 'Product image'}
              fill
              unoptimized
              sizes="33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package className="h-10 w-10 text-slate-400" />
            </div>
          )}

          <div className="absolute left-3 top-3 flex items-center gap-2">
            <Badge
              variant={product.inStock ? 'success' : 'secondary'}
              className="rounded-full"
            >
              {stockLabel}
            </Badge>
          </div>
        </div>
      </Link>

      <div className="p-4">
        <div className="space-y-1.5">
          <Link href={href} className="block">
            <p className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2 hover:underline">
              {product.name || 'Untitled product'}
            </p>
          </Link>

          <p className="text-xs text-slate-500 line-clamp-1">
            {[product.category, product.subcategory].filter(Boolean).join(' · ') || '—'}
          </p>
        </div>

        <div className="mt-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-slate-500">Price</p>
            <p className="text-sm font-semibold text-slate-900">
              <Money amountUSD={Number(product.price ?? 0)} />
              <span className="text-xs font-medium text-slate-500"> / {product.unit || 'unit'}</span>
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              MOQ {Math.max(1, Math.floor(product.minimumOrder || 1))} {product.unit || 'unit'}
            </p>
          </div>

          <Button asChild variant="outline" size="sm" className="shrink-0 rounded-xl">
            <Link href={href}>Details</Link>
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button
            type="button"
            className="h-10 rounded-xl"
            disabled={!product.inStock}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void handleBuyNow();
            }}
          >
            <ShoppingBag className="mr-2 h-4 w-4" aria-hidden />
            Buy now
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-xl border-slate-300"
            disabled={!product.inStock}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void handleAddToCart();
            }}
          >
            <ShoppingCart className="mr-2 h-4 w-4" aria-hidden />
            Add to cart
          </Button>
        </div>
      </div>
    </div>
  );
}

