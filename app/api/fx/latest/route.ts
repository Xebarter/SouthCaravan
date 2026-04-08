import { NextResponse } from 'next/server';

type OpenErApiResponse = {
  result?: string;
  base_code?: string;
  time_last_update_unix?: number;
  rates?: Record<string, number>;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const base = (url.searchParams.get('base') || 'USD').toUpperCase();

  // ExchangeRate-API open endpoint (daily updates). Cache on the server to avoid hammering.
  // https://www.exchangerate-api.com/docs/free
  const upstream = `https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`;

  try {
    const res = await fetch(upstream, {
      // Cache for 1 hour on the Next.js data cache
      next: { revalidate: 60 * 60 },
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      return NextResponse.json({ ok: false, base, rates: null }, { status: 200 });
    }

    const data = (await res.json()) as OpenErApiResponse;
    const rates = data && typeof data.rates === 'object' ? data.rates : null;
    const time = typeof data.time_last_update_unix === 'number' ? data.time_last_update_unix : null;

    return NextResponse.json(
      {
        ok: Boolean(rates),
        base: (data.base_code || base).toUpperCase(),
        rates,
        time_last_update_unix: time,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json({ ok: false, base, rates: null }, { status: 200 });
  }
}

