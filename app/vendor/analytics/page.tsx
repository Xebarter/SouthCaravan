'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
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
  Loader2,
  Package,
  ShoppingBag,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Money } from '@/components/money';
import { useAuth } from '@/lib/auth-context';

const PERIODS = ['7D', '30D', '90D', 'All'] as const;
type Period = typeof PERIODS[number];

const STATUS_COLORS: Record<string, string> = {
  pending:   '#f59e0b',
  confirmed: '#0f766e',
  shipped:   '#7c3aed',
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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/vendor/analytics?period=${encodeURIComponent(period)}`, { cache: 'no-store' });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error ?? 'Failed to load analytics');
        if (!cancelled) setData(json);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load analytics');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, period]);

  if (!user) return null;

  const totalRevenue = Number(data?.totalRevenue ?? 0);
  const totalOrders = Number(data?.totalOrders ?? 0);
  const avgOrderValue = Number(data?.avgOrderValue ?? 0);
  const uniqueBuyers = Number(data?.uniqueBuyers ?? 0);
  const monthlyRevenue = Array.isArray(data?.monthlyRevenue) ? data.monthlyRevenue : [{ month: '—', revenue: 0 }];
  const orderStatusCounts = data?.orderStatusCounts && typeof data.orderStatusCounts === 'object' ? data.orderStatusCounts : {};
  const orderStatusData = useMemo(
    () => Object.entries(orderStatusCounts).map(([name, value]) => ({ name, value: Number(value) || 0 })),
    [orderStatusCounts],
  );

  const topProducts = useMemo(() => {
    const raw = Array.isArray(data?.topProducts) ? data.topProducts : [];
    const denom = totalRevenue > 0 ? totalRevenue : 1;
    return raw.slice(0, 5).map((p: any) => {
      const name = String(p.name ?? 'Product');
      const revenue = Number(p.revenue ?? 0);
      const pct = Math.max(0, Math.min(100, Math.round((revenue / denom) * 100)));
      return {
        name: name.length > 26 ? name.slice(0, 26) + '…' : name,
        revenue,
        pct,
      };
    });
  }, [data, totalRevenue]);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Performance overview for your storefront
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

      {loading ? (
        <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading analytics…</span>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

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
          value={totalOrders}
          sub={`${Number(orderStatusCounts?.pending ?? 0)} awaiting action`}
          icon={ShoppingBag}
          iconBg="bg-primary"
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
              <AreaChart data={monthlyRevenue} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
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
