import type { Editor } from '@tiptap/core'
import { generateJSON } from '@tiptap/html'
import { DOMParser as PMDOMParser } from '@tiptap/pm/model'

/**
 * Insert prepared HTML using Tiptap's command pipeline (preferred) with
 * ProseMirror parseSlice fallback.
 */
export function insertPreparedHtml(editor: Editor, html: string): boolean {
  if (!html.trim()) return false

  try {
    editor
      .chain()
      .focus()
      .insertContent(html, { parseOptions: { preserveWhitespace: 'full' } })
      .run()
    return true
  } catch {
    /* fall through */
  }

  try {
    const json = generateJSON(html, editor.extensionManager.extensions)
    const nodes = json.type === 'doc' && Array.isArray(json.content) ? json.content : json
    editor.chain().focus().insertContent(nodes).run()
    return true
  } catch {
    /* fall through */
  }

  try {
    const container = document.createElement('div')
    container.innerHTML = html
    const parser = PMDOMParser.fromSchema(editor.schema)
    const slice = parser.parseSlice(container, { preserveWhitespace: 'full' })
    const tr = editor.state.tr.replaceSelection(slice)
    editor.view.dispatch(tr.scrollIntoView())
    return true
  } catch {
    return false
  }
}
