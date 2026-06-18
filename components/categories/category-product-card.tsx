import Link from 'next/link';
import { Package, Sparkles, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Money } from '@/components/money';
import type { FeedProduct } from '@/lib/landing-data';
import { cn } from '@/lib/utils';

function getVendorLabel(vendorId: string | null) {
  if (!vendorId) return 'Verified supplier';
  return `Supplier ${vendorId.slice(0, 8)}`;
}

export function CategoryProductCard({
  product,
  priority = false,
  className,
  imageFit = 'cover',
}: {
  product: FeedProduct;
  priority?: boolean;
  className?: string;
  /** `cover` fills the frame (center-cropped). `contain` shows the full image with letterboxing. */
  imageFit?: 'cover' | 'contain';
}) {
  const isService = product.item_kind === 'service';
  const href = product.href ?? `/product/${product.id}`;
  const baseCurrency = (product.price_currency ?? 'USD').toUpperCase();

  return (
    <Link href={href} className={cn('group block h-full', className)}>
      <Card className="h-full overflow-hidden rounded-lg border border-border/60 bg-card py-0 gap-0 shadow-none transition-shadow hover:shadow-sm">
        <CardContent className="flex h-full flex-col p-0">
          <div className="relative aspect-square w-full overflow-hidden bg-muted/30">
            {product.images?.[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.images[0]}
                alt={product.name}
                className={cn(
                  'h-full w-full object-center transition-transform duration-300 group-hover:scale-[1.02]',
                  imageFit === 'cover' ? 'object-cover' : 'object-contain',
                )}
                loading={priority ? 'eager' : 'lazy'}
                decoding="async"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                {isService ? (
                  <Sparkles className="h-8 w-8 text-sky-600/70" />
                ) : (
                  <Package className="h-8 w-8 text-muted-foreground/50" />
                )}
              </div>
            )}
            {product.is_featured ? (
              <Badge className="absolute left-2 top-2 gap-1 border-0 bg-amber-500/95 text-white text-[10px]">
                <Star className="h-3 w-3 fill-current" />
                Featured
              </Badge>
            ) : null}
          </div>

          <div className="flex flex-1 flex-col gap-1.5 p-2">
            <div className="flex items-start gap-1 min-h-[2.25rem]">
              {isService ? (
                <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5 py-0 h-5">
                  Service
                </Badge>
              ) : null}
              <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">{product.name}</p>
            </div>

            <div className="mt-auto space-y-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-base font-bold tabular-nums text-foreground">
                  <Money amount={Number(product.price)} baseCurrency={baseCurrency} />
                </p>
                <span className="text-[11px] text-muted-foreground text-right shrink-0">
                  {isService
                    ? product.unit === 'hour'
                      ? 'per hour'
                      : 'from'
                    : `MOQ ${product.minimum_order} ${product.unit}`}
                </span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {isService ? product.subcategory : getVendorLabel(product.vendor_id)}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border/50 bg-muted/20 px-2 py-1.5">
            <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
              {product.is_featured ? 'Top pick' : isService ? 'Service' : 'In catalog'}
            </span>
            <span
              className={cn(
                'text-xs font-semibold',
                product.in_stock ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              {isService
                ? product.in_stock
                  ? 'View service →'
                  : 'Unavailable'
                : product.in_stock
                  ? 'View product →'
                  : 'Out of stock'}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
