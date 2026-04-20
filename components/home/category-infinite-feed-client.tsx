'use client';

import type { FeedSection } from '@/lib/landing-data';
import CategoryInfiniteFeed from '@/app/landing/category-infinite-feed';

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

