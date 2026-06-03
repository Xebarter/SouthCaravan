export type InlineStyleFlags = {
  isBold: boolean
  isItalic: boolean
  isUnderline: boolean
  isStrike: boolean
}

export function parseStyleFlags(style: string): InlineStyleFlags {
  const normalized = style.toLowerCase()
  const isBold =
    /\bfont-weight:\s*(bold|[5-9]00)\b/.test(normalized) &&
    !/\bfont-weight:\s*normal\b/.test(normalized)
  return {
    isBold,
    isItalic: /\bfont-style:\s*italic\b/.test(normalized),
    isUnderline: /\btext-decoration:[^;]*underline\b/.test(normalized) || /\btext-underline\b/.test(normalized),
    isStrike: /\btext-decoration:[^;]*line-through\b/.test(normalized),
  }
}

export function extractStyleValue(style: string, prop: string): string | null {
  const re = new RegExp(`${prop}\\s*:\\s*([^;]+)`, 'i')
  const match = style.match(re)
  return match?.[1]?.trim() ?? null
}

/** Remove properties we map to marks/tags; keep color & background for Tiptap TextStyle / Highlight. */
export function stripMappedStyleProperties(style: string): string {
  let remaining = style
  const stripProps = [
    'font-weight',
    'font-style',
    'text-decoration',
    'text-underline',
    'mso-[^:;]+',
    'font-family',
    'font-size',
    'line-height',
    'letter-spacing',
    'margin-top',
    'margin-bottom',
    'margin-left',
    'margin-right',
    'padding-top',
    'padding-bottom',
    'padding-left',
    'padding-right',
    'tab-stops',
    'page-break-before',
    'page-break-after',
  ]
  for (const prop of stripProps) {
    remaining = remaining.replace(new RegExp(`${prop}\\s*:[^;]+;?`, 'gi'), '')
  }
  remaining = remaining.replace(/;\s*;/g, ';').trim().replace(/^;|;$/g, '')
  return remaining
}

export function hasRetainableStyle(style: string): boolean {
  const cleaned = stripMappedStyleProperties(style)
  if (!cleaned) return false
  return /(?:^|;)\s*(?:color|background(?:-color)?|text-align)\s*:/i.test(cleaned)
}

export function normalizeColorValue(value: string): string {
  const v = value.trim()
  if (/^rgb|^hsl|^#[0-9a-f]/i.test(v)) return v
  return v
}
