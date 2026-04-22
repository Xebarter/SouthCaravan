'use client'

import { useRef, useState } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MAX_SERVICE_OFFERING_IMAGES, normalizeOfferingImageUrls } from '@/lib/service-offering-images'
import { cn } from '@/lib/utils'

type Props = {
  offeringId: string
  images: string[] | undefined
  disabled?: boolean
  needsSetup?: boolean
  onUpdated: () => void
  onError?: (message: string) => void
}

export function OfferingImagesEditor({
  offeringId,
  images: imagesProp,
  disabled,
  needsSetup,
  onUpdated,
  onError,
}: Props) {
  const list = normalizeOfferingImageUrls(imagesProp)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function uploadFiles(files: FileList | null) {
    if (!files?.length || needsSetup || disabled) return
    setUploading(true)
    try {
      const fd = new FormData()
      for (let i = 0; i < files.length; i++) fd.append('images', files[i])
      const res = await fetch(`/api/services/offerings/${encodeURIComponent(offeringId)}/images`, {
        method: 'POST',
        body: fd,
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error ?? 'Upload failed')
      onUpdated()
      if (json?.truncated) {
        onError?.(
          `Only some files were added — listings allow up to ${MAX_SERVICE_OFFERING_IMAGES} images each.`,
        )
      }
    } catch (e: any) {
      onError?.(e?.message ?? 'Upload failed')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function removeUrl(url: string) {
    if (needsSetup || disabled) return
    setRemoving(url)
    try {
      const next = list.filter((u) => u !== url)
      const res = await fetch(`/api/services/offerings/${encodeURIComponent(offeringId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: next }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error ?? 'Failed to remove image')
      onUpdated()
    } catch (e: any) {
      onError?.(e?.message ?? 'Failed to remove image')
    } finally {
      setRemoving(null)
    }
  }

  const canAdd = list.length < MAX_SERVICE_OFFERING_IMAGES

  return (
    <div className="space-y-2 w-full sm:max-w-md">
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
        Public photos
      </p>
      {list.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {list.map((src, idx) => (
            <div
              key={`${src}-${idx}`}
              className="relative h-16 w-24 rounded-md overflow-hidden border border-border/80 bg-muted shrink-0"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                className={cn(
                  'absolute top-0.5 right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white shadow-sm',
                  'hover:bg-black/75 disabled:opacity-50',
                )}
                disabled={Boolean(removing) || disabled || needsSetup}
                onClick={() => void removeUrl(src)}
                aria-label="Remove image"
              >
                {removing === src ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <X className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No photos yet — add images for the marketplace and your public page.</p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => void uploadFiles(e.target.files)}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        disabled={disabled || needsSetup || uploading || !canAdd}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
        {uploading ? 'Uploading…' : 'Add images'}
      </Button>
      <p className="text-[11px] text-muted-foreground">
        Up to {MAX_SERVICE_OFFERING_IMAGES} images · shown on your public listing and home feed
      </p>
    </div>
  )
}
