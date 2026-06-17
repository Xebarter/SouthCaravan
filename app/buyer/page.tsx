'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { canAccessBuyerWorkspace } from '@/lib/buyer-portal-access';
import { grantPortalAccess } from '@/lib/portal-session';
import { BuyerDashboard } from '@/components/dashboards/buyer-dashboard';
import { Skeleton } from '@/components/ui/skeleton';

export default function BuyerHomePage() {
  const { user, isLoading } = useAuth();
  const buyerId = user?.id ?? 'user-1';

  useEffect(() => {
    if (isLoading || !user) return;
    void grantPortalAccess('buyer').catch(() => {});
  }, [isLoading, user]);

  if (isLoading && !user) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-16 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!canAccessBuyerWorkspace(user)) return null;

  return <BuyerDashboard buyerId={buyerId} />;
}

