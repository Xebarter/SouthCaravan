import { NextResponse } from 'next/server';
import { getExchangeRates } from '@/lib/currency/rates';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const base = (url.searchParams.get('base') || 'USD').toUpperCase();

  try {
    const payload = await getExchangeRates(base);
    return NextResponse.json(
      {
        ok: payload.rates && Object.keys(payload.rates).length > 0,
        base: payload.base,
        rates: payload.rates,
        source: payload.source,
        time_last_update_unix: payload.updatedAt ? Math.floor(payload.updatedAt / 1000) : null,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json({ ok: false, base, rates: null }, { status: 200 });
  }
}
