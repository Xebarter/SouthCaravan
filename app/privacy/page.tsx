import { Breadcrumbs } from '@/components/breadcrumbs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import Link from 'next/link';
import React from 'react';

// ─── Data loading ────────────────────────────────────────────────────────────

async function getPrivacyText() {
  try {
    return await readFile(path.join(process.cwd(), 'additems.txt'), 'utf8');
  } catch {
    return null;
  }
}

// ─── Text normalisation ──────────────────────────────────────────────────────

/**
 * Line-by-line pass that adds blank lines both BEFORE and AFTER any section
 * heading so the paragraph-splitter always sees them as isolated blocks.
 */
function normalizeText(text: string): string {
  const lines = text.split('\n');
  const out: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    const isHeading = /^\d+\.(\d+)?\s+[A-Z\[]/.test(trimmed);
    const prevBlank = i === 0 || lines[i - 1].trim() === '';
    const nextBlank = i === lines.length - 1 || lines[i + 1].trim() === '';

    if (isHeading && !prevBlank) out.push('');
    out.push(lines[i]);
    if (isHeading && !nextBlank) out.push('');
  }

  return out.join('\n');
}

// ─── Block classification ────────────────────────────────────────────────────

type BlockKind = 'h2' | 'h3' | 'bullets' | 'paragraph' | 'table' | 'labeled-list';

interface Block {
  kind: BlockKind;
  raw: string;
  lines: string[];
  singleLine: string;
}

function classify(raw: string): Block {
  const lines = raw
    .split(/\r?\n/g)
    .map((l) => l.trim())
    .filter(Boolean);
  const singleLine = lines.join(' ');
  const isH3 = /^\d+\.\d+\s+/.test(singleLine);
  const isH2 = /^\d+\.\s+/.test(singleLine) && !isH3;
  const isBullets = lines.length >= 1 && lines.every((l) => /^[-•]\s+/.test(l));
  // Table: has at least one separator row (---) and at least one pipe-delimited row
  const isTable =
    lines.length >= 2 &&
    lines.some((l) => /^[-|:\s]+$/.test(l)) &&
    lines.some((l) => l.includes('|'));
  // Labeled list: first line is a label (e.g. "Notes:"), rest are bullet lines
  const isLabeledList =
    !isBullets &&
    lines.length >= 2 &&
    !/^[-•]\s+/.test(lines[0]) &&
    lines.slice(1).every((l) => /^[-•]\s+/.test(l));

  const kind: BlockKind = isH2
    ? 'h2'
    : isH3
      ? 'h3'
      : isTable
        ? 'table'
        : isBullets
          ? 'bullets'
          : isLabeledList
            ? 'labeled-list'
            : 'paragraph';

  return { kind, raw, lines, singleLine };
}

// ─── Section grouping ────────────────────────────────────────────────────────

interface Section {
  num: string;
  title: string;
  id: string;
  blocks: Block[];
}

function groupSections(blocks: Block[]): { preamble: Block[]; sections: Section[] } {
  const preamble: Block[] = [];
  const sections: Section[] = [];
  let current: Section | null = null;

  for (const block of blocks) {
    if (block.kind === 'h2') {
      if (current) sections.push(current);
      const match = block.singleLine.match(/^(\d+)\.\s+(.*)/);
      const num = match?.[1] ?? '';
      const title = (match?.[2] ?? block.singleLine)
        .replace(/\s+\[Note:.*$/i, '')
        .trim();
      current = { num, title, id: `section-${num}`, blocks: [] };
    } else if (current) {
      current.blocks.push(block);
    } else {
      preamble.push(block);
    }
  }
  if (current) sections.push(current);
  return { preamble, sections };
}

// ─── Inline link enrichment ──────────────────────────────────────────────────

const LINK_SPLIT =
  /(privacy@southcaravan\.com|legal@southcaravan\.com|support@southcaravan\.com|Terms and Conditions|Terms of Service)/g;

function withLinks(text: string): React.ReactNode {
  return text.split(LINK_SPLIT).map((seg, i) => {
    if (seg === 'privacy@southcaravan.com')
      return <a key={i} href="mailto:privacy@southcaravan.com" className="text-link underline underline-offset-2 hover:text-link-hover transition-colors">{seg}</a>;
    if (seg === 'legal@southcaravan.com')
      return <a key={i} href="mailto:legal@southcaravan.com" className="text-link underline underline-offset-2 hover:text-link-hover transition-colors">{seg}</a>;
    if (seg === 'support@southcaravan.com')
      return <a key={i} href="mailto:support@southcaravan.com" className="text-link underline underline-offset-2 hover:text-link-hover transition-colors">{seg}</a>;
    if (seg === 'Terms and Conditions' || seg === 'Terms of Service')
      return <Link key={i} href="/terms" className="text-link underline underline-offset-2 hover:text-link-hover transition-colors">{seg}</Link>;
    return seg;
  });
}

// ─── Block renderers ─────────────────────────────────────────────────────────

function renderH3(block: Block, idx: number) {
  const match = block.singleLine.match(/^(\d+\.\d+)\s+(.*)/);
  const num = match?.[1] ?? '';
  const title = match?.[2] ?? block.singleLine;
  return (
    <div key={`h3-${idx}`} id={`section-${num}`} className="mt-6 scroll-mt-24">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 shrink-0 inline-flex items-center rounded-md bg-[#eff6ff] border border-[#bfdbfe] px-2 py-0.5 text-[11px] font-bold text-[#1565c0] tabular-nums leading-5">
          {num}
        </span>
        <h3 className="text-[15px] font-semibold text-foreground leading-snug">{title}</h3>
      </div>
    </div>
  );
}

function renderBullets(block: Block, idx: number) {
  return (
    <ul key={`bullets-${idx}`} className="my-1 space-y-2">
      {block.lines.map((l, li) => (
        <li key={li} className="flex items-start gap-3 text-[15px] leading-7 text-foreground/85">
          <span className="mt-[11px] h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
          <span>{withLinks(l.replace(/^[-•]+\s+/, ''))}</span>
        </li>
      ))}
    </ul>
  );
}

function renderParagraph(block: Block, idx: number) {
  return (
    <p key={`p-${idx}`} className="text-[15px] leading-7 text-foreground/85">
      {withLinks(block.raw)}
    </p>
  );
}

const CATEGORY_STYLES: Record<string, string> = {
  'Strictly Necessary': 'bg-red-50 text-red-700 border-red-200',
  'Functional / Preference': 'bg-blue-50 text-blue-700 border-blue-200',
  'Performance / Analytics': 'bg-purple-50 text-purple-700 border-purple-200',
  'Marketing / Targeting': 'bg-orange-50 text-orange-700 border-orange-200',
};

function renderTable(block: Block, idx: number) {
  // Drop separator rows (---) and split remaining rows on |
  const rows = block.lines
    .filter((l) => !/^[-|:\s]+$/.test(l))
    .map((l) => l.split('|').map((c) => c.trim()));

  if (rows.length < 2) return renderParagraph(block, idx);

  const [headerCells, ...dataCells] = rows;

  return (
    <div key={`table-${idx}`} className="my-4 overflow-x-auto rounded-xl border border-border shadow-xs">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/60">
            {headerCells.map((h, hi) => (
              <th
                key={hi}
                className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {dataCells.map((row, ri) => (
            <tr key={ri} className="transition-colors hover:bg-muted/20">
              {row.map((cell, ci) => {
                // Cookie name column — monospace
                if (ci === 0) {
                  return (
                    <td key={ci} className="whitespace-nowrap px-4 py-3 font-mono text-[12px] font-semibold text-foreground">
                      {cell}
                    </td>
                  );
                }
                // Provider column — distinguish first/third party
                if (ci === 1) {
                  const isThird = /third-party/i.test(cell);
                  return (
                    <td key={ci} className="px-4 py-3 text-[13px] text-foreground/80">
                      <span className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${isThird ? 'bg-amber-400' : 'bg-success'}`} />
                        {cell}
                      </span>
                    </td>
                  );
                }
                // Type/Category column — colour badge
                if (ci === 2) {
                  const colorClass = CATEGORY_STYLES[cell] ?? 'border-border bg-muted text-muted-foreground';
                  return (
                    <td key={ci} className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${colorClass}`}>
                        {cell}
                      </span>
                    </td>
                  );
                }
                // Purpose & Duration
                return (
                  <td key={ci} className="px-4 py-3 text-[13px] leading-relaxed text-foreground/80">
                    {withLinks(cell)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderLabeledList(block: Block, idx: number) {
  const [label, ...bulletLines] = block.lines;
  return (
    <div key={`ll-${idx}`} className="space-y-2">
      <p className="text-[14px] font-semibold text-foreground">{label}</p>
      <ul className="space-y-2">
        {bulletLines.map((l, li) => (
          <li key={li} className="flex items-start gap-3 text-[15px] leading-7 text-foreground/85">
            <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span>{withLinks(l.replace(/^[-•]+\s+/, ''))}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function renderBlock(block: Block, idx: number): React.ReactNode {
  if (block.kind === 'h3') return renderH3(block, idx);
  if (block.kind === 'bullets') return renderBullets(block, idx);
  if (block.kind === 'table') return renderTable(block, idx);
  if (block.kind === 'labeled-list') return renderLabeledList(block, idx);
  return renderParagraph(block, idx);
}

// ─── Static data ─────────────────────────────────────────────────────────────

const COMMITMENTS = [
  {
    title: 'We never sell your data',
    body: 'Your personal and business data is never sold to third parties for monetary compensation.',
    iconBg: 'bg-success-surface',
    iconColor: 'text-success-text',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: 'Encrypted end-to-end',
    body: 'TLS/SSL in transit. Industry-standard encryption at rest. MFA supported across all accounts.',
    iconBg: 'bg-[#eff6ff]',
    iconColor: 'text-[#1e40af]',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  {
    title: 'Your rights respected',
    body: 'Access, correct, delete, or export your data any time. Full GDPR, CCPA & Uganda DPA support.',
    iconBg: 'bg-accent',
    iconColor: 'text-primary',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    title: 'Breach notification',
    body: 'Prompt notification in the event of a data breach that may affect your rights or freedoms.',
    iconBg: 'bg-warning-surface',
    iconColor: 'text-warning-text',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function PrivacyPage() {
  const rawText = await getPrivacyText();
  const text = rawText ? normalizeText(rawText) : null;

  const allBlocks = text
    ? text.split(/\r?\n\s*\r?\n/g).map((b) => b.trim()).filter(Boolean).map(classify)
    : [];

  const { sections } = groupSections(allBlocks);

  const toc = sections.map((s) => ({ id: s.id, number: s.num, label: s.title }));

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Breadcrumbs items={[{ label: 'Privacy Policy' }]} />

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div className="mt-6 rounded-2xl overflow-hidden border border-border shadow-md">

          {/* Banner */}
          <div
            className="relative px-8 sm:px-12 py-10 border-b border-border overflow-hidden"
            style={{ background: 'linear-gradient(135deg,#ecfdf5 0%,#ffffff 50%,#eff6ff 100%)' }}
          >
            {/* Decorative blobs */}
            <span aria-hidden className="pointer-events-none absolute -right-8 -top-8 w-56 h-56 rounded-full bg-success/[0.06]" />
            <span aria-hidden className="pointer-events-none absolute right-24 top-10 w-32 h-32 rounded-full bg-[#2196f3]/[0.05]" />

            <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
              <div className="flex-1 min-w-0">
                {/* Badge */}
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success-surface border border-success-border px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-success-text mb-5">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Privacy Policy
                </span>

                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
                  Your Data, Your Rights
                </h1>
                <p className="mt-3 text-base text-muted-foreground leading-relaxed max-w-xl">
                  How SouthCaravan collects, uses, shares, and protects your
                  information when you access our B2B platform and services.
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  Incorporated into our{' '}
                  <Link href="/terms#section-1" className="font-medium text-link underline underline-offset-2 hover:text-link-hover transition-colors">
                    Terms &amp; Conditions
                  </Link>
                  . In the event of conflict, this policy prevails on privacy matters.
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
              <span className="font-semibold">Your Privacy Matters: </span>
              By accessing or using SouthCaravan you agree to the data practices described in this policy. It applies to all registered users, buyers, and vendors on the platform.
            </p>
          </div>

          {/* Key commitments */}
          <div className="px-8 sm:px-12 py-8 bg-muted/30 border-b border-border">
            <p className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground mb-5">
              Our Core Commitments
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {COMMITMENTS.map((c) => (
                <div key={c.title} className="rounded-xl bg-card border border-border p-5 flex flex-col gap-3 shadow-xs hover:shadow-sm transition-shadow">
                  <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${c.iconBg} ${c.iconColor}`}>
                    {c.icon}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-foreground leading-snug">{c.title}</p>
                    <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{c.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Table of Contents */}
          {toc.length > 0 && (
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
          )}

          {/* Content body */}
          {text ? (
            <div className="bg-card px-8 sm:px-12 py-10">
              <div className="max-w-3xl divide-y divide-border/60">
                {sections.map((section) => (
                  <section
                    key={section.id}
                    id={section.id}
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

                    {/* Section content */}
                    <div className="pl-[52px] space-y-4">
                      {section.blocks.map((block, i) => renderBlock(block, i))}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-card px-8 sm:px-12 py-10">
              <div className="rounded-xl border border-border bg-muted/30 p-6">
                <p className="text-muted-foreground text-sm">
                  We couldn&apos;t load the Privacy Policy right now. Please contact{' '}
                  <a href="mailto:privacy@southcaravan.com" className="text-link underline underline-offset-4 hover:text-link-hover transition-colors">
                    privacy@southcaravan.com
                  </a>
                  .
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Contact + related ────────────────────────────────────────────── */}
        <div className="mt-6 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          {/* Contact section */}
          <div className="px-8 sm:px-10 pt-8 pb-6 border-b border-border">
            <p className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground mb-5">
              Get in Touch
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Privacy */}
              <div className="rounded-xl border border-border bg-background p-5 flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <span className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-sm font-bold text-foreground">Privacy &amp; Data Rights</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Access, deletion, correction &amp; portability requests</p>
                  </div>
                </div>
                <a
                  href="mailto:privacy@southcaravan.com"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  privacy@southcaravan.com
                </a>
              </div>

              {/* Legal */}
              <div className="rounded-xl border border-border bg-background p-5 flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <span className="shrink-0 w-10 h-10 rounded-xl bg-[#eff6ff] flex items-center justify-center">
                    <svg className="h-5 w-5 text-[#1e40af]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-sm font-bold text-foreground">Legal &amp; Compliance</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Formal notices, regulatory &amp; breach correspondence</p>
                  </div>
                </div>
                <a
                  href="mailto:legal@southcaravan.com"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1e40af] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1e3a8a] transition-colors"
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
              {[
                { href: '/terms', label: 'Terms of Service', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                { href: '/cookies', label: 'Cookie Policy', icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                { href: '/compliance', label: 'Compliance', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
              ].map((p) => (
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
