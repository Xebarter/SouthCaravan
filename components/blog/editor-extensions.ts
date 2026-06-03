import type { Extensions } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Image from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import CharacterCount from '@tiptap/extension-character-count'
import Typography from '@tiptap/extension-typography'
import Youtube from '@tiptap/extension-youtube'

import { RichPasteExtension } from '@/components/blog/rich-paste-extension'

/** Parses highlight from &lt;mark&gt; and pasted &lt;span style="background:..."&gt;. */
const PasteFriendlyHighlight = Highlight.extend({
  addOptions() {
    return {
      multicolor: true,
      HTMLAttributes: {},
    }
  },
  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: (element) =>
          element.getAttribute('data-color') ||
          element.style?.backgroundColor ||
          element.style?.background ||
          null,
        renderHTML: (attributes) => {
          if (!attributes.color) return {}
          return {
            'data-color': attributes.color,
            style: `background-color: ${attributes.color}; color: inherit`,
          }
        },
      },
    }
  },
  parseHTML() {
    return [
      { tag: 'mark' },
      {
        tag: 'span',
        getAttrs: (element) => {
          if (!(element instanceof HTMLElement)) return false
          const bg = element.style?.backgroundColor || element.style?.background
          if (!bg || bg === 'transparent') return false
          return { color: bg }
        },
      },
    ]
  },
})

export type BlogEditorExtensionOptions = {
  placeholder?: string
}

export function createBlogEditorExtensions(options: BlogEditorExtensionOptions = {}): Extensions {
  const { placeholder = 'Write your post content here…' } = options

  return [
    RichPasteExtension,
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      link: false,
    }),
    Underline,
    Subscript,
    Superscript,
    TextStyle.configure({ mergeNestedSpanStyles: true }),
    Color,
    PasteFriendlyHighlight.configure({ multicolor: true }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Link.extend({
      parseHTML() {
        const inherited = this.parent?.() ?? []
        return [
          ...inherited,
          {
            tag: 'a[href]',
            getAttrs: (node) => {
              if (!(node instanceof HTMLElement)) return false
              const href = node.getAttribute('href')
              if (!href || href.startsWith('file:') || href === '#') return false
              return {}
            },
          },
        ]
      },
    }).configure({
      openOnClick: false,
      autolink: true,
      linkOnPaste: true,
      HTMLAttributes: {
        class: 'text-primary underline cursor-pointer',
        rel: 'noopener noreferrer',
        target: '_blank',
      },
    }),
    Image.configure({
      inline: false,
      allowBase64: false,
      HTMLAttributes: { class: 'rounded-lg max-w-full h-auto my-4' },
    }),
    Table.configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,
    Youtube.configure({
      width: 640,
      height: 360,
      nocookie: true,
      HTMLAttributes: { class: 'youtube-embed w-full aspect-video rounded-lg overflow-hidden my-4' },
    }),
    Typography,
    Placeholder.configure({ placeholder }),
    CharacterCount,
  ]
}
