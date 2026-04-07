'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { BuyerDashboard } from '@/components/dashboards/buyer-dashboard';
import { Skeleton } from '@/components/ui/skeleton';

export default function BuyerHomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const buyerId = user?.id ?? 'user-1';

  useEffect(() => {
    if (isLoading || !user) return;

    if (user.role === 'vendor') router.replace('/vendor');
    if (user.role === 'admin') router.replace('/dashboard');
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-16 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (user && user.role !== 'buyer') return null;

  return <BuyerDashboard buyerId={buyerId} />;
}

