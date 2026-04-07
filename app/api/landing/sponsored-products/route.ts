import { NextResponse } from 'next/server';
import { getSponsoredProducts } from '@/lib/landing-data';

export const revalidate = 60;

export async function GET() {
  const items = await getSponsoredProducts(12);
  return NextResponse.json(
    { items },
    {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=30',
      },
    },
  );
}
