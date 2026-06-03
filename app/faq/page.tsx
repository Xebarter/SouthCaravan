'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  ChevronDown,
  CreditCard,
  HelpCircle,
  Mail,
  Package,
  Phone,
  Rocket,
  Search,
  Store,
  X,
} from 'lucide-react';

const CATEGORY_META: Record<string, { icon: typeof Rocket; accent: string }> = {
  'Getting Started': { icon: Rocket, accent: 'text-sky-600 bg-sky-50' },
  'Products & Orders': { icon: Package, accent: 'text-emerald-600 bg-emerald-50' },
  'Vendor Management': { icon: Store, accent: 'text-violet-600 bg-violet-50' },
  'Support & Account': { icon: HelpCircle, accent: 'text-amber-600 bg-amber-50' },
  'Billing & Plans': { icon: CreditCard, accent: 'text-rose-600 bg-rose-50' },
};

const faqs = [
  {
    category: 'Getting Started',
    items: [
      {
        q: 'How do I create an account?',
        a: 'Click "Sign Up" on the homepage and select whether you are a Buyer or Vendor. Fill in your company information and create a secure password. You\'ll be able to start using South Caravan immediately after verification.',
      },
      {
        q: 'What\'s the difference between Buyer and Vendor accounts?',
        a: 'Buyer accounts allow you to browse products, place orders, and manage your procurement. Vendor accounts let you list products, manage inventory, and fulfill orders from buyers.',
      },
      {
        q: 'Is there a free trial?',
        a: 'Yes. Buyer and Vendor accounts both have a free tier. Upgrade to Pro or Enterprise plans to access premium features and higher transaction limits.',
      },
    ],
  },
  {
    category: 'Products & Orders',
    items: [
      {
        q: 'How do I search for products?',
        a: 'Use the search bar or browse by category. You can filter by price, availability, rating, and other criteria. You can also view products directly from specific vendors.',
      },
      {
        q: 'How do I place an order?',
        a: 'Add products to your cart, review the items, and proceed to checkout. You can save items as drafts to complete later. Orders are tracked in real time from placement to delivery.',
      },
      {
        q: 'Can I request a custom quote?',
        a: 'Yes. Use the "Request Quote" feature on any product page or vendor profile. Vendors typically respond within 24 hours. You can negotiate pricing and terms directly.',
      },
      {
        q: 'What payment methods do you accept?',
        a: 'We support credit cards, bank transfers, and wire transfers. Enterprise customers can arrange net payment terms. All payments are processed securely.',
      },
    ],
  },
  {
    category: 'Vendor Management',
    items: [
      {
        q: 'How do I list my products?',
        a: 'Log in to your vendor dashboard and click "Add Product". Fill in product details, upload images, set pricing, and specify availability. Your products appear instantly to buyers.',
      },
      {
        q: 'Can I bulk import products?',
        a: 'Yes. You can upload a CSV file with product information. We provide a template and validation to ensure data quality. Contact support for assistance with large imports.',
      },
      {
        q: 'How do I manage inventory?',
        a: 'Track stock levels in real time from your dashboard. Set low stock alerts and automatic reorder points. Our system prevents overselling.',
      },
      {
        q: 'How are commissions calculated?',
        a: 'Commissions depend on your plan tier. Free vendors pay 8% per transaction, Pro vendors pay 5%, and Enterprise vendors negotiate custom rates. Contact sales@southcaravan.com for plan details.',
      },
    ],
  },
  {
    category: 'Support & Account',
    items: [
      {
        q: 'How can I contact support?',
        a: 'Use the Help Center in your dashboard, email support@southcaravan.com, or call +256783676313. Response times vary by plan, with Enterprise customers receiving priority support.',
      },
      {
        q: 'How do I reset my password?',
        a: 'Click "Forgot Password" on the login page. Enter your email and follow the reset link sent to your inbox. The link expires in 24 hours for security.',
      },
      {
        q: 'Is my data secure?',
        a: 'Yes. We use industry-standard encryption (HTTPS/TLS), regular security audits, and compliance with GDPR and CCPA. Your payment data never touches our servers.',
      },
      {
        q: 'Can I export my data?',
        a: 'Yes. You can download orders, invoices, and analytics reports anytime. You can also request a full data export in CSV or JSON format.',
      },
    ],
  },
  {
    category: 'Billing & Plans',
    items: [
      {
        q: 'When am I charged?',
        a: 'Subscription plans renew monthly or annually, depending on your selection. Commissions are charged per transaction automatically. You can view your billing history anytime.',
      },
      {
        q: 'Can I change or cancel my plan?',
        a: 'Yes. You can upgrade or downgrade your plan anytime from Account Settings. Downgrades take effect at the next billing cycle. Cancellations are processed immediately.',
      },
      {
        q: 'Do you offer discounts for annual billing?',
        a: 'Yes. Annual plans include a 15% discount compared to monthly billing. Contact sales@southcaravan.com for volume discounts and enterprise pricing.',
      },
      {
        q: 'What is your refund policy?',
        a: 'We offer a 30-day money-back guarantee for annual subscriptions. Monthly plans can be canceled anytime without penalty. Refunds are processed within 5–7 business days.',
      },
    ],
  },
];

const ALL_CATEGORIES = faqs.map((s) => s.category);
const TOTAL_QUESTIONS = faqs.reduce((n, s) => n + s.items.length, 0);

function FaqAccordionItem({
  id,
  question,
  answer,
  isExpanded,
  onToggle,
}: {
  id: string;
  question: string;
  answer: string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`rounded-xl border bg-card transition-shadow duration-200 ${
        isExpanded ? 'border-primary/30 shadow-sm ring-1 ring-primary/10' : 'border-border hover:border-primary/20'
      }`}
    >
      <button
        type="button"
        id={`faq-btn-${id}`}
        aria-expanded={isExpanded}
        aria-controls={`faq-panel-${id}`}
        onClick={onToggle}
        className="w-full px-5 sm:px-6 py-4 flex items-start justify-between gap-4 text-left"
      >
        <span className="font-semibold text-foreground leading-snug pr-2">{question}</span>
        <span
          className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            isExpanded ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
          }`}
        >
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
        </span>
      </button>
      <div
        id={`faq-panel-${id}`}
        role="region"
        aria-labelledby={`faq-btn-${id}`}
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="overflow-hidden">
          <div className="px-5 sm:px-6 pb-5 pt-0 border-t border-border/80">
            <p className="text-sm text-muted-foreground leading-relaxed pt-4">{answer}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FAQPage() {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const toggleItem = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredSections = useMemo(() => {
    const q = search.trim().toLowerCase();
    return faqs
      .filter((section) => activeCategory === 'all' || section.category === activeCategory)
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            !q ||
            item.q.toLowerCase().includes(q) ||
            item.a.toLowerCase().includes(q) ||
            section.category.toLowerCase().includes(q),
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [search, activeCategory]);

  const resultCount = filteredSections.reduce((n, s) => n + s.items.length, 0);
  const hasFilters = search.trim() !== '' || activeCategory !== 'all';

  return (
    <div className="bg-background min-h-screen">
      {/* Hero */}
      <header
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e3a5f 45%,#0f4c34 100%)' }}
      >
        <span aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-white/3" />
        <span aria-hidden className="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full bg-emerald-500/7" />

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white/80 mb-5">
            <HelpCircle className="h-3.5 w-3.5" />
            Help Center
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight max-w-2xl">
            Frequently Asked
            <span className="text-emerald-400"> Questions</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-white/70 leading-relaxed">
            Clear answers about buying, selling, accounts, billing, and using South Caravan&apos;s B2B marketplace.
          </p>
          <p className="mt-6 text-sm text-white/50">
            {TOTAL_QUESTIONS} questions across {ALL_CATEGORIES.length} topics
          </p>
        </div>

        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1440 40" fill="none" className="w-full" preserveAspectRatio="none">
            <path d="M0 40H1440V20C1200 0 960 40 720 20C480 0 240 40 0 20V40Z" className="fill-background" />
          </svg>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Search + filters */}
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm mb-10">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search questions…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-9"
              aria-label="Search FAQ"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                activeCategory === 'all'
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:border-primary/40 hover:text-primary'
              }`}
            >
              All topics
            </button>
            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  activeCategory === cat
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border hover:border-primary/40 hover:text-primary'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {hasFilters && (
            <p className="mt-4 text-sm text-muted-foreground">
              {resultCount === 0 ? 'No matching questions.' : `${resultCount} matching question${resultCount !== 1 ? 's' : ''}`}
            </p>
          )}
        </div>

        {/* FAQ sections */}
        {filteredSections.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
            <HelpCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="font-semibold text-foreground">No results found</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Try a different search term or browse all topics.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-5"
              onClick={() => {
                setSearch('');
                setActiveCategory('all');
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="space-y-12">
            {filteredSections.map((section, sectionIdx) => {
              const meta = CATEGORY_META[section.category] ?? { icon: HelpCircle, accent: 'text-primary bg-primary/10' };
              const Icon = meta.icon;

              return (
                <section key={section.category} id={section.category.replace(/\s+/g, '-').toLowerCase()}>
                  <div className="flex items-center gap-3 mb-5">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${meta.accent}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">{section.category}</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {section.items.length} question{section.items.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {section.items.map((item, itemIdx) => {
                      const itemId = `${sectionIdx}-${itemIdx}-${section.category}`;
                      return (
                        <FaqAccordionItem
                          key={itemId}
                          id={itemId}
                          question={item.q}
                          answer={item.a}
                          isExpanded={expandedItems.has(itemId)}
                          onToggle={() => toggleItem(itemId)}
                        />
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* Support CTA */}
        <section
          className="mt-14 rounded-2xl border border-border overflow-hidden"
          style={{ background: 'linear-gradient(135deg,#ecfdf5 0%,#eff6ff 100%)' }}
        >
          <div className="px-6 sm:px-10 py-10 sm:py-12">
            <div className="text-center max-w-lg mx-auto mb-8">
              <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-700 mb-2">Still need help?</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                Didn&apos;t find your answer?
              </h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Our support team is ready to help with account, orders, vendor setup, and billing questions.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
              <a
                href="mailto:support@southcaravan.com"
                className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-5 text-center shadow-sm hover:border-primary/30 hover:shadow-md transition-all"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Mail className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Email</p>
                  <p className="text-sm font-semibold text-foreground mt-1 group-hover:text-primary transition-colors">
                    support@southcaravan.com
                  </p>
                </div>
              </a>

              <a
                href="tel:+256783676313"
                className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-5 text-center shadow-sm hover:border-primary/30 hover:shadow-md transition-all"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Phone className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Phone</p>
                  <p className="text-sm font-semibold text-foreground mt-1 group-hover:text-primary transition-colors">
                    +256783676313
                  </p>
                </div>
              </a>

              <Link
                href="/contact"
                className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-5 text-center shadow-sm hover:border-primary/30 hover:shadow-md transition-all"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <HelpCircle className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Contact form</p>
                  <p className="text-sm font-semibold text-foreground mt-1 inline-flex items-center gap-1 group-hover:text-primary transition-colors">
                    Send a message
                    <ArrowRight className="h-3.5 w-3.5" />
                  </p>
                </div>
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-3 mt-8">
              <Button variant="outline" size="sm" asChild>
                <Link href="/about">About South Caravan</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/">
                  Explore marketplace
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
