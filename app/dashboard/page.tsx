'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { AdminDashboard } from '@/components/dashboards/admin-dashboard';
import { BuyerDashboard } from '@/components/dashboards/buyer-dashboard';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !user) return;

    if (user.role === 'vendor') router.replace('/vendor');
    if (user.role === 'buyer') router.replace('/buyer');
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-16 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (user.role === 'vendor' || user.role === 'buyer') {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-16 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (user.role === 'admin') {
    return <AdminDashboard />;
  }

  return null;
}
