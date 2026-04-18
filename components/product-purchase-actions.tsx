'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ShoppingBag, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { setCheckoutLineItems, type CheckoutLineItem } from '@/lib/checkout-session';
import { addToCart } from '@/lib/cart-store';

export type ProductPurchaseActionsProps = {
  productId: string;
  name: string;
  unitPrice: number;
  minimumOrder: number;
  unit: string;
  inStock: boolean;
  vendorLabel: string;
  imageUrl?: string;
};

export function ProductPurchaseActions({
  productId,
  name,
  unitPrice,
  minimumOrder,
  unit,
  inStock,
  vendorLabel,
  imageUrl,
}: ProductPurchaseActionsProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(Math.max(1, minimumOrder));
  const [busy, setBusy] = useState(false);

  const clampQty = (n: number) => {
    if (!Number.isFinite(n) || n < minimumOrder) return minimumOrder;
    return Math.floor(n);
  };

  const handleBuyNow = () => {
    if (!inStock || busy) return;
    setBusy(true);
    const qty = clampQty(quantity);
    const line: CheckoutLineItem = {
      id: productId,
      name,
      vendor: vendorLabel,
      price: unitPrice,
      quantity: qty,
      image: imageUrl,
    };
    setCheckoutLineItems([line]);
    router.push('/checkout');
  };

  const handleAddToCart = async () => {
    if (!inStock) return;
    const qty = clampQty(quantity);
    try {
      await addToCart({
        id: productId,
        name,
        vendor: vendorLabel,
        price: unitPrice,
        quantity: qty,
        image: imageUrl,
        minQty: minimumOrder,
      });
      toast.success('Added to cart', {
        description: `${qty} ${unit} · ${name}`,
        action: {
          label: 'View cart',
          onClick: () => router.push('/cart'),
        },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not add to cart';
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
      <div className="space-y-2">
        <Label htmlFor="order-qty" className="text-slate-700">
          Order quantity ({unit})
        </Label>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            id="order-qty"
            type="number"
            min={minimumOrder}
            step={1}
            value={quantity}
            disabled={!inStock}
            onChange={(e) => setQuantity(clampQty(parseInt(e.target.value, 10) || minimumOrder))}
            className="max-w-[140px]"
          />
          <span className="text-xs text-slate-500">Minimum {minimumOrder} {unit}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          className="rounded-full border-slate-300 px-5"
          disabled={!inStock}
          onClick={handleAddToCart}
        >
          <ShoppingCart className="mr-2 h-4 w-4" aria-hidden />
          Add to cart
        </Button>
        <Button
          type="button"
          className="rounded-full px-5"
          disabled={!inStock || busy}
          onClick={handleBuyNow}
        >
          {busy ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              Redirecting…
            </>
          ) : (
            <>
              <ShoppingBag className="mr-2 h-4 w-4" aria-hidden />
              Buy now
            </>
          )}
        </Button>
        <Button asChild variant="outline" className="rounded-full px-5 border-slate-300">
          <Link href="/login">Request quotation</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full px-5 border-slate-300">
          <Link href="/login">Contact supplier</Link>
        </Button>
      </div>

      {!inStock && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-md px-3 py-2">
          This SKU is not available for immediate purchase. Use quotation or contact the supplier.
        </p>
      )}
    </div>
  );
}
