'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Globe2,
  ImageIcon,
  Inbox,
  Layers,
  LayoutGrid,
  Loader2,
  Package,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Store,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Money } from '@/components/money';
import { cn } from '@/lib/utils';
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
  featuredProducts: { id: string; name: string; price: number; category: string; is_featured: boolean; images?: string[] | null }[];
  pendingVendors: { id: string; company_name: string; email: string; created_at: string; is_verified: boolean }[];
  topCategories: { id: string; name: string; sort_order: number; is_active: boolean; level: number }[];
};

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  iconBg,
  loading,
}: {
  title: string;
  value: React.ReactNode;
  sub: string;
  icon: React.ElementType;
  iconBg: string;
  loading?: boolean;
}) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardContent className="p-3">
        {loading ? (
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', iconBg)}>
              <Icon className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium leading-none text-muted-foreground">{title}</p>
              <p className="mt-1 text-lg font-bold leading-none tracking-tight tabular-nums">{value}</p>
              <p className="mt-1 truncate text-[10px] leading-tight text-muted-foreground">{sub}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center">
      <div className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function fmtDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function ProductThumb({ name, images }: { name: string; images?: string[] | null }) {
  const src = images?.[0];
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className="h-11 w-11 shrink-0 rounded-md border border-border object-cover bg-muted"
      />
    );
  }
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
      <ImageIcon className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}

export default function AdminOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<OverviewPayload | null>(null);
  const [featured, setFeatured] = useState<FeaturedState>({});

  const totals = overview?.totals;
  const activeFeaturedCount = useMemo(() => Object.values(featured).filter(Boolean).length, [featured]);
  const pendingCount = totals?.pendingVendorCount ?? 0;
  const activeCategoryCount = useMemo(
    () => (overview?.topCategories ?? []).filter((c) => c.is_active).length,
    [overview?.topCategories],
  );

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

  const quickLinks = [
    { href: '/admin/vendors', label: 'Vendor approvals', icon: ShieldAlert, desc: 'Verify new suppliers' },
    { href: '/admin/products', label: 'Products', icon: Package, desc: 'Catalog & merchandising' },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart3, desc: 'Platform intelligence' },
    { href: '/admin/orders', label: 'Orders', icon: LayoutGrid, desc: 'Fulfillment queue' },
  ];

  return (
    <main className="flex-1 overflow-auto bg-linear-to-b from-background via-background to-muted/25">
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 md:py-10 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-wide text-muted-foreground">Admin console</p>
            <h1 className="mt-1 flex items-center gap-2.5 text-2xl font-semibold tracking-tight md:text-3xl">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
                <LayoutGrid className="h-5 w-5" />
              </span>
              Platform overview
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Monitor marketplace health, approve vendors, and manage merchandising from one control center.
            </p>
            {!loading && (
              <div className="mt-3 flex flex-wrap gap-2">
                {pendingCount > 0 ? (
                  <Badge variant="destructive" className="font-normal">
                    {pendingCount} vendor{pendingCount === 1 ? '' : 's'} awaiting approval
                  </Badge>
                ) : (
                  <Badge variant="outline" className="font-normal border-emerald-500/40 text-emerald-700 dark:text-emerald-400">
                    Vendor queue clear
                  </Badge>
                )}
                <Badge variant="secondary" className="font-normal">
                  {totals?.featuredCount ?? activeFeaturedCount} featured listings
                </Badge>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="rounded-xl" onClick={fetchOverview} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Refresh
            </Button>
            <Button size="sm" className="rounded-xl" asChild>
              <Link href="/admin/vendors">
                Review vendors
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl" asChild>
              <Link href="/admin/analytics">
                Analytics
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          title="Total GMV"
          value={<Money amountUSD={totals?.totalGMV ?? 0} notation="compact" />}
          sub="All-time gross merchandise value"
          icon={TrendingUp}
          iconBg="bg-emerald-500"
          loading={loading}
        />
        <StatCard
          title="Vendors"
          value={totals?.vendorCount ?? 0}
          sub="Registered suppliers"
          icon={Store}
          iconBg="bg-primary"
          loading={loading}
        />
        <StatCard
          title="Users"
          value={totals?.userCount ?? 0}
          sub="Buyer accounts"
          icon={Users}
          iconBg="bg-violet-500"
          loading={loading}
        />
        <StatCard
          title="Featured"
          value={totals?.featuredCount ?? activeFeaturedCount}
          sub="Merchandising coverage"
          icon={Sparkles}
          iconBg="bg-amber-500"
          loading={loading}
        />
        <StatCard
          title="Pending"
          value={totals?.pendingVendorCount ?? 0}
          sub="Awaiting verification"
          icon={ShieldAlert}
          iconBg="bg-rose-500"
          loading={loading}
        />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="group flex items-center gap-3 rounded-lg border border-border/60 bg-card px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-muted/30"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted group-hover:bg-primary/10">
                <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium leading-tight">{link.label}</p>
                <p className="truncate text-[10px] text-muted-foreground">{link.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Vendor queue + Featured products */}
      <div className="grid gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-5 border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-primary" />
                  Vendor approval queue
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Review and verify new supplier registrations
                </CardDescription>
              </div>
              {!loading && pendingCount > 0 && (
                <Badge variant="destructive" className="shrink-0">
                  {pendingCount}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
              </div>
            ) : (overview?.pendingVendors?.length ?? 0) === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="Queue is clear"
                description="No vendors are waiting for verification right now."
              />
            ) : (
              overview!.pendingVendors.map((vendor) => (
                <div
                  key={vendor.id}
                  className="group rounded-lg border border-border/60 p-3 transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-snug">{vendor.company_name || 'Vendor'}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{vendor.email}</p>
                      {vendor.created_at ? (
                        <p className="mt-1 text-[10px] text-muted-foreground">Applied {fmtDate(vendor.created_at)}</p>
                      ) : null}
                    </div>
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      Pending
                    </Badge>
                  </div>
                  <div className="mt-2.5 flex gap-2">
                    <Button size="sm" className="h-7 text-xs" onClick={() => approveVendor(vendor.id)}>
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
                      <Link href="/admin/vendors">Review</Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
            <Separator className="my-3" />
            <Button variant="ghost" size="sm" asChild className="w-full text-xs">
              <Link href="/admin/vendors" className="flex items-center justify-center gap-1">
                View all vendor approvals
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="xl:col-span-7 border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Featured products
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Toggle homepage and catalog highlights
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" className="shrink-0 h-7 text-xs" asChild>
                <Link href="/admin/products">Manage all</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : (overview?.featuredProducts?.length ?? 0) === 0 ? (
              <EmptyState
                icon={Package}
                title="No products yet"
                description="Add products to the catalog, then feature them here."
              />
            ) : (
              overview!.featuredProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2.5 transition-colors hover:bg-muted/30"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <ProductThumb name={product.name} images={product.images} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium line-clamp-1">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        <Money amountUSD={Number(product.price)} />
                        {product.category ? ` · ${product.category}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2.5">
                    <Badge
                      variant={featured[product.id] ? 'default' : 'outline'}
                      className="text-[10px] hidden sm:inline-flex"
                    >
                      {featured[product.id] ? 'Featured' : 'Standard'}
                    </Badge>
                    <Switch
                      checked={Boolean(featured[product.id])}
                      onCheckedChange={(checked) => toggleFeatured(product.id, checked)}
                      aria-label={`Toggle featured for ${product.name}`}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Categories + Platform snapshot */}
      <div className="grid gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-6 border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  Menu taxonomy
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Control category visibility in navigation
                </CardDescription>
              </div>
              {!loading && overview?.topCategories?.length ? (
                <Badge variant="secondary" className="shrink-0 text-[10px]">
                  {activeCategoryCount} visible
                </Badge>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : (overview?.topCategories?.length ?? 0) === 0 ? (
              <EmptyState
                icon={Inbox}
                title="No categories yet"
                description="Seed defaults from the Categories page in settings."
              />
            ) : (
              overview!.topCategories.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2.5 transition-colors hover:bg-muted/30"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground">Sort order {item.sort_order}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2.5">
                    <Badge variant={item.is_active ? 'default' : 'outline'} className="text-[10px]">
                      {item.is_active ? 'Visible' : 'Hidden'}
                    </Badge>
                    <Switch
                      checked={item.is_active}
                      onCheckedChange={(checked) => toggleCategory(item.id, checked)}
                      aria-label={`Toggle ${item.name}`}
                    />
                  </div>
                </div>
              ))
            )}
            <Separator className="my-3" />
            <Button variant="ghost" size="sm" asChild className="w-full text-xs">
              <Link href="/admin/settings?tab=categories" className="flex items-center justify-center gap-1">
                Manage full taxonomy
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="xl:col-span-6 border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-primary" />
              Platform snapshot
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Live metrics from your marketplace data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                      <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium">Gross merchandise value</p>
                      <p className="text-[10px] text-muted-foreground">All-time platform revenue</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold tabular-nums">
                    <Money amountUSD={totals?.totalGMV ?? 0} notation="compact" />
                  </p>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <Store className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-medium">Supply network</p>
                      <p className="text-[10px] text-muted-foreground">Registered vendor accounts</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold tabular-nums">{totals?.vendorCount ?? 0}</p>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                      <Users className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium">Buyer base</p>
                      <p className="text-[10px] text-muted-foreground">Active user accounts</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold tabular-nums">{totals?.userCount ?? 0}</p>
                </div>
                <div
                  className={cn(
                    'flex items-center justify-between rounded-lg border px-3 py-2.5',
                    pendingCount > 0 ? 'border-amber-500/30 bg-amber-500/5' : 'border-border/60',
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg',
                        pendingCount > 0 ? 'bg-amber-500/15' : 'bg-muted',
                      )}
                    >
                      <ShieldAlert
                        className={cn(
                          'h-4 w-4',
                          pendingCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground',
                        )}
                      />
                    </div>
                    <div>
                      <p className="text-xs font-medium">Action required</p>
                      <p className="text-[10px] text-muted-foreground">Vendors pending verification</p>
                    </div>
                  </div>
                  <p
                    className={cn(
                      'text-sm font-bold tabular-nums',
                      pendingCount > 0 && 'text-amber-600 dark:text-amber-400',
                    )}
                  >
                    {pendingCount}
                  </p>
                </div>
              </>
            )}
            <Separator className="my-3" />
            <Button variant="outline" size="sm" asChild className="w-full text-xs">
              <Link href="/admin/analytics" className="flex items-center justify-center gap-1">
                Open analytics dashboard
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      </div>
    </main>
  );
}
