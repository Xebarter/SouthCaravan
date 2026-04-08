'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, ShoppingCart } from 'lucide-react';
import { mockProducts, mockVendors } from '@/lib/mock-data';
import { stripHtmlForPreview } from '@/lib/strip-html';
import { Money } from '@/components/money';

export default function CatalogClient() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [selectedSubSubcategory, setSelectedSubSubcategory] = useState<string>('all');
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    const qpQuery = searchParams.get('query') ?? '';
    const qpCategory = searchParams.get('category') ?? 'all';
    const qpSubcategory = searchParams.get('subcategory') ?? 'all';
    const qpSubSubcategory = searchParams.get('subSubcategory') ?? 'all';

    setSearchQuery(qpQuery);
    setSelectedCategory(qpCategory);
    setSelectedSubcategory(qpSubcategory);
    setSelectedSubSubcategory(qpSubSubcategory);
  }, [searchParams]);

  const categories = useMemo(() => ['all', ...new Set(mockProducts.map((p) => p.category))], []);
  const subcategories = useMemo(() => {
    if (selectedCategory === 'all') return ['all'];
    return [
      'all',
      ...new Set(
        mockProducts
          .filter((p) => p.category === selectedCategory)
          .map((p) => p.subcategory)
          .filter(Boolean),
      ),
    ];
  }, [selectedCategory]);

  const subSubcategories = useMemo(() => {
    if (selectedCategory === 'all' || selectedSubcategory === 'all') return ['all'];
    return [
      'all',
      ...new Set(
        mockProducts
          .filter((p) => p.category === selectedCategory && p.subcategory === selectedSubcategory)
          .map((p) => p.subSubcategory)
          .filter(Boolean),
      ),
    ];
  }, [selectedCategory, selectedSubcategory]);

  const filteredProducts = mockProducts.filter((product) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      product.name.toLowerCase().includes(q) ||
      stripHtmlForPreview(product.description).toLowerCase().includes(q);
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSubcategory =
      selectedSubcategory === 'all' || (product.subcategory && product.subcategory === selectedSubcategory);
    const matchesSubSubcategory =
      selectedSubSubcategory === 'all' ||
      (product.subSubcategory && product.subSubcategory === selectedSubSubcategory);
    const matchesStock = !inStockOnly || product.inStock;
    return matchesSearch && matchesCategory && matchesSubcategory && matchesSubSubcategory && matchesStock;
  });

  return (
    <main className="flex-1 overflow-auto">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Product Catalog</h1>
          <p className="text-muted-foreground mt-2">Browse products from our trusted vendors</p>
        </div>

        <Card className="mb-8 border-border/50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-secondary"
                />
              </div>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="bg-secondary">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedSubcategory}
                onValueChange={(v) => {
                  setSelectedSubcategory(v);
                  setSelectedSubSubcategory('all');
                }}
              >
                <SelectTrigger className="bg-secondary">
                  <SelectValue placeholder="Select subcategory" />
                </SelectTrigger>
                <SelectContent>
                  {subcategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat === 'all' ? 'All subcategories' : cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant={inStockOnly ? 'default' : 'outline'}
                onClick={() => setInStockOnly(!inStockOnly)}
                className="w-full"
              >
                {inStockOnly ? 'In Stock Only' : 'Show All'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            Found <span className="font-bold text-foreground">{filteredProducts.length}</span> products
          </p>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => {
              const vendor = mockVendors.find((v) => v.id === product.vendorId);
              return (
                <Card
                  key={product.id}
                  className="border-border/50 hover:border-primary/30 transition-colors overflow-hidden flex flex-col"
                >
                  <CardHeader className="pb-3">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base line-clamp-2">{product.name}</CardTitle>
                          <p className="text-xs text-muted-foreground mt-1">{product.category}</p>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ml-2 ${
                            product.inStock ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {product.inStock ? 'In Stock' : 'Out'}
                        </span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pb-3 flex-1 flex flex-col">
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {stripHtmlForPreview(product.description)}
                    </p>

                    <div className="p-3 bg-secondary/50 rounded-lg mb-4">
                      <p className="text-xs font-medium text-foreground">{vendor?.companyName}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={
                                i < Math.floor(vendor?.rating || 0) ? 'text-primary text-xs' : 'text-muted text-xs'
                              }
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">({vendor?.reviewCount})</span>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Unit Price:</span>
                        <span className="text-lg font-bold text-primary">
                          <Money amountUSD={Number(product.price)} />
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Min Order:</span>
                        <span className="text-sm font-medium">
                          {product.minimumOrder} {product.unit}
                        </span>
                      </div>
                    </div>

                    {product.specifications && Object.keys(product.specifications).length > 0 && (
                      <div className="mb-4 p-2 bg-secondary/30 rounded text-xs space-y-1">
                        {Object.entries(product.specifications)
                          .slice(0, 2)
                          .map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-muted-foreground">{key}:</span>
                              <span className="font-medium">{value}</span>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>

                  <div className="p-4 pt-0">
                    <Link href={`/product/${product.id}`} className="w-full block">
                      <Button className="w-full" disabled={!product.inStock}>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        {product.inStock ? 'View Details' : 'Out of Stock'}
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-border/50">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No products found matching your criteria.</p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setInStockOnly(false);
                }}
                className="mt-4"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}

