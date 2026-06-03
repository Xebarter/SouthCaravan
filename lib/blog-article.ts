export type ArticleHeading = {
  id: string
  text: string
  level: 2 | 3
}

export function formatBlogDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function slugifyHeading(text: string, index: number) {
  const base = text
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base ? `${base}-${index}` : `section-${index}`
}

/** Add id attributes to h2/h3 and return TOC entries (client-only). */
export function prepareArticleContent(html: string): {
  html: string
  headings: ArticleHeading[]
} {
  if (!html?.trim() || typeof document === 'undefined') {
    return { html: html ?? '', headings: [] }
  }

  const doc = new DOMParser().parseFromString(`<div id="article-root">${html}</div>`, 'text/html')
  const root = doc.getElementById('article-root')
  if (!root) return { html, headings: [] }

  const headings: ArticleHeading[] = []
  const elements = root.querySelectorAll('h2, h3')

  elements.forEach((el, index) => {
    const level = el.tagName === 'H2' ? 2 : 3
    const text = el.textContent?.trim() ?? ''
    if (!text) return
    const id = el.id || slugifyHeading(text, index)
    el.id = id
    headings.push({ id, text, level })
  })

  return { html: root.innerHTML, headings }
}

export const ARTICLE_PROSE_CLASS = [
  'blog-article-prose',
  'prose prose-lg sm:prose-xl max-w-none',
  'prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground',
  'prose-h1:text-3xl prose-h2:text-2xl prose-h2:mt-14 prose-h2:mb-5 prose-h2:pb-2 prose-h2:border-b prose-h2:border-border/60 prose-h2:scroll-mt-32',
  'prose-h3:text-xl prose-h3:mt-10 prose-h3:mb-4 prose-h3:scroll-mt-32',
  'prose-p:text-foreground/88 prose-p:leading-[1.8] prose-p:text-[1.0625rem]',
  'prose-lead:text-xl prose-lead:text-muted-foreground prose-lead:leading-relaxed',
  'prose-a:text-primary prose-a:font-medium prose-a:underline-offset-4 hover:prose-a:underline',
  'prose-strong:text-foreground prose-strong:font-semibold',
  'prose-blockquote:border-l-[3px] prose-blockquote:border-primary prose-blockquote:bg-muted/50',
  'prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:rounded-r-xl prose-blockquote:not-italic prose-blockquote:text-foreground/80',
  'prose-code:bg-muted prose-code:rounded-md prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[0.9em] prose-code:font-normal',
  'prose-code:before:content-none prose-code:after:content-none',
  'prose-pre:bg-slate-950 prose-pre:text-slate-100 prose-pre:rounded-2xl prose-pre:p-5 prose-pre:shadow-inner prose-pre:overflow-x-auto',
  'prose-img:rounded-2xl prose-img:border prose-img:border-border/80 prose-img:shadow-md prose-img:my-10',
  'prose-figure:my-10',
  'prose-figcaption:text-center prose-figcaption:text-sm prose-figcaption:text-muted-foreground',
  'prose-ul:my-5 prose-ol:my-5 prose-li:my-1.5 prose-li:marker:text-primary/70',
  'prose-hr:border-border/80 prose-hr:my-12',
  'prose-table:my-10 prose-table:rounded-xl prose-table:overflow-hidden prose-table:border prose-table:border-border',
  'prose-thead:bg-muted',
  'prose-th:border prose-th:border-border prose-th:px-4 prose-th:py-3 prose-th:text-left prose-th:font-semibold',
  'prose-td:border prose-td:border-border prose-td:px-4 prose-td:py-3',
  'prose-mark:bg-amber-100/90 prose-mark:text-amber-950 prose-mark:rounded px-1',
  '[&_.youtube-embed]:my-10 [&_.youtube-embed]:rounded-2xl [&_.youtube-embed]:overflow-hidden [&_.youtube-embed]:aspect-video [&_.youtube-embed]:shadow-lg',
  'first:prose-p:text-xl first:prose-p:leading-relaxed first:prose-p:text-muted-foreground',
].join(' ')
