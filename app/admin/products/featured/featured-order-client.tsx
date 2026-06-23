'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  ImageIcon,
  Loader2,
  RefreshCw,
  Star,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Money } from '@/components/money';
import type { FeaturedProductRow } from '@/lib/product-featured-order';
import { cn } from '@/lib/utils';

function placementLabel(index: number): { label: string; className: string } {
  if (index === 0) {
    return {
      label: 'Hero spotlight',
      className: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    };
  }
  if (index >= 1 && index <= 4) {
    return {
      label: `Hero tile #${index + 1}`,
      className: 'border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-200',
    };
  }
  return {
    label: 'More featured',
    className: 'border-border bg-muted/40 text-muted-foreground',
  };
}

export default function FeaturedOrderClient() {
  const [products, setProducts] = useState<FeaturedProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

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

  const heroPreview = useMemo(() => products.slice(0, 5), [products]);

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
      toast.success('Featured order updated');
    } catch (e: unknown) {
      setProducts(snapshot);
      toast.error(e instanceof Error ? e.message : 'Failed to save order');
    } finally {
      setSaving(false);
    }
  }

  function moveProduct(id: string, direction: 'up' | 'down') {
    const index = products.findIndex((p) => p.id === id);
    if (index < 0) return;
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= products.length) return;

    const next = [...products];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item!);
    void persistOrder(next);
  }

  async function removeFeatured(id: string) {
    setBusyId(id);
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
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Featured order</h2>
          <p className="mt-1 text-muted-foreground">
            Arrange how featured products appear on the homepage. Position #1 is the large hero spotlight;
            positions #2–#5 fill the hero grid. The rest appear under &ldquo;More featured&rdquo;.
          </p>
        </div>
        <Button variant="outline" onClick={() => load()} disabled={loading || saving}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Refresh
        </Button>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
            Homepage hero preview
          </CardTitle>
          <CardDescription>
            This mirrors the featured picks card on the home page (first five items only).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-40 rounded-xl bg-muted/50 animate-pulse" />
          ) : heroPreview.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No featured products yet. Mark products as featured on the{' '}
              <Link href="/admin/products" className="font-medium text-primary hover:underline">
                All products
              </Link>{' '}
              tab.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 rounded-xl border border-border/60 overflow-hidden">
              <div className="border-b md:border-b-0 md:border-r border-border/60 p-3">
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                  {heroPreview[0]?.images?.[0] ? (
                    <Image
                      src={heroPreview[0].images[0]}
                      alt={heroPreview[0].name}
                      fill
                      unoptimized
                      className="object-cover"
                      sizes="(min-width: 768px) 50vw, 100vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ImageIcon className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                  <Badge className="absolute left-2 top-2 border-0 bg-amber-500 text-white">#1 Spotlight</Badge>
                </div>
                <p className="mt-2 text-sm font-semibold line-clamp-1">{heroPreview[0]?.name ?? '—'}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 p-3">
                {heroPreview.slice(1, 5).map((product, idx) => (
                  <div key={product.id} className="space-y-1">
                    <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                      {product.images?.[0] ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          unoptimized
                          className="object-cover"
                          sizes="25vw"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <Badge variant="secondary" className="absolute left-1.5 top-1.5 text-[10px] px-1.5 py-0">
                        #{idx + 2}
                      </Badge>
                    </div>
                    <p className="text-xs font-medium line-clamp-1">{product.name}</p>
                  </div>
                ))}
                {heroPreview.length < 5
                  ? Array.from({ length: 5 - heroPreview.length }).map((_, i) => (
                      <div
                        key={`empty-${i}`}
                        className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/30 text-[10px] text-muted-foreground"
                      >
                        Empty
                      </div>
                    ))
                  : null}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Featured products ({products.length})</CardTitle>
          <CardDescription>Use the arrows to change display order. Changes save immediately.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 rounded-xl bg-muted/50 animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No featured products to arrange.
            </p>
          ) : (
            products.map((product, index) => {
              const placement = placementLabel(index);
              const isBusy = busyId === product.id || saving;

              return (
                <div
                  key={product.id}
                  className={cn(
                    'flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center',
                    index === 0 && 'border-amber-500/30 bg-amber-500/5',
                  )}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold tabular-nums">
                      {index + 1}
                    </div>
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
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
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium truncate">{product.name}</p>
                        <Badge variant="outline" className={cn('text-[11px]', placement.className)}>
                          {placement.label}
                        </Badge>
                        {!product.in_stock ? (
                          <Badge variant="outline" className="text-[11px]">
                            Out of stock
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {product.subcategory || product.category}
                        {product.vendor_id ? ' · Vendor' : ' · Platform'}
                      </p>
                      <p className="text-sm font-semibold tabular-nums">
                        <Money amount={Number(product.price)} baseCurrency={product.currency ?? 'USD'} />
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1 self-end sm:self-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={isBusy || index === 0}
                      onClick={() => moveProduct(product.id, 'up')}
                      aria-label={`Move ${product.name} up`}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={isBusy || index === products.length - 1}
                      onClick={() => moveProduct(product.id, 'down')}
                      aria-label={`Move ${product.name} down`}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      disabled={isBusy}
                      onClick={() => removeFeatured(product.id)}
                    >
                      {busyId === product.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <X className="mr-1 h-4 w-4" />
                          Remove
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {products.length > 0 ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowUp className="h-3.5 w-3.5" />}
          {saving ? 'Saving order…' : 'Tip: move #1 to the top for the homepage hero spotlight image.'}
          <ArrowDown className="h-3.5 w-3.5 opacity-0" aria-hidden />
        </div>
      ) : null}
    </div>
  );
}
