import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const SUBJECTS = new Set([
  'general', 'sales', 'support', 'partnership',
  'billing', 'vendor_inquiry', 'careers', 'other',
]);

const RATE_LIMIT_MS = 60_000; // one submission per IP per minute
const recentSubmissions = new Map<string, number>();

/** POST /api/contact — submit a contact form message */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const get = (k: string) => (typeof body[k] === 'string' ? (body[k] as string).trim() : '');

  // Honeypot check (bot trap field — should always be empty)
  if (get('website')) {
    return NextResponse.json({ success: true }); // silently discard
  }

  const name    = get('name');
  const email   = get('email');
  const message = get('message');
  const subject = get('subject') || 'general';

  if (!name)    return NextResponse.json({ error: 'Name is required.' },    { status: 422 });
  if (!email)   return NextResponse.json({ error: 'Email is required.' },   { status: 422 });
  if (!message) return NextResponse.json({ error: 'Message is required.' }, { status: 422 });
  if (!SUBJECTS.has(subject)) {
    return NextResponse.json({ error: 'Invalid subject.' }, { status: 422 });
  }

  // Simple in-memory rate limit per IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
    ?? 'unknown';
  const last = recentSubmissions.get(ip);
  if (last && Date.now() - last < RATE_LIMIT_MS) {
    return NextResponse.json(
      { error: 'Please wait a moment before submitting again.' },
      { status: 429 },
    );
  }
  recentSubmissions.set(ip, Date.now());
  // Clean up old entries every 200 requests
  if (recentSubmissions.size > 200) {
    const cutoff = Date.now() - RATE_LIMIT_MS;
    for (const [k, v] of recentSubmissions) {
      if (v < cutoff) recentSubmissions.delete(k);
    }
  }

  const { error } = await supabaseAdmin.from('contact_messages').insert({
    name,
    email,
    phone:           get('phone') || null,
    company:         get('company') || null,
    subject,
    message,
    status:          'new',
    priority:        subject === 'support' ? 'high' : 'normal',
    ip_address:      ip,
    user_agent:      req.headers.get('user-agent') ?? null,
    honeypot_filled: false,
  });

  if (error) {
    console.error('[/api/contact POST]', error);
    return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
