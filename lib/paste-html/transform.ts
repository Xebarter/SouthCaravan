import {
  extractStyleValue,
  hasRetainableStyle,
  normalizeColorValue,
  parseStyleFlags,
  stripMappedStyleProperties,
} from '@/lib/paste-html/style-utils'

const BLOCK_TAGS = /^(P|DIV|H[1-6]|UL|OL|LI|TABLE|THEAD|TBODY|TR|TH|TD|BLOCKQUOTE|PRE|HR|FIGURE|IMG)$/i

function depth(el: Element): number {
  let d = 0
  let node: Element | null = el
  while (node?.parentElement) {
    d++
    node = node.parentElement
  }
  return d
}

export function sanitizeClipboardDom(root: HTMLElement): void {
  root.querySelectorAll('script, style, meta, link, title, head, noscript').forEach((n) => n.remove())
  removeGoogleDocsShell(root)
  stripOfficeNoise(root)
  mapWordHeadings(root)
  mapWordLists(root)
  normalizeAllInlineStyles(root)
  normalizeSemanticTags(root)
  normalizeLinks(root)
  normalizeBlockAlignment(root)
  normalizeTables(root)
  convertDivsToParagraphs(root)
  flattenEmptySpans(root)
  removeEmptyElements(root)
}

function removeGoogleDocsShell(root: Element) {
  root.querySelectorAll('b[id^="docs-internal-guid"]').forEach((el) => {
    const style = el.getAttribute('style') ?? ''
    if (!style || /font-weight:\s*normal/i.test(style)) {
      el.replaceWith(...el.childNodes)
    }
  })
}

function stripOfficeNoise(root: Element) {
  const walk = (node: Element) => {
    for (const attr of [...node.attributes]) {
      const name = attr.name.toLowerCase()
      if (
        (name.startsWith('data-') && name.includes('mso')) ||
        (name === 'class' && /mso|wordsection|msonormal|wordsection/i.test(attr.value)) ||
        name === 'lang' ||
        name === 'dir'
      ) {
        node.removeAttribute(attr.name)
      }
    }
    const style = node.getAttribute('style')
    if (style && /mso-|tab-stops|page-break|pane-border/i.test(style)) {
      const cleaned = stripMappedStyleProperties(style)
      if (cleaned && hasRetainableStyle(style)) node.setAttribute('style', cleaned)
      else node.removeAttribute('style')
    }
    for (const child of [...node.children]) walk(child)
  }
  walk(root)
}

function mapWordHeadings(root: Element) {
  const rules: [string, string][] = [
    ['[class*="MsoTitle"]', 'h1'],
    ['[class*="MsoSubtitle"]', 'h2'],
    ['[class*="MsoHeading1"], p[style*="Heading 1"]', 'h1'],
    ['[class*="MsoHeading2"], p[style*="Heading 2"]', 'h2'],
    ['[class*="MsoHeading3"], p[style*="Heading 3"]', 'h3'],
  ]
  for (const [selector, tag] of rules) {
    root.querySelectorAll(selector).forEach((el) => {
      if (!/^P|DIV$/i.test(el.tagName)) return
      const h = el.ownerDocument.createElement(tag)
      h.innerHTML = el.innerHTML
      el.replaceWith(h)
    })
  }
}

/** Word list paragraphs → HTML lists (best-effort). */
function mapWordLists(root: Element) {
  const paragraphs = [...root.querySelectorAll('p[class*="MsoList"]')]
  if (!paragraphs.length) return

  const groups: Element[][] = []
  let group: Element[] = []

  for (const p of paragraphs) {
    const prev = p.previousElementSibling
    const continues =
      group.length === 0 ||
      (prev && (prev.className.includes('MsoList') || group.includes(prev)))
    if (!continues && group.length) {
      groups.push(group)
      group = []
    }
    group.push(p)
  }
  if (group.length) groups.push(group)

  for (const items of groups) {
    const first = items[0]
    if (!first?.parentElement) continue
    const sample = first.textContent ?? ''
    const isOrdered = /^\s*\d+[\.)]\s/.test(sample)
    const list = first.ownerDocument.createElement(isOrdered ? 'ol' : 'ul')
    for (const p of items) {
      const li = first.ownerDocument.createElement('li')
      li.innerHTML = p.innerHTML.replace(/^\s*(?:\d+[\.)]|[•●○■\-–—])\s*/, '')
      list.appendChild(li)
      p.remove()
    }
    first.parentElement.insertBefore(list, first)
  }
}

function normalizeAllInlineStyles(root: Element) {
  const styled = [...root.querySelectorAll('[style]')].sort((a, b) => depth(b) - depth(a))
  for (const el of styled) {
    if (!el.isConnected || !(el instanceof HTMLElement)) continue
    const style = el.getAttribute('style') ?? ''
    if (!style.trim()) continue

    if (BLOCK_TAGS.test(el.tagName)) {
      const remaining = stripMappedStyleProperties(style)
      if (remaining && hasRetainableStyle(remaining)) el.setAttribute('style', remaining)
      else el.removeAttribute('style')
      continue
    }

    transformStyledElement(el)
  }
}

function transformStyledElement(el: HTMLElement) {
  const style = el.getAttribute('style') ?? ''
  const flags = parseStyleFlags(style)
  const color = extractStyleValue(style, 'color')
  const background =
    extractStyleValue(style, 'background-color') ?? extractStyleValue(style, 'background')

  const fragment = el.ownerDocument.createDocumentFragment()
  while (el.firstChild) fragment.appendChild(el.firstChild)

  const wrapWith = (tag: string, parent: HTMLElement): HTMLElement => {
    const wrapper = el.ownerDocument.createElement(tag)
    while (parent.firstChild) wrapper.appendChild(parent.firstChild)
    parent.appendChild(wrapper)
    return wrapper
  }

  const holder = el.ownerDocument.createElement('span')
  holder.appendChild(fragment)

  let inner: HTMLElement = holder
  if (flags.isBold) inner = wrapWith('strong', inner)
  if (flags.isItalic) inner = wrapWith('em', inner)
  if (flags.isUnderline) inner = wrapWith('u', inner)
  if (flags.isStrike) inner = wrapWith('s', inner)

  if (background) {
    const mark = el.ownerDocument.createElement('mark')
    const bg = normalizeColorValue(background)
    mark.setAttribute('data-color', bg)
    mark.style.backgroundColor = bg
    while (inner.firstChild) mark.appendChild(inner.firstChild)
    inner.appendChild(mark)
    inner = mark
  }

  if (color) {
    const span = el.ownerDocument.createElement('span')
    span.style.color = normalizeColorValue(color)
    while (inner.firstChild) span.appendChild(inner.firstChild)
    inner.appendChild(span)
  }

  el.appendChild(holder)

  const finalStyle = stripMappedStyleProperties(style)
  if (finalStyle && hasRetainableStyle(finalStyle)) {
    el.setAttribute('style', finalStyle)
  } else {
    el.removeAttribute('style')
  }
}

function normalizeSemanticTags(root: Element) {
  root.querySelectorAll('b').forEach((b) => {
    if (b.closest('strong')) return
    const strong = b.ownerDocument.createElement('strong')
    strong.innerHTML = b.innerHTML
    b.replaceWith(strong)
  })
  root.querySelectorAll('i').forEach((i) => {
    const em = i.ownerDocument.createElement('em')
    em.innerHTML = i.innerHTML
    i.replaceWith(em)
  })
}

function normalizeLinks(root: Element) {
  root.querySelectorAll('a').forEach((a) => {
    const href = a.getAttribute('href')
    if (!href || href.startsWith('file:') || href === '#') {
      const span = a.ownerDocument.createElement('span')
      span.innerHTML = a.innerHTML
      a.replaceWith(span)
      return
    }
    a.setAttribute('target', '_blank')
    a.setAttribute('rel', 'noopener noreferrer')
  })
}

function normalizeBlockAlignment(root: Element) {
  for (const el of root.querySelectorAll('p, h1, h2, h3, div')) {
    const style = el.getAttribute('style') ?? ''
    const align = extractStyleValue(style, 'text-align')
    if (align && /^(left|center|right|justify)$/i.test(align)) {
      el.setAttribute('style', `text-align: ${align.toLowerCase()}`)
    }
  }
}

function normalizeTables(root: Element) {
  root.querySelectorAll('table').forEach((table) => {
    table.removeAttribute('width')
    table.removeAttribute('cellspacing')
    table.removeAttribute('cellpadding')
    if (!table.querySelector('tbody')) {
      const tbody = table.ownerDocument.createElement('tbody')
      while (table.firstChild) tbody.appendChild(table.firstChild)
      table.appendChild(tbody)
    }
  })
}

function convertDivsToParagraphs(root: Element) {
  for (const div of [...root.querySelectorAll('div')]) {
    const hasBlockChild = [...div.children].some((c) => BLOCK_TAGS.test(c.tagName))
    if (!hasBlockChild && div.parentElement) {
      const p = div.ownerDocument.createElement('p')
      p.innerHTML = div.innerHTML
      if (div.getAttribute('style')) p.setAttribute('style', div.getAttribute('style')!)
      div.replaceWith(p)
    }
  }
}

function flattenEmptySpans(root: Element) {
  let changed = true
  while (changed) {
    changed = false
    for (const span of [...root.querySelectorAll('span')]) {
      if (
        !span.getAttribute('style') &&
        !span.getAttribute('class') &&
        span.childNodes.length === 1 &&
        span.firstChild?.nodeType === Node.ELEMENT_NODE
      ) {
        span.replaceWith(...span.childNodes)
        changed = true
      }
    }
  }
}

function removeEmptyElements(root: Element) {
  for (const el of [...root.querySelectorAll('p, span, div, li')]) {
    if (!el.textContent?.trim() && !el.querySelector('img, table, hr, iframe')) {
      el.remove()
    }
  }
}
