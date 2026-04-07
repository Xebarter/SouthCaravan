'use client';

import { useEffect } from 'react';
import LinkExtension from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';

type Props = {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

export function ProductDescriptionEditor({
  value,
  onChange,
  disabled,
  placeholder = 'Describe the product…',
}: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false,
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    editable: !disabled,
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  if (!editor) {
    return (
      <div
        className="min-h-[220px] rounded-md border border-input bg-muted/40 animate-pulse"
        aria-hidden
      />
    );
  }

  function setLink() {
    const previous = editor.getAttributes('link').href as string | undefined;
    const next = typeof window !== 'undefined' ? window.prompt('Link URL', previous ?? 'https://') : null;
    if (next === null) return;
    const trimmed = next.trim();
    if (trimmed === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: trimmed }).run();
  }

  return (
    <div className={cn('product-description-editor rounded-md border border-input bg-background overflow-hidden')}>
      <div
        className="flex flex-wrap items-center gap-0.5 border-b border-border/80 bg-muted/25 px-2 py-1.5"
        role="toolbar"
        aria-label="Formatting"
      >
        <Toggle
          size="sm"
          pressed={editor.isActive('bold')}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          disabled={disabled}
          aria-label="Bold"
        >
          <Bold className="size-3.5" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('italic')}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          disabled={disabled}
          aria-label="Italic"
        >
          <Italic className="size-3.5" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('strike')}
          onPressedChange={() => editor.chain().focus().toggleStrike().run()}
          disabled={disabled}
          aria-label="Strikethrough"
        >
          <Strikethrough className="size-3.5" />
        </Toggle>
        <span className="mx-0.5 h-5 w-px bg-border shrink-0" aria-hidden />
        <Toggle
          size="sm"
          pressed={editor.isActive('heading', { level: 2 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          disabled={disabled}
          aria-label="Heading 2"
        >
          <Heading2 className="size-3.5" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('heading', { level: 3 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          disabled={disabled}
          aria-label="Heading 3"
        >
          <Heading3 className="size-3.5" />
        </Toggle>
        <span className="mx-0.5 h-5 w-px bg-border shrink-0" aria-hidden />
        <Toggle
          size="sm"
          pressed={editor.isActive('bulletList')}
          onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
          disabled={disabled}
          aria-label="Bullet list"
        >
          <List className="size-3.5" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('orderedList')}
          onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
          disabled={disabled}
          aria-label="Numbered list"
        >
          <ListOrdered className="size-3.5" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('blockquote')}
          onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
          disabled={disabled}
          aria-label="Quote"
        >
          <Quote className="size-3.5" />
        </Toggle>
        <button
          type="button"
          onClick={setLink}
          disabled={disabled}
          className={cn(
            'inline-flex h-8 min-w-8 items-center justify-center rounded-md text-sm hover:bg-muted',
            editor.isActive('link') && 'bg-accent text-accent-foreground',
          )}
          aria-label="Link"
        >
          <Link2 className="size-3.5" />
        </button>
        <span className="mx-0.5 h-5 w-px bg-border shrink-0" aria-hidden />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={disabled || !editor.can().undo()}
          aria-label="Undo"
        >
          <Undo2 className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={disabled || !editor.can().redo()}
          aria-label="Redo"
        >
          <Redo2 className="size-3.5" />
        </Button>
      </div>
      <EditorContent
        editor={editor}
        className="product-description-editor__content max-h-[min(360px,50vh)] overflow-y-auto px-3 py-2.5"
      />
    </div>
  );
}
