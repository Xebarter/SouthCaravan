'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Mail, Phone, MapPin, Clock, CheckCircle2, Loader2,
  MessageSquare, ChevronDown, ChevronUp,
} from 'lucide-react';

const SUBJECTS = [
  { value: 'general',         label: 'General Enquiry' },
  { value: 'support',         label: 'Support Request' },
  { value: 'sales',           label: 'Sales & Pricing' },
  { value: 'vendor_inquiry',  label: 'Vendor / Supplier Enquiry' },
  { value: 'partnership',     label: 'Partnership Opportunity' },
  { value: 'billing',         label: 'Billing Question' },
  { value: 'careers',         label: 'Careers' },
  { value: 'other',           label: 'Other' },
];

const FAQS = [
  {
    q: "What's the fastest way to get support?",
    a: 'Email support@southcaravan.com or use the contact form and select "Support Request". Our team typically responds within 2–4 hours during business hours (Mon–Sun, 8 am–6 pm EAT).',
  },
  {
    q: 'How do I register as a vendor on SouthCaravan?',
    a: 'Click "Sign Up" on the homepage and select the Vendor option. Once you complete your profile, our team reviews and approves your account — usually within 24 hours.',
  },
  {
    q: 'Can I visit your physical office?',
    a: 'Yes! We are located at Mutungo Zone 1, Kampala, Uganda. We welcome visits by appointment — please call or email ahead so we can prepare for you.',
  },
  {
    q: 'How long does it take to get a response?',
    a: 'We respond to all enquiries within 2–4 business hours. For urgent matters, please call us directly on +256 783 676 313.',
  },
  {
    q: 'Do you support buyers and vendors outside Uganda?',
    a: 'Absolutely. SouthCaravan serves buyers and vendors across Africa. Get in touch to learn how we can support your region.',
  },
];

interface FormState {
  name: string;
  email: string;
  phone: string;
  company: string;
  subject: string;
  message: string;
  website: string; // honeypot
}

const EMPTY: FormState = {
  name: '', email: '', phone: '', company: '',
  subject: '', message: '', website: '',
};

export default function ContactPage() {
  const [form, setForm]       = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }
      setSuccess(true);
      setForm(EMPTY);
    } catch {
      setError('Network error — please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-border bg-linear-to-br from-primary/5 via-background to-background">
        <div className="max-w-4xl mx-auto px-6 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6">
            <MessageSquare className="w-3.5 h-3.5" />
            We&apos;re here to help
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Get in Touch
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Have a question, partnership idea, or just want to say hello?
            Our team is available every day and always happy to chat.
          </p>
        </div>
      </section>

      {/* ── Main grid ── */}
      <section className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-5 gap-12">

        {/* Left: contact info + map */}
        <aside className="lg:col-span-2 space-y-8">
          <div>
            <h2 className="text-xl font-bold mb-6">Contact Information</h2>
            <ul className="space-y-5">
              <ContactItem
                icon={<MapPin className="w-5 h-5 text-primary" />}
                title="Our Office"
                lines={['Mutungo Zone 1', 'Kampala, Uganda']}
              />
              <ContactItem
                icon={<Phone className="w-5 h-5 text-primary" />}
                title="Phone"
                lines={['+256 783 676 313']}
                href="tel:+256783676313"
              />
              <ContactItem
                icon={<Mail className="w-5 h-5 text-primary" />}
                title="Email"
                lines={['support@southcaravan.com']}
                href="mailto:support@southcaravan.com"
              />
              <ContactItem
                icon={<Clock className="w-5 h-5 text-primary" />}
                title="Business Hours"
                lines={['Monday – Sunday', '8:00 am – 6:00 pm EAT']}
              />
            </ul>
          </div>

          {/* Quick links card */}
          <div className="rounded-xl border border-border bg-secondary/40 p-5">
            <h3 className="font-semibold text-sm mb-3">Quick Help</h3>
            <ul className="space-y-2 text-sm">
              {[
                { label: 'Browse FAQs',         href: '/faq' },
                { label: 'Check System Status', href: '/status' },
                { label: 'View open roles',     href: '/careers' },
                { label: 'Start as a Vendor',   href: '/signup' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-primary hover:underline flex items-center gap-1.5">
                    → {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Embedded map */}
          <div className="rounded-xl overflow-hidden border border-border aspect-video w-full">
            <iframe
              title="SouthCaravan office location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.756!2d32.635!3d0.316!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMCwzMTYgMzIsMDYz!5e0!3m2!1sen!2sug!4v1600000000000!5m2!1sen!2sug&q=Mutungo+Zone+1+Kampala+Uganda"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </aside>

        {/* Right: form */}
        <div className="lg:col-span-3">
          <h2 className="text-xl font-bold mb-6">Send us a Message</h2>

          {success ? (
            <div className="flex flex-col items-center justify-center gap-5 py-16 text-center rounded-xl border border-green-200 bg-green-50/50">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <p className="text-lg font-semibold text-green-800">Message Sent!</p>
                <p className="text-sm text-green-700 mt-1 max-w-xs">
                  Thanks for reaching out. We&apos;ll get back to you within a few hours.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setSuccess(false)}>
                Send another message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Honeypot — hidden from real users */}
              <input
                type="text"
                name="website"
                value={form.website}
                onChange={(e) => set('website', e.target.value)}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="Jane Nakato"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    placeholder="jane@example.com"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => set('phone', e.target.value)}
                    placeholder="+256 7XX XXX XXX"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="company">Company / Organisation</Label>
                  <Input
                    id="company"
                    value={form.company}
                    onChange={(e) => set('company', e.target.value)}
                    placeholder="Acme Ltd"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Subject <span className="text-destructive">*</span></Label>
                <Select
                  value={form.subject || 'none'}
                  onValueChange={(v) => set('subject', v === 'none' ? '' : v)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="What is your message about?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" disabled>Select a subject…</SelectItem>
                    {SUBJECTS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="message">Message <span className="text-destructive">*</span></Label>
                <textarea
                  id="message"
                  value={form.message}
                  onChange={(e) => set('message', e.target.value)}
                  placeholder="Tell us how we can help…"
                  required
                  rows={6}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={loading || !form.name || !form.email || !form.subject || !form.message}
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…</>
                ) : (
                  'Send Message'
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                We respond within 2–4 hours · Mon–Sun, 8 am–6 pm EAT
              </p>
            </form>
          )}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="border-t border-border bg-secondary/20">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-center mb-10">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => {
              const open = openFaq === i;
              return (
                <div key={i} className="rounded-xl border border-border bg-background overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left font-medium text-sm hover:bg-secondary/40 transition-colors"
                  >
                    <span>{faq.q}</span>
                    {open
                      ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                      : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                  </button>
                  {open && (
                    <div className="px-5 pb-5 text-sm text-muted-foreground border-t border-border pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-border px-6 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
          <p className="text-muted-foreground text-lg">
            Join thousands of businesses across Africa transforming their supply chain with SouthCaravan.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild>
              <Link href="/signup">Create a Free Account</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/catalog">Browse the Catalog</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function ContactItem({
  icon, title, lines, href,
}: {
  icon: React.ReactNode;
  title: string;
  lines: string[];
  href?: string;
}) {
  return (
    <li className="flex items-start gap-4">
      <div className="w-9 h-9 rounded-lg border border-border bg-secondary/50 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">
          {title}
        </p>
        {lines.map((line, i) =>
          href && i === 0 ? (
            <a key={i} href={href} className="text-sm font-medium text-primary hover:underline block">
              {line}
            </a>
          ) : (
            <p key={i} className="text-sm text-foreground/80">{line}</p>
          ),
        )}
      </div>
    </li>
  );
}
