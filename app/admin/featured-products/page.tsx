'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Money } from '@/components/money';
import { mockProducts } from '@/lib/mock-data';

export default function AdminFeaturedProductsPage() {
  const [featuredMap, setFeaturedMap] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(mockProducts.map((product, index) => [product.id, index < 4])),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Featured Products</h2>
          <p className="text-muted-foreground mt-1">Promote products across homepage, campaigns, and curated collections.</p>
        </div>
        <div className="flex gap-2">
          <Input placeholder="Search products..." className="w-56 bg-secondary" />
          <Button>Save Changes</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Promotion Controls</CardTitle>
          <CardDescription>Toggle featured status and prioritize visibility in merchandising slots.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {mockProducts.map((product) => (
            <div key={product.id} className="rounded-md border border-border p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium line-clamp-1">{product.name}</p>
                <p className="text-xs text-muted-foreground">
                  <Money amountUSD={Number(product.price)} /> - {product.category}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={featuredMap[product.id] ? 'default' : 'outline'}>
                  {featuredMap[product.id] ? (
                    <span className="inline-flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-current" /> Featured</span>
                  ) : 'Standard'}
                </Badge>
                <Switch
                  checked={Boolean(featuredMap[product.id])}
                  onCheckedChange={(checked) =>
                    setFeaturedMap((prev) => ({ ...prev, [product.id]: checked }))
                  }
                  aria-label={`Toggle featured status for ${product.name}`}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
