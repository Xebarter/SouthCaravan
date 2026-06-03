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
  'prose prose-lg max-w-none',
  'prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground',
  'prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:scroll-mt-28',
  'prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-h3:scroll-mt-28',
  'prose-p:text-foreground/90 prose-p:leading-[1.75]',
  'prose-a:text-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline',
  'prose-strong:text-foreground prose-strong:font-semibold',
  'prose-blockquote:border-l-4 prose-blockquote:border-primary/50 prose-blockquote:bg-muted/40',
  'prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic',
  'prose-code:bg-muted prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm',
  'prose-code:before:content-none prose-code:after:content-none',
  'prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:rounded-xl prose-pre:p-4 prose-pre:overflow-x-auto',
  'prose-img:rounded-xl prose-img:border prose-img:border-border prose-img:shadow-sm prose-img:my-8',
  'prose-ul:my-4 prose-ol:my-4 prose-li:my-1',
  'prose-hr:border-border prose-hr:my-10',
  'prose-table:border-collapse prose-table:w-full prose-table:my-8',
  'prose-th:border prose-th:border-border prose-th:bg-muted prose-th:px-4 prose-th:py-2 prose-th:text-left',
  'prose-td:border prose-td:border-border prose-td:px-4 prose-td:py-2',
  'prose-mark:bg-amber-100 prose-mark:rounded-sm prose-mark:px-1',
  '[&_.youtube-embed]:my-8 [&_.youtube-embed]:rounded-xl [&_.youtube-embed]:overflow-hidden [&_.youtube-embed]:aspect-video',
].join(' ')
