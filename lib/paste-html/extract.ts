/** Pull the meaningful HTML payload from Office / browser clipboard wrappers. */
export function extractClipboardFragment(raw: string): string {
  if (!raw?.trim()) return ''

  const startFragment = raw.match(/<!--StartFragment-->([\s\S]*?)<!--EndFragment-->/i)
  if (startFragment?.[1]) return startFragment[1]

  const bodyMatch = raw.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  if (bodyMatch?.[1] && /<html/i.test(raw)) return bodyMatch[1]

  return raw
}

export function extractClipboardHtml(clipboard: DataTransfer): string {
  const direct = clipboard.getData('text/html')
  if (direct?.trim()) return direct

  for (const item of clipboard.items) {
    if (item.type === 'text/html') {
      const html = clipboard.getData('text/html')
      if (html?.trim()) return html
    }
  }
  return ''
}

export function clipboardHasMeaningfulHtml(clipboard: DataTransfer | null): boolean {
  if (!clipboard) return false
  const html = extractClipboardHtml(clipboard)
  if (!html?.trim()) return false
  const text = html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
  return text.length > 0 || /<img/i.test(html)
}

export function isInternalEditorCopy(html: string): boolean {
  return html.includes('data-pm-slice')
}
