'use client'

import { usePathname } from 'next/navigation'
import { ServicesConsoleShell } from '@/components/services/services-console-shell'
import { isServicesConsolePath } from '@/lib/services-console-path'

export default function ServicesSegmentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (!isServicesConsolePath(pathname)) {
    return <>{children}</>
  }

  return <ServicesConsoleShell>{children}</ServicesConsoleShell>
}

