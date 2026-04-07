'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AlertCircle,
  BadgeCheck,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  PlusCircle,
  RefreshCw,
  Star,
  Trash2,
  UploadCloud,
  User,
  X,
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
import { ProductDescriptionEditor } from '@/components/product-description-editor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { stripHtmlForPreview } from '@/lib/strip-html';
import { MAX_PRODUCT_IMAGE_BYTES, productImageMaxSizeLabel } from '@/lib/product-image-limits';

const UNITS = ['piece', 'kg', 'g', 'tonne', 'litre', 'ml', 'metre', 'sqm', 'box', 'pack', 'dozen', 'set'] as const;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

type SourceFilter = 'all' | 'admin' | 'vendor';
type StockFilter = 'all' | 'in' | 'out';

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
  isFeatured: z.boolean().default(false),
  vendorId: z.string().optional(),
  specifications: z.array(specificationSchema).default([]),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

type ReplaceTarget =
  | { kind: 'existing'; url: string }
  | { kind: 'new'; index: number }
  | null;

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
      return false;
    }
    if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
      setReplaceAlert(
        'Image too large',
        `Maximum size is ${productImageMaxSizeLabel()} per file. "${file.name}" is too large.`,
      );
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

export default function ProductManagementClient() {
  const [products, setProducts] = useState<SupabaseProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [featuredUpdatingId, setFeaturedUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [featuredOnly, setFeaturedOnly] = useState(false);
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
      isFeatured: false,
      vendorId: '',
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
    () => taxonomyTree.find((item) => item.name === selectedCategory)?.subcategories.map((sub) => sub.name) ?? [],
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

  async function fetchProducts() {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/products');
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Failed to fetch products');
      setProducts(payload.products ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load products');
    } finally {
      setLoading(false);
    }
  }

  async function fetchTaxonomy() {
    try {
      const response = await fetch('/api/categories');
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Failed to load categories');
      setTaxonomyTree(payload.tree ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load categories');
    }
  }

  useEffect(() => {
    fetchProducts();
    fetchTaxonomy();
  }, []);

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
      isFeatured: false,
      vendorId: '',
      specifications: [],
    });
    replace([]);
    setEditingProduct(null);
    setExistingImages([]);
    newImages.forEach((item) => URL.revokeObjectURL(item.preview));
    setNewImages([]);
    setMode('create');
  }

  function openCreateDialog() {
    resetDialogState();
    setMode('create');
    setDescriptionEditorKey((k) => k + 1);
    setDialogOpen(true);
  }

  function openEditDialog(product: SupabaseProduct) {
    resetDialogState();
    setMode('edit');
    setEditingProduct(product);
    setExistingImages(product.images ?? []);
    form.reset({
      name: product.name,
      description: product.description ?? '',
      category: product.category,
      subcategory: product.subcategory,
      subSubCategory: product.sub_subcategory,
      price: Number(product.price),
      minimumOrder: product.minimum_order,
      unit: product.unit,
      inStock: product.in_stock,
      isFeatured: product.is_featured,
      vendorId: product.vendor_id ?? '',
      specifications: Object.entries(product.specifications ?? {}).map(([key, value]) => ({ key, value })),
    });
    replace(Object.entries(product.specifications ?? {}).map(([key, value]) => ({ key, value })));
    setDescriptionEditorKey((k) => k + 1);
    setDialogOpen(true);
  }

  async function onSubmit(values: ProductFormValues) {
    setSubmitting(true);
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
      formData.append('isFeatured', String(values.isFeatured));
      formData.append('vendorId', values.vendorId ?? '');
      formData.append('specifications', JSON.stringify(specificationMap));
      for (const image of newImages) formData.append('images', image.file);

      let response: Response;
      if (mode === 'create') {
        response = await fetch('/api/admin/products', { method: 'POST', body: formData });
      } else {
        if (!editingProduct) throw new Error('Missing product to edit');
        formData.append('id', editingProduct.id);
        formData.append('existingImages', JSON.stringify(existingImages));
        response = await fetch('/api/admin/products', { method: 'PATCH', body: formData });
      }

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Failed to save product');

      toast.success(mode === 'create' ? 'Product created' : 'Product updated');
      setDialogOpen(false);
      resetDialogState();
      await fetchProducts();
    } catch (error) {
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
      const response = await fetch(`/api/admin/products?id=${product.id}`, { method: 'DELETE' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Delete failed');
      setProducts((prev) => prev.filter((item) => item.id !== product.id));
      toast.success('Product deleted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  }

  async function toggleFeatured(product: SupabaseProduct, checked: boolean) {
    setFeaturedUpdatingId(product.id);
    try {
      const response = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: product.id, isFeatured: checked }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Failed to update featured status');
      setProducts((prev) => prev.map((item) => (item.id === product.id ? { ...item, is_featured: checked } : item)));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Feature update failed');
    } finally {
      setFeaturedUpdatingId(null);
    }
  }

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const source = product.vendor_id ? 'vendor' : 'admin';
      if (sourceFilter !== 'all' && sourceFilter !== source) return false;
      if (stockFilter === 'in' && !product.in_stock) return false;
      if (stockFilter === 'out' && product.in_stock) return false;
      if (featuredOnly && !product.is_featured) return false;
      if (categoryFilter !== 'all' && product.category !== categoryFilter) return false;

      const haystack = `${product.name} ${stripHtmlForPreview(product.description)} ${product.category} ${product.subcategory} ${product.sub_subcategory}`.toLowerCase();
      if (search.trim() && !haystack.includes(search.trim().toLowerCase())) return false;
      return true;
    });
  }, [products, sourceFilter, stockFilter, featuredOnly, categoryFilter, search]);

  const stats = useMemo(() => {
    return {
      total: products.length,
      admin: products.filter((item) => !item.vendor_id).length,
      vendor: products.filter((item) => Boolean(item.vendor_id)).length,
      featured: products.filter((item) => item.is_featured).length,
    };
  }, [products]);
  const hasTaxonomy = categoryOptions.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Products Management</h2>
          <p className="text-muted-foreground mt-1">
            Manage admin-created and vendor-created products, visibility, taxonomy, and merchandising.
          </p>
        </div>
        <Button onClick={openCreateDialog} disabled={!hasTaxonomy}>
          <Plus className="w-4 h-4 mr-2" />
          Create Product
        </Button>
      </div>
      {!hasTaxonomy && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="py-3 text-sm text-amber-700 dark:text-amber-300">
            No active categories found. Add categories in <Link className="underline" href="/admin/cartegories">/admin/cartegories</Link> before creating products.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50"><CardContent className="pt-4"><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
        <Card className="border-border/50"><CardContent className="pt-4"><p className="text-2xl font-bold">{stats.admin}</p><p className="text-xs text-muted-foreground">Admin-Created</p></CardContent></Card>
        <Card className="border-border/50"><CardContent className="pt-4"><p className="text-2xl font-bold">{stats.vendor}</p><p className="text-xs text-muted-foreground">Vendor-Created</p></CardContent></Card>
        <Card className="border-border/50"><CardContent className="pt-4"><p className="text-2xl font-bold text-amber-500">{stats.featured}</p><p className="text-xs text-muted-foreground">Featured</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Find products quickly by source, taxonomy, status, and keywords.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products..." />
          <Select value={sourceFilter} onValueChange={(value) => setSourceFilter(value as SourceFilter)}>
            <SelectTrigger><SelectValue placeholder="Source" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="vendor">Vendor</SelectItem>
            </SelectContent>
          </Select>
          <Select value={stockFilter} onValueChange={(value) => setStockFilter(value as StockFilter)}>
            <SelectTrigger><SelectValue placeholder="Stock" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stock</SelectItem>
              <SelectItem value="in">In Stock</SelectItem>
              <SelectItem value="out">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categoryOptions.map((category) => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 px-3 border rounded-md">
            <Switch checked={featuredOnly} onCheckedChange={setFeaturedOnly} />
            <span className="text-sm">Featured only</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Product Registry</CardTitle>
          <CardDescription>Comprehensive management of catalog products and merchandising state.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-14 flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading products...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-14 text-center text-muted-foreground">No products matched the current filters.</div>
          ) : (
            <div className="max-md:overflow-x-auto md:overflow-x-visible">
              <table className="w-full table-fixed border-collapse text-sm max-md:min-w-[580px]">
                <colgroup>
                  <col className="w-[34%]" />
                  <col className="w-[12%]" />
                  <col className="w-[22%]" />
                  <col className="w-[9%]" />
                  <col className="w-[14%]" />
                  <col className="w-[9%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2.5 px-2 sm:py-3 sm:px-3">Product</th>
                    <th className="text-left py-2.5 px-2 sm:py-3 sm:px-3">Source</th>
                    <th className="text-left py-2.5 px-2 sm:py-3 sm:px-3">Taxonomy</th>
                    <th className="text-left py-2.5 px-2 sm:py-3 sm:px-3">Price</th>
                    <th className="text-left py-2.5 px-2 sm:py-3 sm:px-3">Featured</th>
                    <th className="text-right py-2.5 px-2 sm:py-3 sm:px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b border-border/40 hover:bg-secondary/40">
                      <td className="min-w-0 py-2.5 px-2 align-top sm:py-3 sm:px-3">
                        <div className="flex min-w-0 items-start gap-2 sm:gap-3">
                          {product.images?.[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={product.images[0]} alt={product.name} className="h-10 w-10 shrink-0 rounded border border-border object-cover" />
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-border bg-secondary">
                              <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{product.name}</p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground sm:text-xs">
                              {stripHtmlForPreview(product.description ?? '').trim() ? 'Has description' : 'No description'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="min-w-0 py-2.5 px-2 align-top sm:py-3 sm:px-3">
                        {product.vendor_id ? (
                          <Badge variant="outline" className="inline-flex max-w-full items-center gap-1 whitespace-nowrap">
                            <User className="h-3 w-3 shrink-0" /> Vendor
                          </Badge>
                        ) : (
                          <Badge className="inline-flex max-w-full items-center gap-1 whitespace-nowrap">
                            <BadgeCheck className="h-3 w-3 shrink-0" /> Admin
                          </Badge>
                        )}
                      </td>
                      <td className="min-w-0 py-2.5 px-2 align-top text-xs sm:py-3 sm:px-3">
                        <p className="break-words leading-snug">{product.category}</p>
                        <p className="break-words leading-snug text-muted-foreground">
                          {product.subcategory} / {product.sub_subcategory}
                        </p>
                      </td>
                      <td className="whitespace-nowrap py-2.5 px-2 align-top sm:py-3 sm:px-3">
                        ${Number(product.price).toFixed(2)}
                      </td>
                      <td className="min-w-0 py-2.5 px-2 align-top sm:py-3 sm:px-3">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <Switch
                            checked={product.is_featured}
                            disabled={featuredUpdatingId === product.id}
                            onCheckedChange={(checked) => toggleFeatured(product, checked)}
                          />
                          <Star className={`h-3.5 w-3.5 shrink-0 ${product.is_featured ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground'}`} />
                        </div>
                      </td>
                      <td className="py-2.5 px-2 align-top sm:py-3 sm:px-3">
                        <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(product)} aria-label={`Edit ${product.name}`}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(product)}
                            disabled={deletingId === product.id}
                            aria-label={`Delete ${product.name}`}
                          >
                            {deletingId === product.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) resetDialogState();
      }}>
        <DialogContent className="w-[92vw] max-w-[92vw] sm:max-w-2xl lg:max-w-3xl h-[88dvh] p-0 gap-0 overflow-hidden border-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, onInvalidSubmit)} className="h-full min-h-0 flex flex-col">
              <DialogHeader className="border-b border-border px-6 py-4">
                <DialogTitle>{mode === 'create' ? 'Create Product' : 'Edit Product'}</DialogTitle>
                <DialogDescription>
                  Fill the fields below to {mode === 'create' ? 'add a new product' : 'update this product'}.
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
                <div className="mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-base font-semibold">Product Information</h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem data-field="name">
                          <FormLabel>Product Name *</FormLabel>
                          <FormControl><Input {...field} placeholder="e.g. Organic Arabica Coffee Beans" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="vendorId" render={({ field }) => (
                        <FormItem data-field="vendorId">
                          <FormLabel>Vendor ID (optional)</FormLabel>
                          <FormControl><Input {...field} placeholder="Leave blank for admin-created products" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="description" render={({ field }) => (
                      <FormItem data-field="description">
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

                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-base font-semibold">Category</h3>
                      <Badge variant="outline" className="max-w-[60%] truncate">{taxonomyPath || 'Select category path'}</Badge>
                    </div>
                    <div className="grid md:grid-cols-3 gap-3">
                      <FormField control={form.control} name="category" render={({ field }) => (
                        <FormItem data-field="category">
                          <FormLabel>Category *</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger></FormControl>
                            <SelectContent>{categoryOptions.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="subcategory" render={({ field }) => (
                        <FormItem data-field="subcategory">
                          <FormLabel>Subcategory (optional)</FormLabel>
                          <Select value={field.value || '__none__'} onValueChange={(value) => field.onChange(value === '__none__' ? '' : value)}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select subcategory (optional)" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="__none__">None</SelectItem>
                              {availableSubcategories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="subSubCategory" render={({ field }) => (
                        <FormItem data-field="subSubCategory">
                          <FormLabel>Sub-Subcategory (optional)</FormLabel>
                          <Select value={field.value || '__none__'} onValueChange={(value) => field.onChange(value === '__none__' ? '' : value)}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select sub-subcategory (optional)" /></SelectTrigger></FormControl>
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

                  <div className="space-y-4">
                    <h3 className="text-base font-semibold">Pricing & Availability</h3>
                    <div className="grid md:grid-cols-3 gap-3">
                      <FormField control={form.control} name="price" render={({ field }) => (
                        <FormItem data-field="price">
                          <FormLabel>Price (USD) *</FormLabel>
                          <FormControl><Input {...field} type="number" step="0.01" min={0} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="minimumOrder" render={({ field }) => (
                        <FormItem data-field="minimumOrder">
                          <FormLabel>Minimum Order *</FormLabel>
                          <FormControl><Input {...field} type="number" step="1" min={1} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="unit" render={({ field }) => (
                        <FormItem data-field="unit">
                          <FormLabel>Unit *</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger></FormControl>
                            <SelectContent>{UNITS.map((unit) => <SelectItem key={unit} value={unit}>{unit}</SelectItem>)}</SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    <div className="flex flex-wrap items-center gap-8 pt-1">
                      <FormField control={form.control} name="inStock" render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                          <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                          <FormLabel className="!mt-0">In Stock</FormLabel>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="isFeatured" render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                          <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                          <FormLabel className="!mt-0">Featured Product</FormLabel>
                        </FormItem>
                      )} />
                    </div>
                  </div>

                  <div className="space-y-3">
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

                  <div className="space-y-3 pb-4">
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
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {mode === 'create' ? 'Creating...' : 'Saving...'}
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
