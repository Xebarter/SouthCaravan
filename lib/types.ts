// User types
export type UserRole = 'admin' | 'vendor' | 'services' | 'buyer';

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

// ─── Blog types ──────────────────────────────────────────────────────────────

export type BlogPostStatus = 'draft' | 'published' | 'archived' | 'scheduled';

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  post_count: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
  post_count: number;
  created_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  cover_image?: string;
  cover_image_alt?: string;
  status: BlogPostStatus;
  author_id?: string;
  author_name: string;
  author_avatar?: string;
  category_id?: string;
  category?: BlogCategory;
  tags?: BlogTag[];
  meta_title?: string;
  meta_description?: string;
  canonical_url?: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  featured: boolean;
  allow_comments: boolean;
  read_time_mins?: number;
  published_at?: string;
  scheduled_for?: string;
  created_at: string;
  updated_at: string;
}

export interface BlogComment {
  id: string;
  post_id: string;
  parent_id?: string;
  author_id?: string;
  author_name: string;
  author_email?: string;
  author_avatar?: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected' | 'spam';
  like_count: number;
  created_at: string;
  updated_at: string;
  replies?: BlogComment[];
}

export interface BlogSubscriber {
  id: string;
  email: string;
  name?: string;
  status: 'active' | 'unsubscribed' | 'bounced';
  confirmed: boolean;
  subscribed_at: string;
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
