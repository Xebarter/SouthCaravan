'use client'

import * as React from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type ProductImageGalleryProps = {
  images: string[]
  alt: string
  className?: string
  /** How many thumbnails to show under the hero (excluding hero). */
  maxThumbs?: number
}

export function ProductImageGallery({
  images,
  alt,
  className,
  maxThumbs = 4,
}: ProductImageGalleryProps) {
  const safeImages = React.useMemo(() => (images ?? []).filter(Boolean), [images])
  const hasImages = safeImages.length > 0

  const [activeIndex, setActiveIndex] = React.useState(0)
  const [expanded, setExpanded] = React.useState(false)

  React.useEffect(() => {
    if (!expanded) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExpanded(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [expanded])

  const clampIndex = React.useCallback(
    (idx: number) => Math.max(0, Math.min(idx, Math.max(0, safeImages.length - 1))),
    [safeImages.length],
  )

  const goPrev = React.useCallback(() => {
    setActiveIndex((idx) => clampIndex(idx - 1))
  }, [clampIndex])

  const goNext = React.useCallback(() => {
    setActiveIndex((idx) => clampIndex(idx + 1))
  }, [clampIndex])

  const openExpandedAt = React.useCallback(
    (idx: number) => {
      setActiveIndex(clampIndex(idx))
      setExpanded(true)
    },
    [clampIndex],
  )

  const thumbs = safeImages.slice(1, 1 + maxThumbs)
  const remainingCount = Math.max(0, safeImages.length - 1 - thumbs.length)

  if (!hasImages) {
    return (
      <div className={cn('w-full', className)}>
        <div className="w-full h-[340px] md:h-[440px] rounded-lg bg-slate-100" />
      </div>
    )
  }

  return (
    <div className={cn('w-full space-y-3', className)}>
      <div className="group relative w-full h-[340px] md:h-[440px] rounded-lg overflow-hidden bg-slate-100">
        <Image
          src={safeImages[activeIndex]}
          alt={alt}
          fill
          priority
          unoptimized
          sizes="(min-width: 1024px) 58vw, 100vw"
          className="object-cover"
        />

        {safeImages.length > 1 && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 text-slate-900 shadow-lg ring-1 ring-black/10 backdrop-blur hover:bg-white focus-visible:ring-2 focus-visible:ring-sky-500 transition"
              onClick={goPrev}
              disabled={activeIndex <= 0}
              aria-label="Previous image"
            >
              <ChevronLeft />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 text-slate-900 shadow-lg ring-1 ring-black/10 backdrop-blur hover:bg-white focus-visible:ring-2 focus-visible:ring-sky-500 transition"
              onClick={goNext}
              disabled={activeIndex >= safeImages.length - 1}
              aria-label="Next image"
            >
              <ChevronRight />
            </Button>
          </>
        )}
      </div>

      {thumbs.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {thumbs.map((src, idx) => {
            const absoluteIndex = idx + 1
            const isLastThumbWithMore = idx === thumbs.length - 1 && remainingCount > 0
            return (
              <button
                key={`${src}-grid-${idx}`}
                type="button"
                className="group relative h-20 w-full rounded-md overflow-hidden bg-slate-100 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-sky-500"
                onClick={() => openExpandedAt(absoluteIndex)}
                aria-label={`Expand image ${absoluteIndex + 1}`}
              >
                <Image
                  src={src}
                  alt={`${alt} thumbnail ${absoluteIndex + 1}`}
                  fill
                  unoptimized
                  sizes="20vw"
                  className="object-cover"
                />
                {isLastThumbWithMore && (
                  <div className="absolute inset-0 grid place-items-center bg-black/55 text-white text-sm font-semibold">
                    +{remainingCount}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}

      {expanded && (
        <div
          className="fixed inset-0 z-50 bg-black/80"
          onClick={() => setExpanded(false)}
          role="button"
          tabIndex={-1}
          aria-label="Collapse expanded image"
        >
          <div className="absolute inset-0 grid place-items-center p-4">
            <div className="relative w-[min(96vw,1100px)] h-[min(92vh,820px)]">
              <Image
                src={safeImages[activeIndex]}
                alt={`${alt} — expanded image ${activeIndex + 1}`}
                fill
                unoptimized
                sizes="96vw"
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

