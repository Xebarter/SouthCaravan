import { Extension } from '@tiptap/core'
import type { Editor } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

import { insertPreparedHtml } from '@/lib/paste-html/insert'
import {
  clipboardHasMeaningfulHtml,
  extractClipboardHtml,
  isInternalEditorCopy,
  preparePastedHtml,
  rewritePastedImageSources,
} from '@/lib/paste-html'

export type RichPasteStorage = {
  /** Upload file and return public URL for use in HTML or image nodes. */
  uploadImage: ((file: File) => Promise<string>) | null
}

declare module '@tiptap/core' {
  interface Storage {
    richPaste: RichPasteStorage
  }
}

export const RichPasteExtension = Extension.create<object, RichPasteStorage>({
  name: 'richPaste',
  priority: 1000,

  addStorage() {
    return {
      uploadImage: null,
    }
  },

  addProseMirrorPlugins() {
    const extension = this

    return [
      new Plugin({
        key: new PluginKey('richPaste'),
        props: {
          handlePaste(view, event) {
            const clipboard = event.clipboardData
            if (!clipboard) return false

            const editor = extension.editor
            const html = extractClipboardHtml(clipboard)

            if (html && isInternalEditorCopy(html)) {
              return false
            }

            const hasHtml = clipboardHasMeaningfulHtml(clipboard) && !!html

            if (hasHtml) {
              event.preventDefault()

              void (async () => {
                let prepared = preparePastedHtml(html)
                if (!prepared) return

                if (extension.storage.uploadImage && /<img/i.test(prepared)) {
                  prepared = await rewritePastedImageSources(prepared, (file) =>
                    extension.storage.uploadImage!(file),
                  )
                }

                insertPreparedHtml(editor, prepared)
              })()

              return true
            }

            const imageItem = Array.from(clipboard.items).find((item) =>
              item.type.startsWith('image/'),
            )
            if (imageItem?.type.startsWith('image/') && extension.storage.uploadImage) {
              const file = imageItem.getAsFile()
              if (file) {
                event.preventDefault()
                void extension.storage.uploadImage(file).then((url) => {
                  editor.chain().focus().setImage({ src: url, alt: '' }).run()
                })
                return true
              }
            }

            return false
          },
        },
      }),
    ]
  },
})
