import { NextRequest, NextResponse } from 'next/server';
import {
  CATEGORIES_PAGE_MAX_PAGE_SIZE,
  CATEGORIES_PAGE_MAX_PER_CATEGORY,
  getCategoriesPageFeedSections,
} from '@/lib/landing-data';

export const revalidate = 60;

function parsePositiveInt(value: string | null, fallback: number, max: number) {
  const parsed = Number.parseInt(value ?? '', 10);
  if (Number.isNaN(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(0, Number.parseInt(searchParams.get('page') ?? '0', 10) || 0);
    const pageSize = parsePositiveInt(
      searchParams.get('pageSize'),
      4,
      CATEGORIES_PAGE_MAX_PAGE_SIZE,
    );
    const perCategory = parsePositiveInt(
      searchParams.get('perCategory'),
      12,
      CATEGORIES_PAGE_MAX_PER_CATEGORY,
    );

    const { sections, hasMore } = await getCategoriesPageFeedSections({
      page,
      pageSize,
      perCategory,
    });

    return NextResponse.json(
      { sections, hasMore, page },
      {
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=30',
        },
      },
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to load categories feed';
    return NextResponse.json({ error: message }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
