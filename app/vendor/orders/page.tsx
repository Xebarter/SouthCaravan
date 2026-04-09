'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, Filter } from 'lucide-react';
import { Money } from '@/components/money';
import { mockOrders, mockUsers } from '@/lib/mock-data';
import { useAuth } from '@/lib/auth-context';
import { getVendorProfileForConsole } from '@/lib/vendor-dashboard-data';

export default function VendorOrdersPage() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const vendor = getVendorProfileForConsole(user);
  if (!vendor) return null;

  const vendorOrders = mockOrders.filter(o => o.vendorId === vendor.id);

  const filteredOrders = statusFilter === 'all'
    ? vendorOrders
    : vendorOrders.filter(o => o.status === statusFilter);

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-400',
    confirmed: 'bg-blue-500/10 text-blue-400',
    shipped: 'bg-purple-500/10 text-purple-400',
    delivered: 'bg-green-500/10 text-green-400',
    cancelled: 'bg-red-500/10 text-red-400',
  };

  const stats = {
    total: vendorOrders.length,
    pending: vendorOrders.filter(o => o.status === 'pending').length,
    confirmed: vendorOrders.filter(o => o.status === 'confirmed').length,
    shipped: vendorOrders.filter(o => o.status === 'shipped').length,
    delivered: vendorOrders.filter(o => o.status === 'delivered').length,
  };

  const totalRevenue = vendorOrders.reduce((sum, order) => sum + order.totalAmount, 0);

  return (
    <main className="flex-1 overflow-auto">
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Customer Orders</h1>
          <p className="text-muted-foreground mt-2">Manage incoming orders from your customers</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
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
              <div className="text-2xl font-bold">{stats.confirmed}</div>
              <p className="text-xs text-muted-foreground mt-1">Confirmed</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.shipped}</div>
              <p className="text-xs text-muted-foreground mt-1">Shipped</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4">
              <div className="text-lg font-bold text-primary">
                <Money amountUSD={totalRevenue} notation="compact" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Revenue</p>
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
              const buyer = mockUsers.find(u => u.id === order.buyerId);
              return (
                <Card key={order.id} className="border-border/50 hover:border-primary/30 transition-colors">
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      {/* Order Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{buyer?.company || buyer?.name}</h3>
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
                            <p className="text-xs text-muted-foreground">Amount</p>
                            <p className="font-bold text-primary">
                              <Money amountUSD={order.totalAmount} />
                            </p>
                          </div>
                        </div>

                        {/* Items Summary */}
                        <div className="mt-3 p-2 bg-secondary/50 rounded text-sm space-y-1 max-h-20 overflow-y-auto">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Qty: {item.quantity}</span>
                              <span className="font-medium">
                                <Money amountUSD={item.subtotal} />
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Shipping */}
                        {order.shippingAddress && (
                          <div className="mt-3 p-2 bg-secondary/30 rounded text-xs">
                            <p className="text-muted-foreground">Shipping: <span className="font-medium text-foreground">{order.shippingAddress}</span></p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 md:flex-col md:gap-3">
                        {order.status === 'pending' && (
                          <Button size="sm" className="flex-1 md:flex-none md:w-28">
                            Confirm Order
                          </Button>
                        )}
                        {order.status === 'confirmed' && (
                          <Button size="sm" className="flex-1 md:flex-none md:w-28">
                            Mark Shipped
                          </Button>
                        )}
                        {['pending', 'confirmed', 'shipped'].includes(order.status) && (
                          <Button variant="outline" size="sm" className="flex-1 md:flex-none md:w-28">
                            Cancel
                          </Button>
                        )}
                        <Link href={`/vendor/orders/${order.id}`} className="flex-1 md:flex-none">
                          <Button variant="outline" size="sm" className="w-full md:w-28">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
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
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
