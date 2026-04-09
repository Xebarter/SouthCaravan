'use client';

import { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Package,
  ShoppingBag,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Money } from '@/components/money';
import { mockOrders, mockProducts } from '@/lib/mock-data';
import { useAuth } from '@/lib/auth-context';
import { getVendorProfileForConsole } from '@/lib/vendor-dashboard-data';

const PERIODS = ['7D', '30D', '90D', 'All'] as const;
type Period = typeof PERIODS[number];

const MONTHLY_DATA = [
  { month: 'Nov', revenue: 18400, orders: 24 },
  { month: 'Dec', revenue: 24800, orders: 31 },
  { month: 'Jan', revenue: 19200, orders: 26 },
  { month: 'Feb', revenue: 28600, orders: 38 },
  { month: 'Mar', revenue: 32100, orders: 42 },
  { month: 'Apr', revenue: 27400, orders: 35 },
];

const STATUS_COLORS: Record<string, string> = {
  pending:   '#f59e0b',
  confirmed: '#3b82f6',
  shipped:   '#8b5cf6',
  delivered: '#10b981',
  cancelled: '#f43f5e',
};

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  trend,
  iconBg,
}: {
  title: string;
  value: React.ReactNode;
  sub: string;
  icon: React.ElementType;
  trend?: number;
  iconBg: string;
}) {
  const up = trend === undefined || trend >= 0;
  return (
    <Card className="border-border/60">
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start justify-between gap-3">
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', iconBg)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          {trend !== undefined && (
            <span
              className={cn(
                'flex items-center gap-0.5 text-xs font-semibold',
                up ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500',
              )}
            >
              {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              {Math.abs(trend)}%
            </span>
          )}
        </div>
        <div className="mt-4">
          <p className="text-2xl font-bold tracking-tight tabular-nums">{value}</p>
          <p className="mt-0.5 text-sm font-medium text-foreground/80">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-xl text-xs">
      <p className="font-semibold mb-1.5 text-foreground">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.dataKey} style={{ color: entry.color }} className="flex items-center gap-1">
          <span className="capitalize">{entry.dataKey}:</span>
          <span className="font-semibold">
            {entry.dataKey === 'revenue'
              ? `$${Number(entry.value).toLocaleString()}`
              : entry.value}
          </span>
        </p>
      ))}
    </div>
  );
}

export default function VendorAnalyticsPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>('30D');

  const vendor = getVendorProfileForConsole(user);
  if (!vendor) return null;

  const vendorOrders = mockOrders.filter((o) => o.vendorId === vendor.id);
  const vendorProducts = mockProducts.filter((p) => p.vendorId === vendor.id);
  const totalRevenue = vendorOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const avgOrderValue = vendorOrders.length > 0 ? totalRevenue / vendorOrders.length : 0;
  const uniqueBuyers = new Set(vendorOrders.map((o) => o.buyerId)).size;

  const orderStatusData = useMemo(
    () =>
      Object.entries(
        vendorOrders.reduce<Record<string, number>>((acc, o) => {
          acc[o.status] = (acc[o.status] ?? 0) + 1;
          return acc;
        }, {}),
      ).map(([name, value]) => ({ name, value })),
    [vendorOrders],
  );

  const topProducts = useMemo(
    () =>
      vendorProducts.slice(0, 5).map((p, i) => {
        const shares = [0.35, 0.25, 0.20, 0.12, 0.08];
        const revenue = Math.round(totalRevenue * (shares[i] ?? 0));
        const pct = Math.round((shares[i] ?? 0) * 100);
        return {
          name: p.name.length > 26 ? p.name.slice(0, 26) + '…' : p.name,
          revenue,
          pct,
        };
      }),
    [vendorProducts, totalRevenue],
  );

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Performance overview for {vendor.companyName}
          </p>
        </div>
        <div className="flex rounded-lg border border-border overflow-hidden w-fit">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'px-4 py-1.5 text-xs font-semibold transition-colors',
                period === p
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary',
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={<Money amountUSD={totalRevenue} notation="compact" />}
          sub="Lifetime gross earnings"
          icon={DollarSign}
          iconBg="bg-emerald-500"
          trend={12}
        />
        <StatCard
          title="Total Orders"
          value={vendorOrders.length}
          sub={`${vendorOrders.filter((o) => o.status === 'pending').length} awaiting action`}
          icon={ShoppingBag}
          iconBg="bg-blue-500"
          trend={8}
        />
        <StatCard
          title="Avg. Order Value"
          value={<Money amountUSD={avgOrderValue} />}
          sub="Per completed order"
          icon={DollarSign}
          iconBg="bg-violet-500"
          trend={-3}
        />
        <StatCard
          title="Unique Buyers"
          value={uniqueBuyers}
          sub="Across all orders"
          icon={Users}
          iconBg="bg-amber-500"
          trend={5}
        />
      </div>

      {/* Revenue chart + Status donut */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 border-border/60">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold">Revenue over time</CardTitle>
                <CardDescription className="text-xs mt-0.5">Monthly gross revenue — last 6 months</CardDescription>
              </div>
              <Badge variant="outline" className="text-[11px] shrink-0">Last 6 months</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={MONTHLY_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="vendorRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  fill="url(#vendorRevenueGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#7c3aed', strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Order status</CardTitle>
            <CardDescription className="text-xs">Breakdown across all orders</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {orderStatusData.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                No orders yet
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={78}
                      dataKey="value"
                      paddingAngle={3}
                    >
                      {orderStatusData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={STATUS_COLORS[entry.name] ?? '#94a3b8'}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-3 space-y-2">
                  {orderStatusData.map((entry) => (
                    <div key={entry.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ background: STATUS_COLORS[entry.name] ?? '#94a3b8' }}
                        />
                        <span className="capitalize text-muted-foreground">{entry.name}</span>
                      </div>
                      <span className="font-semibold tabular-nums">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top products ranked list */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Top products by revenue</CardTitle>
          <CardDescription className="text-xs">Your best-performing listings this period</CardDescription>
        </CardHeader>
        <CardContent>
          {topProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
              <Package className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No product data yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {topProducts.map((product, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="w-5 shrink-0 text-center text-xs font-bold text-muted-foreground tabular-nums">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium truncate">{product.name}</span>
                      <span className="text-sm font-semibold tabular-nums ml-4 shrink-0">
                        <Money amountUSD={product.revenue} />
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-violet-500 transition-all"
                        style={{ width: `${product.pct}%` }}
                      />
                    </div>
                  </div>
                  <span className="shrink-0 w-9 text-right text-xs text-muted-foreground tabular-nums">
                    {product.pct}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
