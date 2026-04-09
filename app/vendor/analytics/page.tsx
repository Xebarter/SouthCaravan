'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, ShoppingCart, DollarSign } from 'lucide-react';
import { mockOrders, mockProducts } from '@/lib/mock-data';
import { Money } from '@/components/money';
import { useAuth } from '@/lib/auth-context';
import { getVendorProfileForConsole } from '@/lib/vendor-dashboard-data';

export default function VendorAnalyticsPage() {
  const { user } = useAuth();

  const vendor = getVendorProfileForConsole(user);
  if (!vendor) return null;

  const vendorOrders = mockOrders.filter(o => o.vendorId === vendor.id);
  const vendorProducts = mockProducts.filter(p => p.vendorId === vendor.id);
  const totalRevenue = vendorOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const avgOrderValue = vendorOrders.length > 0 ? totalRevenue / vendorOrders.length : 0;

  // Monthly revenue data
  const monthlyData = [
    { month: 'Jan', revenue: 4000 },
    { month: 'Feb', revenue: 3000 },
    { month: 'Mar', revenue: 2000 },
    { month: 'Apr', revenue: 2780 },
    { month: 'May', revenue: 1890 },
    { month: 'Jun', revenue: 2390 },
  ];

  // Product performance
  const topProducts = vendorProducts.slice(0, 3).map(p => ({
    name: p.name,
    sales: Math.floor(Math.random() * 100),
  }));

  // Customer breakdown
  const customerData = [
    { name: 'New Customers', value: 30 },
    { name: 'Repeat Customers', value: 70 },
  ];

  const COLORS = ['#6d28d9', '#2563eb'];

  // Order status breakdown
  const orderStatusData = vendorOrders.reduce((acc, order) => {
    const existing = acc.find(item => item.status === order.status);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ status: order.status, count: 1 });
    }
    return acc;
  }, [] as Array<{ status: string; count: number }>);

  return (
    <main className="flex-1 overflow-auto">
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-2">Monitor your business performance</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <Money amountUSD={totalRevenue} notation="compact" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <Money amountUSD={avgOrderValue} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{vendorOrders.length} orders</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{new Set(vendorOrders.map(o => o.buyerId)).size}</div>
              <p className="text-xs text-muted-foreground mt-1">Unique buyers</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Products</CardTitle>
              <ShoppingCart className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vendorProducts.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Active listings</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Revenue */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Monthly Revenue</CardTitle>
              <CardDescription>Revenue trend over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis stroke="var(--color-muted-foreground)" style={{ fontSize: '12px' }} />
                  <YAxis stroke="var(--color-muted-foreground)" style={{ fontSize: '12px' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-foreground)'
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="var(--color-primary)" strokeWidth={2} dot={{ fill: 'var(--color-primary)' }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Customer Breakdown */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Customer Breakdown</CardTitle>
              <CardDescription>New vs repeat customers</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={customerData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {customerData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-foreground)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Additional Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Top Products</CardTitle>
              <CardDescription>Best performing products by sales</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topProducts}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis stroke="var(--color-muted-foreground)" style={{ fontSize: '12px' }} />
                  <YAxis stroke="var(--color-muted-foreground)" style={{ fontSize: '12px' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-foreground)'
                    }}
                  />
                  <Bar dataKey="sales" fill="var(--color-primary)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Order Status */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
              <CardDescription>Breakdown of orders by status</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={orderStatusData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis type="number" stroke="var(--color-muted-foreground)" style={{ fontSize: '12px' }} />
                  <YAxis dataKey="status" type="category" stroke="var(--color-muted-foreground)" style={{ fontSize: '11px' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-foreground)'
                    }}
                  />
                  <Bar dataKey="count" fill="var(--color-primary)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
