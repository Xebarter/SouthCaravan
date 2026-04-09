'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  PackageCheck,
  PackageX,
  ShoppingBag,
  TrendingUp,
  Truck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Money } from '@/components/money';
import { mockOrders, mockUsers } from '@/lib/mock-data';
import { useAuth } from '@/lib/auth-context';
import { getVendorProfileForConsole } from '@/lib/vendor-dashboard-data';

type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
const ALL_TABS = ['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const;
type Tab = typeof ALL_TABS[number];

const STATUS_META: Record<OrderStatus, { label: string; badgeCn: string; icon: React.ElementType }> = {
  pending:   { label: 'Pending',   badgeCn: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400',     icon: Clock },
  confirmed: { label: 'Confirmed', badgeCn: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400',         icon: CheckCircle2 },
  shipped:   { label: 'Shipped',   badgeCn: 'bg-violet-500/10 text-violet-600 border-violet-500/20 dark:text-violet-400', icon: Truck },
  delivered: { label: 'Delivered', badgeCn: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400', icon: PackageCheck },
  cancelled: { label: 'Cancelled', badgeCn: 'bg-red-500/10 text-red-500 border-red-500/20',                               icon: PackageX },
};

export default function VendorOrdersPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('all');

  const vendor = getVendorProfileForConsole(user);
  if (!vendor) return null;

  const vendorOrders = mockOrders.filter((o) => o.vendorId === vendor.id);
  const totalRevenue = vendorOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const counts = useMemo(
    () =>
      ALL_TABS.reduce<Record<Tab, number>>(
        (acc, tab) => {
          acc[tab] =
            tab === 'all'
              ? vendorOrders.length
              : vendorOrders.filter((o) => o.status === tab).length;
          return acc;
        },
        {} as Record<Tab, number>,
      ),
    [vendorOrders],
  );

  const filtered = useMemo(
    () =>
      activeTab === 'all'
        ? vendorOrders
        : vendorOrders.filter((o) => o.status === activeTab),
    [vendorOrders, activeTab],
  );

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage and fulfil incoming customer orders
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(
          [
            {
              label: 'Total orders',
              value: vendorOrders.length,
              icon: ShoppingBag,
              color: 'bg-blue-500',
            },
            {
              label: 'Pending',
              value: counts.pending,
              icon: Clock,
              color: 'bg-amber-500',
            },
            {
              label: 'In transit',
              value: counts.shipped,
              icon: Truck,
              color: 'bg-violet-500',
            },
            {
              label: 'Lifetime revenue',
              value: <Money amountUSD={totalRevenue} notation="compact" />,
              icon: TrendingUp,
              color: 'bg-emerald-500',
            },
          ] as const
        ).map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="border-border/60">
            <CardContent className="pt-5 pb-4 flex items-center gap-3">
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                  color,
                )}
              >
                <Icon className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold leading-tight tabular-nums">{value}</p>
                <p className="text-xs text-muted-foreground truncate">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {ALL_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors',
              activeTab === tab
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-secondary text-muted-foreground hover:text-foreground',
            )}
          >
            <span className="capitalize">
              {tab === 'all' ? 'All orders' : STATUS_META[tab as OrderStatus]?.label ?? tab}
            </span>
            {counts[tab] > 0 && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-px text-[10px] font-bold tabular-nums',
                  activeTab === tab ? 'bg-white/25' : 'bg-border',
                )}
              >
                {counts[tab]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 text-center">
          <div className="rounded-full bg-secondary p-5 mb-5">
            <ShoppingBag className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <p className="text-sm font-semibold">No orders here</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            {activeTab === 'all'
              ? 'Orders will appear here once buyers start purchasing from your catalog.'
              : `You have no ${activeTab} orders right now.`}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-border/60 bg-secondary/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground tracking-wide">
                    Order
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground tracking-wide">
                    Customer
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground tracking-wide">
                    Date
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground tracking-wide">
                    Items
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground tracking-wide">
                    Total
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground tracking-wide">
                    Status
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground tracking-wide">
                    &nbsp;
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((order) => {
                  const buyer = mockUsers.find((u) => u.id === order.buyerId);
                  const meta = STATUS_META[order.status as OrderStatus];
                  const StatusIcon = meta?.icon;
                  return (
                    <tr
                      key={order.id}
                      className="group hover:bg-secondary/30 transition-colors"
                    >
                      <td className="px-5 py-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
                        #{order.id.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-sm leading-tight">
                          {buyer?.company || buyer?.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[180px]">
                          {buyer?.email}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-xs text-muted-foreground whitespace-nowrap">
                        {order.createdAt.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-5 py-4 text-xs text-muted-foreground">
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                      </td>
                      <td className="px-5 py-4 font-semibold tabular-nums text-sm">
                        <Money amountUSD={order.totalAmount} />
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
                            meta?.badgeCn,
                          )}
                        >
                          {StatusIcon && <StatusIcon className="h-3 w-3" />}
                          {meta?.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link href={`/vendor/orders/${order.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            View
                            <ChevronRight className="h-3.5 w-3.5" />
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
      )}
    </div>
  );
}
