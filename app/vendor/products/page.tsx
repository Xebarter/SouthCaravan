'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Edit,
  ImageIcon,
  Loader2,
  Package,
  Plus,
  Trash2,
  TrendingUp,
} from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { stripHtmlForPreview } from '@/lib/strip-html';
import { Money } from '@/components/money';
import { useAuth } from '@/lib/auth-context';

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

type Draft = {
  id?: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  subSubCategory: string;
  price: string;
  minimumOrder: string;
  unit: string;
  inStock: boolean;
};

function emptyDraft(category = '', subcategory = '', subSubCategory = ''): Draft {
  return {
    name: '',
    description: '',
    category,
    subcategory,
    subSubCategory,
    price: '0',
    minimumOrder: '1',
    unit: 'piece',
    inStock: true,
  };
}

export default function VendorProductsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [products, setProducts] = useState<SupabaseProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [taxonomyTree, setTaxonomyTree] = useState<TaxonomyTree[]>([]);
  const [draft, setDraft] = useState<Draft>(() => emptyDraft());

  const categoryOptions = useMemo(
    () => taxonomyTree.map((item) => item.name),
    [taxonomyTree],
  );

  const availableSubcategories = useMemo(
    () =>
      taxonomyTree
        .find((item) => item.name === draft.category)
        ?.subcategories.map((sub) => sub.name) ?? [],
    [taxonomyTree, draft.category],
  );

  const availableSubSubcategories = useMemo(
    () =>
      taxonomyTree
        .find((item) => item.name === draft.category)
        ?.subcategories.find((sub) => sub.name === draft.subcategory)
        ?.subSubcategories.map((leaf) => leaf.name) ?? [],
    [taxonomyTree, draft.category, draft.subcategory],
  );

  const taxonomyPath = useMemo(() => {
    const parts = [draft.category, draft.subcategory, draft.subSubCategory].map((v) => (v ?? '').trim()).filter(Boolean);
    return parts.join(' / ');
  }, [draft.category, draft.subcategory, draft.subSubCategory]);

  useEffect(() => {
    if (draft.subcategory && !availableSubcategories.includes(draft.subcategory)) {
      setDraft((prev) => ({ ...prev, subcategory: '', subSubCategory: '' }));
    }
  }, [availableSubcategories, draft.subcategory]);

  useEffect(() => {
    if (draft.subSubCategory && !availableSubSubcategories.includes(draft.subSubCategory)) {
      setDraft((prev) => ({ ...prev, subSubCategory: '' }));
    }
  }, [availableSubSubcategories, draft.subSubCategory]);

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

  function openCreate() {
    const cat = categoryOptions[0] ?? '';
    const sub = taxonomyTree.find((i) => i.name === cat)?.subcategories[0]?.name ?? '';
    const leaf =
      taxonomyTree
        .find((i) => i.name === cat)
        ?.subcategories.find((s) => s.name === sub)
        ?.subSubcategories[0]?.name ?? '';
    setDraft(emptyDraft(cat, sub, leaf));
    setMode('create');
    setDialogOpen(true);
  }

  function openEdit(product: SupabaseProduct) {
    setDraft({
      id: product.id,
      name: product.name ?? '',
      description: product.description ?? '',
      category: product.category ?? '',
      subcategory: product.subcategory ?? '',
      subSubCategory: product.sub_subcategory ?? '',
      price: String(product.price ?? 0),
      minimumOrder: String(product.minimum_order ?? 1),
      unit: product.unit ?? 'piece',
      inStock: Boolean(product.in_stock),
    });
    setMode('edit');
    setDialogOpen(true);
  }

  async function saveDraft() {
    const name = draft.name.trim();
    const category = draft.category.trim();
    if (!name) { toast.error('Product name is required'); return; }
    if (!category) { toast.error('Category is required'); return; }
    const price = Number(draft.price);
    const minimumOrder = Number(draft.minimumOrder);
    if (!Number.isFinite(price) || price < 0) { toast.error('Price must be 0 or more'); return; }
    if (!Number.isFinite(minimumOrder) || minimumOrder < 1) { toast.error('Minimum order must be at least 1'); return; }

    setSaving(true);
    try {
      const body = {
        ...(mode === 'edit' ? { id: draft.id } : {}),
        name,
        description: draft.description,
        category: draft.category,
        subcategory: draft.subcategory,
        subSubCategory: draft.subSubCategory,
        price,
        minimumOrder,
        unit: draft.unit,
        inStock: draft.inStock,
      };
      const res = await fetch('/api/vendor/products', {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Save failed');
      toast.success(mode === 'create' ? 'Product created' : 'Product updated');
      setDialogOpen(false);
      await fetchProducts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
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
            { label: 'Total products', value: stats.total,    color: 'bg-blue-500',   icon: Package },
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
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!saving) setDialogOpen(open); }}>
        <DialogContent className="w-[92vw] max-w-[92vw] sm:max-w-2xl lg:max-w-3xl h-[88dvh] p-0 gap-0 overflow-hidden rounded-2xl border shadow-xl">
          <div className="h-full min-h-0 flex flex-col">
            <DialogHeader className="border-b border-border px-6 py-4 bg-background/95 backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <DialogTitle className="text-xl">{mode === 'create' ? 'Add product' : 'Edit product'}</DialogTitle>
                  <DialogDescription className="mt-1">
                    {mode === 'create'
                      ? 'Create a new product listing with pricing and taxonomy.'
                      : 'Update this product’s details and availability.'}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
              <div className="mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
                <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-4">
                  <h3 className="text-base font-semibold">Product information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5 min-w-0">
                      <Label htmlFor="dp-name" className="text-sm">
                        Product name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="dp-name"
                        value={draft.name}
                        onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. Stainless Steel Ball Bearings"
                      />
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <Label htmlFor="dp-unit" className="text-sm">Unit</Label>
                      <Input
                        id="dp-unit"
                        value={draft.unit}
                        onChange={(e) => setDraft((prev) => ({ ...prev, unit: e.target.value }))}
                        placeholder="piece"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 min-w-0">
                    <Label htmlFor="dp-desc" className="text-sm">
                      Description
                    </Label>
                    <Input
                      id="dp-desc"
                      value={draft.description}
                      onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description shown in listings"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                    <h3 className="text-base font-semibold">Category</h3>
                    <Badge variant="outline" className="w-full sm:w-auto sm:max-w-[60%] truncate">
                      {taxonomyPath || 'Select category path'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1.5 min-w-0">
                      <Label className="text-sm">
                        Category <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={draft.category || '__none__'}
                        onValueChange={(v) =>
                          setDraft((prev) => ({
                            ...prev,
                            category: v === '__none__' ? '' : v,
                            subcategory: '',
                            subSubCategory: '',
                          }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Select…</SelectItem>
                          {categoryOptions.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5 min-w-0">
                      <Label className="text-sm">Subcategory (optional)</Label>
                      <Select
                        value={draft.subcategory || '__none__'}
                        onValueChange={(v) =>
                          setDraft((prev) => ({
                            ...prev,
                            subcategory: v === '__none__' ? '' : v,
                            subSubCategory: '',
                          }))
                        }
                        disabled={!draft.category || availableSubcategories.length === 0}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select subcategory (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">None</SelectItem>
                          {availableSubcategories.map((sub) => (
                            <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5 min-w-0">
                      <Label className="text-sm">Sub-Subcategory (optional)</Label>
                      <Select
                        value={draft.subSubCategory || '__none__'}
                        onValueChange={(v) =>
                          setDraft((prev) => ({
                            ...prev,
                            subSubCategory: v === '__none__' ? '' : v,
                          }))
                        }
                        disabled={!draft.subcategory || availableSubSubcategories.length === 0}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select sub-subcategory (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">None</SelectItem>
                          {availableSubSubcategories.map((leaf) => (
                            <SelectItem key={leaf} value={leaf}>{leaf}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-4">
                  <h3 className="text-base font-semibold">Pricing & availability</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1.5 min-w-0">
                      <Label htmlFor="dp-price" className="text-sm">
                        Base price (USD) <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="dp-price"
                        type="number"
                        step="0.01"
                        min={0}
                        value={draft.price}
                        onChange={(e) => setDraft((prev) => ({ ...prev, price: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <Label htmlFor="dp-min-order" className="text-sm">
                        Minimum order <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="dp-min-order"
                        type="number"
                        step="1"
                        min={1}
                        value={draft.minimumOrder}
                        onChange={(e) => setDraft((prev) => ({ ...prev, minimumOrder: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <Label className="text-sm">In stock</Label>
                      <div className="flex items-center justify-between rounded-lg border border-border px-4 py-2.5">
                        <p className="text-sm text-muted-foreground">Available to buyers</p>
                        <Switch
                          checked={draft.inStock}
                          onCheckedChange={(v) => setDraft((prev) => ({ ...prev, inStock: v }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-border bg-background/95 backdrop-blur px-6 py-3">
              <div className="max-w-5xl mx-auto w-full flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={saveDraft} disabled={saving} className="min-w-32">
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving…
                    </>
                  ) : mode === 'create' ? (
                    'Create Product'
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
