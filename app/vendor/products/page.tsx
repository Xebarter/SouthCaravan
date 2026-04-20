'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AlertCircle,
  CheckCircle2,
  Edit,
  ImageIcon,
  Loader2,
  Package,
  Plus,
  PlusCircle,
  RefreshCw,
  Trash2,
  TrendingUp,
  UploadCloud,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { stripHtmlForPreview } from '@/lib/strip-html';
import { MAX_PRODUCT_IMAGE_BYTES, productImageMaxSizeLabel } from '@/lib/product-image-limits';
import { Money } from '@/components/money';
import { useAuth } from '@/lib/auth-context';

const ProductDescriptionEditor = dynamic(
  () => import('@/components/product-description-editor').then((m) => m.ProductDescriptionEditor),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[220px] rounded-md border border-input bg-muted/40 animate-pulse" aria-hidden />
    ),
  },
);

const UNITS = ['piece', 'kg', 'g', 'tonne', 'litre', 'ml', 'metre', 'sqm', 'box', 'pack', 'dozen', 'set'] as const;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

interface SupabaseProduct {
  id: string;
  vendor_id: string | null;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  sub_subcategory: string;
  price: number;
  minimum_order: number;
  unit: string;
  images: string[];
  in_stock: boolean;
  is_featured: boolean;
  specifications: Record<string, string>;
  created_at: string;
}

type ImageEntry = { file: File; preview: string };

type TaxonomyTree = {
  id: string;
  name: string;
  slug: string;
  subcategories: {
    id: string;
    name: string;
    slug: string;
    subSubcategories: { id: string; name: string; slug: string }[];
  }[];
};

type ReplaceTarget =
  | { kind: 'existing'; url: string }
  | { kind: 'new'; index: number }
  | null;

type UploadUiState =
  | { status: 'idle' }
  | { status: 'uploading'; progress: number }
  | { status: 'success'; progress: number }
  | { status: 'error' };

const specificationSchema = z.object({
  key: z.string().min(1, 'Key required'),
  value: z.string().min(1, 'Value required'),
});

const productFormSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().default(''),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().default(''),
  subSubCategory: z.string().default(''),
  price: z.coerce.number().min(0, 'Price must be 0 or more'),
  minimumOrder: z.coerce.number().int().min(1, 'Minimum order must be at least 1'),
  unit: z.string().min(1, 'Unit is required'),
  inStock: z.boolean().default(true),
  specifications: z.array(specificationSchema).default([]),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

async function uploadFormDataWithProgress({
  url,
  method,
  body,
  onProgress,
  signal,
}: {
  url: string;
  method: 'POST' | 'PATCH';
  body: FormData;
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
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
    xhr.onabort = () => reject(new Error('Upload cancelled'));

    if (signal) {
      if (signal.aborted) {
        xhr.abort();
        return;
      }
      signal.addEventListener('abort', () => xhr.abort(), { once: true });
    }

    xhr.send(body);
  });
}

function ImageUploader({
  newImages,
  onNewImagesChange,
  existingImages = [],
  onExistingImagesChange,
  dialogOpen,
}: {
  newImages: ImageEntry[];
  onNewImagesChange: (images: ImageEntry[]) => void;
  existingImages?: string[];
  onExistingImagesChange?: (images: string[]) => void;
  dialogOpen: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replaceTarget, setReplaceTarget] = useState<ReplaceTarget>(null);
  const [dragging, setDragging] = useState(false);
  const [uploadAlert, setUploadAlert] = useState<{ title: string; description: string } | null>(null);

  useEffect(() => {
    if (dialogOpen) setUploadAlert(null);
  }, [dialogOpen]);

  useEffect(() => {
    if (!dialogOpen) setReplaceTarget(null);
  }, [dialogOpen]);

  function addFiles(fileList: FileList | File[]) {
    const next: ImageEntry[] = [];
    const tooLarge: string[] = [];
    const badType: string[] = [];

    for (const file of Array.from(fileList)) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        badType.push(file.name);
        continue;
      }
      if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
        tooLarge.push(file.name);
        continue;
      }
      next.push({ file, preview: URL.createObjectURL(file) });
    }

    const lines: string[] = [];
    if (tooLarge.length > 0) {
      lines.push(
        `Maximum size is ${productImageMaxSizeLabel()} per file. Too large: ${tooLarge.join(', ')}.`,
      );
    }
    if (badType.length > 0) {
      lines.push(`Unsupported type (use PNG, JPG, WEBP, or GIF): ${badType.join(', ')}.`);
    }

    if (lines.length > 0) {
      const title =
        tooLarge.length > 0 && badType.length > 0
          ? 'Some images were not added'
          : tooLarge.length > 0
            ? 'Image too large'
            : 'Unsupported file type';
      setUploadAlert({ title, description: lines.join('\n\n') });

      if (tooLarge.length > 0) {
        toast.error(`Image too large. Max size is ${productImageMaxSizeLabel()} per file.`);
      } else if (badType.length > 0) {
        toast.error('Unsupported image type. Use PNG, JPG, WEBP, or GIF.');
      }
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

  function setReplaceAlert(title: string, description: string) {
    setUploadAlert({ title, description });
  }

  function validateReplacementFile(file: File): boolean {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setReplaceAlert(
        'Unsupported file type',
        `Use PNG, JPG, WEBP, or GIF. "${file.name}" is not supported.`,
      );
      toast.error('Unsupported image type. Use PNG, JPG, WEBP, or GIF.');
      return false;
    }
    if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
      setReplaceAlert(
        'Image too large',
        `Maximum size is ${productImageMaxSizeLabel()} per file. "${file.name}" is too large.`,
      );
      toast.error(`Image too large. Max size is ${productImageMaxSizeLabel()} per file.`);
      return false;
    }
    return true;
  }

  function openReplaceExisting(url: string) {
    setReplaceTarget({ kind: 'existing', url });
    replaceInputRef.current?.click();
  }

  function openReplaceNew(index: number) {
    setReplaceTarget({ kind: 'new', index });
    replaceInputRef.current?.click();
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
        <Alert className="border-amber-500/60 bg-amber-50 text-amber-950 dark:bg-amber-950/35 dark:text-amber-50 dark:border-amber-500/45 [&>svg]:text-amber-700 dark:[&>svg]:text-amber-400">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{uploadAlert.title}</AlertTitle>
          <AlertDescription className="whitespace-pre-wrap text-amber-900/90 dark:text-amber-50/90">
            {uploadAlert.description}
          </AlertDescription>
        </Alert>
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          addFiles(event.dataTransfer.files);
        }}
        className={[
          'w-full rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors',
          dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-secondary/40',
        ].join(' ')}
      >
        <UploadCloud className="mx-auto mb-2 h-7 w-7 text-muted-foreground" />
        <p className="text-sm font-medium">Click to upload or drag and drop</p>
        <p className="text-xs text-muted-foreground mt-1">
          PNG, JPG, WEBP, GIF up to {productImageMaxSizeLabel()} each
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          accept={ACCEPTED_TYPES.join(',')}
          onChange={(event) => {
            const list = event.target.files;
            if (list) addFiles(list);
            event.target.value = '';
          }}
        />
      </button>

      <input
        ref={replaceInputRef}
        type="file"
        className="hidden"
        accept={ACCEPTED_TYPES.join(',')}
        onChange={onReplaceFilePicked}
        aria-hidden
      />

      {(existingImages.length > 0 || newImages.length > 0) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {existingImages.map((url) => (
            <div
              key={url}
              className="relative rounded-md overflow-hidden border border-border aspect-square bg-secondary"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="Existing product image" className="h-full w-full object-cover" />
              {onExistingImagesChange && (
                <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-black/55 p-1.5">
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8 shrink-0 bg-background/95 hover:bg-background"
                    onClick={() => openReplaceExisting(url)}
                    aria-label="Replace this image"
                    title="Replace image"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="h-8 w-8 shrink-0"
                    onClick={() => removeExistingImage(url)}
                    aria-label="Remove image from product"
                    title="Remove image"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ))}
          {newImages.map((image, index) => (
            <div
              key={`${image.preview}-${index}`}
              className="relative rounded-md overflow-hidden border border-border aspect-square bg-secondary"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.preview} alt={image.file.name} className="h-full w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-black/55 p-1.5">
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 shrink-0 bg-background/95 hover:bg-background"
                  onClick={() => openReplaceNew(index)}
                  aria-label={`Replace ${image.file.name}`}
                  title="Replace image"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="h-8 w-8 shrink-0"
                  onClick={() => removeNewImage(index)}
                  aria-label={`Remove ${image.file.name}`}
                  title="Remove image"
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

export default function VendorProductsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [products, setProducts] = useState<SupabaseProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadUi, setUploadUi] = useState<UploadUiState>({ status: 'idle' });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [editingProduct, setEditingProduct] = useState<SupabaseProduct | null>(null);
  const [newImages, setNewImages] = useState<ImageEntry[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [taxonomyTree, setTaxonomyTree] = useState<TaxonomyTree[]>([]);
  const [descriptionEditorKey, setDescriptionEditorKey] = useState(0);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
      subcategory: '',
      subSubCategory: '',
      price: 0,
      minimumOrder: 1,
      unit: 'piece',
      inStock: true,
      specifications: [],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'specifications',
  });

  const selectedCategory = form.watch('category');
  const selectedSubcategory = form.watch('subcategory');
  const selectedSubSubcategory = form.watch('subSubCategory');
  const taxonomyPath = [selectedCategory, selectedSubcategory, selectedSubSubcategory].filter(Boolean).join(' / ');

  const categoryOptions = useMemo(
    () => taxonomyTree.map((item) => item.name),
    [taxonomyTree],
  );

  const availableSubcategories = useMemo(
    () =>
      taxonomyTree.find((item) => item.name === selectedCategory)?.subcategories.map((sub) => sub.name) ?? [],
    [taxonomyTree, selectedCategory],
  );

  const availableSubSubcategories = useMemo(
    () =>
      taxonomyTree
        .find((item) => item.name === selectedCategory)
        ?.subcategories.find((sub) => sub.name === selectedSubcategory)
        ?.subSubcategories.map((leaf) => leaf.name) ?? [],
    [taxonomyTree, selectedCategory, selectedSubcategory],
  );

  useEffect(() => {
    const current = form.getValues('subcategory');
    if (current && !availableSubcategories.includes(current)) {
      form.setValue('subcategory', '');
    }
  }, [availableSubcategories, form]);

  useEffect(() => {
    const current = form.getValues('subSubCategory');
    if (current && !availableSubSubcategories.includes(current)) {
      form.setValue('subSubCategory', '');
    }
  }, [availableSubSubcategories, form]);

  async function fetchTaxonomy() {
    try {
      const res = await fetch('/api/categories');
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? 'Failed to load categories');
      setTaxonomyTree(payload.tree ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not load categories');
    }
  }

  async function fetchProducts() {
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/products');
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error ?? 'Failed to fetch products');
      setProducts(payload.products ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not load products');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading || !user) return;
    fetchTaxonomy();
    fetchProducts();
  }, [authLoading, user]);

  const stats = useMemo(() => {
    const total = products.length;
    const inStock = products.filter((p) => p.in_stock).length;
    const totalValue = products.reduce((sum, p) => sum + Number(p.price ?? 0), 0);
    return { total, inStock, outOfStock: total - inStock, totalValue };
  }, [products]);

  function resetDialogState() {
    const firstCategory = categoryOptions[0] ?? '';
    const firstSubcategory =
      taxonomyTree.find((item) => item.name === firstCategory)?.subcategories[0]?.name ?? '';
    const firstSubSubcategory =
      taxonomyTree
        .find((item) => item.name === firstCategory)
        ?.subcategories.find((sub) => sub.name === firstSubcategory)
        ?.subSubcategories[0]?.name ?? '';

    form.reset({
      name: '',
      description: '',
      category: firstCategory,
      subcategory: firstSubcategory,
      subSubCategory: firstSubSubcategory,
      price: 0,
      minimumOrder: 1,
      unit: 'piece',
      inStock: true,
      specifications: [],
    });
    replace([]);
    setEditingProduct(null);
    setExistingImages([]);
    newImages.forEach((item) => URL.revokeObjectURL(item.preview));
    setNewImages([]);
    setMode('create');
    setUploadUi({ status: 'idle' });
  }

  function openCreate() {
    resetDialogState();
    setMode('create');
    setDescriptionEditorKey((k) => k + 1);
    setDialogOpen(true);
  }

  function openEdit(product: SupabaseProduct) {
    resetDialogState();
    setMode('edit');
    setEditingProduct(product);
    setExistingImages(product.images ?? []);
    form.reset({
      name: product.name ?? '',
      description: product.description ?? '',
      category: product.category ?? '',
      subcategory: product.subcategory ?? '',
      subSubCategory: product.sub_subcategory ?? '',
      price: Number(product.price ?? 0),
      minimumOrder: product.minimum_order ?? 1,
      unit: product.unit ?? 'piece',
      inStock: Boolean(product.in_stock),
      specifications: Object.entries(product.specifications ?? {}).map(([key, value]) => ({ key, value })),
    });
    replace(Object.entries(product.specifications ?? {}).map(([key, value]) => ({ key, value })));
    setDescriptionEditorKey((k) => k + 1);
    setDialogOpen(true);
  }

  async function onSubmit(values: ProductFormValues) {
    setSubmitting(true);
    setUploadUi({ status: 'uploading', progress: 0 });
    try {
      const specificationMap: Record<string, string> = {};
      for (const item of values.specifications) specificationMap[item.key] = item.value;

      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('description', values.description);
      formData.append('category', values.category);
      formData.append('subcategory', values.subcategory);
      formData.append('subSubCategory', values.subSubCategory);
      formData.append('price', String(values.price));
      formData.append('minimumOrder', String(values.minimumOrder));
      formData.append('unit', values.unit);
      formData.append('inStock', String(values.inStock));
      formData.append('specifications', JSON.stringify(specificationMap));
      for (const image of newImages) formData.append('images', image.file);

      let response: { ok: boolean; status: number; json: () => Promise<unknown> };
      if (mode === 'create') {
        response = await uploadFormDataWithProgress({
          url: '/api/vendor/products',
          method: 'POST',
          body: formData,
          onProgress: (progress) => setUploadUi({ status: 'uploading', progress }),
        });
      } else {
        if (!editingProduct) throw new Error('Missing product to edit');
        formData.append('id', editingProduct.id);
        formData.append('existingImages', JSON.stringify(existingImages));
        response = await uploadFormDataWithProgress({
          url: '/api/vendor/products',
          method: 'PATCH',
          body: formData,
          onProgress: (progress) => setUploadUi({ status: 'uploading', progress }),
        });
      }

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload?.error ?? 'Failed to save product');

      setUploadUi({ status: 'success', progress: 100 });
      toast.success(mode === 'create' ? 'Product created' : 'Product updated');
      await new Promise((r) => setTimeout(r, 600));
      setDialogOpen(false);
      resetDialogState();
      await fetchProducts();
    } catch (error) {
      setUploadUi({ status: 'error' });
      toast.error(error instanceof Error ? error.message : 'Could not save product');
    } finally {
      setSubmitting(false);
    }
  }

  function onInvalidSubmit(errors: Record<string, unknown>) {
    const firstErrorPath = Object.keys(errors)[0];
    if (!firstErrorPath) return;

    const normalizedPath = firstErrorPath.replace(/\.\d+\./g, '.');
    const topLevelField = normalizedPath.split('.')[0];
    const fieldContainer = document.querySelector<HTMLElement>(`[data-field="${topLevelField}"]`);
    if (!fieldContainer) return;

    fieldContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const focusTarget = fieldContainer.querySelector<HTMLElement>(
      'input, textarea, [role="combobox"], button, [contenteditable="true"]',
    );
    focusTarget?.focus();
  }

  async function handleDelete(product: SupabaseProduct) {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    setDeletingId(product.id);
    try {
      const res = await fetch(`/api/vendor/products?id=${product.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Delete failed');
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      toast.success('Product deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  }

  if (authLoading || !user) return null;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your catalog listings
          </p>
        </div>
        <Button
          onClick={openCreate}
          disabled={categoryOptions.length === 0}
          size="sm"
          className="gap-2 shrink-0"
        >
          <Plus className="h-4 w-4" />
          Add product
        </Button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(
          [
            { label: 'Total products', value: stats.total,    color: 'bg-primary',   icon: Package },
            { label: 'In stock',       value: stats.inStock,  color: 'bg-emerald-500', icon: Package },
            { label: 'Out of stock',   value: stats.outOfStock, color: 'bg-red-500',   icon: Package },
            { label: 'Total value',    value: <Money amountUSD={stats.totalValue} notation="compact" />, color: 'bg-violet-500', icon: TrendingUp },
          ] as const
        ).map(({ label, value, color, icon: Icon }) => (
          <Card key={label} className="border-border/60">
            <CardContent className="pt-5 pb-4 flex items-center gap-3">
              <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', color)}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold leading-tight tabular-nums">{value}</p>
                <p className="text-xs text-muted-foreground truncate">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Products table */}
      {loading ? (
        <div className="flex items-center justify-center py-28 gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading products…</span>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 text-center">
          <div className="rounded-full bg-secondary p-5 mb-5">
            <Package className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <p className="text-base font-semibold">No products yet</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Add your first product to start selling on the marketplace.
          </p>
          <Button
            onClick={openCreate}
            disabled={categoryOptions.length === 0}
            className="mt-5 gap-2"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            Add your first product
          </Button>
          {categoryOptions.length === 0 && (
            <p className="text-xs text-muted-foreground mt-3">
              Categories need to be set up before you can add products.
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-border/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-border/60 bg-secondary/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground tracking-wide">
                    Product
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground tracking-wide">
                    Category
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground tracking-wide">
                    Price
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground tracking-wide">
                    Min. order
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground tracking-wide">
                    Stock
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground tracking-wide">
                    &nbsp;
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="group hover:bg-secondary/30 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {product.images?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="h-9 w-9 shrink-0 rounded-lg border border-border object-cover"
                          />
                        ) : (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary">
                            <ImageIcon className="h-4 w-4 text-muted-foreground/60" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium truncate max-w-[200px] leading-tight">
                            {product.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">
                            {stripHtmlForPreview(product.description ?? '').trim() || 'No description'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="outline" className="text-xs">
                        {product.category}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 font-semibold tabular-nums text-sm">
                      <Money amountUSD={Number(product.price)} />
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      {product.minimum_order} {product.unit}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border',
                          product.in_stock
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : 'bg-red-500/10 text-red-500 border-red-500/20',
                        )}
                      >
                        {product.in_stock ? 'In stock' : 'Out of stock'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEdit(product)}
                          aria-label={`Edit ${product.name}`}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(product)}
                          disabled={deletingId === product.id}
                          aria-label={`Delete ${product.name}`}
                        >
                          {deletingId === product.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) resetDialogState();
      }}>
        <DialogContent className="w-[92vw] max-w-[92vw] sm:max-w-2xl lg:max-w-3xl h-[88dvh] p-0 gap-0 overflow-hidden rounded-2xl border shadow-xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, onInvalidSubmit)} className="h-full min-h-0 flex flex-col">
              <DialogHeader className="border-b border-border px-6 py-4 bg-background/95 backdrop-blur">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <DialogTitle className="text-xl">{mode === 'create' ? 'Add product' : 'Edit product'}</DialogTitle>
                    <DialogDescription className="mt-1">
                      {mode === 'create'
                        ? 'Create a new product listing with pricing, images, and specs.'
                        : 'Update this product\u2019s details, pricing, images, and specs.'}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
                <div className="mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
                  <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-base font-semibold">Product information</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem data-field="name" className="min-w-0">
                          <FormLabel>Product Name *</FormLabel>
                          <FormControl><Input {...field} placeholder="e.g. Stainless Steel Ball Bearings" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="unit" render={({ field }) => (
                        <FormItem data-field="unit" className="min-w-0">
                          <FormLabel>Unit *</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select unit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>{UNITS.map((unit) => <SelectItem key={unit} value={unit}>{unit}</SelectItem>)}</SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="description" render={({ field }) => (
                      <FormItem data-field="description" className="min-w-0">
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <ProductDescriptionEditor
                            key={descriptionEditorKey}
                            value={field.value}
                            onChange={field.onChange}
                            disabled={submitting}
                            placeholder="Full product description (shown on the public product page)…"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                      <h3 className="text-base font-semibold">Category</h3>
                      <Badge variant="outline" className="w-full sm:w-auto sm:max-w-[60%] truncate">
                        {taxonomyPath || 'Select category path'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <FormField control={form.control} name="category" render={({ field }) => (
                        <FormItem data-field="category" className="min-w-0">
                          <FormLabel>Category *</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>{categoryOptions.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="subcategory" render={({ field }) => (
                        <FormItem data-field="subcategory" className="min-w-0">
                          <FormLabel>Subcategory (optional)</FormLabel>
                          <Select value={field.value || '__none__'} onValueChange={(value) => field.onChange(value === '__none__' ? '' : value)}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select subcategory (optional)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="__none__">None</SelectItem>
                              {availableSubcategories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="subSubCategory" render={({ field }) => (
                        <FormItem data-field="subSubCategory" className="min-w-0">
                          <FormLabel>Sub-Subcategory (optional)</FormLabel>
                          <Select value={field.value || '__none__'} onValueChange={(value) => field.onChange(value === '__none__' ? '' : value)}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select sub-subcategory (optional)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="__none__">None</SelectItem>
                              {availableSubSubcategories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-4">
                    <h3 className="text-base font-semibold">Pricing & availability</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <FormField control={form.control} name="price" render={({ field }) => (
                        <FormItem data-field="price" className="min-w-0">
                          <FormLabel>Base Price (USD) *</FormLabel>
                          <FormControl><Input {...field} type="number" step="0.01" min={0} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="minimumOrder" render={({ field }) => (
                        <FormItem data-field="minimumOrder" className="min-w-0">
                          <FormLabel>Minimum Order *</FormLabel>
                          <FormControl><Input {...field} type="number" step="1" min={1} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    <FormField control={form.control} name="inStock" render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <FormLabel className="!mt-0">In Stock</FormLabel>
                      </FormItem>
                    )} />
                  </div>

                  <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-3">
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

                  <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-3 pb-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold">Specifications</h3>
                      <Button type="button" variant="outline" size="sm" onClick={() => append({ key: '', value: '' })}>
                        <PlusCircle className="w-4 h-4 mr-1" />
                        Add Specification
                      </Button>
                    </div>
                    {fields.length === 0 && (
                      <p className="text-sm text-muted-foreground">No specifications yet.</p>
                    )}
                    {fields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 items-start">
                        <FormField control={form.control} name={`specifications.${index}.key`} render={({ field: itemField }) => (
                          <FormItem>
                            <FormControl><Input {...itemField} placeholder="Key (e.g. Origin)" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name={`specifications.${index}.value`} render={({ field: itemField }) => (
                          <FormItem>
                            <FormControl><Input {...itemField} placeholder="Value (e.g. Kenya)" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <Button type="button" variant="ghost" size="icon" className="md:mt-0" onClick={() => remove(index)} aria-label="Remove specification">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-border bg-background/95 backdrop-blur px-6 py-3">
                <div className="max-w-5xl mx-auto w-full flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting} className="min-w-32">
                    {submitting ? (
                      <>
                        {uploadUi.status === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
                        ) : (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin text-emerald-600" />
                        )}
                        {uploadUi.status === 'uploading'
                          ? `Uploading ${uploadUi.progress}%`
                          : uploadUi.status === 'success'
                            ? 'Success'
                            : mode === 'create'
                              ? 'Creating...'
                              : 'Saving...'}
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        {mode === 'create' ? 'Create Product' : 'Save Changes'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
