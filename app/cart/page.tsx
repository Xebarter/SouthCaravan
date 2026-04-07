'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Trash2, ShoppingCart, Truck, Tags } from 'lucide-react';
import { setCheckoutLineItems } from '@/lib/checkout-session';

interface CartItem {
  id: string;
  name: string;
  vendor: string;
  price: number;
  quantity: number;
  image: string;
}

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([
    {
      id: '1',
      name: 'Industrial Component A',
      vendor: 'Premium Manufacturing',
      price: 145.99,
      quantity: 2,
      image: 'Component A',
    },
    {
      id: '2',
      name: 'Steel Fasteners (Box of 100)',
      vendor: 'Industrial Parts Co',
      price: 32.50,
      quantity: 3,
      image: 'Fasteners',
    },
  ]);

  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 500 ? 0 : 25;
  const tax = (subtotal + shipping - discount) * 0.08;
  const total = subtotal + shipping + tax - discount;

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems(items.map(item => (item.id === id ? { ...item, quantity } : item)));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const applyCoupon = () => {
    if (couponCode.toUpperCase() === 'WELCOME10') {
      setDiscount(subtotal * 0.1);
      setCouponCode('');
    }
  };

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: 'Shopping Cart' }]} />
        
        <div className="flex flex-col items-center justify-center py-12 space-y-6">
          <ShoppingCart className="w-16 h-16 text-muted-foreground" />
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Your cart is empty</h1>
            <p className="text-muted-foreground">Add products to your cart to get started</p>
          </div>
          <Link href="/catalog">
            <Button>Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <Breadcrumbs items={[{ label: 'Shopping Cart' }]} />

      <div>
        <h1 className="text-4xl font-bold text-foreground">Shopping Cart</h1>
        <p className="text-muted-foreground mt-2">{items.length} items in your cart</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <Card key={item.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-secondary rounded flex items-center justify-center flex-shrink-0">
                    <span className="text-xs text-muted-foreground">{item.image}</span>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="font-semibold text-foreground">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">{item.vendor}</p>
                    </div>
                    <p className="text-lg font-bold text-primary">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <button onClick={() => removeItem(item.id)} className="text-destructive hover:bg-destructive/10 p-2 rounded">
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="px-2 py-1 border border-border rounded hover:bg-secondary transition"
                      >
                        -
                      </button>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                        className="w-12 text-center"
                      />
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="px-2 py-1 border border-border rounded hover:bg-secondary transition"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Shipping Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Shipping Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {shipping === 0 ? (
                <div className="p-3 bg-primary/10 border border-primary/30 rounded text-primary">
                  Free shipping applied (order over $500)
                </div>
              ) : (
                <div className="text-muted-foreground">
                  <p>Standard Shipping: ${shipping.toFixed(2)}</p>
                  <p className="text-xs mt-1">Free shipping available on orders over $500</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm border-b border-border pb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-primary">
                    <span>Discount</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-semibold">${shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax (8%)</span>
                  <span className="font-semibold">${tax.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-border">
                <span className="font-bold text-lg">Total</span>
                <span className="text-2xl font-bold text-primary">${total.toFixed(2)}</span>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={() => {
                  setCheckoutLineItems(
                    items.map((item) => ({
                      id: item.id,
                      name: item.name,
                      vendor: item.vendor,
                      price: item.price,
                      quantity: item.quantity,
                      image: item.image,
                    })),
                    { discount },
                  );
                  router.push('/checkout');
                }}
              >
                Proceed to Checkout
              </Button>
              <Link href="/catalog">
                <Button variant="outline" className="w-full">
                  Continue Shopping
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Promo Code */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Tags className="w-5 h-5" />
                Promo Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
                <Button onClick={applyCoupon} variant="outline">
                  Apply
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Try code: WELCOME10</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
