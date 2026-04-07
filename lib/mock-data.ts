import { User, VendorProfile, Product, Order, Message, Quote, Conversation } from './types';

// Mock users
export const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'john@buyer.com',
    name: 'John Davis',
    role: 'buyer',
    company: 'Tech Solutions Inc',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: 'user-2',
    email: 'sarah@vendor.com',
    name: 'Sarah Chen',
    role: 'vendor',
    company: 'Premium Manufacturing',
    createdAt: new Date('2023-06-20'),
  },
  {
    id: 'user-3',
    email: 'admin@southcaravan.com',
    name: 'Alex Admin',
    role: 'admin',
    company: 'SouthCaravan',
    createdAt: new Date('2023-01-01'),
  },
  {
    id: 'user-4',
    email: 'mike@vendor.com',
    name: 'Mike Johnson',
    role: 'vendor',
    company: 'Industrial Parts Co',
    createdAt: new Date('2023-08-10'),
  },
  {
    id: 'user-5',
    email: 'lisa@buyer.com',
    name: 'Lisa Wong',
    role: 'buyer',
    company: 'Global Enterprises',
    createdAt: new Date('2024-02-05'),
  },
];

// Mock vendor profiles
export const mockVendors: VendorProfile[] = [
  {
    id: 'vendor-1',
    userId: 'user-2',
    companyName: 'Premium Manufacturing',
    description: 'Leading supplier of industrial components and machinery parts',
    website: 'www.premiummanufacturing.com',
    phone: '+1-555-0123',
    email: 'sales@premiummanufacturing.com',
    address: '123 Industrial Ave',
    city: 'Chicago',
    state: 'IL',
    zipCode: '60601',
    country: 'USA',
    rating: 4.8,
    reviewCount: 342,
    verified: true,
    createdAt: new Date('2023-06-20'),
  },
  {
    id: 'vendor-2',
    userId: 'user-4',
    companyName: 'Industrial Parts Co',
    description: 'Specialized in precision engineering and custom fabrication',
    website: 'www.industrialparts.com',
    phone: '+1-555-0456',
    email: 'support@industrialparts.com',
    address: '456 Factory Blvd',
    city: 'Detroit',
    state: 'MI',
    zipCode: '48201',
    country: 'USA',
    rating: 4.6,
    reviewCount: 218,
    verified: true,
    createdAt: new Date('2023-08-10'),
  },
];

// Mock products
export const mockProducts: Product[] = [
  {
    id: 'prod-1',
    vendorId: 'vendor-1',
    name: 'Stainless Steel Bearings',
    description: 'Premium quality stainless steel ball bearings for industrial applications',
    category: 'Bearings',
    price: 45.99,
    minimumOrder: 100,
    unit: 'piece',
    images: [],
    inStock: true,
    specifications: {
      'Outer Diameter': '52mm',
      'Inner Diameter': '25mm',
      'Material': 'Stainless Steel 440C',
      'Grade': 'P6',
    },
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-03-15'),
  },
  {
    id: 'prod-2',
    vendorId: 'vendor-1',
    name: 'Aluminum Extrusion Profiles',
    description: 'Custom aluminum extrusion profiles for various industrial uses',
    category: 'Materials',
    price: 12.5,
    minimumOrder: 500,
    unit: 'meter',
    images: [],
    inStock: true,
    specifications: {
      'Alloy': '6061-T6',
      'Standard': 'ISO 6060',
      'Finish': 'Anodized',
    },
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-03-10'),
  },
  {
    id: 'prod-3',
    vendorId: 'vendor-2',
    name: 'Precision Machined Components',
    description: 'Custom precision machined parts with tolerances up to 0.001 inches',
    category: 'Machining',
    price: 125.0,
    minimumOrder: 50,
    unit: 'piece',
    images: [],
    inStock: true,
    specifications: {
      'Material': 'Aluminum 7075-T73',
      'Surface Finish': 'Ra 0.8µm',
      'Lead Time': '2-3 weeks',
    },
    createdAt: new Date('2023-12-15'),
    updatedAt: new Date('2024-03-12'),
  },
  {
    id: 'prod-4',
    vendorId: 'vendor-2',
    name: 'CNC Turned Parts',
    description: 'High-precision CNC turned parts for automotive and aerospace',
    category: 'Machining',
    price: 8.75,
    minimumOrder: 1000,
    unit: 'piece',
    images: [],
    inStock: false,
    specifications: {
      'Material': 'Steel 1018',
      'Diameter Range': '3-50mm',
      'Thread Sizes': 'M3-M12',
    },
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-03-08'),
  },
];

// Mock orders
export const mockOrders: Order[] = [
  {
    id: 'order-1',
    buyerId: 'user-1',
    vendorId: 'vendor-1',
    items: [
      { productId: 'prod-1', quantity: 500, unitPrice: 45.99, subtotal: 22995 },
    ],
    status: 'shipped',
    totalAmount: 22995,
    shippingAddress: '789 Business Park, New York, NY 10001',
    notes: 'Please ship ASAP',
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-10'),
    estimatedDelivery: new Date('2024-03-20'),
  },
  {
    id: 'order-2',
    buyerId: 'user-1',
    vendorId: 'vendor-2',
    items: [
      { productId: 'prod-3', quantity: 200, unitPrice: 125.0, subtotal: 25000 },
    ],
    status: 'confirmed',
    totalAmount: 25000,
    shippingAddress: '789 Business Park, New York, NY 10001',
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-03-12'),
    estimatedDelivery: new Date('2024-03-30'),
  },
  {
    id: 'order-3',
    buyerId: 'user-5',
    vendorId: 'vendor-1',
    items: [
      { productId: 'prod-2', quantity: 1000, unitPrice: 12.5, subtotal: 12500 },
    ],
    status: 'pending',
    totalAmount: 12500,
    shippingAddress: '321 Corporate Way, Los Angeles, CA 90001',
    createdAt: new Date('2024-03-14'),
    updatedAt: new Date('2024-03-14'),
  },
];

// Mock conversations
export const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    participants: ['user-1', 'user-2'],
    updatedAt: new Date('2024-03-15'),
  },
  {
    id: 'conv-2',
    participants: ['user-1', 'user-4'],
    updatedAt: new Date('2024-03-12'),
  },
  {
    id: 'conv-3',
    participants: ['user-5', 'user-2'],
    updatedAt: new Date('2024-03-10'),
  },
];

// Mock messages
export const mockMessages: Message[] = [
  {
    id: 'msg-1',
    senderId: 'user-2',
    recipientId: 'user-1',
    conversationId: 'conv-1',
    content: 'Hi John, thanks for your order. We are processing it now.',
    createdAt: new Date('2024-03-15T10:30:00'),
    read: true,
  },
  {
    id: 'msg-2',
    senderId: 'user-1',
    recipientId: 'user-2',
    conversationId: 'conv-1',
    content: 'Great! When can I expect delivery?',
    createdAt: new Date('2024-03-15T10:45:00'),
    read: true,
  },
  {
    id: 'msg-3',
    senderId: 'user-2',
    recipientId: 'user-1',
    conversationId: 'conv-1',
    content: 'Estimated delivery is March 20th. I will send you tracking info soon.',
    createdAt: new Date('2024-03-15T11:00:00'),
    read: false,
  },
];

// Mock quotes
export const mockQuotes: Quote[] = [
  {
    id: 'quote-1',
    vendorId: 'vendor-1',
    buyerId: 'user-1',
    items: [
      { productId: 'prod-1', quantity: 1000, unitPrice: 43.0, subtotal: 43000 },
      { productId: 'prod-2', quantity: 2000, unitPrice: 11.5, subtotal: 23000 },
    ],
    totalAmount: 66000,
    validUntil: new Date('2024-03-25'),
    status: 'pending',
    createdAt: new Date('2024-03-14'),
  },
  {
    id: 'quote-2',
    vendorId: 'vendor-2',
    buyerId: 'user-5',
    items: [
      { productId: 'prod-3', quantity: 500, unitPrice: 120.0, subtotal: 60000 },
    ],
    totalAmount: 60000,
    validUntil: new Date('2024-03-22'),
    status: 'accepted',
    createdAt: new Date('2024-03-10'),
  },
];
