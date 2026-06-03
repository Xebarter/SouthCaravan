'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import CharacterCount from '@tiptap/extension-character-count';
import Typography from '@tiptap/extension-typography';
import Youtube from '@tiptap/extension-youtube';
import { generateJSON } from '@tiptap/html';
import type { Editor } from '@tiptap/react';
import { Code2, FileCode } from 'lucide-react';

import { RichTextEditorToolbar } from '@/components/blog/rich-text-editor-toolbar';
import { clipboardHasHtml, preparePastedHtml } from '@/lib/paste-html';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: number;
}

const EDITOR_PROSE_CLASS = [
  'prose prose-sm max-w-none focus:outline-none px-4 py-3',
  '[&_img]:rounded-lg [&_img]:max-w-full [&_img]:h-auto [&_img]:my-4',
  '[&_table]:border-collapse [&_table]:w-full [&_table]:my-4',
  '[&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold',
  '[&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2',
  '[&_.youtube-embed]:my-4 [&_.youtube-embed]:rounded-lg [&_.youtube-embed]:overflow-hidden',
].join(' ');

const EDITOR_SURFACE_CLASS = [
  '[&_.ProseMirror]:min-h-[inherit]',
  '[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground',
  '[&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
  '[&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left',
  '[&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none',
  '[&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-border',
  '[&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:text-muted-foreground',
  '[&_.ProseMirror_pre]:bg-muted [&_.ProseMirror_pre]:rounded-lg [&_.ProseMirror_pre]:p-3',
  '[&_.ProseMirror_code]:bg-muted [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:px-1',
  '[&_.ProseMirror_hr]:border-border',
  '[&_.ProseMirror_selectednode]:outline [&_.ProseMirror_selectednode]:outline-2',
  '[&_.ProseMirror_selectednode]:outline-primary/40',
].join(' ');

function pasteHtmlIntoEditor(ed: Editor, rawHtml: string) {
  const prepared = preparePastedHtml(rawHtml);
  if (!prepared) return;

  try {
    const json = generateJSON(prepared, ed.extensionManager.extensions);
    ed.chain().focus().insertContent(json).run();
  } catch {
    ed.chain().focus().insertContent(prepared, { parseOptions: { preserveWhitespace: 'full' } }).run();
  }
}

async function uploadEditorImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch('/api/admin/blog/upload', { method: 'POST', body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Upload failed');
  return data.url as string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write your post content here…',
  className,
  minHeight = 480,
}: RichTextEditorProps) {
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [sourceMode, setSourceMode] = useState(false);
  const [sourceHtml, setSourceHtml] = useState(value);
  const lastEmittedHtml = useRef(value);
  const editorRef = useRef<ReturnType<typeof useEditor>>(null);

  const insertImageUrl = useCallback((editor: NonNullable<ReturnType<typeof useEditor>>, url: string) => {
    editor.chain().focus().setImage({ src: url, alt: '' }).run();
  }, []);

  const handleImageUpload = useCallback(
    async (editor: NonNullable<ReturnType<typeof useEditor>>, file: File) => {
      setImageUploading(true);
      setUploadError(null);
      try {
        const url = await uploadEditorImage(file);
        insertImageUrl(editor, url);
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : 'Image upload failed');
      } finally {
        setImageUploading(false);
      }
    },
    [insertImageUrl],
  );

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Subscript,
      Superscript,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-primary underline cursor-pointer', rel: 'noopener noreferrer', target: '_blank' },
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: { class: 'rounded-lg max-w-full h-auto' },
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Youtube.configure({
        width: 640,
        height: 360,
        nocookie: true,
        HTMLAttributes: { class: 'youtube-embed w-full aspect-video rounded-lg overflow-hidden' },
      }),
      Typography,
      Placeholder.configure({ placeholder }),
      CharacterCount,
    ],
    content: value,
    onCreate: ({ editor: ed }) => {
      editorRef.current = ed;
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      lastEmittedHtml.current = html;
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: EDITOR_PROSE_CLASS,
        spellcheck: 'true',
      },
      handlePaste: (view, event) => {
        const ed = editorRef.current;
        const clipboard = event.clipboardData;
        if (!ed || !clipboard) return false;

        // Pasted image files (screenshots, copied images)
        for (const item of Array.from(clipboard.items)) {
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (file) {
              event.preventDefault();
              void handleImageUpload(ed, file);
              return true;
            }
          }
        }

        const html = clipboard.getData('text/html');
        // Let Tiptap handle copy/paste within the same editor
        if (html?.includes('data-pm-slice')) return false;

        // Rich paste from Word, Google Docs, Excel, websites, etc.
        if (clipboardHasHtml(clipboard) && html) {
          event.preventDefault();
          pasteHtmlIntoEditor(ed, html);
          return true;
        }

        return false;
      },
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files;
        const ed = editorRef.current;
        if (!files?.length || !ed) return false;

        const imageFile = Array.from(files).find((f) => f.type.startsWith('image/'));
        if (imageFile) {
          event.preventDefault();
          const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
          if (coords) {
            ed.chain().focus().setTextSelection(coords.pos).run();
          }
          void handleImageUpload(ed, imageFile);
          return true;
        }
        return false;
      },
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (value === lastEmittedHtml.current) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || '', { emitUpdate: false });
      lastEmittedHtml.current = value;
    }
  }, [value, editor]);

  useEffect(() => {
    if (!sourceMode) setSourceHtml(editor?.getHTML() ?? value);
  }, [sourceMode, editor, value]);

  const applySourceHtml = () => {
    if (!editor) return;
    editor.commands.setContent(sourceHtml || '', { emitUpdate: true });
    lastEmittedHtml.current = editor.getHTML();
    onChange(editor.getHTML());
    setSourceMode(false);
  };

  const promptImageUrl = () => {
    if (!editor) return;
    const url = window.prompt('Image URL', 'https://');
    if (url === null) return;
    const trimmed = url.trim();
    if (trimmed) insertImageUrl(editor, /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  };

  if (!editor) {
    return (
      <div
        className={cn('border border-border rounded-lg bg-muted/30 animate-pulse', className)}
        style={{ minHeight }}
        aria-hidden
      />
    );
  }

  const words = editor.storage.characterCount.words();
  const chars = editor.storage.characterCount.characters();

  return (
    <div className={cn('border border-border rounded-lg overflow-hidden bg-background shadow-sm', className)}>
      <RichTextEditorToolbar
        editor={editor}
        onInsertImage={promptImageUrl}
        onUploadImage={(file) => handleImageUpload(editor, file)}
        imageUploading={imageUploading}
      />

      <div className="flex items-center justify-between gap-2 px-3 py-1.5 border-b border-border/60 bg-muted/20 text-[11px] text-muted-foreground">
        <span>
          Paste from Word, Google Docs, or the web — formatting is preserved. Drop or paste images to upload.
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs shrink-0"
          onClick={() => {
            if (sourceMode) applySourceHtml();
            else {
              setSourceHtml(editor.getHTML());
              setSourceMode(true);
            }
          }}
        >
          {sourceMode ? <Code2 className="h-3.5 w-3.5" /> : <FileCode className="h-3.5 w-3.5" />}
          {sourceMode ? 'Apply HTML' : 'HTML'}
        </Button>
      </div>

      {uploadError && (
        <p className="px-3 py-2 text-xs text-destructive bg-destructive/10 border-b border-destructive/20">{uploadError}</p>
      )}

      {sourceMode ? (
        <Textarea
          value={sourceHtml}
          onChange={(e) => setSourceHtml(e.target.value)}
          className="font-mono text-xs rounded-none border-0 resize-y min-h-[320px] focus-visible:ring-0"
          style={{ minHeight }}
          spellCheck={false}
        />
      ) : (
        <EditorContent
          editor={editor}
          style={{ minHeight }}
          className={EDITOR_SURFACE_CLASS}
        />
      )}

      <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-muted/20 text-[11px] text-muted-foreground tabular-nums">
        <span>{words} words · {chars} characters</span>
        <span>~{Math.max(1, Math.ceil(words / 200))} min read</span>
      </div>
    </div>
  );
}
