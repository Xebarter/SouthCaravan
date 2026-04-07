'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Download, Eye, Filter } from 'lucide-react';
import { mockOrders, mockVendors, mockUsers } from '@/lib/mock-data';
import { useAuth } from '@/lib/auth-context';
import { Order } from '@/lib/types';

export default function BuyerOrdersPage() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const buyerId = user?.id ?? 'user-1';

  const buyerOrders = mockOrders.filter(o => o.buyerId === buyerId);

  const filteredOrders = statusFilter === 'all'
    ? buyerOrders
    : buyerOrders.filter(o => o.status === statusFilter);

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-400',
    confirmed: 'bg-blue-500/10 text-blue-400',
    shipped: 'bg-purple-500/10 text-purple-400',
    delivered: 'bg-green-500/10 text-green-400',
    cancelled: 'bg-red-500/10 text-red-400',
  };

  const stats = {
    total: buyerOrders.length,
    pending: buyerOrders.filter(o => o.status === 'pending').length,
    shipped: buyerOrders.filter(o => o.status === 'shipped').length,
    delivered: buyerOrders.filter(o => o.status === 'delivered').length,
  };

  return (
    <main className="flex-1 overflow-auto">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">My Orders</h1>
          <p className="text-muted-foreground mt-2">Track and manage your purchase orders</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-border/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">Total Orders</p>
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
        </div>

        {/* Filters */}
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

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length > 0 ? (
            filteredOrders.map(order => {
              const vendor = mockVendors.find(v => v.id === order.vendorId);
              const totalValue = order.items.reduce((sum, item) => sum + item.subtotal, 0);

              return (
                <Card key={order.id} className="border-border/50 hover:border-primary/30 transition-colors">
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      {/* Order Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{vendor?.companyName || 'Unknown Vendor'}</h3>
                          <Badge className={statusColors[order.status]}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mt-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Order ID</p>
                            <p className="font-mono text-foreground">{order.id.slice(-6)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Date</p>
                            <p className="font-medium">{order.createdAt.toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Items</p>
                            <p className="font-medium">{order.items.length}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Total</p>
                            <p className="font-bold text-primary">${order.totalAmount.toLocaleString()}</p>
                          </div>
                        </div>

                        {/* Shipping Info */}
                        {order.estimatedDelivery && (
                          <div className="mt-3 p-2 bg-secondary/50 rounded text-sm">
                            <p className="text-muted-foreground">Est. Delivery: <span className="font-medium text-foreground">{order.estimatedDelivery.toLocaleDateString()}</span></p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 md:flex-col md:gap-3">
                        <Link href={`/buyer/orders/${order.id}`} className="flex-1 md:flex-none">
                          <Button variant="outline" className="w-full" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            Details
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm" className="w-full md:w-auto">
                          <Download className="w-4 h-4 mr-2" />
                          Invoice
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="border-border/50">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No orders found.</p>
                <Link href="/catalog">
                  <Button className="mt-4">Browse Catalog</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
