'use client';

import { useAuth } from '@/lib/auth-context';
import { mockProducts, mockQuotes, mockVendors } from '@/lib/mock-data';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Money } from '@/components/money';
import { Download, Printer } from 'lucide-react';
import Link from 'next/link';

export default function BuyerQuoteDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const buyerId = user?.id ?? 'user-1';

  const quote = mockQuotes.find((q) => q.id === params.id && q.buyerId === buyerId) ?? null;
  const vendor = quote ? mockVendors.find((v) => v.id === quote.vendorId) ?? null : null;

  if (!quote) {
    return (
      <div className="space-y-8 pb-12">
        <Breadcrumbs
          items={[
            { label: 'Quotes', href: '/buyer/services' },
            { label: `Quote #${params.id.slice(-6)}` },
          ]}
        />
        <Card className="border-border/50">
          <CardContent className="py-12 text-center text-muted-foreground">Quote not found.</CardContent>
        </Card>
      </div>
    );
  }

  const quotePillMap: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    accepted: 'bg-green-500/10 text-green-400 border-green-500/20',
    rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
    expired: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  };

  const canRespond = quote.status === 'pending';

  return (
    <div className="space-y-8 pb-12">
      <Breadcrumbs
        items={[
          { label: 'Quotes', href: '/buyer/services' },
          { label: `Quote #${quote.id.slice(-6)}` },
        ]}
      />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quote #{quote.id.slice(-6)}</h1>
          <p className="text-muted-foreground mt-2">
            From {vendor?.companyName || 'Unknown Vendor'} • Valid until {quote.validUntil.toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" size="sm">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Quote Summary</span>
                <Badge className={quotePillMap[quote.status]}>
                  {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold text-primary">
                  <Money amountUSD={quote.totalAmount} />
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Created</span>
                <span>{quote.createdAt.toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Items</span>
                <span>{quote.items.length}</span>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-sm font-medium mb-3">Line Items</p>
                <div className="space-y-3">
                  {quote.items.map((line) => {
                    const product = mockProducts.find((p) => p.id === line.productId);
                    return (
                      <div key={`${quote.id}-${line.productId}`} className="flex items-start justify-between gap-4 p-3 rounded-lg bg-secondary/50">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{product?.name ?? line.productId}</p>
                          <p className="text-sm text-muted-foreground mt-1">Qty: {line.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            <Money amountUSD={line.subtotal} />
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <Money amountUSD={line.unitPrice} /> each
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Vendor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <div>
                <p className="font-semibold text-foreground">{vendor?.companyName}</p>
                <p className="text-sm mt-1">{vendor?.description}</p>
              </div>
              <div className="pt-3 border-t border-border">
                <p className="text-sm">
                  <span className="font-medium text-foreground">Status: </span>
                  {quote.status}
                </p>
                <p className="text-sm">
                  <span className="font-medium text-foreground">Valid: </span>
                  {quote.validUntil.toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {canRespond ? (
                <>
                  <Button size="sm" className="w-full">
                    Accept Quote
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    Decline
                  </Button>
                </>
              ) : quote.status === 'accepted' ? (
                <Link href="/buyer/orders">
                  <Button size="sm" className="w-full">
                    Convert to Order
                  </Button>
                </Link>
              ) : (
                <div className="text-sm text-muted-foreground">
                  This quote can no longer be modified. You can view it or message the vendor.
                </div>
              )}

              <Link href="/buyer/messages">
                <Button variant="outline" size="sm" className="w-full">
                  Message Vendor
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

