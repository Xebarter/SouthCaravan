import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Package, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Money } from '@/components/money';
import type { LandingProduct } from '@/lib/landing-data';

type Props = {
  products: LandingProduct[];
};

export function FeaturedPicksCard({ products }: Props) {
  const heroProducts = products.slice(0, 5);
  const spotlight = heroProducts[0];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <Link
        href="/featured"
        className="group/header flex items-center justify-between gap-3 p-4 sm:p-5 border-b border-slate-100 hover:bg-slate-50/80 transition-colors"
      >
        <div className="min-w-0 flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500 fill-amber-500 shrink-0" />
            <p className="text-sm font-semibold text-slate-950 group-hover/header:text-sky-900 transition-colors">
              Featured picks
            </p>
          </div>
        <span className="inline-flex items-center gap-1 text-sm font-medium text-sky-800 shrink-0">
          All
          <ArrowRight className="h-4 w-4 transition-transform group-hover/header:translate-x-0.5" />
        </span>
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
        <Link
          href={spotlight ? `/product/${spotlight.id}` : '/featured'}
          className="group block border-b md:border-b-0 md:border-r border-slate-100"
        >
          <div className="p-2 sm:p-3">
            <div className="relative w-full overflow-hidden rounded-lg bg-slate-100 aspect-[4/3] sm:aspect-[5/4] lg:aspect-[3/2]">
              {spotlight?.images?.[0] ? (
                <Image
                  src={spotlight.images[0]}
                  alt={spotlight.name}
                  fill
                  priority
                  fetchPriority="high"
                  unoptimized
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.02]"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <Package className="w-12 h-12 text-slate-400" />
                </div>
              )}
              <Badge className="absolute left-3 top-3 border-0 bg-amber-500/95 text-white gap-1">
                <Star className="h-3 w-3 fill-current" />
                Spotlight
              </Badge>
            </div>

            <div className="mt-3 space-y-1.5">
              <p className="text-base sm:text-lg font-semibold text-slate-950 line-clamp-1">
                {spotlight?.name ?? 'Featured product'}
              </p>
              <div className="flex items-center justify-between gap-3">
                <Badge variant="outline" className="border-slate-300 bg-white">
                  {spotlight?.subcategory ?? spotlight?.category ?? 'Category'}
                </Badge>
                <p className="text-base font-semibold text-slate-950">
                  <Money amountUSD={Number(spotlight?.price ?? 0)} />
                </p>
              </div>
            </div>
          </div>
        </Link>

        <div className="grid grid-cols-1 sm:grid-cols-2">
          {heroProducts.slice(1).map((product) => (
            <Link
              key={product.id}
              href={`/product/${product.id}`}
              className="group block border-t sm:border-t-0 border-slate-100"
            >
              <div className="p-2 sm:p-2.5">
                <div className="relative w-full overflow-hidden rounded-lg bg-slate-100 aspect-square">
                  {product.images?.[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      unoptimized
                      sizes="(min-width: 640px) 25vw, 100vw"
                      className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Package className="w-8 h-8 text-slate-400" />
                    </div>
                  )}
                </div>
                <div className="mt-3 space-y-1.5">
                  <p className="text-sm font-semibold text-slate-950 line-clamp-1">{product.name}</p>
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant="outline"
                      className="text-[11px] border-slate-300 bg-slate-50 max-w-[70%] truncate"
                    >
                      {product.subcategory || product.category}
                    </Badge>
                    <p className="text-sm font-semibold text-slate-950 whitespace-nowrap">
                      <Money amountUSD={Number(product.price)} />
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
