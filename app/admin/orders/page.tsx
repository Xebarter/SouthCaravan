'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Money } from '@/components/money';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, Filter, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type OrderRow = {
  id: string;
  buyer_id: string;
  vendor_user_id: string | null;
  status: string;
  total_amount: number;
  created_at: string | null;
  items_count: number;
  buyer: { id: string; name: string | null; email: string | null } | null;
  vendor: { id: string; company_name: string | null; name: string | null; email: string | null } | null;
};

export default function AdminOrdersPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderRow[]>([]);

  async function load() {
    setLoading(true);
    try {
      const qs = statusFilter && statusFilter !== 'all' ? `?status=${encodeURIComponent(statusFilter)}` : '';
      const res = await fetch(`/api/admin/orders${qs}`, { cache: 'no-store' });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || 'Failed to load orders');
      setOrders(Array.isArray(json?.orders) ? json.orders : []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-400',
    confirmed: 'bg-primary/10 text-primary',
    shipped: 'bg-purple-500/10 text-purple-400',
    delivered: 'bg-green-500/10 text-green-400',
    cancelled: 'bg-red-500/10 text-red-400',
  };

  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) => o.status === 'pending').length;
    const shipped = orders.filter((o) => o.status === 'shipped').length;
    const delivered = orders.filter((o) => o.status === 'delivered').length;
    const cancelled = orders.filter((o) => o.status === 'cancelled').length;
    const totalGMV = orders.reduce((sum, o) => sum + Number(o.total_amount ?? 0), 0);
    return { total, pending, shipped, delivered, cancelled, totalGMV };
  }, [orders]);

  return (
    <main className="flex-1 overflow-auto">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Order Management</h1>
            <p className="text-muted-foreground mt-2">Monitor all platform transactions</p>
          </div>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <Card className="border-border/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">Total Orders</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">
                <Money amountUSD={stats.totalGMV} notation="compact" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">GMV</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-muted-foreground mt-1">Pending</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.shipped}</div>
              <p className="text-xs text-muted-foreground mt-1">In Transit</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.delivered}</div>
              <p className="text-xs text-muted-foreground mt-1">Delivered</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.cancelled}</div>
              <p className="text-xs text-muted-foreground mt-1">Cancelled</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="mb-6 flex gap-2 items-center">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 bg-secondary">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Orders Table */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>All Orders</CardTitle>
            <CardDescription>Complete transaction history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 overflow-x-auto">
              <div className="inline-block w-full">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Order ID</th>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Buyer</th>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Vendor</th>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Items</th>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Status</th>
                      <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="py-12 px-4 text-center text-muted-foreground">
                          <span className="inline-flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading orders…
                          </span>
                        </td>
                      </tr>
                    ) : orders.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 px-4 text-center text-muted-foreground">
                          No orders found.
                        </td>
                      </tr>
                    ) : (
                      orders.map((order) => {
                        const buyerName = order.buyer?.name || order.buyer?.email || order.buyer_id;
                        const buyerCompany = order.buyer?.email || '';
                        const vendorName =
                          order.vendor?.company_name || order.vendor?.name || order.vendor?.email || order.vendor_user_id || '—';
                        return (
                        <tr key={order.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                          <td className="py-3 px-4 font-mono text-xs">{String(order.id).slice(-6)}</td>
                          <td className="py-3 px-4">
                            <div className="text-sm font-medium">{buyerName}</div>
                            <div className="text-xs text-muted-foreground">{buyerCompany}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm font-medium">{vendorName}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm">{order.items_count}</span>
                          </td>
                          <td className="py-3 px-4 font-bold text-primary">
                            <Money amountUSD={Number(order.total_amount ?? 0)} />
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {order.created_at ? new Date(order.created_at).toLocaleDateString() : '—'}
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={statusColors[order.status]}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Link href={`/admin/orders/${order.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                          </td>
                        </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
