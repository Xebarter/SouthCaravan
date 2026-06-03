'use client'

import { useCallback, useState } from 'react'
import type { Editor } from '@tiptap/react'
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Code2,
  Eraser,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Redo,
  Strikethrough,
  Subscript,
  Superscript,
  Table,
  Underline,
  Undo,
  Unlink,
  Youtube,
  Loader2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const HIGHLIGHT_COLORS = [
  { label: 'Yellow', value: '#fef08a' },
  { label: 'Green', value: '#bbf7d0' },
  { label: 'Blue', value: '#bfdbfe' },
  { label: 'Pink', value: '#fbcfe8' },
  { label: 'None', value: '' },
]

const TEXT_COLORS = [
  { label: 'Default', value: '' },
  { label: 'Orange', value: '#ea580c' },
  { label: 'Green', value: '#15803d' },
  { label: 'Blue', value: '#1d4ed8' },
  { label: 'Red', value: '#b91c1c' },
]

interface ToolbarButtonProps {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}

export function ToolbarButton({ onClick, active, disabled, title, children }: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn('h-8 w-8 p-0 shrink-0', active && 'bg-secondary text-foreground')}
    >
      {children}
    </Button>
  )
}

function ToolbarDivider() {
  return <span className="w-px h-5 bg-border mx-0.5 shrink-0" aria-hidden />
}

type RichTextEditorToolbarProps = {
  editor: Editor
  onInsertImage: () => void
  onUploadImage: (file: File) => Promise<void>
  imageUploading: boolean
}

export function RichTextEditorToolbar({
  editor,
  onInsertImage,
  onUploadImage,
  imageUploading,
}: RichTextEditorToolbarProps) {
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [youtubeOpen, setYoutubeOpen] = useState(false)
  const [youtubeUrl, setYoutubeUrl] = useState('')

  const openLinkDialog = useCallback(() => {
    const previous = (editor.getAttributes('link').href as string) ?? ''
    setLinkUrl(previous)
    setLinkOpen(true)
  }, [editor])

  const applyLink = useCallback(() => {
    const trimmed = linkUrl.trim()
    if (!trimmed) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      const href = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
      editor.chain().focus().extendMarkRange('link').setLink({ href, target: '_blank', rel: 'noopener noreferrer' }).run()
    }
    setLinkOpen(false)
  }, [editor, linkUrl])

  const insertYoutube = useCallback(() => {
    const trimmed = youtubeUrl.trim()
    if (!trimmed) return
    editor.chain().focus().setYoutubeVideo({ src: trimmed }).run()
    setYoutubeUrl('')
    setYoutubeOpen(false)
  }, [editor, youtubeUrl])

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  return (
    <>
      <div className="border-b border-border bg-muted/30">
        {/* Row 1: history, blocks, marks */}
        <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-border/60">
          <ToolbarButton title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
            <Undo className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
            <Redo className="h-3.5 w-3.5" />
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton title="Paragraph" onClick={() => editor.chain().focus().setParagraph().run()} active={editor.isActive('paragraph')}>
            <Pilcrow className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Heading 1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })}>
            <Heading1 className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Heading 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })}>
            <Heading2 className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Heading 3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })}>
            <Heading3 className="h-3.5 w-3.5" />
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton title="Bold" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')}>
            <Bold className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')}>
            <Italic className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')}>
            <Underline className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Strikethrough" onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')}>
            <Strikethrough className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Inline code" onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')}>
            <Code className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Subscript" onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive('subscript')}>
            <Subscript className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Superscript" onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive('superscript')}>
            <Superscript className="h-3.5 w-3.5" />
          </ToolbarButton>

          <ToolbarDivider />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="h-8 gap-1 px-2 text-xs" title="Text color">
                <span className="font-bold text-primary">A</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {TEXT_COLORS.map((c) => (
                <DropdownMenuItem
                  key={c.label}
                  onClick={() => {
                    if (!c.value) editor.chain().focus().unsetColor().run()
                    else editor.chain().focus().setColor(c.value).run()
                  }}
                >
                  <span className="w-3 h-3 rounded-full border border-border mr-2" style={{ background: c.value || 'currentColor' }} />
                  {c.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" title="Highlight">
                <Highlighter className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {HIGHLIGHT_COLORS.map((c) => (
                <DropdownMenuItem
                  key={c.label}
                  onClick={() => {
                    if (!c.value) editor.chain().focus().unsetHighlight().run()
                    else editor.chain().focus().toggleHighlight({ color: c.value }).run()
                  }}
                >
                  <span className="w-4 h-4 rounded border border-border mr-2" style={{ background: c.value || 'transparent' }} />
                  {c.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <ToolbarButton title="Clear formatting" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>
            <Eraser className="h-3.5 w-3.5" />
          </ToolbarButton>
        </div>

        {/* Row 2: align, lists, blocks, media, table */}
        <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5">
          <ToolbarButton title="Align left" onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })}>
            <AlignLeft className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Align center" onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })}>
            <AlignCenter className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Align right" onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })}>
            <AlignRight className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Justify" onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })}>
            <AlignJustify className="h-3.5 w-3.5" />
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton title="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')}>
            <List className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Numbered list" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')}>
            <ListOrdered className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Blockquote" onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')}>
            <Quote className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Code block" onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')}>
            <Code2 className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Horizontal rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
            <Minus className="h-3.5 w-3.5" />
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton title="Insert link" onClick={openLinkDialog} active={editor.isActive('link')}>
            <LinkIcon className="h-3.5 w-3.5" />
          </ToolbarButton>
          {editor.isActive('link') && (
            <ToolbarButton title="Remove link" onClick={() => editor.chain().focus().unsetLink().run()}>
              <Unlink className="h-3.5 w-3.5" />
            </ToolbarButton>
          )}

          <ToolbarButton title="Insert image (URL)" onClick={onInsertImage} disabled={imageUploading}>
            {imageUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
          </ToolbarButton>
          <label className={cn('inline-flex cursor-pointer', imageUploading && 'pointer-events-none opacity-50')}>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={imageUploading}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void onUploadImage(file)
                e.target.value = ''
              }}
            />
            <span className="inline-flex h-8 items-center rounded-md px-2 text-xs font-medium hover:bg-accent hover:text-accent-foreground">
              Upload
            </span>
          </label>

          <ToolbarButton title="YouTube embed" onClick={() => setYoutubeOpen(true)}>
            <Youtube className="h-3.5 w-3.5" />
          </ToolbarButton>

          <ToolbarDivider />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="h-8 gap-1 px-2 text-xs" title="Table">
                <Table className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={insertTable}>Insert 3×3 table</DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().addColumnAfter().run()}>Add column</DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().addRowAfter().run()}>Add row</DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().deleteColumn().run()}>Delete column</DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().deleteRow().run()}>Delete row</DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().deleteTable().run()}>Delete table</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Insert link</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="editor-link-url">URL</Label>
            <Input
              id="editor-link-url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), applyLink())}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setLinkOpen(false)}>Cancel</Button>
            <Button type="button" onClick={applyLink}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={youtubeOpen} onOpenChange={setYoutubeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Embed YouTube video</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="editor-youtube-url">Video URL</Label>
            <Input
              id="editor-youtube-url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=…"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), insertYoutube())}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setYoutubeOpen(false)}>Cancel</Button>
            <Button type="button" onClick={insertYoutube}>Embed</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
