'use client';

import { useState } from 'react';
import Link from 'next/link';
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
import { Eye, Filter, Download } from 'lucide-react';
import { mockOrders, mockUsers, mockVendors } from '@/lib/mock-data';

export default function AdminOrdersPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredOrders = statusFilter === 'all'
    ? mockOrders
    : mockOrders.filter(o => o.status === statusFilter);

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-400',
    confirmed: 'bg-blue-500/10 text-blue-400',
    shipped: 'bg-purple-500/10 text-purple-400',
    delivered: 'bg-green-500/10 text-green-400',
    cancelled: 'bg-red-500/10 text-red-400',
  };

  const stats = {
    total: mockOrders.length,
    pending: mockOrders.filter(o => o.status === 'pending').length,
    shipped: mockOrders.filter(o => o.status === 'shipped').length,
    delivered: mockOrders.filter(o => o.status === 'delivered').length,
    cancelled: mockOrders.filter(o => o.status === 'cancelled').length,
    totalGMV: mockOrders.reduce((sum, o) => sum + o.totalAmount, 0),
  };

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
              <div className="text-2xl font-bold">${(stats.totalGMV / 1000).toFixed(1)}k</div>
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
                    {filteredOrders.map(order => {
                      const buyer = mockUsers.find(u => u.id === order.buyerId);
                      const vendor = mockVendors.find(v => v.id === order.vendorId);
                      return (
                        <tr key={order.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                          <td className="py-3 px-4 font-mono text-xs">{order.id.slice(-6)}</td>
                          <td className="py-3 px-4">
                            <div className="text-sm font-medium">{buyer?.name}</div>
                            <div className="text-xs text-muted-foreground">{buyer?.company}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm font-medium">{vendor?.companyName}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm">{order.items.length}</span>
                          </td>
                          <td className="py-3 px-4 font-bold text-primary">
                            ${order.totalAmount.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {order.createdAt.toLocaleDateString()}
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
                    })}
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
