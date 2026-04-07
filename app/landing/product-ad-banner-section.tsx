'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'

import type { SponsoredItem, SponsoredProductSummary } from '@/lib/landing-data'

function formatProductPriceLabel(product: SponsoredProductSummary | null | undefined) {
  if (!product) return '$0.00'
  // Sponsored items currently provide a single price in this repo.
  return `$${product.price.toFixed(2)}`
}

export default function ProductAdBannerSection({ items }: { items: SponsoredItem[] }) {
  const [activeBannerIndex, setActiveBannerIndex] = React.useState(0)
  const [bannerFading, setBannerFading] = React.useState(false)
  const [promoBanners, setPromoBanners] = React.useState<SponsoredItem[]>([])

  React.useEffect(() => {
    // Initialize from server-provided items. (The design spec calls this "promo banners".)
    setPromoBanners(Array.isArray(items) ? items : [])
    setActiveBannerIndex(0)
  }, [items])

  const bannerItems = promoBanners.slice(0, 5)
  const activeBannerItem = bannerItems[activeBannerIndex % Math.max(bannerItems.length, 1)]
  const activeBannerProduct = activeBannerItem?.products
  const activeBannerImageUrl =
    activeBannerItem?.banner_image_url || activeBannerProduct?.images?.[0] || ''

  React.useEffect(() => {
    if (promoBanners.length <= 1) return

    const ROTATE_MS = 7500
    const FADE_MS = 350
    const timeouts: number[] = []

    const intervalId = window.setInterval(() => {
      setBannerFading(true)

      const t1 = window.setTimeout(() => {
        setActiveBannerIndex((prev) => (prev + 1) % promoBanners.length)
      }, FADE_MS)

      // After swapping image, quickly "unfade".
      const t2 = window.setTimeout(() => {
        setBannerFading(false)
      }, FADE_MS + 20)

      timeouts.push(t1, t2)
    }, ROTATE_MS)

    return () => {
      window.clearInterval(intervalId)
      timeouts.forEach((t) => window.clearTimeout(t))
    }
  }, [promoBanners.length])

  return (
    <section className="bg-background py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!activeBannerProduct ? (
          <div className="rounded-2xl border border-border bg-card p-3 md:p-4 shadow-sm min-h-[150px] md:h-[210px] flex flex-col items-center justify-center text-center">
            <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-foreground mb-1.5 md:mb-2 leading-tight">
              Sponsored product spots
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              No active sponsored banners yet. Add them in <span className="font-medium text-foreground">Admin → Adds</span> to feature products here.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-3 md:p-4 shadow-sm flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 md:gap-4 items-center">
              <div className="md:col-span-4 flex flex-col justify-center order-2 md:order-1">
                <div className="flex gap-2 mb-2">
                  <span className="text-[11px] uppercase tracking-wider bg-primary/10 text-primary px-2 py-1 rounded-full">
                    Featured ad
                  </span>
                  <span className="text-[11px] uppercase tracking-wider bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-1 rounded-full">
                    Verified suppliers
                  </span>
                </div>

                <h1 className="text-base sm:text-lg md:text-xl font-extrabold text-foreground mb-1 line-clamp-1 leading-tight">
                  {activeBannerProduct.name}
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground mb-2 max-w-xl line-clamp-1">
                  {activeBannerItem?.headline?.trim()
                    ? activeBannerItem.headline
                    : `Top pick in ${activeBannerProduct.subcategory || activeBannerProduct.category}.`}
                </p>

                <div className="flex items-center gap-2 sm:gap-2.5 mb-2">
                  <span className="text-base sm:text-lg font-bold text-foreground">
                    {formatProductPriceLabel(activeBannerProduct)}
                  </span>
                  <span className="text-xs bg-accent text-accent-foreground px-2.5 py-1 rounded-full">
                    {activeBannerProduct.subcategory || activeBannerProduct.category}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-1.5">
                  <Link
                    href={`/product/${activeBannerProduct.id}`}
                    className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-3 py-2 text-xs sm:text-sm font-semibold hover:bg-primary/90 transition"
                  >
                    {activeBannerItem?.cta_label?.trim() || 'View product'}
                  </Link>
                  <Link
                    href={`/product/${activeBannerProduct.id}`}
                    className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-3 py-2 text-xs sm:text-sm font-medium text-foreground hover:bg-accent transition"
                  >
                    See details
                  </Link>
                </div>

                <p className="hidden md:block text-[11px] text-muted-foreground">
                  Compare suppliers, request quotes, and order with confidence.
                </p>
              </div>

              <div className="md:col-span-8 order-1 md:order-2">
                <div className="relative aspect-[1600/450] w-full overflow-hidden rounded-xl border border-border bg-muted/30">
                  <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-black/10 via-transparent to-black/5" />
                  {activeBannerImageUrl ? (
                    <Image
                      src={activeBannerImageUrl}
                      alt={activeBannerProduct.name}
                      fill
                      sizes="(min-width: 1024px) 1500px, 100vw"
                      className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ease-in-out ${
                        bannerFading ? 'opacity-0' : 'opacity-100'
                      }`}
                    />
                  ) : null}
                </div>
              </div>
            </div>

            {bannerItems.length > 1 ? (
              <div className="mt-2 md:mt-2.5 flex items-center justify-between gap-2">
                <p className="text-[11px] text-muted-foreground">
                  Banner {activeBannerIndex + 1} of {bannerItems.length}
                </p>
                <div className="flex items-center gap-1.5">
                  {bannerItems.map((_, i) => {
                    const isActive = i === activeBannerIndex
                    return (
                      <button
                        key={i}
                        type="button"
                        aria-label={`Show banner ${i + 1}`}
                        onClick={() => setActiveBannerIndex(i)}
                        className={`h-2.5 rounded-full transition ${
                          isActive ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/40 hover:bg-muted-foreground/70'
                        }`}
                      />
                    )
                  })}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  )
}

