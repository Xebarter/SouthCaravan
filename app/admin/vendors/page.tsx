'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Money } from '@/components/money';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Mail, Phone, Star, Eye } from 'lucide-react';
import { mockVendors, mockOrders, mockUsers, mockProducts } from '@/lib/mock-data';

export default function AdminVendorsPage() {
  const verifiedVendors = mockVendors.filter(v => v.verified).length;
  const unverifiedVendors = mockVendors.filter(v => !v.verified).length;
  const totalVendorRevenue = mockOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <main className="flex-1 overflow-auto">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Vendor Management</h1>
          <p className="text-muted-foreground mt-2">Manage vendors and verify seller accounts</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-border/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{mockVendors.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Total Vendors</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{verifiedVendors}</div>
              <p className="text-xs text-muted-foreground mt-1">Verified</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{unverifiedVendors}</div>
              <p className="text-xs text-muted-foreground mt-1">Pending Verification</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4">
              <div className="text-lg font-bold text-primary">
                <Money amountUSD={totalVendorRevenue} notation="compact" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Platform Revenue</p>
            </CardContent>
          </Card>
        </div>

        {/* Vendors List */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Vendors</CardTitle>
            <CardDescription>All registered vendors on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockVendors.map(vendor => {
                const vendorUser = mockUsers.find(u => u.id === vendor.userId);
                const vendorOrders = mockOrders.filter(o => o.vendorId === vendor.id);
                const vendorProducts = mockProducts.filter(p => p.vendorId === vendor.id);
                const vendorRevenue = vendorOrders.reduce((sum, o) => sum + o.totalAmount, 0);

                return (
                  <div key={vendor.id} className="flex items-start justify-between p-4 border border-border/50 rounded-lg hover:bg-secondary/50 transition-colors">
                    <div className="flex gap-4 flex-1">
                      {/* Logo */}
                      <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <div className="text-2xl font-bold text-primary">
                          {vendor.companyName.charAt(0)}
                        </div>
                      </div>

                      {/* Company Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg">{vendor.companyName}</h3>
                          {vendor.verified && (
                            <Badge className="bg-green-500/10 text-green-400 text-xs">Verified</Badge>
                          )}
                          {!vendor.verified && (
                            <Badge variant="outline" className="text-xs">Pending</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">{vendor.description}</p>

                        {/* Contact Info */}
                        <div className="flex flex-wrap gap-3 mt-2 text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="w-4 h-4" />
                            <span className="text-xs">{vendor.email}</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="w-4 h-4" />
                            <span className="text-xs">{vendor.phone}</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Star className="w-4 h-4 fill-primary text-primary" />
                            <span className="text-xs font-medium">{vendor.rating.toFixed(1)}/5 ({vendor.reviewCount})</span>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="mt-3 flex flex-wrap gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Owner: </span>
                            <span className="font-medium">{vendorUser?.name}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Products: </span>
                            <span className="font-medium">{vendorProducts.length}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Orders: </span>
                            <span className="font-medium">{vendorOrders.length}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Revenue: </span>
                            <span className="font-bold text-primary">
                              <Money amountUSD={vendorRevenue} notation="compact" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 ml-4 flex-shrink-0">
                      <Link href={`/admin/vendors/${vendor.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            id={`admin-vendor-actions-${vendor.id}`}
                            variant="ghost"
                            size="sm"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!vendor.verified && (
                            <DropdownMenuItem className="text-green-400">
                              Verify Vendor
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem>View Products</DropdownMenuItem>
                          <DropdownMenuItem>View Orders</DropdownMenuItem>
                          <DropdownMenuItem>Send Message</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            Suspend Account
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
