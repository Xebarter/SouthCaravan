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
  Search,
  Sparkles,
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
import { Textarea } from '@/components/ui/textarea';
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
import { validateDualPricingConfig } from '@/lib/product-pricing';
import { DualPricingFormSection } from '@/components/product/dual-pricing-form-section';

const ProductDescriptionEditor = dynamic(
  () => import('@/components/product-description-editor').then((m) => m.ProductDescriptionEditor),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[140px] sm:min-h-[220px] rounded-md border border-input bg-muted/40 animate-pulse" aria-hidden />
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
  retail_price: number | null;
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

type ProductPromotionRequest = {
  id: string;
  product_id: string;
  kind: 'featured';
  status: 'pending' | 'approved' | 'rejected';
  message: string;
  created_at: string;
};

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
  price: z.coerce.number().min(0, 'Bulk price must be 0 or more'),
  retailPrice: z.union([z.literal(''), z.coerce.number().min(0)]).optional(),
  minimumOrder: z.coerce.number().int().min(1, 'Minimum order must be at least 1'),
  unit: z.string().min(1, 'Unit is required'),
  inStock: z.boolean().default(true),
  specifications: z.array(specificationSchema).default([]),
}).superRefine((data, ctx) => {
  const retail = data.retailPrice === '' || data.retailPrice == null ? null : Number(data.retailPrice);
  const err = validateDualPricingConfig(data.price, retail, data.minimumOrder);
  if (err) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: err, path: ['retailPrice'] });
  }
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
          'w-full rounded-lg border-2 border-dashed px-4 py-6 sm:px-6 sm:py-8 text-center transition-colors',
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
  const { user } = useAuth();
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
  const [promotionRequests, setPromotionRequests] = useState<ProductPromotionRequest[]>([]);
  const [promotionNeedsSetup, setPromotionNeedsSetup] = useState(false);
  const [featureMessage, setFeatureMessage] = useState('');
  const [featureSubmitting, setFeatureSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
      subcategory: '',
      subSubCategory: '',
      price: 0,
      retailPrice: '',
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

  async function loadPromotionRequests() {
    try {
      const res = await fetch('/api/vendor/products/promotions', { cache: 'no-store' });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error ?? 'Failed to load promotion requests');
      setPromotionNeedsSetup(Boolean(payload.needsSetup));
      setPromotionRequests(Array.isArray(payload.requests) ? payload.requests : []);
    } catch {
      setPromotionRequests([]);
    }
  }

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
    if (!user) return;
    fetchTaxonomy();
    fetchProducts();
    void loadPromotionRequests();
  }, [user]);

  const stats = useMemo(() => {
    const total = products.length;
    const inStock = products.filter((p) => p.in_stock).length;
    const totalValue = products.reduce((sum, p) => sum + Number(p.price ?? 0), 0);
    return { total, inStock, outOfStock: total - inStock, totalValue };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return products;

    return products.filter((product) => {
      const haystack = [
        product.name,
        stripHtmlForPreview(product.description ?? ''),
        product.category,
        product.subcategory,
        product.sub_subcategory,
        product.unit,
        product.in_stock ? 'in stock' : 'out of stock',
        product.is_featured ? 'featured' : '',
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [products, searchQuery]);

  const hasSearch = Boolean(searchQuery.trim());

  const pendingFeaturedRequest = useMemo(() => {
    if (!editingProduct?.id) return null;
    return promotionRequests.find(
      (request) =>
        request.product_id === editingProduct.id &&
        request.kind === 'featured' &&
        request.status === 'pending',
    );
  }, [promotionRequests, editingProduct]);

  const isProductFeatured = Boolean(editingProduct?.is_featured);
  const canRequestFeatured =
    Boolean(editingProduct?.id) &&
    !isProductFeatured &&
    !pendingFeaturedRequest &&
    !promotionNeedsSetup;

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
      retailPrice: '',
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
    setFeatureMessage('');
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
      retailPrice: product.retail_price == null ? '' : Number(product.retail_price),
      minimumOrder: product.minimum_order ?? 1,
      unit: product.unit ?? 'piece',
      inStock: Boolean(product.in_stock),
      specifications: Object.entries(product.specifications ?? {}).map(([key, value]) => ({ key, value })),
    });
    replace(Object.entries(product.specifications ?? {}).map(([key, value]) => ({ key, value })));
    setDescriptionEditorKey((k) => k + 1);
    setFeatureMessage('');
    setDialogOpen(true);
  }

  async function submitFeaturedRequest() {
    if (!editingProduct?.id) {
      toast.error('Save the product first to request featured placement.');
      return;
    }

    setFeatureSubmitting(true);
    try {
      const res = await fetch('/api/vendor/products/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: editingProduct.id,
          kind: 'featured',
          message: featureMessage,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error ?? 'Failed to submit request');
      toast.success('Featured listing request sent to admin for review');
      setFeatureMessage('');
      await loadPromotionRequests();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit request');
    } finally {
      setFeatureSubmitting(false);
    }
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
      formData.append(
        'retailPrice',
        values.retailPrice === '' || values.retailPrice == null ? '' : String(values.retailPrice),
      );
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

      const payload = (await response.json()) as { error?: string; product?: SupabaseProduct };
      if (!response.ok) throw new Error(payload?.error ?? 'Failed to save product');

      const savedProduct = payload.product;
      if (savedProduct) {
        setEditingProduct(savedProduct);
        setMode('edit');
        setExistingImages(savedProduct.images ?? []);
        newImages.forEach((item) => URL.revokeObjectURL(item.preview));
        setNewImages([]);
      }

      setUploadUi({ status: 'success', progress: 100 });
      toast.success(
        mode === 'create'
          ? 'Product created. You can request featured placement below.'
          : 'Product updated',
      );
      await fetchProducts();
      await new Promise((r) => setTimeout(r, 600));
      setUploadUi({ status: 'idle' });
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

  if (!user) return null;

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

      {promotionNeedsSetup ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          Featured listing requests are not enabled yet. Run the SQL in{' '}
          <code className="rounded bg-background/60 px-1.5 py-0.5 text-xs">supabase/product-promotions.sql</code>{' '}
          in your Supabase project.
        </div>
      ) : null}

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
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by name, category, or description…"
                className="rounded-xl border-border/60 bg-background pl-9 pr-9"
                aria-label="Search products"
              />
              {hasSearch ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
            {hasSearch ? (
              <p className="text-sm text-muted-foreground shrink-0">
                {filteredProducts.length} of {products.length} product{products.length === 1 ? '' : 's'}
              </p>
            ) : null}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-border/60 py-20 text-center">
              <div className="rounded-full bg-secondary p-4 mb-4">
                <Search className="h-6 w-6 text-muted-foreground/60" />
              </div>
              <p className="text-base font-semibold">No products match your search</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                Try a different name, category, or keyword.
              </p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setSearchQuery('')}>
                Clear search
              </Button>
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
                {filteredProducts.map((product) => (
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
                          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                            {product.is_featured ? (
                              <Badge className="h-5 gap-1 px-1.5 text-[10px]">
                                <Sparkles className="h-3 w-3" />
                                Featured
                              </Badge>
                            ) : null}
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {stripHtmlForPreview(product.description ?? '').trim() || 'No description'}
                            </p>
                          </div>
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
                      <div className="flex items-center justify-end">
                        <div className="flex items-center justify-end gap-2 rounded-lg border border-border bg-background/95 p-1.5 shadow-sm opacity-100 transition-opacity md:opacity-100">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 bg-background hover:bg-secondary focus-visible:ring-2 focus-visible:ring-primary"
                          onClick={() => openEdit(product)}
                          aria-label={`Edit ${product.name}`}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 border-destructive/40 text-destructive hover:text-destructive hover:bg-destructive/10 focus-visible:ring-2 focus-visible:ring-destructive"
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
          )}
        </div>
      )}

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) resetDialogState();
      }}>
        <DialogContent
          className={cn(
            'flex flex-col p-0 gap-0 overflow-hidden rounded-xl sm:rounded-2xl border shadow-xl',
            // Mobile: inset panel that fits the viewport (overrides default center translate)
            'fixed left-2 right-2 top-2 bottom-2 w-auto max-w-none translate-x-0 translate-y-0',
            // Desktop: centered modal
            'sm:left-1/2 sm:right-auto sm:top-1/2 sm:bottom-auto sm:-translate-x-1/2 sm:-translate-y-1/2',
            'sm:w-[min(92vw,48rem)] sm:max-w-3xl sm:h-[min(88dvh,900px)]',
          )}
        >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, onInvalidSubmit)} className="flex h-full min-h-0 flex-col">
              <DialogHeader className="shrink-0 border-b border-border bg-background/95 px-4 py-3 pr-12 backdrop-blur sm:px-6 sm:py-4">
                <div className="min-w-0">
                  <DialogTitle className="text-lg sm:text-xl">
                    {mode === 'create' ? 'Add product' : 'Edit product'}
                  </DialogTitle>
                  <DialogDescription className="mt-1 hidden text-xs sm:block sm:text-sm">
                    {mode === 'create'
                      ? 'Create a new product listing with pricing, images, and specs.'
                      : 'Update this product\u2019s details, pricing, images, and specs.'}
                  </DialogDescription>
                </div>
              </DialogHeader>

              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
                <div className="mx-auto w-full space-y-4 px-3 py-4 sm:space-y-6 sm:px-6 sm:py-6">
                  <div className="rounded-xl border border-border bg-card p-3 sm:p-5 space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold sm:text-base">Product information</h3>
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

                  <div className="rounded-xl border border-border bg-card p-3 sm:p-5 space-y-3 sm:space-y-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                      <h3 className="text-sm font-semibold sm:text-base">Category</h3>
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

                  <DualPricingFormSection control={form.control} />

                  <div className="rounded-xl border border-border bg-card p-3 sm:p-5">
                    <FormField control={form.control} name="inStock" render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <FormLabel className="!mt-0">In Stock</FormLabel>
                      </FormItem>
                    )} />
                  </div>

                  <div className="rounded-xl border border-border bg-card p-3 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold sm:text-base">Images</h3>
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

                  <div className="rounded-xl border border-border bg-card p-3 sm:p-5 space-y-3 sm:space-y-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="text-sm font-semibold sm:text-base">Specifications</h3>
                      <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => append({ key: '', value: '' })}>
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

              <div className="shrink-0 border-t border-border bg-background/95 px-4 py-3 backdrop-blur pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
                <div className="mx-auto w-full max-w-5xl space-y-3">
                  <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-3 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary shrink-0" />
                      <p className="text-sm font-medium">Featured on homepage</p>
                      {isProductFeatured ? (
                        <Badge className="gap-1">
                          <Sparkles className="h-3 w-3" />
                          Live
                        </Badge>
                      ) : pendingFeaturedRequest ? (
                        <Badge variant="secondary">Request pending</Badge>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isProductFeatured
                        ? 'This product is already featured on the homepage.'
                        : pendingFeaturedRequest
                          ? 'An admin is reviewing your featured listing request.'
                          : editingProduct?.id
                            ? 'Submit this product for admin review to appear in the homepage featured section.'
                            : 'Save the product first, then you can submit it for featured placement.'}
                    </p>
                    {canRequestFeatured ? (
                      <Textarea
                        value={featureMessage}
                        onChange={(e) => setFeatureMessage(e.target.value)}
                        placeholder="Optional note for admin (e.g. seasonal promo, bulk discounts, fast delivery)."
                        disabled={featureSubmitting || submitting}
                        className="min-h-16 resize-y text-sm"
                      />
                    ) : null}
                  </div>

                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={() => setDialogOpen(false)}
                      disabled={submitting || featureSubmitting}
                    >
                      {editingProduct ? 'Done' : 'Cancel'}
                    </Button>
                    {canRequestFeatured ? (
                      <Button
                        type="button"
                        variant="secondary"
                        className="w-full sm:w-auto gap-2"
                        disabled={submitting || featureSubmitting}
                        onClick={() => void submitFeaturedRequest()}
                      >
                        {featureSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                        {featureSubmitting ? 'Submitting…' : 'Submit for featured'}
                      </Button>
                    ) : null}
                    <Button type="submit" disabled={submitting || featureSubmitting} className="w-full min-w-0 sm:min-w-32 sm:w-auto">
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
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
