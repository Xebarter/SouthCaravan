'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  GripVertical,
  ImageIcon,
  Images,
  Loader2,
  Replace,
  Trash2,
  Upload,
  ZoomIn,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  SHOWCASE_ACCEPT,
  SHOWCASE_CAPTION_MAX,
  SHOWCASE_KINDS,
  SHOWCASE_MAX_BYTES,
  SHOWCASE_MAX_IMAGES,
  SHOWCASE_RECOMMENDED_MAX,
  SHOWCASE_RECOMMENDED_MIN,
  getShowcaseKindHint,
  getShowcaseKindLabel,
  normalizeShowcaseKind,
  type ShowcaseImage,
  type ShowcaseKind,
} from '@/lib/vendor-showcase';

type Props = {
  images: ShowcaseImage[];
  onImagesChange: (images: ShowcaseImage[]) => void;
  publicProfileEnabled?: boolean;
  publicProfileHref?: string;
  onError?: (message: string) => void;
};

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function VendorShowcaseGalleryCard({
  images,
  onImagesChange,
  publicProfileEnabled = false,
  publicProfileHref = '',
  onError,
}: Props) {
  const uploadInputId = 'vendor-showcase-upload';
  const [uploadKind, setUploadKind] = useState<ShowcaseKind>('premises');
  const [busy, setBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [filterKind, setFilterKind] = useState<'all' | ShowcaseKind>('all');
  const [previewImage, setPreviewImage] = useState<ShowcaseImage | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const pendingReplaceIdRef = useRef('');
  const captionTimersRef = useRef<Record<string, ReturnType<typeof window.setTimeout> | undefined>>({});

  const sortedImages = useMemo(
    () => [...images].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [images],
  );

  const filteredImages = useMemo(() => {
    if (filterKind === 'all') return sortedImages;
    return sortedImages.filter((img) => normalizeShowcaseKind(img.kind) === filterKind);
  }, [filterKind, sortedImages]);

  const kindCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const img of sortedImages) {
      const kind = normalizeShowcaseKind(img.kind);
      counts.set(kind, (counts.get(kind) ?? 0) + 1);
    }
    return counts;
  }, [sortedImages]);

  const coveragePercent = useMemo(() => {
    const kindsUsed = kindCounts.size;
    const target = Math.min(SHOWCASE_KINDS.length, 5);
    return Math.min(100, Math.round((kindsUsed / target) * 100));
  }, [kindCounts.size]);

  const galleryStrength = useMemo(() => {
    const count = sortedImages.length;
    if (count >= SHOWCASE_RECOMMENDED_MIN && count <= SHOWCASE_RECOMMENDED_MAX) {
      return { label: 'Strong gallery', variant: 'success' as const };
    }
    if (count > 0 && count < SHOWCASE_RECOMMENDED_MIN) {
      return { label: `Add ${SHOWCASE_RECOMMENDED_MIN - count} more for best results`, variant: 'warning' as const };
    }
    if (count > SHOWCASE_RECOMMENDED_MAX) {
      return { label: `${count} images — buyers see your top picks first`, variant: 'secondary' as const };
    }
    return { label: 'No images yet', variant: 'secondary' as const };
  }, [sortedImages.length]);

  const reportError = useCallback(
    (message: string) => {
      onError?.(message);
      toast.error(message);
    },
    [onError],
  );

  const uploadImage = async (opts: {
    file: File;
    kind?: string;
    caption?: string;
    replaceId?: string;
  }): Promise<ShowcaseImage> => {
    const formData = new FormData();
    formData.append('file', opts.file);
    if (opts.kind) formData.append('kind', opts.kind);
    if (opts.caption) formData.append('caption', opts.caption);
    if (opts.replaceId) formData.append('replaceId', opts.replaceId);

    const res = await fetch('/api/vendor/showcase-images', { method: 'POST', body: formData });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.error ?? 'Failed to upload image');
    if (!json?.image) throw new Error('Failed to upload image');
    return json.image as ShowcaseImage;
  };

  const persistPatch = async (
    updates: { id: string; kind?: string; caption?: string; sortOrder?: number }[],
  ) => {
    const res = await fetch('/api/vendor/showcase-images', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.error ?? 'Failed to update images');
  };

  const validateFiles = (files: File[]) => {
    const remaining = SHOWCASE_MAX_IMAGES - sortedImages.length;
    if (remaining <= 0) {
      throw new Error(`Maximum ${SHOWCASE_MAX_IMAGES} showcase images allowed. Remove one to upload more.`);
    }

    const accepted = files.slice(0, remaining);
    if (files.length > remaining) {
      toast.message(`Only ${remaining} slot${remaining === 1 ? '' : 's'} left — extra files were skipped`);
    }

    for (const file of accepted) {
      if (!file.type.startsWith('image/')) {
        throw new Error(`${file.name} is not an image file`);
      }
      if (file.size > SHOWCASE_MAX_BYTES) {
        throw new Error(`${file.name} exceeds ${formatFileSize(SHOWCASE_MAX_BYTES)} limit`);
      }
    }

    return accepted;
  };

  const mergeUploaded = (uploaded: ShowcaseImage[]) => {
    onImagesChange(
      [...sortedImages, ...uploaded].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    );
  };

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    setBusy(true);
    setUploadProgress({ done: 0, total: 0 });
    try {
      const files = validateFiles(Array.from(fileList));
      if (files.length === 0) return;

      setUploadProgress({ done: 0, total: files.length });
      const uploaded: ShowcaseImage[] = [];
      let failed = 0;

      for (const file of files) {
        try {
          const image = await uploadImage({ file, kind: uploadKind, caption: '' });
          uploaded.push(image);
        } catch (e: unknown) {
          failed += 1;
          const message = e instanceof Error ? e.message : 'Upload failed';
          toast.error(`${file.name}: ${message}`);
        }
        setUploadProgress((p) => (p ? { ...p, done: p.done + 1 } : null));
      }

      if (uploaded.length > 0) {
        mergeUploaded(uploaded);
        toast.success(
          uploaded.length === 1 ? 'Showcase image uploaded' : `${uploaded.length} showcase images uploaded`,
        );
      }
      if (failed > 0 && uploaded.length === 0) {
        reportError('No images were uploaded. Check file type and size (max 6 MB).');
      }
    } catch (e: unknown) {
      reportError(e instanceof Error ? e.message : 'Failed to upload images');
    } finally {
      setBusy(false);
      setUploadProgress(null);
    }
  };

  const handleReplace = async (replaceId: string, file: File | null) => {
    if (!replaceId || !file) return;
    setBusy(true);
    try {
      if (file.size > SHOWCASE_MAX_BYTES) {
        throw new Error(`Image exceeds ${formatFileSize(SHOWCASE_MAX_BYTES)} limit`);
      }
      const updated = await uploadImage({ file, replaceId });
      onImagesChange(
        sortedImages
          .map((img) => (img.id === updated.id ? updated : img))
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
      );
      toast.success('Image replaced');
    } catch (e: unknown) {
      reportError(e instanceof Error ? e.message : 'Failed to replace image');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    const timer = captionTimersRef.current[id];
    if (timer) clearTimeout(timer);
    delete captionTimersRef.current[id];

    try {
      const res = await fetch(`/api/vendor/showcase-images?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? 'Failed to delete image');
      onImagesChange(sortedImages.filter((img) => img.id !== id));
      if (previewImage?.id === id) setPreviewImage(null);
      toast.success('Image removed');
    } catch (e: unknown) {
      reportError(e instanceof Error ? e.message : 'Failed to delete image');
    }
  };

  const scheduleCaption = (id: string, caption: string) => {
    const nextCaption = caption.slice(0, SHOWCASE_CAPTION_MAX);
    onImagesChange(sortedImages.map((img) => (img.id === id ? { ...img, caption: nextCaption } : img)));

    const existing = captionTimersRef.current[id];
    if (existing) clearTimeout(existing);

    captionTimersRef.current[id] = window.setTimeout(() => {
      void persistPatch([{ id, caption: nextCaption }]).catch((e: unknown) => {
        toast.error(e instanceof Error ? e.message : 'Failed to save caption');
      });
      delete captionTimersRef.current[id];
    }, 650);
  };

  const flushCaption = async (id: string, caption: string) => {
    const nextCaption = caption.slice(0, SHOWCASE_CAPTION_MAX);
    const existing = captionTimersRef.current[id];
    if (existing) clearTimeout(existing);
    delete captionTimersRef.current[id];

    try {
      await persistPatch([{ id, caption: nextCaption }]);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to save caption');
    }
  };

  const updateKind = async (id: string, kind: string) => {
    onImagesChange(sortedImages.map((img) => (img.id === id ? { ...img, kind } : img)));
    try {
      await persistPatch([{ id, kind }]);
      toast.success('Category updated');
    } catch (e: unknown) {
      reportError(e instanceof Error ? e.message : 'Failed to update category');
    }
  };

  const moveImage = async (id: string, direction: 'up' | 'down') => {
    const idx = sortedImages.findIndex((img) => img.id === id);
    if (idx < 0) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sortedImages.length) return;

    const a = sortedImages[idx]!;
    const b = sortedImages[targetIdx]!;
    const snapshot = sortedImages.map((img) => ({ ...img }));
    const nextAOrder = b.sort_order;
    const nextBOrder = a.sort_order;

    onImagesChange(
      sortedImages
        .map((img) => {
          if (img.id === a.id) return { ...img, sort_order: nextAOrder };
          if (img.id === b.id) return { ...img, sort_order: nextBOrder };
          return img;
        })
        .sort((x, y) => (x.sort_order ?? 0) - (y.sort_order ?? 0)),
    );

    try {
      await persistPatch([
        { id: a.id, sortOrder: nextAOrder },
        { id: b.id, sortOrder: nextBOrder },
      ]);
    } catch (e: unknown) {
      onImagesChange(snapshot);
      reportError(e instanceof Error ? e.message : 'Failed to reorder image');
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (busy) return;
    void handleUpload(e.dataTransfer.files);
  };

  return (
    <Card className="rounded-2xl border-border/70 shadow-sm overflow-hidden">
      <CardHeader className="pb-4 border-b border-border/50 bg-muted/20 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              <Images className="h-4 w-4 text-muted-foreground" />
              Showcase gallery
            </CardTitle>
            <CardDescription className="text-xs max-w-2xl">
              Professional photos of your facilities, equipment, QC, and logistics appear on your public supplier
              profile when enabled.
            </CardDescription>
          </div>
          {publicProfileEnabled && publicProfileHref ? (
            <Button asChild variant="outline" size="sm" className="shrink-0 gap-1.5 h-8">
              <a href={publicProfileHref} target="_blank" rel="noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
                Preview on profile
              </a>
            </Button>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border/60 bg-background/80 px-3 py-2.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Images</p>
            <p className="text-lg font-bold tabular-nums mt-0.5">
              {sortedImages.length}
              <span className="text-sm font-normal text-muted-foreground"> / {SHOWCASE_MAX_IMAGES}</span>
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/80 px-3 py-2.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Categories covered</p>
            <p className="text-lg font-bold tabular-nums mt-0.5">{kindCounts.size}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/80 px-3 py-2.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Gallery strength</p>
            <Badge variant={galleryStrength.variant} className="mt-1.5">
              {galleryStrength.label}
            </Badge>
          </div>
        </div>

        {sortedImages.length > 0 ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Category diversity</span>
              <span className="tabular-nums">{coveragePercent}%</span>
            </div>
            <Progress value={coveragePercent} className="h-1.5" />
          </div>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-5 pt-5">
        <input
          id={uploadInputId}
          type="file"
          accept={SHOWCASE_ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => {
            const files = e.target.files;
            e.target.value = '';
            void handleUpload(files);
          }}
        />
        <input
          ref={replaceInputRef}
          type="file"
          accept={SHOWCASE_ACCEPT}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            e.target.value = '';
            const replaceId = pendingReplaceIdRef.current;
            pendingReplaceIdRef.current = '';
            void handleReplace(replaceId, file);
          }}
        />

        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (!busy && sortedImages.length < SHOWCASE_MAX_IMAGES) {
                document.getElementById(uploadInputId)?.click();
              }
            }
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragActive(false);
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className={cn(
            'relative rounded-2xl border-2 border-dashed px-4 py-6 sm:px-6 sm:py-8 transition-colors',
            dragActive
              ? 'border-violet-500/60 bg-violet-500/5'
              : 'border-border/70 bg-muted/15 hover:bg-muted/25',
            busy || sortedImages.length >= SHOWCASE_MAX_IMAGES ? 'opacity-80' : 'cursor-pointer',
          )}
          onClick={() => {
            if (busy || sortedImages.length >= SHOWCASE_MAX_IMAGES) return;
            document.getElementById(uploadInputId)?.click();
          }}
        >
          <div className="flex flex-col items-center text-center gap-3 pointer-events-none">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-700 dark:text-violet-300">
              {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
            </div>
            <div className="space-y-1 max-w-md">
              <p className="text-sm font-semibold text-foreground">
                {sortedImages.length >= SHOWCASE_MAX_IMAGES
                  ? 'Gallery limit reached'
                  : dragActive
                    ? 'Drop images to upload'
                    : 'Drag & drop or click to upload'}
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, WEBP, or GIF · up to {formatFileSize(SHOWCASE_MAX_BYTES)} each ·{' '}
                {SHOWCASE_RECOMMENDED_MIN}–{SHOWCASE_RECOMMENDED_MAX} photos recommended
              </p>
            </div>
          </div>

          <div
            className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 justify-center">
              <Label htmlFor="showcase-upload-kind" className="text-xs text-muted-foreground shrink-0">
                Default category
              </Label>
              <Select value={uploadKind} onValueChange={(v) => setUploadKind(v as ShowcaseKind)}>
                <SelectTrigger id="showcase-upload-kind" size="sm" className="h-8 w-[180px] bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SHOWCASE_KINDS.map((k) => (
                    <SelectItem key={k.value} value={k.value}>
                      {k.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-8"
              disabled={busy || sortedImages.length >= SHOWCASE_MAX_IMAGES}
              onClick={() => document.getElementById(uploadInputId)?.click()}
            >
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              {busy ? 'Uploading…' : 'Choose files'}
            </Button>
          </div>

          {uploadProgress ? (
            <div className="mt-4 space-y-1.5 pointer-events-none">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Uploading…</span>
                <span className="tabular-nums">
                  {uploadProgress.done}/{uploadProgress.total}
                </span>
              </div>
              <Progress value={(uploadProgress.done / uploadProgress.total) * 100} className="h-1.5" />
            </div>
          ) : null}

          <p className="mt-3 text-center text-[11px] text-muted-foreground pointer-events-none">
            {getShowcaseKindHint(uploadKind)}
          </p>
        </div>

        {sortedImages.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={filterKind === 'all' ? 'default' : 'outline'}
              className="h-7 rounded-full text-xs"
              onClick={() => setFilterKind('all')}
            >
              All ({sortedImages.length})
            </Button>
            {SHOWCASE_KINDS.filter((k) => (kindCounts.get(k.value) ?? 0) > 0).map((k) => (
              <Button
                key={k.value}
                type="button"
                size="sm"
                variant={filterKind === k.value ? 'default' : 'outline'}
                className="h-7 rounded-full text-xs"
                onClick={() => setFilterKind(k.value)}
              >
                {k.label} ({kindCounts.get(k.value)})
              </Button>
            ))}
          </div>
        ) : null}

        {filteredImages.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredImages.map((img) => {
              const globalIdx = sortedImages.findIndex((i) => i.id === img.id);
              const isFirst = globalIdx <= 0;
              const isLast = globalIdx >= sortedImages.length - 1;

              return (
                <article
                  key={img.id}
                  className="group rounded-2xl border border-border/70 bg-card overflow-hidden shadow-sm"
                >
                  <div className="relative aspect-[16/10] bg-muted/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.caption || getShowcaseKindLabel(img.kind)}
                      className="h-full w-full object-contain p-2"
                    />
                    <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
                      <Badge className="bg-background/90 text-foreground border border-border/60 shadow-sm">
                        {getShowcaseKindLabel(img.kind)}
                      </Badge>
                      <Badge variant="secondary" className="tabular-nums">
                        #{globalIdx + 1}
                      </Badge>
                    </div>
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 bg-background/90 shadow-sm"
                        onClick={() => setPreviewImage(img)}
                        aria-label="Preview image"
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="p-3 sm:p-4 space-y-3 border-t border-border/50">
                    <div className="flex flex-wrap items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          disabled={busy || isFirst}
                          onClick={() => void moveImage(img.id, 'up')}
                          aria-label="Move up"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          disabled={busy || isLast}
                          onClick={() => void moveImage(img.id, 'down')}
                          aria-label="Move down"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>

                      <Select value={normalizeShowcaseKind(img.kind)} onValueChange={(v) => void updateKind(img.id, v)}>
                        <SelectTrigger size="sm" className="h-8 flex-1 min-w-[140px] max-w-[200px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SHOWCASE_KINDS.map((k) => (
                            <SelectItem key={k.value} value={k.value}>
                              {k.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="flex items-center gap-1 ml-auto">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1"
                          disabled={busy}
                          onClick={() => {
                            pendingReplaceIdRef.current = img.id;
                            replaceInputRef.current?.click();
                          }}
                        >
                          <Replace className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Replace</span>
                        </Button>

                        <AlertDialog
                          open={pendingDeleteId === img.id}
                          onOpenChange={(open) => setPendingDeleteId(open ? img.id : null)}
                        >
                          <AlertDialogTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 text-destructive hover:text-destructive"
                              disabled={busy}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove this showcase image?</AlertDialogTitle>
                              <AlertDialogDescription>
                                It will be removed from your public supplier profile. You can upload a replacement
                                anytime.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={async (e) => {
                                  e.preventDefault();
                                  setPendingDeleteId(null);
                                  await handleDelete(img.id);
                                }}
                              >
                                Remove image
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <Label htmlFor={`showcase-caption-${img.id}`} className="text-xs text-muted-foreground">
                          Caption
                        </Label>
                        <span className="text-[11px] text-muted-foreground tabular-nums">
                          {(img.caption ?? '').length}/{SHOWCASE_CAPTION_MAX}
                        </span>
                      </div>
                      <Input
                        id={`showcase-caption-${img.id}`}
                        value={img.caption ?? ''}
                        onChange={(e) => scheduleCaption(img.id, e.target.value)}
                        onBlur={(e) => void flushCaption(img.id, e.target.value)}
                        placeholder="e.g. ISO-certified final inspection line"
                        disabled={busy}
                      />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : sortedImages.length > 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 px-4 py-8 text-center text-sm text-muted-foreground">
            No images in this category.{' '}
            <button type="button" className="text-primary underline-offset-4 hover:underline" onClick={() => setFilterKind('all')}>
              Show all
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-border/60 bg-muted/10 p-5 sm:p-6">
            <p className="text-sm font-semibold text-foreground">What buyers look for</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              A balanced gallery builds trust faster than product photos alone.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {SHOWCASE_KINDS.slice(0, 6).map((k) => (
                <div key={k.value} className="flex items-start gap-2 rounded-lg border border-border/50 bg-background/70 px-3 py-2">
                  <ImageIcon className="h-4 w-4 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium">{k.label}</p>
                    <p className="text-[11px] text-muted-foreground">{k.hint}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <Dialog open={Boolean(previewImage)} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden">
          {previewImage ? (
            <>
              <DialogHeader className="p-4 pb-2 border-b border-border/50">
                <DialogTitle className="text-base">{getShowcaseKindLabel(previewImage.kind)}</DialogTitle>
                <DialogDescription className="text-sm">
                  {previewImage.caption || 'No caption — add one to help buyers understand this photo.'}
                </DialogDescription>
              </DialogHeader>
              <div className="bg-muted/30 p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewImage.url}
                  alt={previewImage.caption || getShowcaseKindLabel(previewImage.kind)}
                  className="mx-auto max-h-[70vh] w-full object-contain rounded-lg"
                />
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
