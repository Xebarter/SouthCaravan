'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AlertCircle,
  BriefcaseBusiness,
  CheckCircle2,
  ExternalLink,
  ImageIcon,
  Loader2,
  Megaphone,
  Pencil,
  Plus,
  RefreshCw,
  Star,
  Trash2,
  UploadCloud,
  UserRound,
} from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Money } from '@/components/money';
import { MAX_PRODUCT_IMAGE_BYTES, productImageMaxSizeLabel } from '@/lib/product-image-limits';
import { MAX_SERVICE_OFFERING_IMAGES } from '@/lib/service-offering-images';
import { DEFAULT_SERVICES_TAXONOMY } from '@/lib/services-taxonomy';
import { stripHtmlForPreview } from '@/lib/strip-html';
import { cn } from '@/lib/utils';

type StatusFilter = 'all' | 'active' | 'inactive';
type PricingFilter = 'all' | 'fixed' | 'hourly';

interface ProviderInfo {
  user_id: string;
  email: string;
  name: string;
  company_name: string;
}

interface ServiceOffering {
  id: string;
  provider_user_id: string;
  category: string;
  subcategory: string;
  title: string;
  description: string;
  pricing_type: 'fixed' | 'hourly';
  rate: number;
  currency: string;
  is_active: boolean;
  is_featured: boolean;
  featured_sort_order: number;
  is_ad: boolean;
  ad_sort_order: number;
  images: string[];
  created_at: string;
  updated_at: string;
  provider: {
    id: string;
    email: string;
    name: string;
    company_name: string;
  } | null;
}

type ImageEntry = { file: File; preview: string };

type ReplaceTarget =
  | { kind: 'existing'; url: string }
  | { kind: 'new'; index: number }
  | null;

type UploadUiState =
  | { status: 'idle' }
  | { status: 'uploading'; progress: number }
  | { status: 'success'; progress: number }
  | { status: 'error' };

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const CURRENCIES = ['USD', 'KES', 'EUR', 'GBP'] as const;

const serviceFormSchema = z.object({
  providerUserId: z.string().min(1, 'Provider is required'),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().min(1, 'Service type is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().default(''),
  pricingType: z.enum(['fixed', 'hourly']),
  rate: z.coerce.number().min(0, 'Rate must be 0 or more'),
  currency: z.string().min(1, 'Currency is required'),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isAd: z.boolean().default(false),
  featuredSortOrder: z.coerce.number().int().min(0).default(0),
  adSortOrder: z.coerce.number().int().min(0).default(0),
});

type ServiceFormValues = z.infer<typeof serviceFormSchema>;

async function uploadFormDataWithProgress({
  url,
  method,
  body,
  onProgress,
}: {
  url: string;
  method: 'POST' | 'PATCH';
  body: FormData;
  onProgress?: (progress: number) => void;
}): Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }> {
  return await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const progress = Math.max(0, Math.min(100, Math.round((event.loaded / event.total) * 100)));
      onProgress?.(progress);
    };

    xhr.onload = () => {
      const status = xhr.status;
      const ok = status >= 200 && status < 300;
      const text = xhr.responseText ?? '';
      resolve({
        ok,
        status,
        json: async () => {
          try {
            return text ? JSON.parse(text) : {};
          } catch {
            return { error: text || 'Invalid server response' };
          }
        },
      });
    };

    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send(body);
  });
}

function ImageUploader({
  newImages,
  onNewImagesChange,
  existingImages = [],
  onExistingImagesChange,
  dialogOpen,
  maxImages = MAX_SERVICE_OFFERING_IMAGES,
}: {
  newImages: ImageEntry[];
  onNewImagesChange: (images: ImageEntry[]) => void;
  existingImages?: string[];
  onExistingImagesChange?: (images: string[]) => void;
  dialogOpen: boolean;
  maxImages?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replaceTarget, setReplaceTarget] = useState<ReplaceTarget>(null);
  const [dragging, setDragging] = useState(false);
  const [uploadAlert, setUploadAlert] = useState<{ title: string; description: string } | null>(null);

  const totalCount = existingImages.length + newImages.length;
  const atLimit = totalCount >= maxImages;

  useEffect(() => {
    if (dialogOpen) setUploadAlert(null);
  }, [dialogOpen]);

  useEffect(() => {
    if (!dialogOpen) setReplaceTarget(null);
  }, [dialogOpen]);

  function addFiles(fileList: FileList | File[]) {
    if (atLimit) {
      setUploadAlert({
        title: 'Image limit reached',
        description: `Maximum ${maxImages} images per listing.`,
      });
      return;
    }

    const next: ImageEntry[] = [];
    const tooLarge: string[] = [];
    const badType: string[] = [];
    let slots = maxImages - totalCount;

    for (const file of Array.from(fileList)) {
      if (slots <= 0) break;
      if (!ACCEPTED_TYPES.includes(file.type)) {
        badType.push(file.name);
        continue;
      }
      if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
        tooLarge.push(file.name);
        continue;
      }
      next.push({ file, preview: URL.createObjectURL(file) });
      slots -= 1;
    }

    const lines: string[] = [];
    if (tooLarge.length > 0) {
      lines.push(`Maximum size is ${productImageMaxSizeLabel()} per file. Too large: ${tooLarge.join(', ')}.`);
    }
    if (badType.length > 0) {
      lines.push(`Unsupported type (use PNG, JPG, WEBP, or GIF): ${badType.join(', ')}.`);
    }

    if (lines.length > 0) {
      setUploadAlert({ title: 'Some images were not added', description: lines.join('\n\n') });
    } else {
      setUploadAlert(null);
    }

    if (next.length > 0) onNewImagesChange([...newImages, ...next]);
  }

  function removeNewImage(index: number) {
    URL.revokeObjectURL(newImages[index].preview);
    onNewImagesChange(newImages.filter((_, i) => i !== index));
  }

  function removeExistingImage(url: string) {
    if (!onExistingImagesChange) return;
    onExistingImagesChange(existingImages.filter((image) => image !== url));
  }

  function validateReplacementFile(file: File): boolean {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadAlert({ title: 'Unsupported file type', description: `Use PNG, JPG, WEBP, or GIF.` });
      return false;
    }
    if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
      setUploadAlert({ title: 'Image too large', description: `Max ${productImageMaxSizeLabel()} per file.` });
      return false;
    }
    return true;
  }

  function onReplaceFilePicked(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !replaceTarget) return;
    if (!validateReplacementFile(file)) {
      setReplaceTarget(null);
      return;
    }

    if (replaceTarget.kind === 'existing') {
      const url = replaceTarget.url;
      if (onExistingImagesChange) {
        onExistingImagesChange(existingImages.filter((image) => image !== url));
      }
      onNewImagesChange([...newImages, { file, preview: URL.createObjectURL(file) }]);
    } else {
      const index = replaceTarget.index;
      const prev = newImages[index];
      if (prev) URL.revokeObjectURL(prev.preview);
      const next = [...newImages];
      next[index] = { file, preview: URL.createObjectURL(file) };
      onNewImagesChange(next);
    }
    setReplaceTarget(null);
  }

  return (
    <div className="space-y-3">
      {uploadAlert && (
        <Alert className="border-amber-500/60 bg-amber-50 text-amber-950 dark:bg-amber-950/35 dark:text-amber-50">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{uploadAlert.title}</AlertTitle>
          <AlertDescription className="whitespace-pre-wrap">{uploadAlert.description}</AlertDescription>
        </Alert>
      )}
      <button
        type="button"
        disabled={atLimit}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={cn(
          'w-full rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors',
          atLimit && 'opacity-50 cursor-not-allowed',
          dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-secondary/40',
        )}
      >
        <UploadCloud className="mx-auto mb-2 h-7 w-7 text-muted-foreground" />
        <p className="text-sm font-medium">Click to upload or drag and drop</p>
        <p className="text-xs text-muted-foreground mt-1">
          PNG, JPG, WEBP, GIF up to {productImageMaxSizeLabel()} · {totalCount}/{maxImages} images
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          accept={ACCEPTED_TYPES.join(',')}
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </button>

      <input
        ref={replaceInputRef}
        type="file"
        className="hidden"
        accept={ACCEPTED_TYPES.join(',')}
        onChange={onReplaceFilePicked}
      />

      {(existingImages.length > 0 || newImages.length > 0) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {existingImages.map((url) => (
            <div key={url} className="relative rounded-md overflow-hidden border aspect-square bg-secondary">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              {onExistingImagesChange && (
                <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-black/55 p-1.5">
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8"
                    onClick={() => {
                      setReplaceTarget({ kind: 'existing', url });
                      replaceInputRef.current?.click();
                    }}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="h-8 w-8"
                    onClick={() => removeExistingImage(url)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ))}
          {newImages.map((image, index) => (
            <div key={image.preview} className="relative rounded-md overflow-hidden border aspect-square bg-secondary">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.preview} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-black/55 p-1.5">
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8"
                  onClick={() => {
                    setReplaceTarget({ kind: 'new', index });
                    replaceInputRef.current?.click();
                  }}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="h-8 w-8"
                  onClick={() => removeNewImage(index)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function providerLabel(p: ProviderInfo | ServiceOffering['provider']) {
  if (!p) return 'Unknown provider';
  return ('company_name' in p ? p.company_name : '') || p.name || p.email || 'Provider';
}

export default function ServiceManagementClient() {
  const searchParams = useSearchParams();
  const initialProvider = searchParams.get('provider') ?? 'all';

  const [offerings, setOfferings] = useState<ServiceOffering[]>([]);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadUi, setUploadUi] = useState<UploadUiState>({ status: 'idle' });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toggleUpdatingId, setToggleUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [pricingFilter, setPricingFilter] = useState<PricingFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [providerFilter, setProviderFilter] = useState(initialProvider);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [adsOnly, setAdsOnly] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [editingOffering, setEditingOffering] = useState<ServiceOffering | null>(null);
  const [newImages, setNewImages] = useState<ImageEntry[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      providerUserId: '',
      category: DEFAULT_SERVICES_TAXONOMY[0]?.title ?? '',
      subcategory: DEFAULT_SERVICES_TAXONOMY[0]?.items[0] ?? '',
      title: '',
      description: '',
      pricingType: 'fixed',
      rate: 0,
      currency: 'USD',
      isActive: true,
      isFeatured: false,
      isAd: false,
      featuredSortOrder: 0,
      adSortOrder: 0,
    },
  });

  const selectedCategory = form.watch('category');
  const selectedSubcategory = form.watch('subcategory');
  const taxonomyPath = [selectedCategory, selectedSubcategory].filter(Boolean).join(' / ');

  const categoryOptions = useMemo(
    () => DEFAULT_SERVICES_TAXONOMY.map((s) => s.title),
    [],
  );

  const availableSubcategories = useMemo(
    () => DEFAULT_SERVICES_TAXONOMY.find((s) => s.title === selectedCategory)?.items ?? [],
    [selectedCategory],
  );

  useEffect(() => {
    const current = form.getValues('subcategory');
    if (current && !availableSubcategories.includes(current)) {
      const first = availableSubcategories[0] ?? '';
      form.setValue('subcategory', first);
      if (mode === 'create' && first) form.setValue('title', first);
    }
  }, [availableSubcategories, form, mode]);

  useEffect(() => {
    setProviderFilter(initialProvider);
  }, [initialProvider]);

  async function fetchOfferings() {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/services/offerings', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Failed to fetch services');
      setOfferings(payload.offerings ?? []);
      setNeedsSetup(Boolean(payload.needsSetup));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load services');
    } finally {
      setLoading(false);
    }
  }

  async function fetchProviders() {
    try {
      const response = await fetch('/api/admin/services/providers', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Failed to load providers');
      setProviders(payload.providers ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load providers');
    }
  }

  useEffect(() => {
    void fetchOfferings();
    void fetchProviders();
  }, []);

  function resetDialogState() {
    const firstCategory = categoryOptions[0] ?? '';
    const firstSubcategory =
      DEFAULT_SERVICES_TAXONOMY.find((s) => s.title === firstCategory)?.items[0] ?? '';
    const firstProvider = providers[0]?.user_id ?? '';

    form.reset({
      providerUserId: firstProvider,
      category: firstCategory,
      subcategory: firstSubcategory,
      title: firstSubcategory,
      description: '',
      pricingType: 'fixed',
      rate: 0,
      currency: 'USD',
      isActive: true,
      isFeatured: false,
      isAd: false,
      featuredSortOrder: 0,
      adSortOrder: 0,
    });
    setEditingOffering(null);
    setExistingImages([]);
    newImages.forEach((item) => URL.revokeObjectURL(item.preview));
    setNewImages([]);
    setMode('create');
    setUploadUi({ status: 'idle' });
  }

  function openCreateDialog() {
    resetDialogState();
    setMode('create');
    setDialogOpen(true);
  }

  function openEditDialog(offering: ServiceOffering) {
    resetDialogState();
    setMode('edit');
    setEditingOffering(offering);
    setExistingImages(offering.images ?? []);
    form.reset({
      providerUserId: offering.provider_user_id,
      category: offering.category,
      subcategory: offering.subcategory,
      title: offering.title,
      description: offering.description ?? '',
      pricingType: offering.pricing_type,
      rate: Number(offering.rate),
      currency: offering.currency,
      isActive: offering.is_active,
      isFeatured: offering.is_featured,
      isAd: offering.is_ad,
      featuredSortOrder: offering.featured_sort_order,
      adSortOrder: offering.ad_sort_order,
    });
    setDialogOpen(true);
  }

  async function onSubmit(values: ServiceFormValues) {
    setSubmitting(true);
    setUploadUi({ status: 'uploading', progress: 0 });
    try {
      const formData = new FormData();
      formData.append('providerUserId', values.providerUserId);
      formData.append('category', values.category);
      formData.append('subcategory', values.subcategory);
      formData.append('title', values.title);
      formData.append('description', values.description);
      formData.append('pricingType', values.pricingType);
      formData.append('rate', String(values.rate));
      formData.append('currency', values.currency);
      formData.append('isActive', String(values.isActive));
      formData.append('isFeatured', String(values.isFeatured));
      formData.append('isAd', String(values.isAd));
      formData.append('featuredSortOrder', String(values.featuredSortOrder));
      formData.append('adSortOrder', String(values.adSortOrder));
      for (const image of newImages) formData.append('images', image.file);

      let response: { ok: boolean; json: () => Promise<unknown> };
      if (mode === 'create') {
        response = await uploadFormDataWithProgress({
          url: '/api/admin/services/offerings',
          method: 'POST',
          body: formData,
          onProgress: (progress) => setUploadUi({ status: 'uploading', progress }),
        });
      } else {
        if (!editingOffering) throw new Error('Missing offering to edit');
        formData.append('id', editingOffering.id);
        formData.append('existingImages', JSON.stringify(existingImages));
        response = await uploadFormDataWithProgress({
          url: '/api/admin/services/offerings',
          method: 'PATCH',
          body: formData,
          onProgress: (progress) => setUploadUi({ status: 'uploading', progress }),
        });
      }

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload?.error ?? 'Failed to save service');

      setUploadUi({ status: 'success', progress: 100 });
      toast.success(mode === 'create' ? 'Service listing created' : 'Service listing updated');
      await new Promise((r) => setTimeout(r, 500));
      setDialogOpen(false);
      resetDialogState();
      await fetchOfferings();
    } catch (error) {
      setUploadUi({ status: 'error' });
      toast.error(error instanceof Error ? error.message : 'Could not save service');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(offering: ServiceOffering) {
    if (!confirm(`Delete "${offering.title}"? This cannot be undone.`)) return;
    setDeletingId(offering.id);
    try {
      const response = await fetch(`/api/admin/services/offerings?id=${offering.id}`, { method: 'DELETE' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Delete failed');
      setOfferings((prev) => prev.filter((item) => item.id !== offering.id));
      toast.success('Service listing deleted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  }

  async function patchToggle(
    offering: ServiceOffering,
    patch: Partial<{
      isActive: boolean;
      isFeatured: boolean;
      isAd: boolean;
      featuredSortOrder: number;
      adSortOrder: number;
    }>,
  ) {
    setToggleUpdatingId(offering.id);
    try {
      const response = await fetch('/api/admin/services/offerings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: offering.id, ...patch }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Update failed');

      const updated = payload.offering as ServiceOffering;
      setOfferings((prev) => prev.map((item) => (item.id === offering.id ? { ...item, ...updated } : item)));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Update failed');
    } finally {
      setToggleUpdatingId(null);
    }
  }

  const filteredOfferings = useMemo(() => {
    return offerings.filter((offering) => {
      if (statusFilter === 'active' && !offering.is_active) return false;
      if (statusFilter === 'inactive' && offering.is_active) return false;
      if (pricingFilter !== 'all' && offering.pricing_type !== pricingFilter) return false;
      if (featuredOnly && !offering.is_featured) return false;
      if (adsOnly && !offering.is_ad) return false;
      if (categoryFilter !== 'all' && offering.category !== categoryFilter) return false;
      if (providerFilter !== 'all' && offering.provider_user_id !== providerFilter) return false;

      const providerName = providerLabel(offering.provider);
      const haystack =
        `${offering.title} ${stripHtmlForPreview(offering.description)} ${offering.category} ${offering.subcategory} ${providerName}`.toLowerCase();
      if (search.trim() && !haystack.includes(search.trim().toLowerCase())) return false;
      return true;
    });
  }, [
    offerings,
    statusFilter,
    pricingFilter,
    featuredOnly,
    adsOnly,
    categoryFilter,
    providerFilter,
    search,
  ]);

  const stats = useMemo(
    () => ({
      total: offerings.length,
      active: offerings.filter((o) => o.is_active).length,
      featured: offerings.filter((o) => o.is_featured).length,
      ads: offerings.filter((o) => o.is_ad).length,
    }),
    [offerings],
  );

  const hasProviders = providers.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Services Management</h2>
          <p className="text-muted-foreground mt-1">
            Manage all service listings across providers — taxonomy, pricing, visibility, and merchandising.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => void fetchOfferings()} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Refresh
          </Button>
          <Button onClick={openCreateDialog} disabled={!hasProviders || needsSetup}>
            <Plus className="w-4 h-4 mr-2" />
            Add Service Listing
          </Button>
        </div>
      </div>

      {needsSetup && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="py-3 text-sm text-amber-700 dark:text-amber-300">
            Services tables are not set up. Run the SQL migration in{' '}
            <code className="text-xs bg-amber-500/10 px-1 rounded">supabase/services.sql</code> in your Supabase
            project.
          </CardContent>
        </Card>
      )}

      {!hasProviders && !needsSetup && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="py-3 text-sm text-amber-700 dark:text-amber-300">
            No service providers found. Providers must register via the{' '}
            <Link className="underline" href="/admin/vendors">
              Vendor Approvals
            </Link>{' '}
            flow with the services role before listings can be created.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Listings</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-amber-500">{stats.featured}</p>
            <p className="text-xs text-muted-foreground">Featured</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-primary">{stats.ads}</p>
            <p className="text-xs text-muted-foreground">Promoted Ads</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and narrow listings by provider, category, status, and merchandising.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services..."
            className="lg:col-span-2"
          />
          <Select value={providerFilter} onValueChange={setProviderFilter}>
            <SelectTrigger><SelectValue placeholder="Provider" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              {providers.map((p) => (
                <SelectItem key={p.user_id} value={p.user_id}>
                  {providerLabel(p)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categoryOptions.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={pricingFilter} onValueChange={(v) => setPricingFilter(v as PricingFilter)}>
            <SelectTrigger><SelectValue placeholder="Pricing" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pricing</SelectItem>
              <SelectItem value="fixed">Fixed rate</SelectItem>
              <SelectItem value="hourly">Hourly</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex flex-col gap-2 lg:col-span-2">
            <div className="flex items-center gap-2 px-3 border rounded-md h-10">
              <Switch checked={featuredOnly} onCheckedChange={setFeaturedOnly} />
              <span className="text-sm">Featured only</span>
            </div>
            <div className="flex items-center gap-2 px-3 border rounded-md h-10">
              <Switch checked={adsOnly} onCheckedChange={setAdsOnly} />
              <span className="text-sm">Ads only</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Service Registry</CardTitle>
          <CardDescription>
            {filteredOfferings.length} of {offerings.length} listings shown
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-14 flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading services...
            </div>
          ) : filteredOfferings.length === 0 ? (
            <div className="py-14 text-center text-muted-foreground">
              No service listings matched the current filters.
            </div>
          ) : (
            <div className="max-md:overflow-x-auto">
              <table className="w-full table-fixed border-collapse text-sm max-md:min-w-[720px]">
                <colgroup>
                  <col className="w-[28%]" />
                  <col className="w-[16%]" />
                  <col className="w-[18%]" />
                  <col className="w-[10%]" />
                  <col className="w-[8%]" />
                  <col className="w-[8%]" />
                  <col className="w-[8%]" />
                  <col className="w-[4%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2.5 px-2">Service</th>
                    <th className="text-left py-2.5 px-2">Provider</th>
                    <th className="text-left py-2.5 px-2">Category</th>
                    <th className="text-left py-2.5 px-2">Rate</th>
                    <th className="text-left py-2.5 px-2">Active</th>
                    <th className="text-left py-2.5 px-2">Featured</th>
                    <th className="text-left py-2.5 px-2">Ad</th>
                    <th className="text-right py-2.5 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOfferings.map((offering) => (
                    <tr key={offering.id} className="border-b border-border/40 hover:bg-secondary/40">
                      <td className="py-2.5 px-2 align-top">
                        <div className="flex items-start gap-2">
                          {offering.images?.[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={offering.images[0]}
                              alt=""
                              className="h-10 w-10 shrink-0 rounded border object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border bg-secondary">
                              <BriefcaseBusiness className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-medium">{offering.title}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{offering.subcategory}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 align-top">
                        <Badge variant="outline" className="inline-flex max-w-full items-center gap-1 truncate">
                          <UserRound className="h-3 w-3 shrink-0" />
                          <span className="truncate">{providerLabel(offering.provider)}</span>
                        </Badge>
                      </td>
                      <td className="py-2.5 px-2 align-top text-xs">
                        <p className="leading-snug">{offering.category}</p>
                      </td>
                      <td className="py-2.5 px-2 align-top whitespace-nowrap">
                        <Money amount={Number(offering.rate)} baseCurrency={offering.currency} />
                        <p className="text-[10px] text-muted-foreground">
                          {offering.pricing_type === 'hourly' ? '/ hour' : 'fixed'}
                        </p>
                      </td>
                      <td className="py-2.5 px-2 align-top">
                        <Switch
                          checked={offering.is_active}
                          disabled={toggleUpdatingId === offering.id}
                          onCheckedChange={(checked) => patchToggle(offering, { isActive: checked })}
                        />
                      </td>
                      <td className="py-2.5 px-2 align-top">
                        <div className="flex items-center gap-1">
                          <Switch
                            checked={offering.is_featured}
                            disabled={toggleUpdatingId === offering.id}
                            onCheckedChange={(checked) => patchToggle(offering, { isFeatured: checked })}
                          />
                          <Star
                            className={cn(
                              'h-3.5 w-3.5',
                              offering.is_featured ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground',
                            )}
                          />
                        </div>
                      </td>
                      <td className="py-2.5 px-2 align-top">
                        <div className="flex items-center gap-1">
                          <Switch
                            checked={offering.is_ad}
                            disabled={toggleUpdatingId === offering.id}
                            onCheckedChange={(checked) => patchToggle(offering, { isAd: checked })}
                          />
                          <Megaphone
                            className={cn(
                              'h-3.5 w-3.5',
                              offering.is_ad ? 'text-primary' : 'text-muted-foreground',
                            )}
                          />
                        </div>
                      </td>
                      <td className="py-2.5 px-2 align-top">
                        <div className="flex items-center justify-end gap-0.5">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/public/services/${offering.id}`} target="_blank" aria-label="View public page">
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(offering)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(offering)}
                            disabled={deletingId === offering.id}
                          >
                            {deletingId === offering.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetDialogState();
        }}
      >
        <DialogContent className="w-[92vw] max-w-[92vw] sm:max-w-2xl lg:max-w-3xl h-[88dvh] p-0 gap-0 overflow-hidden rounded-2xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="h-full min-h-0 flex flex-col">
              <DialogHeader className="border-b px-6 py-4">
                <DialogTitle className="text-xl">
                  {mode === 'create' ? 'Add service listing' : 'Edit service listing'}
                </DialogTitle>
                <DialogDescription>
                  {mode === 'create'
                    ? 'Create a new service offering for a verified provider.'
                    : 'Update listing details, pricing, images, and merchandising flags.'}
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
                <div className="rounded-xl border p-4 sm:p-5 space-y-4">
                  <h3 className="text-base font-semibold">Listing details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="providerUserId"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Service Provider *</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {providers.map((p) => (
                                <SelectItem key={p.user_id} value={p.user_id}>
                                  {providerLabel(p)} ({p.email})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Listing Title *</FormLabel>
                          <FormControl><Input {...field} placeholder="e.g. Website Design & Development" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              rows={4}
                              placeholder="Describe the service scope, deliverables, and any terms..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="rounded-xl border p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-semibold">Category</h3>
                    <Badge variant="outline" className="truncate max-w-[60%]">{taxonomyPath || 'Select category'}</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category *</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={(value) => {
                              field.onChange(value);
                              const firstSub =
                                DEFAULT_SERVICES_TAXONOMY.find((s) => s.title === value)?.items[0] ?? '';
                              form.setValue('subcategory', firstSub);
                              if (mode === 'create') form.setValue('title', firstSub);
                            }}
                          >
                            <FormControl>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categoryOptions.map((cat) => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="subcategory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Service Type *</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={(value) => {
                              field.onChange(value);
                              if (mode === 'create') form.setValue('title', value);
                            }}
                          >
                            <FormControl>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-64">
                              {availableSubcategories.map((item) => (
                                <SelectItem key={item} value={item}>{item}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="rounded-xl border p-4 sm:p-5 space-y-4">
                  <h3 className="text-base font-semibold">Pricing</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <FormField
                      control={form.control}
                      name="pricingType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pricing Model</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="fixed">Fixed rate</SelectItem>
                              <SelectItem value="hourly">Hourly rate</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="rate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rate</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" min={0} placeholder="0 for contact quote" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {CURRENCIES.map((c) => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="rounded-xl border p-4 sm:p-5 space-y-4">
                  <h3 className="text-base font-semibold">Visibility & merchandising</h3>
                  <div className="flex flex-wrap gap-6">
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                          <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                          <FormLabel className="mt-0!">Active listing</FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="isFeatured"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                          <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                          <FormLabel className="mt-0!">Featured</FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="isAd"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                          <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                          <FormLabel className="mt-0!">Promoted ad</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="featuredSortOrder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Featured sort order</FormLabel>
                          <FormControl><Input {...field} type="number" min={0} step={1} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="adSortOrder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ad sort order</FormLabel>
                          <FormControl><Input {...field} type="number" min={0} step={1} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="rounded-xl border p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold">Images</h3>
                    <Badge variant="outline">{existingImages.length + newImages.length} image(s)</Badge>
                  </div>
                  <ImageUploader
                    dialogOpen={dialogOpen}
                    newImages={newImages}
                    onNewImagesChange={setNewImages}
                    existingImages={existingImages}
                    onExistingImagesChange={setExistingImages}
                  />
                </div>
              </div>

              <div className="border-t px-6 py-3 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      {uploadUi.status === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
                      ) : (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      {uploadUi.status === 'uploading'
                        ? `Uploading ${uploadUi.progress}%`
                        : mode === 'create'
                          ? 'Creating...'
                          : 'Saving...'}
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      {mode === 'create' ? 'Create Listing' : 'Save Changes'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
