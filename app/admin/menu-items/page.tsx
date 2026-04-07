'use client';

import { useState } from 'react';
import { GripVertical, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

type TaxonomyItem = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  children: number;
};

const defaultItems: TaxonomyItem[] = [
  { id: '1', name: 'Agriculture & Food Products', slug: 'agriculture-food-products', active: true, children: 6 },
  { id: '2', name: 'Livestock & Animal Products', slug: 'livestock-animal-products', active: true, children: 3 },
  { id: '3', name: 'Fisheries & Aquaculture', slug: 'fisheries-aquaculture', active: true, children: 3 },
  { id: '4', name: 'Minerals & Natural Resources', slug: 'minerals-natural-resources', active: true, children: 3 },
  { id: '5', name: 'Technology & Digital Products', slug: 'technology-digital-products', active: false, children: 5 },
  { id: '6', name: 'Services', slug: 'services', active: true, children: 5 },
];

export default function AdminMenuItemsPage() {
  const [items, setItems] = useState(defaultItems);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Menu Items Management</h2>
          <p className="text-muted-foreground mt-1">
            Control public marketplace taxonomy, visibility, and storefront navigation structure.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Import Taxonomy</Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Category Registry</CardTitle>
          <CardDescription>Manage parent categories shown in the sidebar and storefront discovery.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-md border border-border p-3 flex items-center justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <GripVertical className="w-4 h-4 text-muted-foreground mt-1" />
                <div className="min-w-0">
                  <p className="font-medium line-clamp-1">{item.name}</p>
                  <p className="text-xs text-muted-foreground">/{item.slug} - {item.children} sub-items</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={item.active ? 'default' : 'outline'}>
                  {item.active ? 'Visible' : 'Hidden'}
                </Badge>
                <Switch
                  checked={item.active}
                  onCheckedChange={(checked) =>
                    setItems((prev) =>
                      prev.map((entry) =>
                        entry.id === item.id ? { ...entry, active: checked } : entry,
                      ),
                    )
                  }
                  aria-label={`Toggle ${item.name}`}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Create New Top-Level Menu Item</CardTitle>
          <CardDescription>Add a category for new global marketplace verticals.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <Input placeholder="Display name" className="bg-secondary" />
          <Input placeholder="Slug" className="bg-secondary" />
          <Button>Create Menu Item</Button>
        </CardContent>
      </Card>
    </div>
  );
}
