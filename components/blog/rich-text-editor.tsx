'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { Code2, FileCode } from 'lucide-react';

import { createBlogEditorExtensions } from '@/components/blog/editor-extensions';
import { RichTextEditorToolbar } from '@/components/blog/rich-text-editor-toolbar';
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
  '[&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6',
  '[&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6',
  '[&_.ProseMirror_li]:my-1',
  '[&_.ProseMirror_img]:rounded-lg [&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:h-auto [&_.ProseMirror_img]:my-4',
  '[&_.ProseMirror_table]:border-collapse [&_.ProseMirror_table]:w-full [&_.ProseMirror_table]:my-4',
  '[&_.ProseMirror_th]:border [&_.ProseMirror_th]:border-border [&_.ProseMirror_th]:bg-muted [&_.ProseMirror_th]:px-3 [&_.ProseMirror_th]:py-2',
  '[&_.ProseMirror_td]:border [&_.ProseMirror_td]:border-border [&_.ProseMirror_td]:px-3 [&_.ProseMirror_td]:py-2',
  '[&_.ProseMirror_mark]:rounded-sm [&_.ProseMirror_mark]:px-0.5',
  '[&_.ProseMirror_a]:text-primary [&_.ProseMirror_a]:underline',
  '[&_.ProseMirror_selectednode]:outline [&_.ProseMirror_selectednode]:outline-2 [&_.ProseMirror_selectednode]:outline-primary/40',
].join(' ');

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
  minHeight = 520,
}: RichTextEditorProps) {
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [sourceMode, setSourceMode] = useState(false);
  const [sourceHtml, setSourceHtml] = useState(value);
  const lastEmittedHtml = useRef(value);
  const editorRef = useRef<ReturnType<typeof useEditor>>(null);

  const uploadImage = useCallback(async (file: File) => {
    setImageUploading(true);
    setUploadError(null);
    try {
      return await uploadEditorImage(file);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Image upload failed';
      setUploadError(message);
      throw err;
    } finally {
      setImageUploading(false);
    }
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    extensions: createBlogEditorExtensions({ placeholder }),
    content: value,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none px-4 py-3 min-h-[inherit]',
        spellcheck: 'true',
      },
      handleDrop: (view, event) => {
        const ed = editorRef.current;
        const files = event.dataTransfer?.files;
        if (!files?.length || !ed) return false;

        const imageFile = Array.from(files).find((f) => f.type.startsWith('image/'));
        if (!imageFile) return false;

        event.preventDefault();
        const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
        if (coords) {
          ed.chain().focus().setTextSelection(coords.pos).run();
        }
        void uploadImage(imageFile).then((url) => {
          ed.chain().focus().setImage({ src: url, alt: '' }).run();
        });
        return true;
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      lastEmittedHtml.current = html;
      onChange(html);
    },
  });

  useEffect(() => {
    editorRef.current = editor;
    if (!editor) return;
    editor.storage.richPaste.uploadImage = uploadImage;
  }, [editor, uploadImage]);

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
    if (trimmed) {
      const href = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
      editor.chain().focus().setImage({ src: href, alt: '' }).run();
    }
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
        onUploadImage={(file) => void uploadImage(file).then((url) => editor.chain().focus().setImage({ src: url, alt: '' }).run())}
        imageUploading={imageUploading}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 border-b border-border/60 bg-muted/20 text-[11px] text-muted-foreground">
        <span>
          Rich paste from Word, Google Docs, Excel, and the web — bold, lists, tables, links, colors, and images.
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
