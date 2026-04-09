'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { MoreVertical, Plus, Edit, Trash2 } from 'lucide-react';
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
  const categoryOptions = useMemo(() => taxonomyTree.map((item) => item.name), [taxonomyTree]);

  const [draft, setDraft] = useState<Draft>(() => emptyDraft());

  const availableSubcategories = useMemo(
    () => taxonomyTree.find((item) => item.name === draft.category)?.subcategories.map((sub) => sub.name) ?? [],
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

  useEffect(() => {
    // Keep draft values consistent when taxonomy changes.
    if (draft.subcategory && !availableSubcategories.includes(draft.subcategory)) {
      setDraft((prev) => ({ ...prev, subcategory: '', subSubCategory: '' }));
    }
    if (draft.subSubCategory && !availableSubSubcategories.includes(draft.subSubCategory)) {
      setDraft((prev) => ({ ...prev, subSubCategory: '' }));
    }
  }, [availableSubcategories, availableSubSubcategories, draft.subcategory, draft.subSubCategory]);

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

  async function fetchProducts() {
    setLoading(true);
    try {
      const response = await fetch('/api/vendor/products');
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Failed to fetch products');
      setProducts(payload.products ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load products');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    fetchTaxonomy();
    fetchProducts();
  }, [authLoading, user]);

  const stats = useMemo(() => {
    const total = products.length;
    const inStock = products.filter((p) => p.in_stock).length;
    const outOfStock = total - inStock;
    const totalValue = products.reduce((sum, p) => sum + Number(p.price ?? 0), 0);
    return { total, inStock, outOfStock, totalValue };
  }, [products]);

  function openCreateDialog() {
    const cat = categoryOptions[0] ?? '';
    const sub = taxonomyTree.find((item) => item.name === cat)?.subcategories[0]?.name ?? '';
    const leaf =
      taxonomyTree
        .find((item) => item.name === cat)
        ?.subcategories.find((s) => s.name === sub)
        ?.subSubcategories[0]?.name ?? '';

    setDraft(emptyDraft(cat, sub, leaf));
    setMode('create');
    setDialogOpen(true);
  }

  function openEditDialog(product: SupabaseProduct) {
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
    if (!name) {
      toast.error('Product name is required');
      return;
    }
    if (!category) {
      toast.error('Category is required');
      return;
    }

    const price = Number(draft.price);
    const minimumOrder = Number(draft.minimumOrder);
    if (!Number.isFinite(price) || price < 0) {
      toast.error('Price must be 0 or more');
      return;
    }
    if (!Number.isFinite(minimumOrder) || minimumOrder < 1) {
      toast.error('Minimum order must be at least 1');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...(mode === 'edit' ? { id: draft.id } : null),
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

      const response = await fetch('/api/vendor/products', {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? 'Save failed');

      toast.success(mode === 'create' ? 'Product created' : 'Product updated');
      setDialogOpen(false);
      await fetchProducts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product: SupabaseProduct) {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    setDeletingId(product.id);
    try {
      const response = await fetch(`/api/vendor/products?id=${product.id}`, { method: 'DELETE' });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? 'Delete failed');
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      toast.success('Product deleted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  }

  if (authLoading) return null;
  if (!user) return null;

  return (
    <main className="flex-1 overflow-auto">
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Product Catalog</h1>
            <p className="text-muted-foreground mt-2">Manage your product listings</p>
          </div>
          <Button onClick={openCreateDialog} disabled={categoryOptions.length === 0}>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-border/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">Total Products</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.inStock}</div>
              <p className="text-xs text-muted-foreground mt-1">In Stock</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">
                <Money amountUSD={stats.totalValue} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total Value</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.outOfStock}</div>
              <p className="text-xs text-muted-foreground mt-1">Out of Stock</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Your Products</CardTitle>
            <CardDescription>These products are stored in the database and scoped to your vendor account.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-muted-foreground">Loading products…</div>
            ) : products.length > 0 ? (
              <div className="space-y-3 overflow-x-auto">
                <div className="inline-block w-full">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Product Name</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Category</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Price</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Min Order</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Status</th>
                        <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr
                          key={product.id}
                          className="border-b border-border/50 hover:bg-secondary/50 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {stripHtmlForPreview(product.description ?? '')}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline">{product.category}</Badge>
                          </td>
                          <td className="py-3 px-4 font-medium">
                            <Money amountUSD={Number(product.price)} />
                          </td>
                          <td className="py-3 px-4">{product.minimum_order}</td>
                          <td className="py-3 px-4">
                            <Badge
                              className={
                                product.in_stock
                                  ? 'bg-green-500/10 text-green-400'
                                  : 'bg-red-500/10 text-red-400'
                              }
                            >
                              {product.in_stock ? 'In Stock' : 'Out of Stock'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  id={`vendor-product-actions-${product.id}`}
                                  variant="ghost"
                                  size="sm"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditDialog(product)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDelete(product)}
                                  disabled={deletingId === product.id}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-muted-foreground mb-4">You haven't added any products yet.</p>
                <Button onClick={openCreateDialog} disabled={categoryOptions.length === 0}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Product
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => setDialogOpen(open)}>
        <DialogContent className="w-[92vw] max-w-[92vw] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{mode === 'create' ? 'Add product' : 'Edit product'}</DialogTitle>
            <DialogDescription>
              {mode === 'create' ? 'Create a new product in your catalog.' : 'Update your product details.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="vendor-product-name">Product name *</Label>
              <Input
                id="vendor-product-name"
                value={draft.name}
                onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Organic Arabica Coffee Beans"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="vendor-product-description">Description</Label>
              <Input
                id="vendor-product-description"
                value={draft.description}
                onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Short description shown in listings"
              />
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              <div className="grid gap-2">
                <Label>Category *</Label>
                <Select
                  value={draft.category || '__none__'}
                  onValueChange={(value) =>
                    setDraft((prev) => ({
                      ...prev,
                      category: value === '__none__' ? '' : value,
                      subcategory: '',
                      subSubCategory: '',
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select…</SelectItem>
                    {categoryOptions.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Subcategory</Label>
                <Select
                  value={draft.subcategory || '__none__'}
                  onValueChange={(value) =>
                    setDraft((prev) => ({ ...prev, subcategory: value === '__none__' ? '' : value, subSubCategory: '' }))
                  }
                  disabled={!draft.category}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {availableSubcategories.map((sub) => (
                      <SelectItem key={sub} value={sub}>
                        {sub}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Sub-subcategory</Label>
                <Select
                  value={draft.subSubCategory || '__none__'}
                  onValueChange={(value) => setDraft((prev) => ({ ...prev, subSubCategory: value === '__none__' ? '' : value }))}
                  disabled={!draft.category || !draft.subcategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sub-subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {availableSubSubcategories.map((leaf) => (
                      <SelectItem key={leaf} value={leaf}>
                        {leaf}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="vendor-product-price">Price (USD) *</Label>
                <Input
                  id="vendor-product-price"
                  type="number"
                  step="0.01"
                  min={0}
                  value={draft.price}
                  onChange={(e) => setDraft((prev) => ({ ...prev, price: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vendor-product-min-order">Minimum order *</Label>
                <Input
                  id="vendor-product-min-order"
                  type="number"
                  step="1"
                  min={1}
                  value={draft.minimumOrder}
                  onChange={(e) => setDraft((prev) => ({ ...prev, minimumOrder: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vendor-product-unit">Unit</Label>
                <Input
                  id="vendor-product-unit"
                  value={draft.unit}
                  onChange={(e) => setDraft((prev) => ({ ...prev, unit: e.target.value }))}
                  placeholder="piece"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <div>
                <p className="text-sm font-medium">In stock</p>
                <p className="text-xs text-muted-foreground">Visible as available to buyers</p>
              </div>
              <Switch checked={draft.inStock} onCheckedChange={(checked) => setDraft((prev) => ({ ...prev, inStock: checked }))} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={saveDraft} disabled={saving}>
                {saving ? 'Saving…' : mode === 'create' ? 'Create product' : 'Save changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
