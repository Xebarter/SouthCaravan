'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <AlertTriangle className="w-16 h-16 text-destructive" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Error</h1>
          <p className="text-xl text-muted-foreground">Something went wrong</p>
        </div>
        <p className="text-muted-foreground">
          We encountered an unexpected error. Our team has been notified. Please try again or contact support.
        </p>
        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="bg-destructive/10 border border-destructive/30 rounded p-4 text-left">
            <p className="text-sm text-destructive font-mono">{error.message}</p>
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Button onClick={() => reset()} variant="default">
            Try Again
          </Button>
          <Button asChild variant="outline">
            <a href="/">Go Home</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
