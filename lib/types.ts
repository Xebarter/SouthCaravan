// User types
export type UserRole = 'admin' | 'vendor' | 'buyer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  company?: string;
  avatar?: string;
  createdAt: Date;
}

// Vendor types
export interface VendorProfile {
  id: string;
  userId: string;
  companyName: string;
  description: string;
  logo?: string;
  website?: string;
  phone?: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  createdAt: Date;
}

// Product types
export interface Product {
  id: string;
  vendorId: string;
  name: string;
  description: string;
  category: string;
  price: number;
  minimumOrder: number;
  unit: string;
  images: string[];
  inStock: boolean;
  specifications?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

// Order types
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  buyerId: string;
  vendorId: string;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  shippingAddress: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  estimatedDelivery?: Date;
}

// Message types
export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  conversationId: string;
  content: string;
  createdAt: Date;
  read: boolean;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  updatedAt: Date;
}

// Quote types
export interface Quote {
  id: string;
  vendorId: string;
  buyerId: string;
  items: OrderItem[];
  totalAmount: number;
  validUntil: Date;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: Date;
}

// Analytics types
export interface VendorAnalytics {
  vendorId: string;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  topProducts: { id: string; name: string; sales: number }[];
  monthlyRevenue: { month: string; revenue: number }[];
}

export interface BuyerAnalytics {
  buyerId: string;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  topVendors: { id: string; name: string; purchases: number }[];
  monthlySpending: { month: string; spending: number }[];
}
