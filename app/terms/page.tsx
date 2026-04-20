import { Breadcrumbs } from '@/components/breadcrumbs';
import Link from 'next/link';

// ─── Static data ─────────────────────────────────────────────────────────────

const HIGHLIGHTS = [
  {
    title: 'Binding Agreement',
    body: 'By accessing SouthCaravan you accept these Terms. Business users agree on behalf of their organisation.',
    iconBg: 'bg-[#eff6ff]',
    iconColor: 'text-[#1e40af]',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: 'B2B Platform Only',
    body: 'SouthCaravan is exclusively for registered business entities. Consumer use is not permitted.',
    iconBg: 'bg-success-surface',
    iconColor: 'text-success-text',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    title: 'Ugandan Law Governs',
    body: 'These Terms are governed by the laws of Uganda. Disputes go to Kampala arbitration first.',
    iconBg: 'bg-warning-surface',
    iconColor: 'text-warning-text',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </svg>
    ),
  },
  {
    title: 'Liability Capped',
    body: "SouthCaravan's aggregate liability is limited to fees paid in the 12 months preceding any claim.",
    iconBg: 'bg-accent',
    iconColor: 'text-primary',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
];

interface SubSection {
  num: string;
  title: string;
  content: React.ReactNode;
}

interface Section {
  num: string;
  title: string;
  intro?: string;
  bullets?: string[];
  note?: string;
  body?: string;
  subsections?: SubSection[];
  definitions?: { term: string; meaning: string }[];
}

import React from 'react';

const SECTIONS: Section[] = [
  {
    num: '1',
    title: 'Acceptance of Terms',
    body: 'These Terms of Service ("Terms") constitute a legally binding agreement between you ("User", "you", or "your") and SouthCaravan Ltd, a company incorporated in Uganda ("SouthCaravan", "we", "us", or "our"), governing your access to and use of the SouthCaravan platform, website at southcaravan.com, APIs, and all related services (collectively, the "Platform").',
    bullets: [
      'By registering, accessing, or using the Platform, you confirm that you have read, understood, and agree to be bound by these Terms.',
      'If you are using the Platform on behalf of an organisation, you represent and warrant that you have the authority to bind that organisation to these Terms.',
      'If you do not agree to these Terms, you must not access or use the Platform.',
      'We may update these Terms at any time. Continued use after notice of changes constitutes acceptance of the revised Terms.',
    ],
  },
  {
    num: '2',
    title: 'Definitions',
    intro: 'The following terms have the meanings set out below throughout these Terms:',
    definitions: [
      { term: 'Platform', meaning: 'the SouthCaravan website, web application, APIs, mobile applications, and all associated services.' },
      { term: 'User', meaning: 'any individual or entity that registers for or uses the Platform, including Buyers, Vendors, and Administrators.' },
      { term: 'Buyer', meaning: 'a registered business entity that uses the Platform to source goods or services, post RFQs, and manage procurement workflows.' },
      { term: 'Vendor', meaning: 'a registered business entity that uses the Platform to respond to RFQs, list products or services, and fulfil orders.' },
      { term: 'RFQ', meaning: 'a Request for Quotation — a formal procurement document posted by a Buyer inviting Vendors to submit bids.' },
      { term: 'Content', meaning: 'all data, text, images, documents, and other materials submitted to or made available through the Platform.' },
      { term: 'Transaction', meaning: 'any procurement agreement, purchase order, or contract facilitated through the Platform.' },
      { term: 'Confidential Information', meaning: 'non-public business, technical, or commercial information disclosed by one party to another through the Platform.' },
    ],
  },
  {
    num: '3',
    title: 'Platform Access and Registration',
    intro: 'Access to SouthCaravan is restricted to registered business entities. To use the Platform you must:',
    bullets: [
      'Be a duly registered business, company, partnership, or organisation with legal capacity to enter contracts.',
      'Provide accurate, complete, and current registration information including your business name, registration number, and authorised contact details.',
      'Maintain the security of your account credentials and promptly notify us of any unauthorised access at support@southcaravan.com.',
      'Not share login credentials with individuals outside your authorised organisation.',
      'Not create multiple accounts for the same entity without prior written approval.',
    ],
    note: 'We reserve the right to suspend or terminate accounts that provide false information, violate these Terms, or engage in fraudulent or deceptive conduct.',
  },
  {
    num: '4',
    title: 'User Obligations and Conduct',
    intro: 'All Users must comply with the following obligations when using the Platform:',
    bullets: [
      'Use the Platform only for lawful B2B procurement purposes and in accordance with all applicable laws and regulations.',
      'Not upload, transmit, or distribute malicious code, viruses, or any content designed to harm, disrupt, or gain unauthorised access to systems.',
      'Not attempt to reverse-engineer, decompile, scrape, or extract data from the Platform without express written permission.',
      'Not impersonate any person or entity, misrepresent your identity or business affiliation.',
      'Not use the Platform to facilitate transactions involving prohibited, restricted, or illegal goods or services.',
      'Not engage in any conduct that could damage the reputation, operations, or security of SouthCaravan or other Users.',
      'Comply with all applicable export control, sanctions, and trade compliance laws when using cross-border procurement features.',
    ],
  },
  {
    num: '5',
    title: 'Vendor Obligations',
    intro: 'In addition to the general obligations above, Vendors specifically agree to:',
    bullets: [
      'Provide accurate, complete, and up-to-date information about their products, services, capabilities, certifications, and pricing.',
      'Fulfil all confirmed orders and accepted bids in accordance with the agreed terms, specifications, timelines, and quality standards.',
      'Hold and maintain all licences, permits, and certifications required to supply the goods or services they list on the Platform.',
      'Not list counterfeit, infringing, prohibited, or substandard goods or services.',
      'Respond to RFQs and Buyer inquiries in a timely and professional manner.',
      'Immediately notify SouthCaravan and affected Buyers of any material changes in ability to deliver (e.g., supply disruptions, insolvency).',
      "Comply with SouthCaravan's Vendor Code of Conduct and all applicable trade, labour, and ESG standards.",
    ],
  },
  {
    num: '6',
    title: 'Buyer Obligations',
    intro: 'In addition to the general obligations above, Buyers specifically agree to:',
    bullets: [
      'Issue RFQs in good faith with genuine intent to procure and award contracts fairly based on merit.',
      'Honour accepted quotations and purchase orders and not cancel confirmed Transactions without legitimate business justification.',
      'Provide Vendors with accurate specifications, requirements, and timelines to enable accurate quotation.',
      'Make payments for completed Transactions promptly in accordance with agreed payment terms.',
      'Not use the Platform solely to harvest pricing or market intelligence without genuine procurement intent.',
      'Treat Vendors with professionalism and fairness in all communications and evaluations.',
    ],
  },
  {
    num: '7',
    title: 'Procurement, Transactions, and Payments',
    intro: 'The following terms govern all procurement activities and financial transactions on the Platform:',
    bullets: [
      'SouthCaravan acts as a technology intermediary facilitating connections between Buyers and Vendors. We are not a party to any Transaction unless expressly stated.',
      'All contracts formed through the Platform are directly between the relevant Buyer and Vendor. SouthCaravan makes no warranty regarding performance of either party.',
      'Payment terms, pricing, delivery, and specifications are agreed between Buyer and Vendor. SouthCaravan may facilitate escrow or payment processing services where expressly offered.',
      'Disputes arising from Transactions should first be resolved between the parties directly. SouthCaravan may provide dispute resolution assistance but is under no obligation to do so.',
      "All fees for SouthCaravan's services are set out in the relevant subscription or service agreement. Fees are non-refundable unless otherwise stated.",
      'We reserve the right to suspend Platform access for non-payment of applicable fees after written notice.',
    ],
  },
  {
    num: '8',
    title: 'Intellectual Property',
    intro: 'All intellectual property rights in the Platform and its content are reserved:',
    bullets: [
      'SouthCaravan and its licensors own all intellectual property rights in the Platform, including software, design, logos, trademarks, and documentation.',
      'We grant you a limited, non-exclusive, non-transferable, revocable licence to access and use the Platform solely for your authorised business purposes.',
      'You retain ownership of Content you submit, but grant SouthCaravan a worldwide, royalty-free licence to host, display, and process your Content to provide the services.',
      'You must not reproduce, distribute, modify, or create derivative works of any Platform content without prior written consent.',
      "You may not use SouthCaravan's trademarks, logos, or branding without express written permission.",
      'You must respect the intellectual property rights of other Users and third parties when uploading Content.',
    ],
  },
  {
    num: '9',
    title: 'Confidentiality',
    intro: 'Users acknowledge that they may receive Confidential Information through the Platform:',
    bullets: [
      'Each party agrees to keep confidential all Confidential Information received from the other party and to use it solely for the purposes of the relevant Transaction or relationship.',
      'Confidentiality obligations do not apply to information that is publicly known, independently developed, or required to be disclosed by law.',
      'Users must implement reasonable technical and organisational measures to protect Confidential Information from unauthorised disclosure.',
      'These confidentiality obligations survive termination of your account or these Terms for a period of three (3) years.',
    ],
  },
  {
    num: '10',
    title: 'Data Protection and Privacy',
    body: 'The collection, use, and protection of personal data processed through the Platform is governed by our Privacy Policy, which is incorporated into these Terms by reference. By using the Platform, you agree to the processing of your data as described therein. For data subject rights requests or privacy inquiries, contact privacy@southcaravan.com.',
    bullets: [
      'Buyers and Vendors acting as data controllers are responsible for their own GDPR, Uganda DPPA, and applicable data protection compliance.',
      'Where SouthCaravan processes personal data on your behalf, a Data Processing Agreement (DPA) is available on request.',
      'You must not upload special category personal data to the Platform without a lawful basis and prior written agreement with SouthCaravan.',
    ],
  },
  {
    num: '11',
    title: 'Disclaimers and Limitation of Liability',
    intro: 'The following limitations apply to the maximum extent permitted by law:',
    bullets: [
      'THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.',
      'SouthCaravan does not warrant that the Platform will be uninterrupted, error-free, secure, or free from viruses or harmful components.',
      'SouthCaravan is not liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform.',
      "SouthCaravan's aggregate liability to you for any claims arising under these Terms shall not exceed the total fees paid by you to SouthCaravan in the twelve (12) months preceding the claim.",
      'Nothing in these Terms excludes liability for death or personal injury caused by negligence, fraud, or any other liability that cannot be excluded by law.',
    ],
    note: 'Some jurisdictions do not permit exclusion of implied warranties or limitation of consequential damages. In such jurisdictions the above limitations apply to the fullest extent permitted by applicable law.',
  },
  {
    num: '12',
    title: 'Indemnification',
    body: 'You agree to indemnify, defend, and hold harmless SouthCaravan, its directors, employees, agents, and licensors from and against any claims, damages, losses, costs, and expenses (including reasonable legal fees) arising from: (a) your use of the Platform in violation of these Terms; (b) your Content; (c) your Transactions with other Users; (d) your violation of any applicable law or third-party right; or (e) any dispute between you and another User.',
  },
  {
    num: '13',
    title: 'Term and Termination',
    intro: 'These Terms apply from the moment you first access the Platform:',
    bullets: [
      'Either party may terminate the account at any time by providing written notice. Buyers and Vendors may close their accounts via the account dashboard.',
      'We may suspend or terminate your access immediately and without notice for material breach of these Terms, fraudulent activity, non-payment, or regulatory requirements.',
      'On termination, your right to access the Platform ceases immediately. Provisions that by their nature should survive (e.g., IP rights, indemnification, confidentiality, governing law) will remain in force.',
      'We will retain your data for the periods required by law and our data retention policy before deletion.',
    ],
  },
  {
    num: '14',
    title: 'Governing Law and Dispute Resolution',
    intro: 'These Terms are governed by and construed in accordance with the laws of Uganda:',
    bullets: [
      'Any dispute, controversy, or claim arising out of or relating to these Terms shall first be subject to good-faith negotiation between the parties for a period of thirty (30) days.',
      'If not resolved through negotiation, disputes shall be referred to binding arbitration in Kampala, Uganda, under the rules of the Centre for Arbitration and Dispute Resolution (CADER).',
      'Nothing prevents either party from seeking urgent injunctive or equitable relief in any court of competent jurisdiction.',
      'For Users based in the EU or other jurisdictions, mandatory statutory rights under local consumer or business protection laws are not affected.',
    ],
  },
  {
    num: '15',
    title: 'General Provisions',
    bullets: [
      'Entire Agreement: These Terms, together with the Privacy Policy and any applicable service agreements, constitute the entire agreement between you and SouthCaravan regarding the Platform.',
      'Severability: If any provision of these Terms is held unenforceable, the remaining provisions continue in full force and effect.',
      'Waiver: Failure to enforce any provision of these Terms does not constitute a waiver of our right to enforce it in the future.',
      'Assignment: You may not assign or transfer your rights or obligations under these Terms without our prior written consent. We may assign these Terms in connection with a merger, acquisition, or sale of assets.',
      'Notices: Legal notices to SouthCaravan must be sent to legal@southcaravan.com or by post to SouthCaravan Ltd, Plot 45, Kampala Road, Kampala, Uganda.',
      'Force Majeure: Neither party is liable for failure to perform due to circumstances beyond their reasonable control, including natural disasters, government actions, or infrastructure failures.',
    ],
  },
];

const RELATED = [
  { href: '/privacy', label: 'Privacy Policy', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { href: '/cookies', label: 'Cookie Policy', icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { href: '/compliance', label: 'Compliance', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function TermsPage() {
  const toc = SECTIONS.map((s) => ({ id: `section-${s.num}`, number: s.num, label: s.title }));

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Breadcrumbs items={[{ label: 'Terms of Service' }]} />

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div className="mt-6 rounded-2xl overflow-hidden border border-border shadow-md">

          {/* Banner */}
          <div
            className="relative px-8 sm:px-12 py-10 border-b border-border overflow-hidden"
            style={{ background: 'linear-gradient(135deg,#fff5f0 0%,#ffffff 50%,#eff6ff 100%)' }}
          >
            <span aria-hidden className="pointer-events-none absolute -right-8 -top-8 w-56 h-56 rounded-full bg-primary/5" />
            <span aria-hidden className="pointer-events-none absolute right-24 top-10 w-32 h-32 rounded-full bg-[#2196f3]/5" />

            <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
              <div className="flex-1 min-w-0">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-primary mb-5">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Legal Document
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
                  Terms of Service
                </h1>
                <p className="mt-3 text-base text-muted-foreground leading-relaxed max-w-xl">
                  These Terms govern your access to and use of the SouthCaravan platform and all associated services. Please read them carefully before using the platform.
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  Incorporated by reference into our{' '}
                  <Link href="/privacy#section-1" className="font-medium text-link underline underline-offset-2 hover:text-link-hover transition-colors">
                    Privacy Policy
                  </Link>
                  .
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
                  <p className="mt-0.5 text-sm font-bold text-foreground">Uganda · Global</p>
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
              <span className="font-semibold">Agreement Notice: </span>
              By registering, accessing, or using SouthCaravan, you confirm that you have read and agree to be bound by these Terms. If you are acting on behalf of an organisation, you warrant that you have authority to bind that organisation.
            </p>
          </div>

          {/* Key highlights */}
          <div className="px-8 sm:px-12 py-8 bg-muted/30 border-b border-border">
            <p className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground mb-5">
              Key Points to Know
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {HIGHLIGHTS.map((h) => (
                <div key={h.title} className="rounded-xl bg-card border border-border p-5 flex flex-col gap-3 shadow-xs hover:shadow-sm transition-shadow">
                  <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${h.iconBg} ${h.iconColor}`}>
                    {h.icon}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-foreground leading-snug">{h.title}</p>
                    <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{h.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Table of Contents */}
          <div className="px-8 sm:px-12 py-8 bg-muted/50 border-b border-border">
            <p className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground mb-5">
              Table of Contents
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
                  {/* Section heading */}
                  <div className="flex items-start gap-4 mb-5">
                    <span className="mt-0.5 shrink-0 w-9 h-9 rounded-full bg-primary text-white text-sm font-extrabold flex items-center justify-center shadow-sm">
                      {section.num}
                    </span>
                    <h2 className="text-xl sm:text-[22px] font-extrabold text-foreground leading-snug tracking-tight">
                      {section.title}
                    </h2>
                  </div>

                  {/* Section body */}
                  <div className="pl-[52px] space-y-4">
                    {section.intro && (
                      <p className="text-[15px] leading-7 text-foreground/85">{section.intro}</p>
                    )}

                    {section.body && (
                      <p className="text-[15px] leading-7 text-foreground/85">{section.body}</p>
                    )}

                    {section.definitions && (
                      <div className="rounded-xl border border-border overflow-hidden">
                        {section.definitions.map((def, i) => (
                          <div
                            key={i}
                            className="flex flex-col sm:flex-row gap-1 sm:gap-4 px-4 py-3 border-b border-border/50 last:border-0 odd:bg-muted/20"
                          >
                            <span className="shrink-0 sm:w-36 text-[13px] font-bold text-primary leading-relaxed">
                              &ldquo;{def.term}&rdquo;
                            </span>
                            <span className="text-[13px] text-foreground/80 leading-relaxed">
                              means {def.meaning}
                            </span>
                          </div>
                        ))}
                      </div>
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

                    {section.note && (
                      <div className="rounded-lg border border-[#bfdbfe] bg-[#eff6ff] px-4 py-3">
                        <p className="text-[13px] text-[#1e40af] leading-relaxed">{section.note}</p>
                      </div>
                    )}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>

        {/* ── Contact + related ────────────────────────────────────────────── */}
        <div className="mt-6 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          {/* Contact */}
          <div className="px-8 sm:px-10 pt-8 pb-6 border-b border-border">
            <p className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground mb-5">
              Questions About These Terms?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border bg-background p-5 flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <span className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-sm font-bold text-foreground">Legal &amp; Compliance</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Formal notices, contract queries &amp; regulatory correspondence</p>
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

              <div className="rounded-xl border border-border bg-background p-5 flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <span className="shrink-0 w-10 h-10 rounded-xl bg-[#eff6ff] flex items-center justify-center">
                    <svg className="h-5 w-5 text-[#1e40af]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-sm font-bold text-foreground">General Support</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Account, platform access &amp; general inquiries</p>
                  </div>
                </div>
                <a
                  href="mailto:support@southcaravan.com"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1e40af] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1e3a8a] transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  support@southcaravan.com
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
