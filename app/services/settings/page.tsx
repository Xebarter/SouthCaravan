'use client'

import { Settings } from 'lucide-react'
import { DashboardCurrencySettings } from '@/components/currency/dashboard-currency-settings'
import { useAuth } from '@/lib/auth-context'

export default function ServicesSettingsPage() {
  const { user } = useAuth()
  if (!user) return null

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage currency preferences for your services dashboard and listing prices.
        </p>
      </div>

      <DashboardCurrencySettings
        apiBase="/api/services/currency"
        title="Service provider currency"
        description="Set how earnings, bookings, and reports are displayed. New offerings use your base pricing currency by default."
      />
    </div>
  )
}
