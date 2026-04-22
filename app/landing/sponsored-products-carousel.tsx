import Link from 'next/link';
import Image from 'next/image';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import type { SponsoredItem } from '@/lib/landing-data';

export default function SponsoredProductsCarousel({ items }: { items: SponsoredItem[] }) {
  if (!items?.length) return null;

  return (
    <section className="pt-3 md:pt-4 px-2 sm:px-4 md:px-6">
      <div className="max-w-[1500px] mx-auto rounded-2xl border border-slate-200 bg-white p-2.5 sm:p-3.5 md:p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-center gap-3">
          <span className="h-px w-10 bg-linear-to-r from-transparent to-amber-300" />
          <p className="rounded-full border border-amber-200 bg-linear-to-r from-amber-50 via-white to-amber-50 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-800 shadow-sm">
            Premium Picks
          </p>
          <span className="h-px w-10 bg-linear-to-l from-transparent to-amber-300" />
        </div>
        <Carousel opts={{ align: 'center', loop: items.length > 1 }}>
          <CarouselContent className="ml-0">
            {items.map((item, idx) => {
              const product = item.products;
              if (!product) return null;

              return (
                <CarouselItem key={item.id} className="pl-0 basis-full">
                  <Link
                    href={`/product/${product.id}`}
                    className="group block overflow-hidden rounded-xl border border-slate-200 bg-white transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="relative w-full aspect-1600/450 overflow-hidden">
                      <Image
                        src={item.banner_image_url}
                        alt={item.headline || product.name}
                        fill
                        priority={idx < 6}
                        unoptimized
                        sizes="(min-width: 1280px) 1500px, 100vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/50 via-black/15 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-3 md:p-4">
                        <p className="line-clamp-1 text-sm md:text-base font-semibold text-white drop-shadow">
                          {item.headline || 'Marketplace spotlight'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 p-3 md:p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <p className="line-clamp-1 text-base font-semibold text-slate-900">{product.name}</p>
                        <p className="text-xs text-slate-500">{product.subcategory || product.category}</p>
                      </div>
                      <span className="inline-flex h-9 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm text-white shrink-0">
                        {product.in_stock ? item.cta_label || 'View offer' : 'Out of stock'}
                      </span>
                    </div>
                  </Link>
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
}
