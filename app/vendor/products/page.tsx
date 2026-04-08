'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { mockProducts } from '@/lib/mock-data';
import { stripHtmlForPreview } from '@/lib/strip-html';
import { useAuth } from '@/lib/auth-context';
import { getVendorProfileForConsole } from '@/lib/vendor-dashboard-data';
import { Money } from '@/components/money';

export default function VendorProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState(mockProducts);

  const vendor = getVendorProfileForConsole(user);
  if (!vendor) return null;

  const vendorProducts = products.filter(p => p.vendorId === vendor.id);

  const handleDelete = (productId: string) => {
    setProducts(products.filter(p => p.id !== productId));
  };

  return (
    <main className="flex-1 overflow-auto">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Product Catalog</h1>
            <p className="text-muted-foreground mt-2">Manage your product listings</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-border/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{vendorProducts.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Total Products</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{vendorProducts.filter(p => p.inStock).length}</div>
              <p className="text-xs text-muted-foreground mt-1">In Stock</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">
                <Money amountUSD={vendorProducts.reduce((sum, p) => sum + p.price, 0)} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total Value</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{vendorProducts.filter(p => !p.inStock).length}</div>
              <p className="text-xs text-muted-foreground mt-1">Out of Stock</p>
            </CardContent>
          </Card>
        </div>

        {/* Products Table */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Your Products</CardTitle>
            <CardDescription>Manage and monitor your product listings</CardDescription>
          </CardHeader>
          <CardContent>
            {vendorProducts.length > 0 ? (
              <div className="space-y-3 overflow-x-auto">
                <div className="inline-block w-full">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Product Name</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Category</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Price</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Min Order</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Status</th>
                        <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendorProducts.map(product => (
                        <tr key={product.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">{stripHtmlForPreview(product.description)}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline">{product.category}</Badge>
                          </td>
                          <td className="py-3 px-4 font-medium">
                            <Money amountUSD={Number(product.price)} />
                          </td>
                          <td className="py-3 px-4">{product.minimumOrder}</td>
                          <td className="py-3 px-4">
                            <Badge className={
                              product.inStock
                                ? 'bg-green-500/10 text-green-400'
                                : 'bg-red-500/10 text-red-400'
                            }>
                              {product.inStock ? 'In Stock' : 'Out of Stock'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  id={`vendor-product-actions-${product.id}`}
                                  variant="ghost"
                                  size="sm"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDelete(product.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-muted-foreground mb-4">You haven't added any products yet.</p>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Product
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
