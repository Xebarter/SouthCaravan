'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  TrendingUp,
  ShoppingCart,
  AlertCircle,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import { mockUsers, mockOrders, mockVendors, mockProducts } from '@/lib/mock-data';

export function AdminDashboard() {
  const totalRevenue = mockOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const verifiedVendors = mockVendors.filter(v => v.verified).length;
  const pendingOrders = mockOrders.filter(o => o.status === 'pending').length;

  return (
    <main className="flex-1 overflow-auto">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">Monitor platform health, users, and transactions</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(totalRevenue / 1000).toFixed(1)}k</div>
              <p className="text-xs text-muted-foreground mt-1">Platform GMV</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockUsers.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Total members</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockOrders.length}</div>
              <p className="text-xs text-muted-foreground mt-1">{pendingOrders} pending</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vendors</CardTitle>
              <CheckCircle className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockVendors.length}</div>
              <p className="text-xs text-muted-foreground mt-1">{verifiedVendors} verified</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="vendors">Vendors</TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Orders</CardTitle>
                    <CardDescription>Platform transactions and order status</CardDescription>
                  </div>
                  <Link href="/admin/orders">
                    <Button variant="outline" size="sm">Manage Orders</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockOrders.map((order) => {
                    const buyer = mockUsers.find(u => u.id === order.buyerId);
                    const vendor = mockVendors.find(v => v.id === order.vendorId);
                    return (
                      <div key={order.id} className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:bg-secondary/50 transition-colors">
                        <div className="flex-1">
                          <div className="font-medium">
                            {buyer?.company || buyer?.name} → {vendor?.companyName}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Order #{order.id.slice(-4).toUpperCase()} • ${order.totalAmount.toLocaleString()}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              order.status === 'delivered' ? 'bg-green-500/10 text-green-400' :
                              order.status === 'shipped' ? 'bg-blue-500/10 text-blue-400' :
                              order.status === 'confirmed' ? 'bg-yellow-500/10 text-yellow-400' :
                              'bg-gray-500/10 text-gray-400'
                            }`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {order.createdAt.toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Link href={`/admin/orders/${order.id}`}>
                          <Button variant="ghost" size="sm">
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>All platform users and their roles</CardDescription>
                  </div>
                  <Link href="/admin/users">
                    <Button variant="outline" size="sm">Manage Users</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockUsers.map((user) => {
                    const userOrders = mockOrders.filter(o => 
                      o.buyerId === user.id || o.vendorId === mockVendors.find(v => v.userId === user.id)?.id
                    ).length;
                    
                    return (
                      <div key={user.id} className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:bg-secondary/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">
                            {user.name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium">{user.name}</h3>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            user.role === 'admin' ? 'bg-purple-500/10 text-purple-400' :
                            user.role === 'vendor' ? 'bg-blue-500/10 text-blue-400' :
                            'bg-green-500/10 text-green-400'
                          }`}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </span>
                          <p className="text-xs text-muted-foreground mt-1">{userOrders} transactions</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vendors Tab */}
          <TabsContent value="vendors" className="space-y-4">
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Vendor Management</CardTitle>
                    <CardDescription>All registered vendors and their status</CardDescription>
                  </div>
                  <Link href="/admin/vendors">
                    <Button variant="outline" size="sm">Manage Vendors</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockVendors.map((vendor) => {
                    const vendorUser = mockUsers.find(u => u.id === vendor.userId);
                    const vendorOrders = mockOrders.filter(o => o.vendorId === vendor.id);
                    const vendorRevenue = vendorOrders.reduce((sum, o) => sum + o.totalAmount, 0);
                    
                    return (
                      <div key={vendor.id} className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:bg-secondary/50 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{vendor.companyName}</h3>
                            {vendor.verified && (
                              <span className="text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded">Verified</span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{vendorUser?.name} • {vendor.email}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-sm">Rating: {vendor.rating.toFixed(1)}/5</span>
                            <span className="text-sm text-muted-foreground">•</span>
                            <span className="text-sm">${(vendorRevenue / 1000).toFixed(1)}k revenue</span>
                            <span className="text-sm text-muted-foreground">•</span>
                            <span className="text-sm">{vendorOrders.length} orders</span>
                          </div>
                        </div>
                        <Link href={`/admin/vendors/${vendor.id}`}>
                          <Button variant="ghost" size="sm">
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
