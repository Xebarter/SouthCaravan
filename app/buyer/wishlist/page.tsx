'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';

export default function BuyerWishlistPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [productId, setProductId] = useState('');

  const refresh = async () => {
    const res = await fetch('/api/buyer/wishlist');
    const json = await res.json().catch(() => null);
    if (res.ok) setItems(Array.isArray(json?.items) ? json.items : []);
  };

  useEffect(() => {
    if (!user) return;
    void refresh();
  }, [user]);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Wishlist</h1>
        <p className="text-muted-foreground mt-2">Save products to revisit later</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add item</CardTitle>
          <CardDescription>Paste a Product UUID to add to wishlist</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input value={productId} onChange={(e) => setProductId(e.target.value)} placeholder="product uuid" />
          <Button
            disabled={loading}
            onClick={async () => {
              const id = productId.trim();
              if (!id) return;
              setLoading(true);
              try {
                await fetch('/api/buyer/wishlist', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ productId: id }),
                });
                setProductId('');
                await refresh();
              } finally {
                setLoading(false);
              }
            }}
          >
            Add
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Saved items</CardTitle>
          <CardDescription>{items.length} item(s)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No wishlist items yet. Browse the <Link className="underline" href="/catalog">catalog</Link>.
            </div>
          ) : (
            items.map((it) => (
              <div key={it.id} className="flex items-center justify-between p-3 rounded bg-secondary/50">
                <div className="text-sm">
                  <div className="font-medium">Product</div>
                  <div className="text-muted-foreground font-mono">{String(it.product_id)}</div>
                </div>
                <Button
                  variant="outline"
                  onClick={async () => {
                    await fetch(`/api/buyer/wishlist?productId=${encodeURIComponent(String(it.product_id))}`, { method: 'DELETE' });
                    await refresh();
                  }}
                >
                  Remove
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

