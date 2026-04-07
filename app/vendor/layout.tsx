'use client';

import { usePathname } from 'next/navigation';
import { VendorConsoleShell } from '@/components/vendor/vendor-console-shell';
import { isVendorConsolePath } from '@/lib/vendor-console-path';

export default function VendorSegmentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (!isVendorConsolePath(pathname)) {
    return <>{children}</>;
  }

  return <VendorConsoleShell>{children}</VendorConsoleShell>;
}
