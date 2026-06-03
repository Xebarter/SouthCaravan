/**
 * Prepare clipboard HTML from Word, Google Docs, Excel, and web pages
 * for Tiptap / ProseMirror (semantic tags, less Office noise).
 */
export function preparePastedHtml(raw: string): string {
  if (!raw?.trim()) return ''

  let html = raw
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<!\[if[\s\S]*?<!\[endif]>/gi, '')
    .replace(/<\/?(o|w|v|xml):[^>]*>/gi, '')

  if (typeof document === 'undefined') {
    return html.trim()
  }

  const doc = new DOMParser().parseFromString(html, 'text/html')
  const root = doc.body

  root.querySelectorAll('script, style, meta, link, title, head').forEach((n) => n.remove())

  stripOfficeAttributes(root)
  normalizeInlineStyles(root)
  unwrapRedundantWrappers(root)
  convertDivsToParagraphs(root)

  return root.innerHTML.trim()
}

function stripOfficeAttributes(el: Element) {
  const walk = (node: Element) => {
    for (const attr of [...node.attributes]) {
      const name = attr.name.toLowerCase()
      if (
        (name.startsWith('data-') && attr.name.toLowerCase().includes('mso')) ||
        (name === 'class' && /mso|wordsection/i.test(attr.value)) ||
        name === 'lang'
      ) {
        node.removeAttribute(attr.name)
      }
    }
    const style = node.getAttribute('style')
    if (style && /mso-|tab-stops|page-break/i.test(style)) {
      node.removeAttribute('style')
    }
    for (const child of [...node.children]) walk(child)
  }
  walk(el)
}

/** Wrap text in semantic tags when only inline CSS carries formatting (Docs / Word). */
function normalizeInlineStyles(root: Element) {
  const elements = [...root.querySelectorAll('[style]')]
  for (const el of elements) {
    if (!el.isConnected) continue
    const style = el.getAttribute('style') ?? ''
    const isBold = /font-weight:\s*(bold|[7-9]00)/i.test(style)
    const isItalic = /font-style:\s*italic/i.test(style)
    const isUnderline = /text-decoration:[^;]*underline/i.test(style)
    const isStrike = /text-decoration:[^;]*line-through/i.test(style)

    if (!isBold && !isItalic && !isUnderline && !isStrike) continue

    let node: HTMLElement = el as HTMLElement
    const tags: string[] = []
    if (isStrike) tags.push('s')
    if (isUnderline) tags.push('u')
    if (isItalic) tags.push('em')
    if (isBold) tags.push('strong')

    for (const tag of tags) {
      const wrapper = el.ownerDocument.createElement(tag)
      while (node.firstChild) wrapper.appendChild(node.firstChild)
      node.replaceWith(wrapper)
      node = wrapper
    }
    node.removeAttribute('style')
  }
}

function unwrapRedundantWrappers(root: Element) {
  let changed = true
  while (changed) {
    changed = false
    for (const el of [...root.querySelectorAll('b, span, font')]) {
      if (
        el.childNodes.length === 1 &&
        el.firstChild?.nodeType === Node.ELEMENT_NODE &&
        !el.getAttribute('style') &&
        !el.getAttribute('class')
      ) {
        el.replaceWith(...el.childNodes)
        changed = true
      }
    }
  }
}

/** Google Docs and Word often paste block content as divs. */
function convertDivsToParagraphs(root: Element) {
  for (const div of [...root.querySelectorAll('div')]) {
    const hasBlockChild = [...div.children].some((c) =>
      /^(P|DIV|H[1-6]|UL|OL|LI|TABLE|BLOCKQUOTE|PRE|HR)$/i.test(c.tagName),
    )
    if (!hasBlockChild && div.parentElement) {
      const p = div.ownerDocument.createElement('p')
      p.innerHTML = div.innerHTML
      div.replaceWith(p)
    }
  }
}

export function clipboardHasHtml(data: DataTransfer | null): boolean {
  if (!data) return false
  const html = data.getData('text/html')
  if (!html?.trim()) return false
  const text = html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
  return text.length > 0 || /<img/i.test(html)
}
