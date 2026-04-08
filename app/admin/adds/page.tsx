'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Loader2, Megaphone, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

export default function AdminAddsPage() {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [adds, setAdds] = useState<EditableAdd[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
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
      toast.success('Ad removed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete ad');
    } finally {
      setDeletingId(null);
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

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Adds Management</h2>
          <Badge variant="secondary" className="text-xs">
            Homepage Carousel
          </Badge>
        </div>
        <p className="text-sm sm:text-base text-muted-foreground">
          Configure sponsored product cards shown in a small carousel above Featured Marketplace Picks.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Adds</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-amber-600">{stats.inactive}</p>
            <p className="text-xs text-muted-foreground">Inactive</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{stats.availableProducts}</p>
            <p className="text-xs text-muted-foreground">Products Available</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Ad Slot</CardTitle>
          <CardDescription>Select a product and set the ad copy for the homepage carousel.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-12">
          <div className="space-y-2 md:col-span-2 xl:col-span-5">
            <p className="text-sm font-medium">Product</p>
            <Popover open={productPickerOpen} onOpenChange={setProductPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={productPickerOpen}
                  className="h-10 w-full justify-between font-normal"
                >
                  <span className="truncate text-left">
                    {selectedProduct ? (
                      <>
                        <span>{selectedProduct.name} - </span>
                        <Money amountUSD={Number(selectedProduct.price)} />
                      </>
                    ) : (
                      'Search and select product'
                    )}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Search product by name..."
                    value={productSearch}
                    onValueChange={setProductSearch}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {availableProducts.length === 0 ? 'No products available.' : 'No product found.'}
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
                            <p className="truncate">{product.name}</p>
                            <p className="text-xs text-muted-foreground">
                              <Money amountUSD={Number(product.price)} /> - {product.in_stock ? 'In stock' : 'Out of stock'}
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
          <div className="space-y-2 xl:col-span-3">
            <p className="text-sm font-medium">Headline</p>
            <Input
              placeholder="Sponsored"
              value={newHeadline}
              onChange={(event) => setNewHeadline(event.target.value)}
            />
          </div>
          <div className="space-y-2 xl:col-span-2">
            <p className="text-sm font-medium">CTA Label</p>
            <Input
              placeholder="Shop now"
              value={newCtaLabel}
              onChange={(event) => setNewCtaLabel(event.target.value)}
            />
          </div>
          <div className="space-y-2 xl:col-span-1">
            <p className="text-sm font-medium">Order</p>
            <Input
              type="number"
              value={newSortOrder}
              onChange={(event) => setNewSortOrder(Number(event.target.value) || 0)}
            />
          </div>
          <div className="space-y-2 md:col-span-2 xl:col-span-5">
            <p className="text-sm font-medium">Ad Banner (required)</p>
            <Input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(event) => onCreateBannerChange(event.target.files?.[0] ?? null)}
            />
            {newBannerPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={newBannerPreview} alt="New ad banner preview" className="w-full h-24 rounded-md object-cover border border-border" />
            ) : (
              <p className="text-xs text-muted-foreground">
                Upload a banner that spans full width of the ad card.
              </p>
            )}
          </div>
          <div className="md:col-span-2 xl:col-span-1 flex items-end">
            <Button className="w-full" onClick={createAdd} disabled={creating || !selectedProductId || !newBannerFile}>
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
              Create Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sponsored Slots</CardTitle>
          <CardDescription>These cards rotate in the homepage sponsored carousel.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="py-8 text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading adds...
            </div>
          ) : adds.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No sponsored slots created yet.</div>
          ) : (
            adds.map((item) => (
              <div key={item.id} className="rounded-lg border border-border bg-card p-4 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    {replacementBanners[item.id]?.preview || item.banner_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={replacementBanners[item.id]?.preview || item.banner_image_url}
                        alt={item.products?.name ?? 'Ad banner'}
                        className="h-16 w-24 rounded-md object-cover border border-border"
                      />
                    ) : (
                      <div className="h-16 w-24 rounded-md border border-border bg-secondary flex items-center justify-center">
                        <Megaphone className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0 space-y-1">
                      <p className="font-medium line-clamp-1">{item.products?.name ?? 'Unknown product'}</p>
                      <p className="text-xs text-muted-foreground">
                        <Money amountUSD={Number(item.products?.price ?? 0)} /> - {item.products?.category ?? 'No category'}
                      </p>
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant={item.draftIsActive ? 'default' : 'outline'}>
                          {item.draftIsActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <span className="text-muted-foreground">Slot #{item.draftSortOrder}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {editingId === item.id ? (
                      <>
                        <Button
                          variant={hasDraftChanges(item) ? 'default' : 'outline'}
                          size="sm"
                          onClick={async () => {
                            const saved = await saveAdd(item);
                            if (saved) setEditingId(null);
                          }}
                          disabled={
                            savingId === item.id || deletingId === item.id || !hasDraftChanges(item)
                          }
                        >
                          {savingId === item.id ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => cancelEdit(item.id)}
                          disabled={savingId === item.id}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingId(item.id)}
                        disabled={savingId === item.id || deletingId === item.id}
                      >
                        Edit
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeAdd(item.id)}
                      disabled={deletingId === item.id}
                    >
                      {deletingId === item.id ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Trash2 className="w-4 h-4 mr-1" />}
                      <span className="inline">Delete</span>
                    </Button>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-12">
                  <div className="space-y-2 lg:col-span-4">
                    <p className="text-xs text-muted-foreground">Product</p>
                    <Select
                      value={item.draftProductId}
                      onValueChange={(value) => updateAddDraft(item.id, { draftProductId: value })}
                      disabled={editingId !== item.id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products
                          .filter((product) => {
                            if (product.id === item.draftProductId) return true;
                            return !adds.some(
                              (entry) => entry.id !== item.id && entry.draftProductId === product.id,
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
                  <div className="space-y-2 lg:col-span-3">
                    <p className="text-xs text-muted-foreground">Headline</p>
                    <Input
                      value={item.draftHeadline}
                      onChange={(event) => updateAddDraft(item.id, { draftHeadline: event.target.value })}
                      placeholder="Sponsored"
                      disabled={editingId !== item.id}
                    />
                  </div>
                  <div className="space-y-2 lg:col-span-2">
                    <p className="text-xs text-muted-foreground">CTA Label</p>
                    <Input
                      value={item.draftCtaLabel}
                      onChange={(event) => updateAddDraft(item.id, { draftCtaLabel: event.target.value })}
                      placeholder="Shop now"
                      disabled={editingId !== item.id}
                    />
                  </div>
                  <div className="space-y-2 lg:col-span-1">
                    <p className="text-xs text-muted-foreground">Order</p>
                    <Input
                      type="number"
                      value={item.draftSortOrder}
                      onChange={(event) => updateAddDraft(item.id, { draftSortOrder: Number(event.target.value) || 0 })}
                      disabled={editingId !== item.id}
                    />
                  </div>
                  <div className="space-y-2 lg:col-span-2">
                    <p className="text-xs text-muted-foreground">Visibility</p>
                    <div className="flex items-center justify-between rounded-md border px-3 h-10">
                      <span className="text-sm">Active</span>
                      <Switch
                        checked={item.draftIsActive}
                        onCheckedChange={(checked) => updateAddDraft(item.id, { draftIsActive: checked })}
                        disabled={editingId !== item.id}
                      />
                    </div>
                  </div>
                  <div className="space-y-2 lg:col-span-4">
                    <p className="text-xs text-muted-foreground">Replace Banner (optional)</p>
                    <Input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={(event) => onReplacementBannerChange(item.id, event.target.files?.[0] ?? null)}
                      disabled={editingId !== item.id}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
