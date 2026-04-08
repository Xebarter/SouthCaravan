import { NextResponse } from 'next/server';

type IpApiResponse = {
  currency?: string;
  country_code?: string;
};

export async function GET() {
  // Best-effort IP-based detection. If it fails, client will fall back to locale mapping.
  try {
    const res = await fetch('https://ipapi.co/json/', {
      headers: { Accept: 'application/json' },
      // Avoid caching surprises during dev; client caches anyway.
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({ currency: null }, { status: 200 });
    }

    const data = (await res.json()) as IpApiResponse;
    const currency = typeof data.currency === 'string' ? data.currency.toUpperCase() : null;
    const country = typeof data.country_code === 'string' ? data.country_code.toUpperCase() : null;

    return NextResponse.json({ currency, country }, { status: 200 });
  } catch {
    return NextResponse.json({ currency: null }, { status: 200 });
  }
}

