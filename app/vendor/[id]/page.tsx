'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Globe,
  Phone,
  Mail,
  MapPin,
  ArrowLeft,
  ShoppingCart,
  MessageSquare,
  Star,
} from 'lucide-react';
import { mockVendors, mockProducts } from '@/lib/mock-data';
import { stripHtmlForPreview } from '@/lib/strip-html';

interface VendorDetailPageProps {
  params: {
    id: string;
  };
}

export default function VendorDetailPage({ params }: VendorDetailPageProps) {
  const vendor = mockVendors.find(v => v.id === params.id);
  const vendorProducts = mockProducts.filter(p => p.vendorId === params.id);

  if (!vendor) {
    return (
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/catalog">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Catalog
            </Button>
          </Link>
          <Card className="border-border/50">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Vendor not found.</p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-auto">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link href="/catalog">
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Catalog
          </Button>
        </Link>

        {/* Vendor Header */}
        <Card className="mb-8 border-border/50">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Logo/Badge */}
              <div className="flex items-center justify-center">
                <div className="w-24 h-24 rounded-lg bg-primary/10 flex items-center justify-center">
                  <div className="text-3xl font-bold text-primary">
                    {vendor.companyName.charAt(0)}
                  </div>
                </div>
              </div>

              {/* Company Info */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold">{vendor.companyName}</h1>
                  {vendor.verified && (
                    <Badge className="bg-green-500/10 text-green-400">Verified</Badge>
                  )}
                </div>
                <p className="text-muted-foreground mb-4">{vendor.description}</p>

                {/* Rating */}
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(vendor.rating) ? 'fill-primary text-primary' : 'text-muted'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">{vendor.rating.toFixed(1)}/5</span>
                  <span className="text-sm text-muted-foreground">({vendor.reviewCount} reviews)</span>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Mail className="w-4 h-4" />
                    Email
                  </div>
                  <p className="font-medium">{vendor.email}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Phone className="w-4 h-4" />
                    Phone
                  </div>
                  <p className="font-medium">{vendor.phone}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <MapPin className="w-4 h-4" />
                    Location
                  </div>
                  <p className="font-medium">{vendor.city}, {vendor.state}</p>
                </div>
                {vendor.website && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Globe className="w-4 h-4" />
                      Website
                    </div>
                    <a href={`https://${vendor.website}`} className="font-medium text-primary hover:underline">
                      {vendor.website}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 pt-6 border-t border-border/50 flex gap-3">
              <Button className="flex-1">
                <MessageSquare className="w-4 h-4 mr-2" />
                Contact Vendor
              </Button>
              <Button variant="outline" className="flex-1">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Request Quote
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Products */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Products & Services</h2>
          {vendorProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vendorProducts.map(product => (
                <Card key={product.id} className="border-border/50 hover:border-primary/30 transition-colors overflow-hidden flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base line-clamp-2">{product.name}</CardTitle>
                          <p className="text-xs text-muted-foreground mt-1">{product.category}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ml-2 ${
                          product.inStock
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}>
                          {product.inStock ? 'In Stock' : 'Out'}
                        </span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pb-3 flex-1 flex flex-col">
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{stripHtmlForPreview(product.description)}</p>

                    {/* Pricing */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Unit Price:</span>
                        <span className="text-lg font-bold text-primary">${product.price}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Min Order:</span>
                        <span className="text-sm font-medium">{product.minimumOrder} {product.unit}</span>
                      </div>
                    </div>

                    {/* Specifications */}
                    {product.specifications && Object.keys(product.specifications).length > 0 && (
                      <div className="mb-4 p-2 bg-secondary/30 rounded text-xs space-y-1">
                        {Object.entries(product.specifications).slice(0, 2).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-muted-foreground">{key}:</span>
                            <span className="font-medium">{value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>

                  {/* Action Button */}
                  <div className="p-4 pt-0">
                    <Link href={`/product/${product.id}`} className="w-full block">
                      <Button className="w-full" disabled={!product.inStock}>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        {product.inStock ? 'View & Order' : 'Out of Stock'}
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-border/50">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No products available at this time.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
