import { Suspense } from 'react';
import ServiceManagementClient from './service-management-client';

function ServicesLoading() {
  return (
    <div className="py-14 flex items-center justify-center text-muted-foreground text-sm">
      Loading services…
    </div>
  );
}

export default function AdminServicesPage() {
  return (
    <Suspense fallback={<ServicesLoading />}>
      <ServiceManagementClient />
    </Suspense>
  );
}
