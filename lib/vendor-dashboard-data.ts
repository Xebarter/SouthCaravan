import {
  mockMessages,
  mockOrders,
  mockProducts,
  mockQuotes,
  mockUsers,
  mockVendors,
} from '@/lib/mock-data';
import type { Order, Product, Quote, User, VendorProfile } from '@/lib/types';

/** Demo vendor user when visiting the console without signing in (sarah@vendor.com). */
export const VENDOR_CONSOLE_DEMO_USER_ID = 'user-2';

export function getVendorConsoleUserId(user: User | null | undefined): string {
  if (user?.role === 'vendor') {
    return user.id;
  }
  return VENDOR_CONSOLE_DEMO_USER_ID;
}

export function getVendorProfileForConsole(user: User | null | undefined): VendorProfile | null {
  const uid = getVendorConsoleUserId(user);
  return mockVendors.find((v) => v.userId === uid) ?? mockVendors[0] ?? null;
}

export type VendorMonthlyPoint = { month: string; revenue: number };

export interface VendorBusinessSnapshot {
  vendor: VendorProfile;
  orders: Order[];
  products: Product[];
  quotes: Quote[];
  totalRevenue: number;
  pendingOrders: number;
  lowStockCount: number;
  uniqueBuyers: number;
  pendingQuotes: number;
  unreadMessages: number;
  recentOrders: Order[];
  topProducts: { product: Product; revenue: number }[];
  orderStatusCounts: Record<string, number>;
  monthlyRevenue: VendorMonthlyPoint[];
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'short' });
}

export function getVendorBusinessSnapshot(userId: string): VendorBusinessSnapshot | null {
  const vendor = mockVendors.find((v) => v.userId === userId);
  if (!vendor) return null;

  const orders = mockOrders.filter((o) => o.vendorId === vendor.id);
  const products = mockProducts.filter((p) => p.vendorId === vendor.id);
  const quotes = mockQuotes.filter((q) => q.vendorId === vendor.id);

  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingOrders = orders.filter((o) => o.status === 'pending').length;
  const lowStockCount = products.filter((p) => !p.inStock).length;
  const uniqueBuyers = new Set(orders.map((o) => o.buyerId)).size;
  const pendingQuotes = quotes.filter((q) => q.status === 'pending').length;
  const unreadMessages = mockMessages.filter(
    (m) => m.recipientId === userId && !m.read,
  ).length;

  const recentOrders = [...orders]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 6);

  const revenueByProduct = new Map<string, number>();
  for (const order of orders) {
    for (const line of order.items) {
      revenueByProduct.set(
        line.productId,
        (revenueByProduct.get(line.productId) ?? 0) + line.subtotal,
      );
    }
  }
  const topProducts = products
    .map((product) => ({
      product,
      revenue: revenueByProduct.get(product.id) ?? 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const orderStatusCounts: Record<string, number> = {};
  for (const order of orders) {
    orderStatusCounts[order.status] = (orderStatusCounts[order.status] ?? 0) + 1;
  }

  const monthTotals = new Map<string, number>();
  for (const order of orders) {
    const key = monthKey(order.createdAt);
    monthTotals.set(key, (monthTotals.get(key) ?? 0) + order.totalAmount);
  }
  const sortedKeys = [...monthTotals.keys()].sort();
  const lastSix = sortedKeys.slice(-6);
  const monthlyRevenue: VendorMonthlyPoint[] = lastSix.map((key) => ({
    month: formatMonthLabel(key),
    revenue: Math.round(monthTotals.get(key) ?? 0),
  }));

  if (monthlyRevenue.length === 0) {
    monthlyRevenue.push({ month: '—', revenue: 0 });
  }

  return {
    vendor,
    orders,
    products,
    quotes,
    totalRevenue,
    pendingOrders,
    lowStockCount,
    uniqueBuyers,
    pendingQuotes,
    unreadMessages,
    recentOrders,
    topProducts,
    orderStatusCounts,
    monthlyRevenue,
  };
}

export function getBuyerLabel(buyerId: string): string {
  const buyer = mockUsers.find((u) => u.id === buyerId);
  return buyer?.company || buyer?.name || buyerId;
}
