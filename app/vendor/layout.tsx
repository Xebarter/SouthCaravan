'use client';

import { usePathname } from 'next/navigation';
import { VendorConsoleShell } from '@/components/vendor/vendor-console-shell';
import { PortalVerificationGate } from '@/components/portal/portal-verification-gate'
import { isVendorConsolePath } from '@/lib/vendor-console-path';

export default function VendorSegmentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (!isVendorConsolePath(pathname)) {
    return <>{children}</>;
  }

  return (
    <VendorConsoleShell>
      <PortalVerificationGate portal="vendor">{children}</PortalVerificationGate>
    </VendorConsoleShell>
  )
}
