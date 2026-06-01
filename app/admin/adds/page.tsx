'use client';

import { useEffect, useMemo, useState, type ElementType } from 'react';
import {
  Check,
  ChevronsUpDown,
  ImageIcon,
  LayoutGrid,
  Loader2,
  Megaphone,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  Upload,
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
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Money } from '@/components/money';

type ProductOption = {
  id: string;
  name: string;
  price: number;
  in_stock: boolean;
};

type ManagedAdd = {
  id: string;
  product_id: string;
  banner_image_url: string;
  headline: string;
  cta_label: string;
  is_active: boolean;
  sort_order: number;
  products: {
    id: string;
    name: string;
    price: number;
    category: string;
    in_stock: boolean;
    images: string[];
  } | null;
};

type EditableAdd = ManagedAdd & {
  draftProductId: string;
  draftHeadline: string;
  draftCtaLabel: string;
  draftSortOrder: number;
  draftIsActive: boolean;
};

function toEditable(items: ManagedAdd[]): EditableAdd[] {
  return items.map((item) => ({
    ...item,
    draftProductId: item.product_id,
    draftHeadline: item.headline ?? '',
    draftCtaLabel: item.cta_label ?? 'Shop now',
    draftSortOrder: Number(item.sort_order) || 0,
    draftIsActive: Boolean(item.is_active),
  }));
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  loading,
  accent = 'primary',
}: {
  label: string;
  value: React.ReactNode;
  hint: string;
  icon: ElementType;
  loading?: boolean;
  accent?: 'primary' | 'emerald' | 'amber' | 'violet';
}) {
  const accentMap = {
    primary: 'bg-primary/10 text-primary ring-primary/15',
    emerald: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/15 dark:text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-600 ring-amber-500/15 dark:text-amber-400',
    violet: 'bg-violet-500/10 text-violet-600 ring-violet-500/15 dark:text-violet-400',
  };

  return (
    <Card className="rounded-2xl border-border/70 bg-card/80 shadow-sm backdrop-blur">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-medium tracking-wide text-muted-foreground">{label}</p>
          <span
            className={cn(
              'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ring-1',
              accentMap[accent],
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
        </div>
        {loading ? (
          <Skeleton className="mt-3 h-8 w-16 rounded-lg" />
        ) : (
          <div className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
            {value}
          </div>
        )}
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

function BannerUploadField({
  id,
  label,
  hint,
  previewUrl,
  onFileChange,
  disabled,
}: {
  id: string;
  label: string;
  hint: string;
  previewUrl?: string;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <label
        htmlFor={id}
        className={cn(
          'flex min-h-[7.5rem] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-5 text-center transition-colors hover:bg-muted/40',
          disabled && 'pointer-events-none opacity-60',
          previewUrl && 'border-primary/30 bg-primary/5',
        )}
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="" className="max-h-28 w-full rounded-lg object-cover" />
        ) : (
          <>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-background ring-1 ring-border/60">
              <Upload className="h-4 w-4 text-muted-foreground" />
            </span>
            <span className="text-sm font-medium text-foreground">Click to upload banner</span>
            <span className="text-xs text-muted-foreground">{hint}</span>
          </>
        )}
      </label>
      <Input
        id={id}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="sr-only"
        disabled={disabled}
        onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
      />
      {previewUrl ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 text-xs"
          disabled={disabled}
          onClick={() => onFileChange(null)}
        >
          Remove image
        </Button>
      ) : null}
    </div>
  );
}

export default function AdminAddsPage() {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [adds, setAdds] = useState<EditableAdd[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [newHeadline, setNewHeadline] = useState('');
  const [newCtaLabel, setNewCtaLabel] = useState('Shop now');
  const [newSortOrder, setNewSortOrder] = useState(0);
  const [newBannerFile, setNewBannerFile] = useState<File | null>(null);
  const [newBannerPreview, setNewBannerPreview] = useState('');
  const [replacementBanners, setReplacementBanners] = useState<Record<string, { file: File; preview: string }>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const [productsRes, addsRes] = await Promise.all([
        fetch('/api/admin/products'),
        fetch('/api/admin/adds'),
      ]);

      const productsPayload = await productsRes.json();
      const addsPayload = await addsRes.json();
      if (!productsRes.ok) throw new Error(productsPayload.error ?? 'Failed to load products');
      if (!addsRes.ok) throw new Error(addsPayload.error ?? 'Failed to load adds');

      setProducts((productsPayload.products ?? []) as ProductOption[]);
      setAdds(toEditable((addsPayload.adds ?? []) as ManagedAdd[]));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load ads data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const availableProducts = useMemo(() => {
    const used = new Set(adds.map((item) => item.product_id));
    return products.filter((product) => !used.has(product.id));
  }, [adds, products]);

  const stats = useMemo(() => {
    const active = adds.filter((item) => item.draftIsActive).length;
    return {
      total: adds.length,
      active,
      inactive: adds.length - active,
      availableProducts: availableProducts.length,
    };
  }, [adds, availableProducts.length]);

  const selectedProduct = useMemo(
    () => availableProducts.find((product) => product.id === selectedProductId) ?? null,
    [availableProducts, selectedProductId],
  );

  const filteredAvailableProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    if (!query) return availableProducts;
    return availableProducts.filter((product) =>
      `${product.name} ${product.id}`.toLowerCase().includes(query),
    );
  }, [availableProducts, productSearch]);

  async function createAdd() {
    if (!selectedProductId) {
      toast.error('Select a product first');
      return;
    }
    if (!newBannerFile) {
      toast.error('Upload a banner image for the ad');
      return;
    }

    setCreating(true);
    try {
      const formData = new FormData();
      formData.append('productId', selectedProductId);
      formData.append('headline', newHeadline);
      formData.append('ctaLabel', newCtaLabel);
      formData.append('sortOrder', String(newSortOrder));
      formData.append('isActive', 'true');
      formData.append('banner', newBannerFile);

      const response = await fetch('/api/admin/adds', {
        method: 'POST',
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Failed to create ad slot');
      setAdds((prev) => toEditable([payload.add as ManagedAdd, ...prev]));
      setSelectedProductId('');
      setNewHeadline('');
      setNewCtaLabel('Shop now');
      setNewSortOrder(0);
      setNewBannerFile(null);
      setNewBannerPreview('');
      toast.success('Ad slot created');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create ad slot');
    } finally {
      setCreating(false);
    }
  }

  async function saveAdd(item: EditableAdd): Promise<boolean> {
    setSavingId(item.id);
    try {
      const formData = new FormData();
      formData.append('id', item.id);
      formData.append('productId', item.draftProductId);
      formData.append('headline', item.draftHeadline);
      formData.append('ctaLabel', item.draftCtaLabel);
      formData.append('sortOrder', String(item.draftSortOrder));
      formData.append('isActive', String(item.draftIsActive));
      const replacementBanner = replacementBanners[item.id];
      if (replacementBanner) {
        formData.append('banner', replacementBanner.file);
      }

      const response = await fetch('/api/admin/adds', {
        method: 'PATCH',
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Failed to save ad');
      const saved = payload.add as ManagedAdd;
      setAdds((prev) => prev.map((entry) => (entry.id === saved.id ? toEditable([saved])[0] : entry)));
      setReplacementBanners((prev) => {
        const next = { ...prev };
        if (next[item.id]?.preview) URL.revokeObjectURL(next[item.id].preview);
        delete next[item.id];
        return next;
      });
      toast.success('Ad updated');
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save ad');
      return false;
    } finally {
      setSavingId(null);
    }
  }

  async function removeAdd(id: string) {
    setDeletingId(id);
    try {
      const response = await fetch(`/api/admin/adds?id=${id}`, { method: 'DELETE' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Failed to delete ad');
      setAdds((prev) => prev.filter((item) => item.id !== id));
      if (editingId === id) setEditingId(null);
      toast.success('Ad removed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete ad');
    } finally {
      setDeletingId(null);
      setDeleteTargetId(null);
    }
  }

  function updateAddDraft(id: string, patch: Partial<EditableAdd>) {
    setAdds((prev) => prev.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  }

  function onCreateBannerChange(file: File | null) {
    if (newBannerPreview) URL.revokeObjectURL(newBannerPreview);
    if (!file) {
      setNewBannerFile(null);
      setNewBannerPreview('');
      return;
    }
    setNewBannerFile(file);
    setNewBannerPreview(URL.createObjectURL(file));
  }

  function onReplacementBannerChange(id: string, file: File | null) {
    setReplacementBanners((prev) => {
      const current = prev[id];
      if (current?.preview) URL.revokeObjectURL(current.preview);
      if (!file) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return {
        ...prev,
        [id]: { file, preview: URL.createObjectURL(file) },
      };
    });
  }

  function hasDraftChanges(item: EditableAdd) {
    return (
      item.draftProductId !== item.product_id ||
      item.draftHeadline !== (item.headline ?? '') ||
      item.draftCtaLabel !== (item.cta_label ?? 'Shop now') ||
      item.draftSortOrder !== (Number(item.sort_order) || 0) ||
      item.draftIsActive !== Boolean(item.is_active) ||
      Boolean(replacementBanners[item.id])
    );
  }

  function cancelEdit(id: string) {
    setAdds((prev) =>
      prev.map((entry) => {
        if (entry.id !== id) return entry;
        return {
          ...entry,
          draftProductId: entry.product_id,
          draftHeadline: entry.headline ?? '',
          draftCtaLabel: entry.cta_label ?? 'Shop now',
          draftSortOrder: Number(entry.sort_order) || 0,
          draftIsActive: Boolean(entry.is_active),
        };
      }),
    );
    setReplacementBanners((prev) => {
      const current = prev[id];
      if (current?.preview) URL.revokeObjectURL(current.preview);
      if (!current) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setEditingId((current) => (current === id ? null : current));
  }

  const deleteTarget = adds.find((a) => a.id === deleteTargetId);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-muted-foreground">Admin console</p>
          <h1 className="mt-1 flex flex-wrap items-center gap-2.5 text-2xl font-semibold tracking-tight md:text-3xl">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
              <Megaphone className="h-5 w-5" />
            </span>
            Sponsored ads
            <Badge variant="secondary" className="rounded-full text-xs font-medium">
              Homepage carousel
            </Badge>
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Configure product promos shown in the carousel above Featured Marketplace Picks. Each slot links to one
            product with a custom banner and CTA.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 rounded-xl"
          onClick={() => loadData()}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total slots"
          value={stats.total}
          hint="Sponsored placements configured"
          icon={LayoutGrid}
          loading={loading}
          accent="primary"
        />
        <StatCard
          label="Live on homepage"
          value={stats.active}
          hint="Currently visible in carousel"
          icon={Sparkles}
          loading={loading}
          accent="emerald"
        />
        <StatCard
          label="Inactive"
          value={stats.inactive}
          hint="Hidden until re-enabled"
          icon={Megaphone}
          loading={loading}
          accent="amber"
        />
        <StatCard
          label="Products available"
          value={stats.availableProducts}
          hint="Not yet assigned to a slot"
          icon={ImageIcon}
          loading={loading}
          accent="violet"
        />
      </div>

      {/* Create */}
      <Card className="overflow-hidden rounded-2xl border-border/70 bg-card/80 shadow-sm">
        <CardHeader className="border-b border-border/60 bg-muted/20">
          <CardTitle className="text-base">Create ad slot</CardTitle>
          <CardDescription>
            Pick a product, upload a wide banner image, and set copy for the sponsored card.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 p-5 sm:p-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Product</Label>
              <Popover open={productPickerOpen} onOpenChange={setProductPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={productPickerOpen}
                    className="h-11 w-full justify-between rounded-xl font-normal"
                  >
                    <span className="truncate text-left">
                      {selectedProduct ? (
                        <>
                          {selectedProduct.name}
                          <span className="text-muted-foreground">
                            {' '}
                            · <Money amountUSD={Number(selectedProduct.price)} />
                          </span>
                        </>
                      ) : (
                        'Search and select product'
                      )}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Search by product name…"
                      value={productSearch}
                      onValueChange={setProductSearch}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {availableProducts.length === 0
                          ? 'All products already have a slot.'
                          : 'No product found.'}
                      </CommandEmpty>
                      <CommandGroup>
                        {filteredAvailableProducts.map((product) => (
                          <CommandItem
                            key={product.id}
                            value={`${product.name} ${product.id}`}
                            onSelect={() => {
                              setSelectedProductId(product.id);
                              setProductSearch('');
                              setProductPickerOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                selectedProductId === product.id ? 'opacity-100' : 'opacity-0',
                              )}
                            />
                            <div className="min-w-0">
                              <p className="truncate font-medium">{product.name}</p>
                              <p className="text-xs text-muted-foreground">
                                <Money amountUSD={Number(product.price)} /> ·{' '}
                                {product.in_stock ? 'In stock' : 'Out of stock'}
                              </p>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="new-headline" className="text-sm font-medium">
                  Headline
                </Label>
                <Input
                  id="new-headline"
                  className="rounded-xl"
                  placeholder="Sponsored"
                  value={newHeadline}
                  onChange={(e) => setNewHeadline(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-order" className="text-sm font-medium">
                  Sort order
                </Label>
                <Input
                  id="new-order"
                  type="number"
                  className="rounded-xl"
                  value={newSortOrder}
                  onChange={(e) => setNewSortOrder(Number(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-cta" className="text-sm font-medium">
                CTA label
              </Label>
              <Input
                id="new-cta"
                className="rounded-xl"
                placeholder="Shop now"
                value={newCtaLabel}
                onChange={(e) => setNewCtaLabel(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <BannerUploadField
              id="new-banner"
              label="Banner image"
              hint="PNG, JPEG, WebP or GIF · wide aspect works best"
              previewUrl={newBannerPreview}
              onFileChange={onCreateBannerChange}
            />
            <Button
              className="mt-auto w-full rounded-xl"
              onClick={createAdd}
              disabled={creating || !selectedProductId || !newBannerFile}
            >
              {creating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Create ad slot
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Slots list */}
      <Card className="overflow-hidden rounded-2xl border-border/70 bg-card/80 shadow-sm">
        <CardHeader className="border-b border-border/60 bg-muted/20">
          <CardTitle className="text-base">Active slots</CardTitle>
          <CardDescription>
            {loading
              ? 'Loading…'
              : `${adds.length} sponsored card${adds.length === 1 ? '' : 's'} · sorted by display order`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {loading ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="space-y-3 rounded-2xl border border-border/60 p-4">
                  <Skeleton className="aspect-[2.4/1] w-full rounded-xl" />
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : adds.length === 0 ? (
            <Empty className="border border-dashed border-border/70 bg-muted/15 py-14">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Megaphone />
                </EmptyMedia>
                <EmptyTitle>No sponsored slots yet</EmptyTitle>
                <EmptyDescription>
                  Create your first ad above to show a product in the homepage carousel.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {adds.map((item) => {
                const bannerSrc = replacementBanners[item.id]?.preview || item.banner_image_url;
                const isEditing = editingId === item.id;
                const productName = item.products?.name ?? 'Unknown product';

                return (
                  <article
                    key={item.id}
                    className={cn(
                      'overflow-hidden rounded-2xl border bg-card transition-shadow',
                      isEditing
                        ? 'border-primary/40 ring-2 ring-primary/15 shadow-md'
                        : 'border-border/70 shadow-sm hover:shadow-md',
                    )}
                  >
                    <div className="relative aspect-[2.2/1] w-full bg-muted/40">
                      {bannerSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={bannerSrc}
                          alt={`${productName} banner`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                          <Megaphone className="h-8 w-8 opacity-40" />
                        </div>
                      )}
                      <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                        <Badge
                          className={cn(
                            'rounded-full shadow-sm',
                            item.draftIsActive
                              ? 'bg-emerald-600/90 text-white hover:bg-emerald-600/90'
                              : 'bg-background/90 text-foreground',
                          )}
                        >
                          {item.draftIsActive ? 'Live' : 'Hidden'}
                        </Badge>
                        <Badge variant="secondary" className="rounded-full bg-background/90 shadow-sm">
                          Order {item.draftSortOrder}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-4 p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate font-semibold text-foreground">{productName}</h3>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            <Money amountUSD={Number(item.products?.price ?? 0)} />
                            {item.products?.category ? (
                              <span> · {item.products.category}</span>
                            ) : null}
                          </p>
                          {(item.draftHeadline || item.draftCtaLabel) && !isEditing ? (
                            <p className="mt-2 text-xs text-muted-foreground">
                              {item.draftHeadline ? (
                                <span className="font-medium text-foreground/80">{item.draftHeadline}</span>
                              ) : null}
                              {item.draftHeadline && item.draftCtaLabel ? ' · ' : null}
                              CTA: {item.draftCtaLabel || 'Shop now'}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 gap-1.5">
                          {isEditing ? (
                            <>
                              <Button
                                size="sm"
                                className="h-8 rounded-lg"
                                onClick={async () => {
                                  const saved = await saveAdd(item);
                                  if (saved) setEditingId(null);
                                }}
                                disabled={
                                  savingId === item.id ||
                                  deletingId === item.id ||
                                  !hasDraftChanges(item)
                                }
                              >
                                {savingId === item.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  'Save'
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 rounded-lg"
                                onClick={() => cancelEdit(item.id)}
                                disabled={savingId === item.id}
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 rounded-lg"
                              onClick={() => setEditingId(item.id)}
                              disabled={savingId === item.id || deletingId === item.id}
                            >
                              Edit
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-lg text-destructive hover:text-destructive"
                            onClick={() => setDeleteTargetId(item.id)}
                            disabled={deletingId === item.id}
                          >
                            {deletingId === item.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="grid gap-3 border-t border-border/60 pt-4 sm:grid-cols-2">
                          <div className="space-y-2 sm:col-span-2">
                            <Label className="text-xs text-muted-foreground">Product</Label>
                            <Select
                              value={item.draftProductId}
                              onValueChange={(value) => updateAddDraft(item.id, { draftProductId: value })}
                            >
                              <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder="Select product" />
                              </SelectTrigger>
                              <SelectContent>
                                {products
                                  .filter((product) => {
                                    if (product.id === item.draftProductId) return true;
                                    return !adds.some(
                                      (entry) =>
                                        entry.id !== item.id && entry.draftProductId === product.id,
                                    );
                                  })
                                  .map((product) => (
                                    <SelectItem key={product.id} value={product.id}>
                                      {product.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Headline</Label>
                            <Input
                              className="rounded-xl"
                              value={item.draftHeadline}
                              onChange={(e) =>
                                updateAddDraft(item.id, { draftHeadline: e.target.value })
                              }
                              placeholder="Sponsored"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">CTA label</Label>
                            <Input
                              className="rounded-xl"
                              value={item.draftCtaLabel}
                              onChange={(e) =>
                                updateAddDraft(item.id, { draftCtaLabel: e.target.value })
                              }
                              placeholder="Shop now"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Sort order</Label>
                            <Input
                              type="number"
                              className="rounded-xl"
                              value={item.draftSortOrder}
                              onChange={(e) =>
                                updateAddDraft(item.id, {
                                  draftSortOrder: Number(e.target.value) || 0,
                                })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Visibility</Label>
                            <div className="flex h-10 items-center justify-between rounded-xl border border-border/70 px-3">
                              <span className="text-sm">Active on homepage</span>
                              <Switch
                                checked={item.draftIsActive}
                                onCheckedChange={(checked) =>
                                  updateAddDraft(item.id, { draftIsActive: checked })
                                }
                              />
                            </div>
                          </div>
                          <div className="space-y-2 sm:col-span-2">
                            <BannerUploadField
                              id={`replace-banner-${item.id}`}
                              label="Replace banner (optional)"
                              hint="Leave empty to keep current image"
                              previewUrl={replacementBanners[item.id]?.preview}
                              onFileChange={(file) => onReplacementBannerChange(item.id, file)}
                            />
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTargetId} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove sponsored slot?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes the ad for{' '}
              <span className="font-medium text-foreground">
                {deleteTarget?.products?.name ?? 'this product'}
              </span>{' '}
              and removes its banner from storage. The product listing is not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingId}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={!!deletingId}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                if (deleteTargetId) void removeAdd(deleteTargetId);
              }}
            >
              {deletingId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete slot
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
