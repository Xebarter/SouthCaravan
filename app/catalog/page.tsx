import { Suspense } from 'react';
import CatalogClient from './catalog-client';

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading catalog…</div>}>
      <CatalogClient />
    </Suspense>
  );
}
