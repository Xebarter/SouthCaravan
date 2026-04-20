import Link from 'next/link';

// ─── Data ────────────────────────────────────────────────────────────────────

const OFFERINGS = [
  {
    title: 'Intelligent Vendor Discovery & Matching',
    body: 'Advanced search, AI-powered recommendations, and detailed supplier profiles to help buyers find the right partners quickly.',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    color: 'bg-[#eff6ff] text-[#1e40af]',
  },
  {
    title: 'RFQ & Tender Management',
    body: 'Streamlined creation, distribution, bidding, and evaluation of RFQs and tenders with automated workflows.',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    color: 'bg-success-surface text-success-text',
  },
  {
    title: 'Supplier Onboarding & Qualification',
    body: 'Robust due diligence tools, document verification, compliance screening, and performance rating systems.',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    color: 'bg-purple-50 text-purple-700',
  },
  {
    title: 'Contract Lifecycle Management',
    body: 'Digital contract creation, negotiation, approval, storage, and renewal reminders — all in one place.',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    color: 'bg-amber-50 text-amber-700',
  },
  {
    title: 'Procurement Analytics & Insights',
    body: 'Real-time dashboards, spend analysis, supplier performance metrics, and procurement trend reports.',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    color: 'bg-rose-50 text-rose-700',
  },
  {
    title: 'Secure Communication & Collaboration',
    body: 'Built-in messaging, document sharing, and audit-ready interaction logs between buyers and suppliers.',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
    color: 'bg-teal-50 text-teal-700',
  },
  {
    title: 'Compliance & Risk Management',
    body: 'Sanctions screening, KYC/KYS processes, audit trails, and regulatory reporting support built in.',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    color: 'bg-orange-50 text-orange-700',
  },
  {
    title: 'Sustainable & ESG Procurement',
    body: 'Tools to track supplier sustainability credentials and support responsible sourcing goals across your supply chain.',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'bg-emerald-50 text-emerald-700',
  },
];

const VALUES = [
  {
    name: 'Integrity',
    body: 'We operate with honesty, transparency, and accountability in everything we do.',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    bg: 'bg-[#eff6ff]',
    color: 'text-[#1e40af]',
  },
  {
    name: 'Innovation',
    body: 'We leverage technology to solve real business challenges and continuously improve our platform.',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    bg: 'bg-amber-50',
    color: 'text-amber-700',
  },
  {
    name: 'Inclusion',
    body: 'We believe in empowering businesses of all sizes across diverse markets and communities.',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    bg: 'bg-purple-50',
    color: 'text-purple-700',
  },
  {
    name: 'Sustainability',
    body: 'We promote responsible procurement and support environmentally and socially conscious supply chains.',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    bg: 'bg-emerald-50',
    color: 'text-emerald-700',
  },
  {
    name: 'Excellence',
    body: 'We strive for the highest standards in service, security, and user experience across everything we build.',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
    bg: 'bg-rose-50',
    color: 'text-rose-700',
  },
  {
    name: 'Partnership',
    body: 'We view our users as long-term partners and work collaboratively to drive mutual success.',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    bg: 'bg-teal-50',
    color: 'text-teal-700',
  },
];

const WHY_ITEMS = [
  'Headquartered in Uganda with pan-African expertise and a global outlook',
  'Designed specifically for the realities of African and emerging market procurement',
  'Strong focus on data protection, cybersecurity, and regulatory compliance',
  'Transparent pricing and flexible plans for businesses of all sizes',
  'Dedicated customer success and support teams',
  'Commitment to ethical business practices and sustainable development',
  'Continuous innovation driven by user feedback and market needs',
];

const REGIONS = [
  { label: 'East Africa', sub: 'Uganda, Kenya, Tanzania, Rwanda' },
  { label: 'West Africa', sub: 'Nigeria, Ghana, Senegal & more' },
  { label: 'Southern Africa', sub: 'South Africa, Zambia, Zimbabwe' },
  { label: 'Europe', sub: 'UK, EU partner markets' },
  { label: 'Asia', sub: 'Emerging trade corridors' },
  { label: 'Middle East', sub: 'GCC procurement networks' },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AboutPage() {
  return (
    <div className="bg-background min-h-screen">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e3a5f 45%,#0f4c34 100%)' }}
      >
        {/* Decorative blobs */}
        <span aria-hidden className="pointer-events-none absolute -left-24 -top-24 w-96 h-96 rounded-full bg-white/3" />
        <span aria-hidden className="pointer-events-none absolute right-0 top-0 w-80 h-80 rounded-full bg-emerald-500/7" />
        <span aria-hidden className="pointer-events-none absolute left-1/2 bottom-0 w-64 h-64 -translate-x-1/2 rounded-full bg-blue-400/5" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white/80 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Kampala, Uganda · Est. 2024
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight tracking-tight">
              Powering Africa&apos;s<br />
              <span className="text-emerald-400">B2B Procurement</span>
            </h1>
            <p className="mt-5 text-lg text-white/70 leading-relaxed">
              SouthCaravan is a leading vendor management and procurement platform built to transform how businesses across Africa and the world connect, source, and trade with confidence.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-6 py-3 text-sm font-bold text-white transition-colors shadow-lg"
              >
                Get Started Free
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-6 py-3 text-sm font-bold text-white transition-colors"
              >
                Request a Demo
              </Link>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full" preserveAspectRatio="none">
            <path d="M0 40H1440V20C1200 0 960 40 720 20C480 0 240 40 0 20V40Z" className="fill-background" />
          </svg>
        </div>
      </div>

      {/* ── Stats strip ───────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-2">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { value: '10,000+', label: 'Registered Businesses' },
            { value: '6+', label: 'African Regions Served' },
            { value: '$M+', label: 'Procurement Facilitated' },
            { value: '99.9%', label: 'Platform Uptime' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-border bg-card shadow-sm px-5 py-5 text-center">
              <p className="text-2xl sm:text-3xl font-extrabold text-primary leading-none">{stat.value}</p>
              <p className="mt-1.5 text-xs text-muted-foreground leading-snug">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">

        {/* ── Mission & Vision ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div
            className="rounded-2xl border border-[#bfdbfe] p-7 flex flex-col gap-4"
            style={{ background: 'linear-gradient(135deg,#eff6ff 0%,#ffffff 100%)' }}
          >
            <span className="w-11 h-11 rounded-xl bg-[#1e40af] flex items-center justify-center shrink-0">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </span>
            <div>
              <p className="text-[11px] uppercase tracking-widest font-bold text-[#1e40af] mb-2">Our Mission</p>
              <p className="text-[15px] text-foreground leading-relaxed font-medium">
                To empower African and global businesses with a world-class B2B procurement platform that drives efficiency, transparency, and sustainable growth through technology and trusted connections.
              </p>
            </div>
          </div>
          <div
            className="rounded-2xl border border-emerald-200 p-7 flex flex-col gap-4"
            style={{ background: 'linear-gradient(135deg,#ecfdf5 0%,#ffffff 100%)' }}
          >
            <span className="w-11 h-11 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </span>
            <div>
              <p className="text-[11px] uppercase tracking-widest font-bold text-emerald-700 mb-2">Our Vision</p>
              <p className="text-[15px] text-foreground leading-relaxed font-medium">
                To become the most trusted digital infrastructure for cross-border B2B trade in Africa and beyond — enabling seamless, compliant, and responsible procurement that accelerates economic development.
              </p>
            </div>
          </div>
        </div>

        {/* ── Our Story ────────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-3 mb-7">
            <span className="h-px flex-1 bg-border" />
            <p className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground px-2">Our Story</p>
            <span className="h-px flex-1 bg-border" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            <div className="lg:col-span-3 space-y-4">
              <p className="text-[15px] leading-7 text-foreground/85">
                SouthCaravan was born in Kampala, Uganda, out of a deep understanding of the challenges faced by businesses operating in emerging markets: fragmented supplier networks, lengthy manual procurement processes, limited visibility into vendor reliability, currency and regulatory complexities, and the need for greater transparency in supply chains.
              </p>
              <p className="text-[15px] leading-7 text-foreground/85">
                Recognizing these pain points, our founders — seasoned professionals with backgrounds in procurement, technology, logistics, and international trade — set out to build a platform that combines the best of global B2B technology with deep local market expertise.
              </p>
              <p className="text-[15px] leading-7 text-foreground/85">
                Since our inception, SouthCaravan has grown rapidly, connecting thousands of buyers and suppliers across multiple African countries and international markets. We have facilitated millions of dollars in procurement transactions while maintaining an unwavering focus on data security, regulatory compliance, and ethical business practices.
              </p>
            </div>
            <div className="lg:col-span-2 space-y-3">
              {[
                { icon: '🌍', title: 'African-first design', sub: 'Built for the realities of emerging market procurement' },
                { icon: '🔒', title: 'Security by default', sub: 'Enterprise-grade data protection from day one' },
                { icon: '📈', title: 'Rapid growth', sub: 'Thousands of businesses across Africa and beyond' },
                { icon: '🤝', title: 'AfCFTA aligned', sub: 'Supporting intra-African trade goals' },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3.5 shadow-xs">
                  <span className="text-xl shrink-0 leading-none mt-0.5">{item.icon}</span>
                  <div>
                    <p className="text-sm font-bold text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── What We Offer ────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-3 mb-7">
            <span className="h-px flex-1 bg-border" />
            <p className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground px-2">What We Offer</p>
            <span className="h-px flex-1 bg-border" />
          </div>
          <p className="text-[15px] text-muted-foreground leading-relaxed mb-8 text-center max-w-2xl mx-auto">
            A comprehensive suite of tools tailored for modern B2B procurement and vendor management — accessible via web and mobile with enterprise-grade security.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {OFFERINGS.map((o) => (
              <div key={o.title} className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
                <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${o.color}`}>
                  {o.icon}
                </span>
                <div>
                  <p className="text-sm font-bold text-foreground leading-snug">{o.title}</p>
                  <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{o.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Why Choose + Values ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Why Choose */}
          <div>
            <p className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground mb-6">Why Choose SouthCaravan</p>
            <ul className="space-y-3">
              {WHY_ITEMS.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                    <svg className="h-3 w-3 text-primary" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span className="text-[14px] text-foreground/85 leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Values */}
          <div>
            <p className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground mb-6">Our Values</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {VALUES.map((v) => (
                <div key={v.name} className="rounded-xl border border-border bg-card px-4 py-4 flex items-start gap-3">
                  <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${v.bg} ${v.color}`}>
                    {v.icon}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-foreground">{v.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-snug">{v.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Our Team ────────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-3 mb-7">
            <span className="h-px flex-1 bg-border" />
            <p className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground px-2">Our Team</p>
            <span className="h-px flex-1 bg-border" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
            <div className="lg:col-span-3 space-y-4">
              <p className="text-[15px] leading-7 text-foreground/85">
                SouthCaravan is powered by a diverse, talented, and passionate team of professionals based primarily in Uganda, with remote contributors across Africa and beyond. Our leadership combines deep local market knowledge with international experience in technology, procurement, finance, and legal compliance.
              </p>
              <p className="text-[15px] leading-7 text-foreground/85">
                We are united by a shared commitment to building infrastructure that supports Africa&apos;s economic growth while meeting global standards.
              </p>
              <Link
                href="/careers"
                className="inline-flex items-center gap-2 rounded-lg border border-primary px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary hover:text-white transition-colors mt-2"
              >
                Join Our Team
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center space-y-3">
                <span className="inline-flex w-14 h-14 rounded-full bg-muted items-center justify-center mx-auto">
                  <svg className="h-7 w-7 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
                <p className="text-sm font-semibold text-foreground">Leadership Profiles</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  CEO, CTO, Head of Compliance, and full leadership team bios coming soon.
                </p>
                <Link href="/contact" className="inline-flex items-center gap-1 text-xs text-link hover:text-link-hover underline underline-offset-2 transition-colors">
                  Get in touch with our team
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── Global Reach ─────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div
            className="px-8 sm:px-10 py-8 border-b border-border"
            style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%)' }}
          >
            <p className="text-[11px] uppercase tracking-widest font-bold text-white/50 mb-3">Global Reach, Local Roots</p>
            <h2 className="text-2xl font-extrabold text-white leading-snug max-w-xl">
              Proudly Ugandan at heart.<br />
              <span className="text-emerald-400">Serving the world.</span>
            </h2>
            <p className="mt-3 text-sm text-white/65 leading-relaxed max-w-2xl">
              While headquartered in Kampala, SouthCaravan serves businesses throughout East Africa, West Africa, Southern Africa, and increasingly in Europe, Asia, and the Middle East. Our platform supports multiple languages, currencies, and regulatory environments to make cross-border trade smoother and more reliable.
            </p>
            <p className="mt-3 text-sm text-white/65 leading-relaxed max-w-2xl">
              We actively partner with local chambers of commerce, industry associations, and government bodies to strengthen supply chain resilience and promote intra-African trade in line with the African Continental Free Trade Area (AfCFTA) objectives.
            </p>
          </div>
          <div className="px-8 sm:px-10 py-6">
            <p className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground mb-4">Markets We Serve</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {REGIONS.map((r) => (
                <div key={r.label} className="rounded-xl border border-border bg-background px-3 py-3 text-center">
                  <p className="text-xs font-bold text-foreground">{r.label}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground leading-snug">{r.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── CTA ──────────────────────────────────────────────────────────── */}
        <div
          className="rounded-2xl overflow-hidden border border-emerald-200 px-8 sm:px-12 py-12 text-center relative"
          style={{ background: 'linear-gradient(135deg,#ecfdf5 0%,#eff6ff 100%)' }}
        >
          <span aria-hidden className="pointer-events-none absolute -right-8 -top-8 w-48 h-48 rounded-full bg-emerald-400/10" />
          <span aria-hidden className="pointer-events-none absolute -left-8 -bottom-8 w-48 h-48 rounded-full bg-blue-400/10" />
          <div className="relative">
            <p className="text-[11px] uppercase tracking-widest font-bold text-emerald-700 mb-3">Join the SouthCaravan Community</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground leading-snug">
              Ready to transform your procurement?
            </h2>
            <p className="mt-3 text-[15px] text-muted-foreground leading-relaxed max-w-xl mx-auto">
              Whether you are a buyer looking to optimise procurement, a supplier seeking new business opportunities, or an enterprise aiming to digitize your supply chain — SouthCaravan provides the tools, network, and trust you need to succeed.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary-hover px-7 py-3 text-sm font-bold text-white transition-colors shadow-sm"
              >
                Sign Up Today
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-white hover:border-primary hover:text-primary px-7 py-3 text-sm font-bold text-foreground transition-colors"
              >
                Request a Demo
              </Link>
            </div>
          </div>
        </div>

        {/* ── Contact strip ────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-8 sm:px-10 pt-7 pb-5 border-b border-border">
            <p className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground mb-5">Contact Us</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
                  label: 'Email', value: 'info@southcaravan.com', href: 'mailto:info@southcaravan.com',
                },
                {
                  icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
                  label: 'Phone', value: '+256 700 123 456', href: 'tel:+256700123456',
                },
                {
                  icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
                  label: 'Address', value: 'Plot 45, Kampala Road, Kampala, Uganda', href: null,
                },
              ].map((c) => (
                <div key={c.label} className="flex items-start gap-3">
                  <span className="shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5">
                    <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d={c.icon} />
                    </svg>
                  </span>
                  <div>
                    <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">{c.label}</p>
                    {c.href ? (
                      <a href={c.href} className="text-sm text-foreground hover:text-primary transition-colors font-medium mt-0.5 block">
                        {c.value}
                      </a>
                    ) : (
                      <p className="text-sm text-foreground font-medium mt-0.5">{c.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="px-8 sm:px-10 py-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Follow us for the latest updates, success stories, and industry insights.
            </p>
            <div className="flex gap-2">
              {[
                { label: 'LinkedIn', href: 'https://linkedin.com', icon: 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z' },
                { label: 'Twitter', href: 'https://twitter.com', icon: 'M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z' },
                { label: 'Facebook', href: 'https://facebook.com', icon: 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z' },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="w-8 h-8 rounded-lg border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
