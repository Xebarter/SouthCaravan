'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Globe2,
  Layers,
  Loader2,
  ShieldAlert,
  Sparkles,
  Store,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Money } from '@/components/money';
import { toast } from 'sonner';

type FeaturedState = Record<string, boolean>;

type OverviewPayload = {
  totals: {
    totalGMV: number;
    vendorCount: number;
    userCount: number;
    featuredCount: number;
    pendingVendorCount: number;
  };
  featuredProducts: { id: string; name: string; price: number; category: string; is_featured: boolean }[];
  pendingVendors: { id: string; company_name: string; email: string; created_at: string; is_verified: boolean }[];
  topCategories: { id: string; name: string; sort_order: number; is_active: boolean; level: number }[];
};

export default function AdminOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<OverviewPayload | null>(null);
  const [featured, setFeatured] = useState<FeaturedState>({});

  const totals = overview?.totals;
  const activeFeaturedCount = useMemo(() => Object.values(featured).filter(Boolean).length, [featured]);

  async function fetchOverview() {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/overview');
      const payload = (await response.json()) as OverviewPayload & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? 'Failed to load overview');
      setOverview(payload);
      setFeatured(
        Object.fromEntries((payload.featuredProducts ?? []).map((p) => [p.id, Boolean(p.is_featured)])),
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load overview');
      setOverview(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOverview();
  }, []);

  async function toggleFeatured(productId: string, checked: boolean) {
    setFeatured((prev) => ({ ...prev, [productId]: checked }));
    const response = await fetch('/api/admin/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: productId, isFeatured: checked }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setFeatured((prev) => ({ ...prev, [productId]: !checked }));
      toast.error(payload?.error ?? 'Feature update failed');
      return;
    }
    setOverview((prev) =>
      prev
        ? {
            ...prev,
            totals: {
              ...prev.totals,
              featuredCount: checked ? prev.totals.featuredCount + 1 : Math.max(0, prev.totals.featuredCount - 1),
            },
            featuredProducts: prev.featuredProducts.map((p) => (p.id === productId ? { ...p, is_featured: checked } : p)),
          }
        : prev,
    );
  }

  async function approveVendor(vendorId: string) {
    const response = await fetch('/api/admin/vendors', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: vendorId, isVerified: true }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      toast.error(payload?.error ?? 'Could not verify vendor');
      return;
    }
    toast.success('Vendor verified');
    await fetchOverview();
  }

  async function toggleCategory(categoryId: string, checked: boolean) {
    const response = await fetch('/api/admin/categories', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: categoryId, isActive: checked }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      toast.error(payload?.error ?? 'Category update failed');
      return;
    }
    setOverview((prev) =>
      prev
        ? {
            ...prev,
            topCategories: prev.topCategories.map((c) => (c.id === categoryId ? { ...c, is_active: checked } : c)),
          }
        : prev,
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">International Ecommerce Control Center</p>
          <h2 className="text-3xl font-bold tracking-tight">Platform Overview</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/admin/vendors">Review Vendors</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/analytics">Open Analytics</Link>
          </Button>
          <Button variant="outline" onClick={fetchOverview} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Total GMV</p>
            <p className="text-2xl font-bold">
              <Money amountUSD={totals?.totalGMV ?? 0} notation="compact" />
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Registered Vendors</p>
            <p className="text-2xl font-bold">{totals?.vendorCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Platform Users</p>
            <p className="text-2xl font-bold">{totals?.userCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Featured Products</p>
            <p className="text-2xl font-bold">{totals?.featuredCount ?? activeFeaturedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Pending Approvals</p>
            <p className="text-2xl font-bold">{totals?.pendingVendorCount ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid xl:grid-cols-12 gap-5">
        <Card className="xl:col-span-5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-primary" />
              Vendor Approval Queue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="rounded-md border border-border bg-secondary/30 p-4 text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading vendor approvals...
              </div>
            ) : (overview?.pendingVendors?.length ?? 0) === 0 ? (
              <div className="rounded-md border border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
                No pending vendor approvals right now.
              </div>
            ) : (
              overview!.pendingVendors.map((vendor) => (
                <div key={vendor.id} className="rounded-md border border-border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{vendor.company_name || 'Vendor'}</p>
                    <Badge variant="outline">Pending</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{vendor.email}</p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => approveVendor(vendor.id)}>
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/admin/vendors">Review</Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
            <Button variant="ghost" asChild className="w-full">
              <Link href="/admin/vendors">Go to full vendor approvals</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="xl:col-span-7">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Manage Featured Products
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(overview?.featuredProducts ?? []).map((product) => (
              <div key={product.id} className="rounded-md border border-border p-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium line-clamp-1">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    <Money amountUSD={Number(product.price)} /> - {product.category}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{featured[product.id] ? 'Featured' : 'Standard'}</Badge>
                  <Switch
                    checked={Boolean(featured[product.id])}
                    onCheckedChange={(checked) => toggleFeatured(product.id, checked)}
                    aria-label={`Toggle featured for ${product.name}`}
                  />
                </div>
              </div>
            ))}
            <Button variant="ghost" asChild className="w-full">
              <Link href="/admin/products">Open products manager</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid xl:grid-cols-12 gap-5">
        <Card className="xl:col-span-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              Menu Items Governance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <div className="rounded-md border border-border bg-secondary/30 p-4 text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading menu items...
              </div>
            ) : (overview?.topCategories?.length ?? 0) === 0 ? (
              <div className="rounded-md border border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
                No categories yet. Seed defaults from the Cartegories page.
              </div>
            ) : (
              overview!.topCategories.map((item) => (
                <div key={item.id} className="rounded-md border border-border p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm line-clamp-1">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Sort: {item.sort_order}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant={item.is_active ? 'default' : 'outline'}>{item.is_active ? 'Visible' : 'Hidden'}</Badge>
                    <Switch
                      checked={item.is_active}
                      onCheckedChange={(checked) => toggleCategory(item.id, checked)}
                      aria-label={`Toggle ${item.name}`}
                    />
                  </div>
                </div>
              ))
            )}
            <Button variant="ghost" asChild className="w-full">
              <Link href="/admin/settings?tab=categories">Manage full menu taxonomy</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="xl:col-span-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              International Operations Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md border border-border p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-primary" />
                <p className="text-sm font-medium">Cross-border Orders</p>
              </div>
              <p className="font-bold">+22.4%</p>
            </div>
            <div className="rounded-md border border-border p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-primary" />
                <p className="text-sm font-medium">Supplier Activation Rate</p>
              </div>
              <p className="font-bold">91.2%</p>
            </div>
            <div className="rounded-md border border-border p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <p className="text-sm font-medium">Compliance Flags</p>
              </div>
              <p className="font-bold">4 Open</p>
            </div>
            <div className="rounded-md border border-border p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <p className="text-sm font-medium">Disputes Resolved (30d)</p>
              </div>
              <p className="font-bold">96%</p>
            </div>
            <Button variant="ghost" asChild className="w-full">
              <Link href="/admin/analytics" className="flex items-center justify-center gap-2">
                Deep dive analytics
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
