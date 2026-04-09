'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth-context';
import { getVendorProfileForConsole } from '@/lib/vendor-dashboard-data';

export default function VendorSettingsPage() {
  const { user } = useAuth();

  const vendor = getVendorProfileForConsole(user);
  if (!vendor) return null;

  return (
    <main className="flex-1 overflow-auto">
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Business profile and notification preferences (demo — connect to your API when ready).
        </p>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Company profile</CardTitle>
          <CardDescription>How buyers see your business on SouthCaravan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company-name">Company name</Label>
            <Input id="company-name" defaultValue={vendor.companyName} readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-desc">Description</Label>
            <Textarea id="company-desc" rows={4} defaultValue={vendor.description} readOnly />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Public email</Label>
              <Input id="email" type="email" defaultValue={vendor.email} readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" defaultValue={vendor.phone} readOnly />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input id="website" defaultValue={vendor.website ?? ''} readOnly />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Choose what you want to hear about</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">New orders</p>
              <p className="text-sm text-muted-foreground">Email when a buyer places an order</p>
            </div>
            <Switch defaultChecked disabled />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">Quote requests</p>
              <p className="text-sm text-muted-foreground">Email when a quote is requested</p>
            </div>
            <Switch defaultChecked disabled />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">Messages</p>
              <p className="text-sm text-muted-foreground">Email for new buyer messages</p>
            </div>
            <Switch defaultChecked disabled />
          </div>
        </CardContent>
      </Card>
      </div>
    </main>
  );
}
