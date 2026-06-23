'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, type ElementType } from 'react';
import {
  ArrowUpToLine,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  GripVertical,
  ImageIcon,
  LayoutGrid,
  Loader2,
  Package,
  RefreshCw,
  Sparkles,
  Star,
  Trash2,
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
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Money } from '@/components/money';
import type { FeaturedProductRow } from '@/lib/product-featured-order';
import { cn } from '@/lib/utils';

type PlacementZone = 'spotlight' | 'hero-tile' | 'more';

function placementMeta(index: number): {
  zone: PlacementZone;
  label: string;
  shortLabel: string;
  className: string;
} {
  if (index === 0) {
    return {
      zone: 'spotlight',
      label: 'Hero spotlight',
      shortLabel: '#1',
      className: 'border-amber-500/35 bg-amber-500/10 text-amber-800 dark:text-amber-200',
    };
  }
  if (index >= 1 && index <= 4) {
    return {
      zone: 'hero-tile',
      label: `Hero tile ${index + 1}`,
      shortLabel: `#${index + 1}`,
      className: 'border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-200',
    };
  }
  return {
    zone: 'more',
    label: 'More featured',
    shortLabel: `${index + 1}`,
    className: 'border-border bg-muted/50 text-muted-foreground',
  };
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
    <Card className="rounded-2xl border-border/70 bg-card/80 shadow-sm">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold tabular-nums tracking-tight">{value}</p>
            )}
            <p className="text-xs text-muted-foreground">{hint}</p>
          </div>
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1',
              accentMap[accent],
            )}
          >
            <Icon className="h-5 w-5" aria-hidden />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function HeroPreview({ products, loading }: { products: FeaturedProductRow[]; loading: boolean }) {
  const hero = products.slice(0, 5);
  const spotlight = hero[0];

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="aspect-[4/3] w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (hero.length === 0) {
    return (
      <Empty className="border border-dashed border-border/70 rounded-xl py-10">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Sparkles />
          </EmptyMedia>
          <EmptyTitle>No hero products yet</EmptyTitle>
          <EmptyDescription>
            Feature products on the All products tab, then arrange them here. Position #1 becomes the
            large homepage spotlight.
          </EmptyDescription>
        </EmptyHeader>
        <Button asChild variant="outline" size="sm" className="mt-2">
          <Link href="/admin/products">Go to all products</Link>
        </Button>
      </Empty>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-border dark:bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 dark:border-border/60">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
          <span className="text-sm font-semibold">Featured picks preview</span>
        </div>
        <Badge variant="secondary" className="text-[10px] font-medium">
          Live layout
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="border-b md:border-b-0 md:border-r border-slate-100 p-3 dark:border-border/60">
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
            {spotlight?.images?.[0] ? (
              <Image
                src={spotlight.images[0]}
                alt={spotlight.name}
                fill
                unoptimized
                className="object-cover"
                sizes="(min-width: 768px) 50vw, 100vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
              </div>
            )}
            <Badge className="absolute left-2 top-2 border-0 bg-amber-500 text-white shadow-sm">
              Spotlight
            </Badge>
          </div>
          <p className="mt-2.5 text-sm font-semibold line-clamp-1">{spotlight?.name}</p>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {spotlight?.subcategory || spotlight?.category || '—'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 p-3">
          {hero.slice(1).map((product, idx) => (
            <div key={product.id} className="space-y-1.5">
              <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                {product.images?.[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="120px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImageIcon className="h-5 w-5 text-muted-foreground/50" />
                  </div>
                )}
                <span className="absolute left-1.5 top-1.5 rounded-md bg-background/90 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums shadow-sm">
                  #{idx + 2}
                </span>
              </div>
              <p className="text-[11px] font-medium leading-tight line-clamp-2">{product.name}</p>
            </div>
          ))}
          {hero.length < 5
            ? Array.from({ length: 5 - hero.length }).map((_, i) => (
                <div
                  key={`slot-${i}`}
                  className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border/80 bg-muted/20 text-center"
                >
                  <Package className="h-4 w-4 text-muted-foreground/40" />
                  <span className="text-[10px] text-muted-foreground">Open slot</span>
                </div>
              ))
            : null}
        </div>
      </div>
    </div>
  );
}

function FeaturedRow({
  product,
  index,
  total,
  saving,
  busyId,
  onMoveUp,
  onMoveDown,
  onMoveToTop,
  onRemove,
}: {
  product: FeaturedProductRow;
  index: number;
  total: number;
  saving: boolean;
  busyId: string | null;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onMoveToTop: () => void;
  onRemove: () => void;
}) {
  const placement = placementMeta(index);
  const isBusy = busyId === product.id || saving;
  const lineCurrency = product.currency ?? 'USD';

  return (
    <div
      className={cn(
        'group relative flex flex-col gap-3 rounded-xl border bg-card p-3 transition-colors sm:flex-row sm:items-center',
        placement.zone === 'spotlight' && 'border-amber-500/25 bg-amber-500/[0.03]',
        placement.zone === 'hero-tile' && 'border-sky-500/15',
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold tabular-nums',
            placement.zone === 'spotlight'
              ? 'bg-amber-500/15 text-amber-800 dark:text-amber-200'
              : 'bg-muted text-foreground',
          )}
        >
          {index + 1}
        </div>

        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-muted">
          {product.images?.[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              unoptimized
              className="object-cover"
              sizes="56px"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ImageIcon className="h-5 w-5 text-muted-foreground/50" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="font-semibold truncate text-sm sm:text-base">{product.name}</p>
            <Badge variant="outline" className={cn('text-[10px] font-medium', placement.className)}>
              {placement.label}
            </Badge>
            {!product.in_stock ? (
              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                Out of stock
              </Badge>
            ) : null}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground truncate">
            {product.subcategory || product.category}
            <span className="mx-1.5 text-border">·</span>
            {product.vendor_id ? 'Vendor listing' : 'Platform listing'}
          </p>
          <p className="mt-1 text-sm font-semibold tabular-nums">
            <Money amount={Number(product.price)} baseCurrency={lineCurrency} />
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 self-end sm:self-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={isBusy || index === 0}
              onClick={onMoveToTop}
              aria-label={`Set ${product.name} as hero spotlight`}
            >
              <ArrowUpToLine className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Set as spotlight (#1)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={isBusy || index === 0}
              onClick={onMoveUp}
              aria-label={`Move ${product.name} up`}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Move up</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={isBusy || index === total - 1}
              onClick={onMoveDown}
              aria-label={`Move ${product.name} down`}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Move down</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-1 hidden h-6 sm:block" />

        <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs">
          <Link href={`/product/${product.id}`} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-1 h-3.5 w-3.5" />
            View
          </Link>
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs text-destructive hover:text-destructive"
          disabled={isBusy}
          onClick={onRemove}
        >
          {busyId === product.id ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <>
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              Remove
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default function FeaturedOrderClient() {
  const [products, setProducts] = useState<FeaturedProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<FeaturedProductRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/products/featured', { cache: 'no-store' });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || 'Failed to load featured products');
      setProducts(Array.isArray(json?.products) ? json.products : []);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to load featured products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const heroFilled = Math.min(5, products.length);
    const moreCount = Math.max(0, products.length - 5);
    return { total: products.length, heroFilled, moreCount };
  }, [products]);

  const heroProducts = useMemo(() => products.slice(0, 5), [products]);
  const moreProducts = useMemo(() => products.slice(5), [products]);

  async function persistOrder(nextProducts: FeaturedProductRow[]) {
    const snapshot = products;
    setProducts(nextProducts);
    setSaving(true);
    try {
      const res = await fetch('/api/admin/products/featured', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: nextProducts.map((p) => p.id) }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || 'Failed to save order');
      setProducts(Array.isArray(json?.products) ? json.products : nextProducts);
      toast.success('Order saved', { description: 'Homepage featured layout updated.' });
    } catch (e: unknown) {
      setProducts(snapshot);
      toast.error(e instanceof Error ? e.message : 'Failed to save order');
    } finally {
      setSaving(false);
    }
  }

  function reorder(id: string, targetIndex: number) {
    const index = products.findIndex((p) => p.id === id);
    if (index < 0 || targetIndex < 0 || targetIndex >= products.length || index === targetIndex) return;
    const next = [...products];
    const [item] = next.splice(index, 1);
    next.splice(targetIndex, 0, item!);
    void persistOrder(next);
  }

  function moveProduct(id: string, direction: 'up' | 'down') {
    const index = products.findIndex((p) => p.id === id);
    if (index < 0) return;
    reorder(id, direction === 'up' ? index - 1 : index + 1);
  }

  async function confirmRemove() {
    if (!removeTarget) return;
    const id = removeTarget.id;
    setBusyId(id);
    setRemoveTarget(null);
    try {
      const res = await fetch('/api/admin/products/featured', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isFeatured: false }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || 'Failed to remove featured product');
      setProducts(Array.isArray(json?.products) ? json.products : products.filter((p) => p.id !== id));
      toast.success('Removed from featured');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to remove featured product');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-8">
        {/* Page header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Merchandising
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/15 dark:text-amber-400">
                <Star className="h-5 w-5 fill-current" />
              </span>
              <div>
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Featured order</h2>
                <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground">
                  Control homepage placement. Position&nbsp;#1 is the large hero image; #2–#5 fill the
                  hero grid. Everything else appears under &ldquo;More featured&rdquo;.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {saving ? (
              <Badge variant="secondary" className="gap-1.5 px-2.5 py-1 font-normal">
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving…
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1.5 px-2.5 py-1 font-normal text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Auto-save on reorder
              </Badge>
            )}
            <Button asChild variant="outline" size="sm" className="rounded-lg">
              <Link href="/" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                View homepage
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg"
              onClick={() => load()}
              disabled={loading || saving}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Featured total"
            value={stats.total}
            hint="Active featured listings"
            icon={LayoutGrid}
            loading={loading}
            accent="primary"
          />
          <StatCard
            label="Hero slots"
            value={`${stats.heroFilled}/5`}
            hint="Spotlight + grid tiles"
            icon={Star}
            loading={loading}
            accent="amber"
          />
          <StatCard
            label="Below the fold"
            value={stats.moreCount}
            hint="Shown in More featured"
            icon={Sparkles}
            loading={loading}
            accent="violet"
          />
        </div>

        {/* Main layout */}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,380px)_1fr] xl:items-start">
          <Card className="rounded-2xl border-border/70 shadow-sm xl:sticky xl:top-24">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Homepage preview</CardTitle>
              <CardDescription>How the first five featured products render on the store.</CardDescription>
            </CardHeader>
            <CardContent>
              <HeroPreview products={heroProducts} loading={loading} />
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="rounded-2xl border-border/70 shadow-sm">
              <CardHeader className="border-b border-border/60 pb-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      Homepage hero
                      <Badge variant="secondary" className="text-[10px] font-medium">
                        Positions 1–5
                      </Badge>
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Reorder with arrows or jump any product to spotlight with{' '}
                      <ArrowUpToLine className="inline h-3.5 w-3.5 align-text-bottom" />.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pt-4">
                {loading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-[88px] w-full rounded-xl" />
                    ))}
                  </div>
                ) : heroProducts.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No products in the hero zone yet.
                  </p>
                ) : (
                  heroProducts.map((product, index) => (
                    <FeaturedRow
                      key={product.id}
                      product={product}
                      index={index}
                      total={products.length}
                      saving={saving}
                      busyId={busyId}
                      onMoveUp={() => moveProduct(product.id, 'up')}
                      onMoveDown={() => moveProduct(product.id, 'down')}
                      onMoveToTop={() => reorder(product.id, 0)}
                      onRemove={() => setRemoveTarget(product)}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            {(loading || moreProducts.length > 0) && (
              <Card className="rounded-2xl border-border/70 shadow-sm">
                <CardHeader className="border-b border-border/60 pb-4">
                  <CardTitle className="text-base flex items-center gap-2">
                    <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                    More featured
                    <Badge variant="secondary" className="text-[10px] font-medium">
                      Position 6+
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    These appear in the &ldquo;More featured&rdquo; row on the homepage and on /featured.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 pt-4">
                  {loading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 2 }).map((_, i) => (
                        <Skeleton key={i} className="h-[88px] w-full rounded-xl" />
                      ))}
                    </div>
                  ) : moreProducts.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      No additional featured products beyond the hero zone.
                    </p>
                  ) : (
                    moreProducts.map((product, offsetIndex) => {
                      const index = offsetIndex + 5;
                      return (
                        <FeaturedRow
                          key={product.id}
                          product={product}
                          index={index}
                          total={products.length}
                          saving={saving}
                          busyId={busyId}
                          onMoveUp={() => moveProduct(product.id, 'up')}
                          onMoveDown={() => moveProduct(product.id, 'down')}
                          onMoveToTop={() => reorder(product.id, 0)}
                          onRemove={() => setRemoveTarget(product)}
                        />
                      );
                    })
                  )}
                </CardContent>
              </Card>
            )}

            {!loading && products.length === 0 && (
              <Empty className="rounded-2xl border border-dashed border-border/70 py-14">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Package />
                  </EmptyMedia>
                  <EmptyTitle>No featured products</EmptyTitle>
                  <EmptyDescription>
                    Mark products as featured from the product registry, then return here to set
                    homepage order.
                  </EmptyDescription>
                </EmptyHeader>
                <Button asChild className="mt-3">
                  <Link href="/admin/products">Manage products</Link>
                </Button>
              </Empty>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={Boolean(removeTarget)} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from featured?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">{removeTarget?.name}</span> will no longer
              appear in featured homepage sections. You can feature it again anytime from All products.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void confirmRemove()}
            >
              Remove featured
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
