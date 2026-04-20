import { Breadcrumbs } from '@/components/breadcrumbs';
import Link from 'next/link';

// ─── Static data ─────────────────────────────────────────────────────────────

const PILLARS = [
  {
    title: 'Data Protection & Privacy',
    body: 'Uganda DPPA, GDPR, and regional African frameworks. DPO appointed, PIAs conducted, and DPAs with all subprocessors.',
    iconBg: 'bg-[#eff6ff]',
    iconColor: 'text-[#1e40af]',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: 'Security & Cybersecurity',
    body: 'ISO 27001-aligned, SOC 2 Type II readiness, MFA, RBAC, and independent penetration testing on every release cycle.',
    iconBg: 'bg-success-surface',
    iconColor: 'text-success-text',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  {
    title: 'Anti-Corruption & Ethics',
    body: 'Zero tolerance for bribery. Aligned with UK Bribery Act, FCPA, and Uganda Anti-Corruption Act with mandatory annual training.',
    iconBg: 'bg-warning-surface',
    iconColor: 'text-warning-text',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </svg>
    ),
  },
  {
    title: 'Trade, Sanctions & AML',
    body: 'Sanctions screening (UN, OFAC, EU, UK), KYC/KYS due diligence, and FATF-aligned AML measures for all B2B transactions.',
    iconBg: 'bg-accent',
    iconColor: 'text-primary',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
  },
];

const SECTIONS = [
  {
    num: '1',
    title: 'Data Protection and Privacy Compliance',
    intro: 'We prioritize the protection of personal and business data in line with global and regional standards:',
    bullets: [
      'Uganda Data Protection and Privacy Act, 2019 (DPPA) and associated Regulations – including mandatory registration with the Personal Data Protection Office (PDPO)',
      'General Data Protection Regulation (GDPR) – for processing data of EU/EEA data subjects, with appropriate safeguards for international transfers (e.g., Standard Contractual Clauses)',
      'Other African data protection laws, such as Kenya Data Protection Act, Nigeria Data Protection Act, Rwanda Law N° 058/2021, and similar frameworks in jurisdictions where we operate',
      'Principles of lawfulness, fairness, purpose limitation, data minimization, accuracy, storage limitation, integrity, confidentiality, and accountability',
    ],
    subsections: [
      {
        label: 'Measures include:',
        items: [
          'Appointment of a Data Protection Officer (DPO)',
          'Privacy Impact Assessments (PIAs) and Data Protection Impact Assessments (DPIAs) for new features or processing activities',
          'Robust consent management, data subject rights fulfillment (access, rectification, erasure, etc.)',
          'Data Processing Agreements (DPAs) with all vendors and subprocessors',
          'Encryption of data in transit and at rest, strict access controls, and anonymization/pseudonymization where appropriate',
        ],
      },
    ],
  },
  {
    num: '2',
    title: 'Information Security and Cybersecurity Compliance',
    intro: 'We maintain a robust security posture to protect the confidentiality, integrity, and availability of platform data:',
    bullets: [
      'Alignment with ISO 27001 information security management principles',
      'SOC 2 Type II readiness (or equivalent independent attestation) focusing on security, availability, processing integrity, confidentiality, and privacy',
      'Implementation of encryption, multi-factor authentication (MFA), role-based access control (RBAC), and secure development lifecycle (SDLC)',
      'Regular penetration testing, vulnerability scanning, and security audits by independent experts',
      'Incident response plan, business continuity, and disaster recovery procedures',
      'Protection against DDoS, malware, and unauthorized access through services such as Cloudflare and advanced monitoring tools',
    ],
    note: 'All platform activities, including RFQ posting, bid management, contract handling, and supplier interactions, are logged in immutable audit trails for accountability.',
  },
  {
    num: '3',
    title: 'Anti-Bribery and Anti-Corruption (ABC) Compliance',
    intro: 'We maintain a zero-tolerance policy toward bribery, corruption, facilitation payments, and conflicts of interest:',
    bullets: [
      'Adherence to the Uganda Anti-Corruption Act',
      'Alignment with UK Bribery Act 2010, U.S. Foreign Corrupt Practices Act (FCPA), and OECD Anti-Bribery Convention standards',
      'Mandatory ABC training and annual certifications for all staff and relevant third parties',
      'Due diligence procedures for high-risk transactions, gifts, hospitality, and third-party relationships',
      'Clear whistleblower protections and confidential reporting channels',
    ],
  },
  {
    num: '4',
    title: 'Trade Compliance, Sanctions, and Anti-Money Laundering (AML)',
    intro: 'As a platform facilitating international B2B trade:',
    bullets: [
      'Screening of users, suppliers, and transactions against global sanctions lists (UN, EU, US OFAC, UK, and others)',
      'Compliance with export control regulations and restricted goods/prohibited items policies',
      'Know Your Customer (KYC), Know Your Supplier (KYS), and enhanced due diligence for high-risk jurisdictions or entities',
      'Anti-money laundering and counter-terrorism financing measures in line with Financial Action Task Force (FATF) recommendations and local laws',
      'Support for users in meeting their own regulatory obligations through audit-ready documentation and compliance records',
    ],
  },
  {
    num: '5',
    title: 'Contract and Procurement Compliance',
    intro: 'We help businesses achieve procurement excellence by enforcing:',
    bullets: [
      'Automated approval workflows and spending controls to prevent maverick spend',
      'Contract lifecycle management with built-in compliance checks (terms, pricing, delivery, quality)',
      'Supplier qualification, onboarding, and ongoing monitoring, including verification of certifications, insurance, and regulatory compliance',
      'Immutable audit trails for all procurement actions (requisitions, POs, invoices, receipts)',
      'Enforcement of internal purchasing policies, preferred supplier lists, and budget thresholds',
    ],
  },
  {
    num: '6',
    title: 'Intellectual Property (IP) Rights and Platform Integrity',
    bullets: [
      'Respect for third-party trademarks, patents, copyrights, and trade secrets',
      'Mechanisms for reporting and addressing IP infringements (notice-and-takedown processes)',
      'Protection of SouthCaravan\'s own IP assets',
      'Policies prohibiting upload or distribution of infringing or counterfeit materials',
    ],
  },
  {
    num: '7',
    title: 'Environmental, Social, and Governance (ESG) and Sustainable Procurement',
    intro: 'We promote responsible sourcing and support users in meeting their ESG goals:',
    bullets: [
      'Encouragement of supplier disclosures on labor standards, human rights, environmental impact, and diversity',
      'Features to track and report on sustainable procurement practices',
      'Alignment with emerging regulations such as Corporate Sustainability Reporting Directive (CSRD) principles where relevant',
      'Commitment to ethical labor practices and avoidance of forced labor, child labor, or unsafe working conditions in supply chains',
    ],
  },
  {
    num: '8',
    title: 'Financial, Tax, and Payment Compliance',
    bullets: [
      'Compliance with VAT/GST, digital services taxes, and invoicing requirements across operating jurisdictions',
      'Secure payment processing in line with PCI DSS standards (where payments are facilitated)',
      'Adherence to financial reporting standards (e.g., IFRS where applicable)',
      'Strong Customer Authentication (SCA) and fraud prevention measures',
    ],
  },
  {
    num: '9',
    title: 'Accessibility and Digital Inclusivity',
    bullets: [
      'Commitment to Web Content Accessibility Guidelines (WCAG 2.1 Level AA or higher)',
      'Ongoing efforts to ensure the platform is usable by individuals with disabilities, supporting diverse business users across regions',
    ],
  },
  {
    num: '10',
    title: 'Industry-Specific and Additional Compliance',
    body: 'Depending on user sectors (e.g., healthcare, finance, government procurement), we support compliance with additional frameworks such as HIPAA principles (where relevant) or public procurement rules. We do not process health data as a core function but maintain controls to prevent unintended collection.',
  },
];

const CERTIFICATIONS = [
  { label: 'Alignment with ISO 27001', status: 'In Progress', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { label: 'SOC 2 Type II attestation', status: 'In Progress', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { label: 'Regular independent penetration tests', status: 'Active', color: 'bg-success-surface text-success-text border-success-border' },
  { label: 'PDPO registration & GDPR documentation', status: 'Active', color: 'bg-success-surface text-success-text border-success-border' },
  { label: 'Annual staff training completion (target: 100%)', status: 'Active', color: 'bg-success-surface text-success-text border-success-border' },
];

const RELATED = [
  { href: '/privacy', label: 'Privacy Policy', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { href: '/terms', label: 'Terms of Service', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { href: '/cookies', label: 'Cookie Policy', icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function CompliancePage() {
  const toc = SECTIONS.map((s) => ({ id: `section-${s.num}`, number: s.num, label: s.title }));

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Breadcrumbs items={[{ label: 'Compliance' }]} />

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div className="mt-6 rounded-2xl overflow-hidden border border-border shadow-md">

          {/* Banner */}
          <div
            className="relative px-8 sm:px-12 py-10 border-b border-border overflow-hidden"
            style={{ background: 'linear-gradient(135deg,#eff6ff 0%,#ffffff 50%,#ecfdf5 100%)' }}
          >
            <span aria-hidden className="pointer-events-none absolute -right-8 -top-8 w-56 h-56 rounded-full bg-[#2196f3]/5" />
            <span aria-hidden className="pointer-events-none absolute right-24 top-10 w-32 h-32 rounded-full bg-success/5" />

            <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
              <div className="flex-1 min-w-0">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eff6ff] border border-[#bfdbfe] px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[#1e40af] mb-5">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Compliance
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
                  Compliance &amp; Regulatory Standards
                </h1>
                <p className="mt-3 text-base text-muted-foreground leading-relaxed max-w-xl">
                  How SouthCaravan meets its legal, regulatory, ethical, and operational obligations as a B2B platform serving businesses across Africa and global markets.
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  Questions?{' '}
                  <a href="mailto:compliance@southcaravan.com" className="font-medium text-link underline underline-offset-2 hover:text-link-hover transition-colors">
                    compliance@southcaravan.com
                  </a>
                </p>
              </div>

              {/* Meta card */}
              <div className="shrink-0 rounded-xl border border-border bg-white/90 backdrop-blur-sm px-5 py-4 shadow-sm space-y-3 min-w-[160px]">
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Last Updated</p>
                  <p className="mt-0.5 text-sm font-bold text-foreground">April 20, 2026</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Jurisdiction</p>
                  <p className="mt-0.5 text-sm font-bold text-foreground">Global · Uganda HQ</p>
                </div>
                <span className="inline-block rounded-full bg-success-surface border border-success-border px-2.5 py-0.5 text-[11px] font-semibold text-success-text">
                  Current Version
                </span>
              </div>
            </div>
          </div>

          {/* Notice bar */}
          <div className="flex items-start gap-3 px-8 sm:px-12 py-4 bg-[#eff6ff] border-b border-[#bfdbfe]">
            <svg className="h-5 w-5 text-[#1e40af] shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-[#1e40af] leading-relaxed">
              <span className="font-semibold">Our Commitment: </span>
              SouthCaravan integrates compliance into every aspect of platform development, vendor onboarding, procurement workflows, and daily operations. We embed automated controls, conduct regular third-party audits, and maintain a dedicated Compliance Officer reporting to senior leadership.
            </p>
          </div>

          {/* Compliance pillars */}
          <div className="px-8 sm:px-12 py-8 bg-muted/30 border-b border-border">
            <p className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground mb-5">
              Core Compliance Pillars
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {PILLARS.map((p) => (
                <div key={p.title} className="rounded-xl bg-card border border-border p-5 flex flex-col gap-3 shadow-xs hover:shadow-sm transition-shadow">
                  <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${p.iconBg} ${p.iconColor}`}>
                    {p.icon}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-foreground leading-snug">{p.title}</p>
                    <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{p.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Table of Contents */}
          <div className="px-8 sm:px-12 py-8 bg-muted/50 border-b border-border">
            <p className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground mb-5">
              Key Compliance Areas
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
              {toc.map((entry) => (
                <a
                  key={entry.id}
                  href={`#${entry.id}`}
                  className="group flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-accent transition-colors"
                >
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[11px] font-extrabold flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                    {entry.number}
                  </span>
                  <span className="text-sm text-foreground/70 group-hover:text-foreground transition-colors leading-snug">
                    {entry.label}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* ── Content body ────────────────────────────────────────────────── */}
          <div className="bg-card px-8 sm:px-12 py-10">
            <div className="max-w-3xl divide-y divide-border/60">

              {SECTIONS.map((section) => (
                <section
                  key={section.num}
                  id={`section-${section.num}`}
                  className="scroll-mt-28 pt-8 pb-2 first:pt-0"
                >
                  <div className="flex items-start gap-4 mb-5">
                    <span className="mt-0.5 shrink-0 w-9 h-9 rounded-full bg-primary text-white text-sm font-extrabold flex items-center justify-center shadow-sm">
                      {section.num}
                    </span>
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-foreground leading-snug tracking-tight">
                      {section.title}
                    </h2>
                  </div>

                  <div className="pl-[52px] space-y-4">
                    {section.intro && (
                      <p className="text-[15px] leading-7 text-foreground/85">{section.intro}</p>
                    )}

                    {section.bullets && (
                      <ul className="space-y-2">
                        {section.bullets.map((item, i) => (
                          <li key={i} className="flex items-start gap-3 text-[15px] leading-7 text-foreground/85">
                            <span className="mt-[11px] h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {section.subsections?.map((sub, si) => (
                      <div key={si} className="space-y-2">
                        <p className="text-[14px] font-semibold text-foreground">{sub.label}</p>
                        <ul className="space-y-2">
                          {sub.items.map((item, ii) => (
                            <li key={ii} className="flex items-start gap-3 text-[15px] leading-7 text-foreground/85">
                              <span className="mt-[11px] h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}

                    {section.note && (
                      <div className="rounded-lg border border-[#bfdbfe] bg-[#eff6ff] px-4 py-3">
                        <p className="text-[13px] text-[#1e40af] leading-relaxed">{section.note}</p>
                      </div>
                    )}

                    {section.body && (
                      <p className="text-[15px] leading-7 text-foreground/85">{section.body}</p>
                    )}
                  </div>
                </section>
              ))}

              {/* ── Governance & Oversight ─────────────────────────────────── */}
              <section className="scroll-mt-28 pt-8 pb-2">
                <div className="flex items-start gap-4 mb-5">
                  <span className="mt-0.5 shrink-0 w-9 h-9 rounded-full bg-[#1e40af] text-white text-sm font-extrabold flex items-center justify-center shadow-sm">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </span>
                  <h2 className="text-xl sm:text-[22px] font-extrabold text-foreground leading-snug tracking-tight">
                    Compliance Governance and Oversight
                  </h2>
                </div>
                <div className="pl-[52px]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: 'Dedicated Compliance Officer', detail: 'Direct access to the Board' },
                      { label: 'Compliance Committee', detail: 'Strategic oversight and direction' },
                      { label: 'Annual Risk Assessments', detail: 'Full program reviews every year' },
                      { label: 'Third-Party Audits', detail: 'Conducted by reputable independent firms' },
                      { label: 'Supplier & Partner Contracts', detail: 'Compliance integrated into all agreements' },
                      { label: 'Continuous Monitoring', detail: 'Automated controls and audit trails' },
                    ].map((item) => (
                      <div key={item.label} className="rounded-lg border border-border bg-muted/30 px-4 py-3 flex items-start gap-3">
                        <span className="mt-0.5 h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                        <div>
                          <p className="text-[13px] font-semibold text-foreground">{item.label}</p>
                          <p className="text-[12px] text-muted-foreground">{item.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* ── Certifications ────────────────────────────────────────── */}
              <section className="scroll-mt-28 pt-8 pb-2">
                <div className="flex items-start gap-4 mb-5">
                  <span className="mt-0.5 shrink-0 w-9 h-9 rounded-full bg-success text-white text-sm font-extrabold flex items-center justify-center shadow-sm">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </span>
                  <h2 className="text-xl sm:text-[22px] font-extrabold text-foreground leading-snug tracking-tight">
                    Certifications and Audits
                  </h2>
                </div>
                <div className="pl-[52px] space-y-4">
                  <p className="text-[15px] leading-7 text-foreground/85">
                    SouthCaravan maintains or is progressing toward the following (status updated regularly):
                  </p>
                  <div className="overflow-hidden rounded-xl border border-border">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-border bg-muted/60">
                          <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Certification / Activity</th>
                          <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground w-28">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {CERTIFICATIONS.map((cert) => (
                          <tr key={cert.label} className="hover:bg-muted/20 transition-colors">
                            <td className="px-4 py-3 text-[13px] text-foreground/85">{cert.label}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cert.color}`}>
                                {cert.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[14px] leading-7 text-foreground/70">
                    We provide summary compliance attestations upon request under appropriate confidentiality terms. Full reports may be shared with qualified enterprise customers via NDA.
                  </p>
                </div>
              </section>

              {/* ── Whistleblower ─────────────────────────────────────────── */}
              <section className="scroll-mt-28 pt-8 pb-2">
                <div className="flex items-start gap-4 mb-5">
                  <span className="mt-0.5 shrink-0 w-9 h-9 rounded-full bg-warning text-white text-sm font-extrabold flex items-center justify-center shadow-sm">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </span>
                  <h2 className="text-xl sm:text-[22px] font-extrabold text-foreground leading-snug tracking-tight">
                    Reporting Concerns and Whistleblower Protection
                  </h2>
                </div>
                <div className="pl-[52px] space-y-4">
                  <p className="text-[15px] leading-7 text-foreground/85">
                    We encourage transparent reporting of any suspected compliance issues, violations, or risks. Reports can be made confidentially and anonymously where permitted by law. All reports are investigated promptly, fairly, and in accordance with applicable laws. Whistleblowers are protected from retaliation.
                  </p>
                  <div className="rounded-xl border border-warning-border bg-warning-surface px-5 py-4 space-y-3">
                    <p className="text-[12px] uppercase tracking-widest font-bold text-warning-text">Report a Concern</p>
                    <div className="space-y-2 text-[13px] text-foreground/80">
                      <p>
                        <span className="font-semibold">Email: </span>
                        <a href="mailto:compliance@southcaravan.com" className="text-link underline underline-offset-2 hover:text-link-hover transition-colors">
                          compliance@southcaravan.com
                        </a>
                      </p>
                      <p><span className="font-semibold">Phone: </span>+256 700 123 456 (Kampala, Uganda)</p>
                      <p><span className="font-semibold">Secure Portal: </span><span className="text-muted-foreground">Available soon — check back for secure anonymous submission</span></p>
                    </div>
                  </div>
                </div>
              </section>

              {/* ── Updates ───────────────────────────────────────────────── */}
              <section className="pt-8 pb-2">
                <div className="pl-0 rounded-xl border border-border bg-muted/30 px-5 py-4">
                  <p className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground mb-2">Updates to This Page</p>
                  <p className="text-[14px] text-foreground/80 leading-relaxed">
                    This page is reviewed at least annually or upon significant regulatory changes. Material updates are communicated via the website, email notifications to registered users where appropriate, and platform announcements. Last updated: <span className="font-semibold text-foreground">April 2026</span>.
                  </p>
                </div>
              </section>

            </div>
          </div>
        </div>

        {/* ── Tagline ──────────────────────────────────────────────────────── */}
        <div
          className="mt-6 rounded-2xl border border-[#bfdbfe] px-8 py-7 text-center"
          style={{ background: 'linear-gradient(135deg,#eff6ff 0%,#f0fdf4 100%)' }}
        >
          <p className="text-base font-bold text-foreground">SouthCaravan — Building Trust Through Compliance</p>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
            By choosing SouthCaravan, businesses benefit from a platform engineered for regulatory resilience, operational transparency, and sustainable growth in international markets.
          </p>
        </div>

        {/* ── Contact + related ────────────────────────────────────────────── */}
        <div className="mt-6 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          {/* Contact section */}
          <div className="px-8 sm:px-10 pt-8 pb-6 border-b border-border">
            <p className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground mb-5">
              Contact Our Compliance Team
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Compliance */}
              <div className="rounded-xl border border-border bg-background p-5 flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <span className="shrink-0 w-10 h-10 rounded-xl bg-[#eff6ff] flex items-center justify-center">
                    <svg className="h-5 w-5 text-[#1e40af]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-sm font-bold text-foreground">Compliance &amp; Regulatory</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Audits, certifications, due diligence &amp; regulatory inquiries</p>
                  </div>
                </div>
                <a
                  href="mailto:compliance@southcaravan.com"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1e40af] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1e3a8a] transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  compliance@southcaravan.com
                </a>
              </div>

              {/* Legal */}
              <div className="rounded-xl border border-border bg-background p-5 flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <span className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-sm font-bold text-foreground">Legal &amp; Formal Notices</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">SouthCaravan Ltd, Plot 45, Kampala Road, Kampala, Uganda</p>
                  </div>
                </div>
                <a
                  href="mailto:legal@southcaravan.com"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  legal@southcaravan.com
                </a>
              </div>
            </div>
          </div>

          {/* Related policies */}
          <div className="px-8 sm:px-10 py-5">
            <p className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground mb-3">
              Related Policies
            </p>
            <div className="flex flex-wrap gap-2">
              {RELATED.map((p) => (
                <Link
                  key={p.href}
                  href={p.href}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm text-foreground/75 hover:border-primary hover:text-primary transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={p.icon} />
                  </svg>
                  {p.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
