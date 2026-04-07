'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Globe2,
  Layers,
  ShieldAlert,
  Sparkles,
  Store,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { mockOrders, mockProducts, mockUsers, mockVendors } from '@/lib/mock-data';

type FeaturedState = Record<string, boolean>;

const operationalMenuItems = [
  { name: 'Agriculture & Food Products', active: true, sort: 1 },
  { name: 'Livestock & Animal Products', active: true, sort: 2 },
  { name: 'Fisheries & Aquaculture', active: true, sort: 3 },
  { name: 'Minerals & Natural Resources', active: true, sort: 4 },
  { name: 'Technology & Digital Products', active: false, sort: 5 },
  { name: 'Services', active: true, sort: 6 },
];

export default function AdminOverviewPage() {
  const [featured, setFeatured] = useState<FeaturedState>(() =>
    Object.fromEntries(mockProducts.map((product, index) => [product.id, index < 3])),
  );

  const pendingVendors = useMemo(() => mockVendors.filter((vendor) => !vendor.verified), []);
  const totalGMV = useMemo(() => mockOrders.reduce((sum, order) => sum + order.totalAmount, 0), []);
  const activeFeaturedCount = useMemo(
    () => Object.values(featured).filter(Boolean).length,
    [featured],
  );

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
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Total GMV</p>
            <p className="text-2xl font-bold">${(totalGMV / 1000).toFixed(1)}k</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Registered Vendors</p>
            <p className="text-2xl font-bold">{mockVendors.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Platform Users</p>
            <p className="text-2xl font-bold">{mockUsers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Featured Products</p>
            <p className="text-2xl font-bold">{activeFeaturedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Pending Approvals</p>
            <p className="text-2xl font-bold">{pendingVendors.length}</p>
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
            {pendingVendors.length === 0 ? (
              <div className="rounded-md border border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
                No pending vendor approvals right now.
              </div>
            ) : (
              pendingVendors.map((vendor) => (
                <div key={vendor.id} className="rounded-md border border-border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{vendor.companyName}</p>
                    <Badge variant="outline">Pending</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{vendor.email}</p>
                  <div className="flex gap-2">
                    <Button size="sm">Approve</Button>
                    <Button size="sm" variant="outline">Request Docs</Button>
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
            {mockProducts.slice(0, 6).map((product) => (
              <div key={product.id} className="rounded-md border border-border p-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium line-clamp-1">{product.name}</p>
                  <p className="text-xs text-muted-foreground">${product.price.toFixed(2)} - {product.category}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{featured[product.id] ? 'Featured' : 'Standard'}</Badge>
                  <Switch
                    checked={Boolean(featured[product.id])}
                    onCheckedChange={(checked) =>
                      setFeatured((prev) => ({ ...prev, [product.id]: checked }))
                    }
                    aria-label={`Toggle featured for ${product.name}`}
                  />
                </div>
              </div>
            ))}
            <Button variant="ghost" asChild className="w-full">
              <Link href="/admin/featured-products">Open featured products manager</Link>
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
            {operationalMenuItems.map((item) => (
              <div key={item.name} className="rounded-md border border-border p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-muted-foreground">Sort: {item.sort}</p>
                </div>
                <Badge variant={item.active ? 'default' : 'outline'}>
                  {item.active ? 'Visible' : 'Hidden'}
                </Badge>
              </div>
            ))}
            <Button variant="ghost" asChild className="w-full">
              <Link href="/admin/menu-items">Manage full menu taxonomy</Link>
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
