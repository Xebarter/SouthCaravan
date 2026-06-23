import { NextRequest, NextResponse } from 'next/server';
import { runSiteSearch } from '@/lib/site-search';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';

  try {
    const results = await runSiteSearch(q, { itemLimit: 12, categoryLimit: 8 });
    return NextResponse.json(results);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Search failed';
    console.error('[search GET]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
