'use client';

import dynamic from 'next/dynamic';
import type { FeedSection } from '@/lib/landing-data';

const CategoryInfiniteFeed = dynamic(() => import('@/app/landing/category-infinite-feed'), {
  ssr: false,
  loading: () => (
    <section className="px-2 sm:px-4 md:px-6 py-6 md:py-8 bg-[#f3f5f7]">
      <div className="max-w-[1500px] mx-auto space-y-4">
        {Array.from({ length: 2 }).map((_, sectionIdx) => (
          <div
            key={sectionIdx}
            className="bg-white border border-slate-200 rounded-xl px-4 md:px-6 py-5 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 w-56 rounded bg-slate-200 animate-pulse" />
              <div className="h-4 w-20 rounded bg-slate-200 animate-pulse" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm"
                >
                  <div className="aspect-square bg-slate-200 animate-pulse" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 w-4/5 rounded bg-slate-200 animate-pulse" />
                    <div className="h-5 w-1/2 rounded bg-slate-200 animate-pulse" />
                    <div className="h-3 w-2/3 rounded bg-slate-200 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  ),
});

export function CategoryInfiniteFeedClient({
  initialSections,
  initialHasMore,
  initialPage,
}: {
  initialSections: FeedSection[];
  initialHasMore: boolean;
  initialPage?: number;
}) {
  return (
    <CategoryInfiniteFeed
      initialSections={initialSections}
      initialHasMore={initialHasMore}
      initialPage={initialPage}
    />
  );
}

