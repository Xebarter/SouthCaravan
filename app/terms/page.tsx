import { Breadcrumbs } from '@/components/breadcrumbs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import Link from 'next/link';
import React from 'react';

async function getTermsText() {
  const filePath = path.join(process.cwd(), 'additems.txt');
  try {
    return await readFile(filePath, 'utf8');
  } catch {
    return null;
  }
}

/** Turn known policy names and email addresses into live links. */
function renderInlineLinks(text: string): React.ReactNode {
  const segments = text.split(
    /(Privacy Policy|privacy@southcaravan\.com|legal@southcaravan\.com)/g,
  );
  return segments.map((seg, i) => {
    if (seg === 'Privacy Policy')
      return (
        <Link key={i} href="/privacy" className="text-link underline underline-offset-2 hover:text-link-hover transition-colors">
          Privacy Policy
        </Link>
      );
    if (seg === 'privacy@southcaravan.com')
      return (
        <a key={i} href="mailto:privacy@southcaravan.com" className="text-link underline underline-offset-2 hover:text-link-hover transition-colors">
          {seg}
        </a>
      );
    if (seg === 'legal@southcaravan.com')
      return (
        <a key={i} href="mailto:legal@southcaravan.com" className="text-link underline underline-offset-2 hover:text-link-hover transition-colors">
          {seg}
        </a>
      );
    return seg;
  });
}

function classifyBlock(block: string) {
  const lines = block
    .split(/\r?\n/g)
    .map((l) => l.trim())
    .filter(Boolean);
  const asSingleLine = lines.join(' ');
  const isH3 = /^\d+\.\d+\s+/.test(asSingleLine);
  return {
    lines,
    asSingleLine,
    isAllCapsTitle:
      lines.length <= 3 &&
      /^[A-Z0-9][A-Z0-9\s().,'"""\-–—/]+$/.test(asSingleLine) &&
      asSingleLine.length <= 80,
    isH2: /^\d+\.\s+/.test(asSingleLine) && !isH3,
    isH3,
    isMetaLine: /^Last Updated:\s*/i.test(asSingleLine),
    isBulletList: lines.length >= 2 && lines.every((l) => /^-\s+/.test(l)),
    isDefinition:
      /^"[A-Z]/.test(asSingleLine) &&
      / means /.test(asSingleLine) &&
      lines.length === 1,
  };
}

export default async function TermsPage() {
  const termsText = await getTermsText();
  const blocks = termsText
    ? termsText.split(/\r?\n\s*\r?\n/g).map((b) => b.trim()).filter(Boolean)
    : [];

  // Pre-pass: extract TOC from numbered H2 sections
  const toc = blocks
    .map((block) => {
      const { asSingleLine, isH2 } = classifyBlock(block);
      if (!isH2) return null;
      const match = asSingleLine.match(/^(\d+)\.\s+(.*)/);
      if (!match) return null;
      return { number: match[1], label: match[2], id: `section-${match[1]}` };
    })
    .filter(Boolean) as { number: string; label: string; id: string }[];

  // Render content blocks
  const rendered = blocks.map((block, idx) => {
    const {
      lines,
      asSingleLine,
      isAllCapsTitle,
      isH2,
      isH3,
      isMetaLine,
      isBulletList,
      isDefinition,
    } = classifyBlock(block);
    const key = `${idx}-${block.slice(0, 20).replace(/\s+/g, '-')}`;

    // Suppress — rendered in the hero header
    if (isMetaLine || isAllCapsTitle) return null;

    if (isH2) {
      const match = asSingleLine.match(/^(\d+)\.\s+(.*)/);
      const num = match?.[1] ?? '';
      const title = match?.[2] ?? asSingleLine;
      return (
        <div key={key} id={`section-${num}`} className="scroll-mt-28">
          <div className="flex items-start gap-4 pt-10 pb-4 border-b-2 border-primary/20">
            <span className="mt-0.5 shrink-0 w-9 h-9 rounded-full bg-primary text-white text-sm font-extrabold flex items-center justify-center shadow-sm">
              {num}
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground leading-snug tracking-tight">
              {title}
            </h2>
          </div>
        </div>
      );
    }

    if (isH3) {
      const match = asSingleLine.match(/^(\d+\.\d+)\s+(.*)/);
      const num = match?.[1] ?? '';
      const title = match?.[2] ?? asSingleLine;
      return (
        <h3
          key={key}
          className="flex items-baseline gap-2 text-base sm:text-lg font-semibold text-[#1565c0] mt-7 mb-1 scroll-mt-24"
        >
          <span className="text-xs font-bold text-muted-foreground tabular-nums">{num}</span>
          <span>{title}</span>
        </h3>
      );
    }

    if (isBulletList) {
      return (
        <ul key={key} className="my-3 space-y-2">
          {lines.map((l) => (
            <li
              key={`${key}-${l.slice(0, 20)}`}
              className="flex items-start gap-3 text-[15px] leading-7 text-foreground/85"
            >
              <span className="mt-2.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              <span>{renderInlineLinks(l.replace(/^-+\s+/, ''))}</span>
            </li>
          ))}
        </ul>
      );
    }

    if (isDefinition) {
      const match = asSingleLine.match(/^"([^"]+)"\s+means\s+(.*)/);
      if (match) {
        return (
          <div
            key={key}
            className="flex flex-col sm:flex-row gap-1 sm:gap-4 py-3 border-b border-border/50 last:border-0"
          >
            <span className="shrink-0 sm:w-44 text-sm font-semibold text-primary leading-relaxed">
              &ldquo;{match[1]}&rdquo;
            </span>
            <span className="text-sm text-foreground/85 leading-relaxed">
              means {match[2]}
            </span>
          </div>
        );
      }
    }

    return (
      <p key={key} className="text-[15px] leading-7 text-foreground/85 whitespace-pre-line">
        {renderInlineLinks(block)}
      </p>
    );
  });

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Breadcrumbs items={[{ label: 'Terms of Service' }]} />

        {/* ─── Hero ─────────────────────────────────────────────────────────── */}
        <div className="mt-6 rounded-2xl overflow-hidden border border-border shadow-md">
          <div
            className="relative px-8 sm:px-12 py-10 border-b border-border"
            style={{
              background:
                'linear-gradient(135deg, #fff5f0 0%, #ffffff 45%, #eff6ff 100%)',
            }}
          >
            {/* Decorative circles */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-6 top-6 w-40 h-40 rounded-full bg-primary/5"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-16 top-14 w-20 h-20 rounded-full bg-[#2196f3]/5"
            />

            <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
              <div>
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-primary mb-4">
                  Legal Document
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
                  Terms of Service
                </h1>
                <p className="mt-3 text-base text-muted-foreground max-w-2xl leading-relaxed">
                  These terms govern your access to and use of the SouthCaravan
                  platform and all associated services.
                </p>
              </div>

              <div className="shrink-0 rounded-xl border border-border bg-white/80 backdrop-blur-sm px-5 py-4 shadow-sm text-left sm:text-right">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                  Last Updated
                </p>
                <p className="mt-1 text-base font-bold text-foreground">April 20, 2026</p>
                <span className="mt-2 inline-block rounded-full bg-success-surface px-2.5 py-0.5 text-[11px] font-semibold text-success-text">
                  Current Version
                </span>
              </div>
            </div>
          </div>

          {/* Agreement notice */}
          <div className="flex items-start gap-3 px-8 sm:px-12 py-4 bg-[#eff6ff] border-b border-[#bfdbfe]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-[#1e40af] shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-[#1e40af] leading-relaxed">
              <span className="font-semibold">Agreement Notice: </span>
              By accessing or using SouthCaravan, you acknowledge that you have
              read and agree to be bound by these Terms of Service.
            </p>
          </div>

          {/* Table of Contents */}
          {toc.length > 0 && (
            <div className="px-8 sm:px-12 py-8 bg-muted/50 border-b border-border">
              <p className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground mb-5">
                Table of Contents
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {toc.map((entry) => (
                  <a
                    key={entry.id}
                    href={`#${entry.id}`}
                    className="group flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-accent transition-colors"
                  >
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[11px] font-extrabold flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                      {entry.number}
                    </span>
                    <span className="text-sm text-foreground/75 group-hover:text-foreground transition-colors leading-snug">
                      {entry.label}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Body */}
          {termsText ? (
            <div className="bg-card px-8 sm:px-12 py-10">
              <div className="max-w-3xl space-y-4">{rendered}</div>
            </div>
          ) : (
            <div className="bg-card px-8 sm:px-12 py-10">
              <div className="rounded-xl border border-border bg-muted/30 p-6">
                <p className="text-muted-foreground text-sm">
                  We couldn&apos;t load the Terms right now. Please try again
                  later or contact{' '}
                  <a
                    href="mailto:legal@southcaravan.com"
                    className="text-link underline underline-offset-4 hover:text-link-hover transition-colors"
                  >
                    legal@southcaravan.com
                  </a>
                  .
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ─── Related policies strip ──────────────────────────────────────── */}
        <div className="mt-6 rounded-2xl border border-border bg-card shadow-sm px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Related Policies
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/privacy"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm text-foreground/80 hover:border-primary hover:text-primary transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Privacy Policy
            </Link>
            <Link
              href="/cookies"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm text-foreground/80 hover:border-primary hover:text-primary transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Cookie Policy
            </Link>
            <Link
              href="/compliance"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm text-foreground/80 hover:border-primary hover:text-primary transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Compliance
            </Link>
          </div>
        </div>

        {/* ─── Contact footer card ──────────────────────────────────────────── */}
        <div className="mt-6 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-8 sm:px-10 py-7">
            <div className="flex items-start gap-4">
              <span className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </span>
              <div>
                <p className="text-base font-semibold text-foreground">
                  Questions about these Terms?
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Our legal team is available to assist with any questions or
                  concerns.
                </p>
              </div>
            </div>
            <a
              href="mailto:legal@southcaravan.com"
              className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-colors shadow-sm"
            >
              Contact Legal Team
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
