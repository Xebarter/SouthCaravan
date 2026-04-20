import { Breadcrumbs } from '@/components/breadcrumbs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import Link from 'next/link';
import React from 'react';

// ─── Data loading & deduplication ────────────────────────────────────────────

async function getCookieText(): Promise<string | null> {
  try {
    const raw = await readFile(path.join(process.cwd(), 'additems.txt'), 'utf8');
    const marker = 'SouthCaravan Cookie Policy';
    const firstIdx = raw.indexOf(marker);
    if (firstIdx === -1) return raw.trim();
    // The second occurrence is the more complete version (has extra sections)
    const secondIdx = raw.indexOf(marker, firstIdx + marker.length);
    const content = secondIdx !== -1 ? raw.slice(secondIdx) : raw.slice(firstIdx);
    // Strip the title line — it is rendered statically in the hero
    return content.replace(/^SouthCaravan Cookie Policy\s*/i, '').trim();
  } catch {
    return null;
  }
}

// ─── Text normalisation ───────────────────────────────────────────────────────

/** Ensures blank lines before and after every section heading. */
function normalizeText(text: string): string {
  const lines = text.split('\n');
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    // Numbered heading: "1. Title" or "1.1 Title"
    const isNumHeading = /^\d+\.(\d+)?\s+[A-Z(]/.test(trimmed);
    const prevBlank = i === 0 || lines[i - 1].trim() === '';
    const nextBlank = i === lines.length - 1 || lines[i + 1].trim() === '';
    if (isNumHeading && !prevBlank) out.push('');
    out.push(lines[i]);
    if (isNumHeading && !nextBlank) out.push('');
  }
  return out.join('\n');
}

// ─── Block types & classification ────────────────────────────────────────────

type BlockKind =
  | 'section-header'   // Plain title like "Introduction / What Are Cookies?"
  | 'h2-numbered'      // "1. Strictly Necessary…"
  | 'table'            // Markdown pipe table
  | 'bullets'          // Pure bullet list (all lines start with -)
  | 'intro-bullets'    // Paragraph ending in ":" followed by bullets
  | 'notes'            // "Notes:\n- item…"
  | 'meta'             // "Last updated: …"
  | 'paragraph';       // Regular text

interface CookieBlock {
  kind: BlockKind;
  raw: string;
  lines: string[];
}

function isSectionHeader(lines: string[]): boolean {
  if (lines.length !== 1) return false;
  const l = lines[0];
  // Must not start with a digit, dash, or lowercase
  if (/^[\d-]/.test(l)) return false;
  if (/^[a-z]/.test(l)) return false;
  // Must be short and look like a title
  if (l.length > 90) return false;
  // Must not end with common sentence punctuation
  if (/[.?!]$/.test(l) && l.split(' ').length > 6) return false;
  return true;
}

function classify(raw: string): CookieBlock {
  const lines = raw
    .split(/\r?\n/g)
    .map((l) => l.trim())
    .filter(Boolean);

  if (!lines.length) return { kind: 'paragraph', raw, lines };

  const first = lines[0];

  if (/^Last updated:/i.test(first)) return { kind: 'meta', raw, lines };

  // Table: 3+ lines each containing 4+ pipe chars (excluding separator row)
  const pipeLines = lines.filter((l) => (l.match(/\|/g) ?? []).length >= 4);
  if (pipeLines.length >= 3) return { kind: 'table', raw, lines };

  // Numbered heading
  const isH3 = /^\d+\.\d+\s+/.test(first);
  if (/^\d+\.\s+/.test(first) && !isH3) return { kind: 'h2-numbered', raw, lines };

  // Notes section
  if (/^Notes:/i.test(first) && lines.length >= 2) return { kind: 'notes', raw, lines };

  // Intro line ending in ":" followed by all-bullet remaining lines
  if (
    lines.length >= 2 &&
    first.endsWith(':') &&
    lines.slice(1).every((l) => /^[-•]\s+/.test(l))
  )
    return { kind: 'intro-bullets', raw, lines };

  // Pure bullets
  if (lines.every((l) => /^[-•]\s+/.test(l))) return { kind: 'bullets', raw, lines };

  // Plain section header
  if (isSectionHeader(lines)) return { kind: 'section-header', raw, lines };

  return { kind: 'paragraph', raw, lines };
}

// ─── Table parsing & rendering ────────────────────────────────────────────────

interface TableRow {
  cookieName: string;
  provider: string;
  category: string;
  purpose: string;
  duration: string;
}

const CATEGORY_STYLE: Record<string, string> = {
  'Strictly Necessary':     'bg-success-surface text-success-text border-success-border',
  'Functional / Preference':'bg-[#eff6ff] text-[#1565c0] border-[#bfdbfe]',
  'Performance / Analytics':'bg-[#fff7ed] text-[#9a3412] border-[#fed7aa]',
  'Marketing / Targeting':  'bg-warning-surface text-warning-text border-warning-border',
};

function getCategoryStyle(category: string): string {
  for (const [key, style] of Object.entries(CATEGORY_STYLE)) {
    if (category.toLowerCase().includes(key.toLowerCase().split(' ')[0])) return style;
  }
  return 'bg-muted text-muted-foreground border-border';
}

function parseTable(lines: string[]): { headers: string[]; rows: TableRow[] } {
  const dataLines = lines.filter(
    (l) => !/^[-|:\s]+$/.test(l) && (l.match(/\|/g) ?? []).length >= 4,
  );
  const [headerLine, ...bodyLines] = dataLines;
  const parse = (l: string) =>
    l.split('|').map((c) => c.trim()).filter((_, i, a) => i !== 0 && i !== a.length - 1 || a.length === 5);

  const headers = parse(headerLine ?? '');
  const rows: TableRow[] = bodyLines.map((l) => {
    const cells = l.split('|').map((c) => c.trim());
    // Remove empty first/last cells from leading/trailing pipes
    const clean = cells[0] === '' ? cells.slice(1) : cells;
    const final = clean[clean.length - 1] === '' ? clean.slice(0, -1) : clean;
    return {
      cookieName: final[0] ?? '',
      provider: final[1] ?? '',
      category: final[2] ?? '',
      purpose: final[3] ?? '',
      duration: final[4] ?? '',
    };
  });
  return { headers, rows };
}

function isThirdParty(provider: string) {
  return provider.toLowerCase().includes('third-party');
}

function renderTable(block: CookieBlock) {
  const { rows } = parseTable(block.lines);
  if (!rows.length) return null;

  return (
    <div className="my-2 rounded-xl border border-border overflow-hidden shadow-xs">
      {/* Mobile scroll wrapper */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-muted/70 border-b border-border">
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                Cookie Name
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                Provider
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                Category
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Purpose
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                Duration
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {rows.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-card' : 'bg-muted/25'}>
                {/* Cookie name */}
                <td className="px-4 py-3 align-top">
                  <span className="font-mono text-[13px] font-semibold text-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                    {row.cookieName}
                  </span>
                </td>
                {/* Provider */}
                <td className="px-4 py-3 align-top">
                  <div className="flex flex-col gap-1">
                    <span className="text-[13px] text-foreground/85 leading-snug">
                      {row.provider.replace(/\s*\(.*?\)/, '')}
                    </span>
                    <span
                      className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        isThirdParty(row.provider)
                          ? 'bg-[#fff7ed] text-[#9a3412] border border-[#fed7aa]'
                          : 'bg-success-surface text-success-text border border-success-border'
                      }`}
                    >
                      {isThirdParty(row.provider) ? '3rd party' : '1st party'}
                    </span>
                  </div>
                </td>
                {/* Category badge */}
                <td className="px-4 py-3 align-top">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${getCategoryStyle(row.category)}`}
                  >
                    {row.category}
                  </span>
                </td>
                {/* Purpose */}
                <td className="px-4 py-3 align-top">
                  <p className="text-[13px] text-foreground/80 leading-relaxed">{row.purpose}</p>
                </td>
                {/* Duration */}
                <td className="px-4 py-3 align-top">
                  <span className="inline-flex items-center rounded-md bg-secondary border border-border px-2 py-1 text-[12px] font-medium text-foreground/75 whitespace-nowrap">
                    {row.duration}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2.5 bg-muted/30 border-t border-border text-[11px] text-muted-foreground">
        Scroll horizontally on smaller screens to see all columns.
      </div>
    </div>
  );
}

// ─── Inline link enrichment ───────────────────────────────────────────────────

const LINK_RE = /(privacy@southcaravan\.com|legal@southcaravan\.com|support@southcaravan\.com|Privacy Policy|Terms of Service|Terms and Conditions)/g;

function withLinks(text: string): React.ReactNode {
  return text.split(LINK_RE).map((seg, i) => {
    if (seg === 'privacy@southcaravan.com')
      return <a key={i} href="mailto:privacy@southcaravan.com" className="text-link underline underline-offset-2 hover:text-link-hover transition-colors">{seg}</a>;
    if (seg === 'legal@southcaravan.com')
      return <a key={i} href="mailto:legal@southcaravan.com" className="text-link underline underline-offset-2 hover:text-link-hover transition-colors">{seg}</a>;
    if (seg === 'support@southcaravan.com')
      return <a key={i} href="mailto:support@southcaravan.com" className="text-link underline underline-offset-2 hover:text-link-hover transition-colors">{seg}</a>;
    if (seg === 'Privacy Policy')
      return <Link key={i} href="/privacy" className="text-link underline underline-offset-2 hover:text-link-hover transition-colors">{seg}</Link>;
    if (seg === 'Terms of Service' || seg === 'Terms and Conditions')
      return <Link key={i} href="/terms" className="text-link underline underline-offset-2 hover:text-link-hover transition-colors">{seg}</Link>;
    return seg;
  });
}

// ─── Block renderers ──────────────────────────────────────────────────────────

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-[15px] leading-7 text-foreground/85">
          <span className="mt-[11px] h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
          <span>{withLinks(item.replace(/^[-•]+\s+/, ''))}</span>
        </li>
      ))}
    </ul>
  );
}

function renderBlock(block: CookieBlock, idx: number): React.ReactNode {
  const key = `block-${idx}`;

  switch (block.kind) {
    case 'section-header':
      return (
        <div key={key} className="pt-10 first:pt-0">
          <h2 className="flex items-center gap-3 text-xl sm:text-2xl font-extrabold text-foreground tracking-tight pb-3 border-b-2 border-primary/20">
            <span className="shrink-0 w-1.5 h-6 rounded-full bg-primary" aria-hidden />
            {block.lines[0]}
          </h2>
        </div>
      );

    case 'h2-numbered': {
      const match = block.lines[0].match(/^(\d+)\.\s+(.*)/);
      const num = match?.[1] ?? '';
      const title = match?.[2] ?? block.lines[0];
      return (
        <div key={key} id={`cat-${num}`} className="scroll-mt-28 pt-8 first:pt-0">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-extrabold flex items-center justify-center border border-primary/20">
              {num}
            </span>
            <h3 className="text-base sm:text-lg font-bold text-foreground leading-snug">{title}</h3>
          </div>
        </div>
      );
    }

    case 'table':
      return <div key={key}>{renderTable(block)}</div>;

    case 'bullets':
      return <div key={key}><BulletList items={block.lines} /></div>;

    case 'intro-bullets':
      return (
        <div key={key} className="space-y-3">
          <p className="text-[15px] leading-7 text-foreground/85 font-medium">
            {withLinks(block.lines[0])}
          </p>
          <BulletList items={block.lines.slice(1)} />
        </div>
      );

    case 'notes':
      return (
        <div key={key} className="rounded-xl border border-border bg-muted/40 px-5 py-4 space-y-3">
          <p className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground">
            Notes
          </p>
          <BulletList items={block.lines.slice(1)} />
        </div>
      );

    case 'meta':
      return (
        <p key={key} className="text-sm text-muted-foreground pt-4">
          {block.raw}
        </p>
      );

    default:
      return (
        <p key={key} className="text-[15px] leading-7 text-foreground/85">
          {withLinks(block.raw)}
        </p>
      );
  }
}

// ─── Static UI data ───────────────────────────────────────────────────────────

const COOKIE_TYPES = [
  {
    num: '1',
    label: 'Strictly Necessary',
    desc: 'Core platform functions — login, sessions, security. Cannot be disabled.',
    style: 'border-success-border bg-success-surface',
    numStyle: 'bg-success-surface text-success-text border-success-border',
    badge: 'bg-success-surface text-success-text border border-success-border',
  },
  {
    num: '2',
    label: 'Functional',
    desc: 'Remembers your preferences, language settings, and saved filters.',
    style: 'border-[#bfdbfe] bg-[#eff6ff]',
    numStyle: 'bg-[#eff6ff] text-[#1565c0] border-[#bfdbfe]',
    badge: 'bg-[#eff6ff] text-[#1565c0] border border-[#bfdbfe]',
  },
  {
    num: '3',
    label: 'Analytics',
    desc: 'Aggregated usage data that helps us improve platform performance.',
    style: 'border-[#fed7aa] bg-[#fff7ed]',
    numStyle: 'bg-[#fff7ed] text-[#9a3412] border-[#fed7aa]',
    badge: 'bg-[#fff7ed] text-[#9a3412] border border-[#fed7aa]',
  },
  {
    num: '4',
    label: 'Marketing',
    desc: 'Used sparingly for professional B2B relevance; never consumer advertising.',
    style: 'border-warning-border bg-warning-surface',
    numStyle: 'bg-warning-surface text-warning-text border-warning-border',
    badge: 'bg-warning-surface text-warning-text border border-warning-border',
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CookiesPage() {
  const rawText = await getCookieText();
  const text = rawText ? normalizeText(rawText) : null;

  const blocks: CookieBlock[] = text
    ? text
        .split(/\r?\n\s*\r?\n/g)
        .map((b) => b.trim())
        .filter(Boolean)
        .map(classify)
    : [];

  // Build flat TOC from section headers + numbered H2s
  const tocEntries = blocks
    .map((block, i) => {
      if (block.kind === 'section-header') {
        return { id: `section-${i}`, label: block.lines[0] };
      }
      if (block.kind === 'h2-numbered') {
        const match = block.lines[0].match(/^(\d+)\.\s+(.*)/);
        if (match) return { id: `cat-${match[1]}`, label: `${match[1]}. ${match[2]}` };
      }
      return null;
    })
    .filter(Boolean) as { id: string; label: string }[];

  // Assign stable IDs to section-header blocks
  const enrichedBlocks = blocks.map((block, i) => ({
    block,
    id: block.kind === 'section-header' ? `section-${i}` : null,
  }));

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Breadcrumbs items={[{ label: 'Cookie Policy' }]} />

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div className="mt-6 rounded-2xl overflow-hidden border border-border shadow-md">

          <div
            className="relative px-8 sm:px-12 py-10 border-b border-border overflow-hidden"
            style={{ background: 'linear-gradient(135deg,#fff7ed 0%,#ffffff 50%,#eff6ff 100%)' }}
          >
            <span aria-hidden className="pointer-events-none absolute -right-8 -top-8 w-52 h-52 rounded-full bg-primary/[0.05]" />
            <span aria-hidden className="pointer-events-none absolute right-20 top-12 w-28 h-28 rounded-full bg-[#2196f3]/[0.04]" />

            <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
              <div className="flex-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-primary mb-5">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Cookie Policy
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
                  Cookies &amp; Tracking
                </h1>
                <p className="mt-3 text-base text-muted-foreground leading-relaxed max-w-xl">
                  How SouthCaravan uses cookies and similar technologies to keep
                  the platform secure, functional, and improving for every user.
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  Part of our{' '}
                  <Link href="/privacy" className="font-medium text-link underline underline-offset-2 hover:text-link-hover transition-colors">
                    Privacy Policy
                  </Link>
                  . By continuing to use SouthCaravan you consent to cookies described here.
                </p>
              </div>

              <div className="shrink-0 rounded-xl border border-border bg-white/90 backdrop-blur-sm px-5 py-4 shadow-sm space-y-3 min-w-[160px]">
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Last Updated</p>
                  <p className="mt-0.5 text-sm font-bold text-foreground">April 2026</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Cookie Types</p>
                  <p className="mt-0.5 text-sm font-bold text-foreground">4 Categories</p>
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
              <span className="font-semibold">Your Choice Matters: </span>
              You can manage or withdraw cookie consent at any time through your browser settings or our cookie consent banner. Disabling some cookies may affect platform functionality.
            </p>
          </div>

          {/* Cookie category cards */}
          <div className="px-8 sm:px-12 py-8 bg-muted/30 border-b border-border">
            <p className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground mb-5">
              Cookie Categories
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {COOKIE_TYPES.map((ct) => (
                <a
                  key={ct.num}
                  href={`#cat-${ct.num}`}
                  className={`group rounded-xl border p-4 flex flex-col gap-2 hover:shadow-sm transition-shadow ${ct.style}`}
                >
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold border ${ct.numStyle}`}>
                    {ct.num}
                  </span>
                  <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{ct.label}</p>
                  <p className="text-[12px] text-muted-foreground leading-relaxed">{ct.desc}</p>
                </a>
              ))}
            </div>
          </div>

          {/* Table of Contents */}
          {tocEntries.length > 0 && (
            <div className="px-8 sm:px-12 py-8 bg-muted/50 border-b border-border">
              <p className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground mb-5">
                Contents
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
                {tocEntries.map((entry) => (
                  <a
                    key={entry.id}
                    href={`#${entry.id}`}
                    className="group flex items-center gap-2.5 rounded-lg px-3 py-2.5 hover:bg-accent transition-colors text-sm text-foreground/70 hover:text-foreground"
                  >
                    <svg className="h-3.5 w-3.5 text-primary/50 shrink-0 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="leading-snug">{entry.label}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Content body */}
          {text ? (
            <div className="bg-card px-8 sm:px-12 py-10">
              <div className="max-w-3xl space-y-5">
                {enrichedBlocks.map(({ block, id }, i) =>
                  id ? (
                    <div key={`wrap-${i}`} id={id} className="scroll-mt-28">
                      {renderBlock(block, i)}
                    </div>
                  ) : (
                    renderBlock(block, i)
                  ),
                )}
              </div>
            </div>
          ) : (
            <div className="bg-card px-8 sm:px-12 py-10">
              <div className="rounded-xl border border-border bg-muted/30 p-6">
                <p className="text-sm text-muted-foreground">
                  We couldn&apos;t load the Cookie Policy right now. Please contact{' '}
                  <a href="mailto:privacy@southcaravan.com" className="text-link underline underline-offset-4 hover:text-link-hover transition-colors">
                    privacy@southcaravan.com
                  </a>
                  .
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Bottom card ───────────────────────────────────────────────────── */}
        <div className="mt-6 rounded-2xl border border-border bg-card shadow-sm overflow-hidden">

          {/* Manage cookies CTA */}
          <div className="px-8 sm:px-10 py-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-bold text-foreground">Manage Your Cookie Preferences</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Update or withdraw consent for non-essential cookies at any time.</p>
              </div>
            </div>
            <a
              href="mailto:privacy@southcaravan.com"
              className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-colors shadow-sm"
            >
              Contact Privacy Team
            </a>
          </div>

          {/* Related policies */}
          <div className="px-8 sm:px-10 py-5">
            <p className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground mb-3">
              Related Policies
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { href: '/privacy', label: 'Privacy Policy', d: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
                { href: '/terms', label: 'Terms of Service', d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                { href: '/compliance', label: 'Compliance', d: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
              ].map((p) => (
                <Link
                  key={p.href}
                  href={p.href}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm text-foreground/75 hover:border-primary hover:text-primary transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={p.d} />
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
