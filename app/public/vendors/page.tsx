'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useState } from 'react';
import { Search, Star, MapPin, Package } from 'lucide-react';
import { mockVendors } from '@/lib/mock-data';

export default function PublicVendorsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    'all',
    'manufacturing',
    'distribution',
    'wholesale',
    'services',
    'retail',
  ];

  const filteredVendors = mockVendors.filter((vendor) => {
    const term = searchTerm.toLowerCase();
    const name = vendor.name?.toLowerCase?.() ?? '';
    const description = vendor.description?.toLowerCase?.() ?? '';
    const matchesSearch = name.includes(term) || description.includes(term);
    const matchesCategory = selectedCategory === 'all' || vendor.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="px-6 py-20 md:py-32 bg-card/30">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold text-balance">
              Discover Verified Vendors
            </h1>
            <p className="text-xl text-foreground/70 text-balance">
              Browse our network of 500+ trusted suppliers across all industries
            </p>
          </div>

          {/* Search */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-3 w-5 h-5 text-foreground/40" />
            <Input
              placeholder="Search vendors, products, or categories..."
              className="pl-12 py-6 text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="px-6 py-6 border-b border-border sticky top-16 bg-background/95 backdrop-blur">
        <div className="max-w-5xl mx-auto flex flex-wrap gap-3">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full capitalize transition-colors ${
                selectedCategory === category
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border text-foreground hover:border-primary'
              }`}
            >
              {category === 'all' ? 'All Vendors' : category}
            </button>
          ))}
        </div>
      </section>

      {/* Results */}
      <section className="px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <p className="text-foreground/70 mb-8">
            Showing {filteredVendors.length} {filteredVendors.length === 1 ? 'vendor' : 'vendors'}
          </p>

          {filteredVendors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredVendors.map((vendor) => (
                <Link
                  key={vendor.id}
                  href={`/vendor/${vendor.id}`}
                  className="group bg-card border border-border rounded-lg overflow-hidden hover:border-primary transition-colors"
                >
                  {/* Card Content */}
                  <div className="p-6 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold group-hover:text-primary transition-colors mb-1">
                          {vendor.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-foreground/60">
                          <MapPin className="w-4 h-4" />
                          {vendor.location}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-primary/10 px-3 py-1 rounded-full">
                        <Star className="w-4 h-4 text-primary fill-primary" />
                        <span className="font-semibold">{vendor.rating}</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-foreground/70 text-sm line-clamp-2">
                      {vendor.description}
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 py-4 border-y border-border">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-primary">
                          {vendor.productCount}+
                        </div>
                        <div className="text-xs text-foreground/60">Products</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-primary">
                          {vendor.yearsInBusiness}
                        </div>
                        <div className="text-xs text-foreground/60">Years</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-primary">
                          {vendor.reviews}
                        </div>
                        <div className="text-xs text-foreground/60">Reviews</div>
                      </div>
                    </div>

                    {/* Category & CTA */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-medium capitalize">
                        {vendor.category}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                        }}
                      >
                        View Profile
                      </Button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No vendors found</h3>
              <p className="text-foreground/60">
                Try adjusting your search or filters to find what you're looking for.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-card/30 px-6 py-20">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
          {[
            { label: 'Verified Vendors', value: '500+' },
            { label: 'Products Listed', value: '50K+' },
            { label: 'Successful Transactions', value: '1M+' },
            { label: 'Trusted Buyers', value: '10K+' },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
              <p className="text-foreground/70">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA for Vendors */}
      <section className="px-6 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-4xl font-bold">Want to Become a Vendor?</h2>
          <p className="text-xl text-foreground/70">
            Join our network and reach thousands of enterprise buyers looking for your products.
          </p>
          <Button size="lg" asChild>
            <Link href="/login">Apply to Sell</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border px-6 py-12">
        <div className="max-w-5xl mx-auto text-center text-foreground/60 text-sm">
          <p>&copy; 2024 SouthCaravan. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
