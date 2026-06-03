import { extractClipboardFragment } from '@/lib/paste-html/extract'

import { sanitizeClipboardDom } from '@/lib/paste-html/transform'

export {
  extractClipboardFragment,
  extractClipboardHtml,
  clipboardHasMeaningfulHtml,
  isInternalEditorCopy,
} from '@/lib/paste-html/extract'

/** Full pipeline: Office/Docs/web HTML → clean HTML Tiptap can parse with marks intact. */
export function preparePastedHtml(raw: string): string {
  if (!raw?.trim()) return ''

  let html = extractClipboardFragment(raw)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<!\[if[\s\S]*?<!\[endif]>/gi, '')
    .replace(/<\/?(o|w|v|xml):[^>]*>/gi, '')

  if (typeof document === 'undefined') {
    return html.trim()
  }

  const doc = new DOMParser().parseFromString(`<div id="paste-root">${html}</div>`, 'text/html')
  const root = doc.getElementById('paste-root')
  if (!root) return html.trim()

  sanitizeClipboardDom(root)
  return root.innerHTML.trim()
}

/** Upload data-URI / blob images in pasted HTML and rewrite src. */
export async function rewritePastedImageSources(
  html: string,
  upload: (file: File) => Promise<string>,
): Promise<string> {
  if (typeof document === 'undefined' || !html.includes('<img')) return html

  const doc = new DOMParser().parseFromString(`<div id="paste-img-root">${html}</div>`, 'text/html')
  const root = doc.getElementById('paste-img-root')
  if (!root) return html

  const images = [...root.querySelectorAll('img')]
  await Promise.all(
    images.map(async (img) => {
      const src = img.getAttribute('src')
      if (!src) return

      try {
        if (src.startsWith('data:')) {
          const res = await fetch(src)
          const blob = await res.blob()
          const ext = blob.type.split('/')[1] || 'png'
          const file = new File([blob], `pasted.${ext}`, { type: blob.type })
          img.setAttribute('src', await upload(file))
          return
        }
        if (src.startsWith('blob:')) {
          const res = await fetch(src)
          const blob = await res.blob()
          const file = new File([blob], 'pasted.png', { type: blob.type || 'image/png' })
          img.setAttribute('src', await upload(file))
        }
      } catch {
        img.remove()
      }
    }),
  )

  return root.innerHTML.trim()
}
