import { NextRequest, NextResponse } from 'next/server';
import { getLandingCategoryFeedSections } from '@/lib/landing-data';

export const revalidate = 60;

const MAX_PAGE_SIZE = 6;
const MAX_PER_CATEGORY = 6;

function parsePositiveInt(value: string | null, fallback: number, max: number) {
  const parsed = Number.parseInt(value ?? '', 10);
  if (Number.isNaN(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(0, Number.parseInt(searchParams.get('page') ?? '0', 10) || 0);
    const pageSize = parsePositiveInt(searchParams.get('pageSize'), 3, MAX_PAGE_SIZE);
    const perCategory = parsePositiveInt(searchParams.get('perCategory'), 4, MAX_PER_CATEGORY);

    const { sections, hasMore } = await getLandingCategoryFeedSections({ page, pageSize, perCategory });

    return NextResponse.json(
      {
        sections,
        hasMore,
        page,
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=30',
        },
      },
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'Failed to load landing feed' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
