'use client';

import { useState } from 'react';
import {
  Bell,
  Building2,
  Globe,
  Lock,
  Mail,
  MapPin,
  Phone,
  Save,
  Shield,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { getVendorProfileForConsole } from '@/lib/vendor-dashboard-data';

type NotifKey = 'orders' | 'quotes' | 'messages' | 'marketing';

const NOTIF_CONFIG: { key: NotifKey; label: string; sub: string }[] = [
  { key: 'orders',    label: 'New orders',       sub: 'Email when a buyer places an order with you' },
  { key: 'quotes',    label: 'Quote requests',    sub: 'Email when a buyer submits a quote request' },
  { key: 'messages',  label: 'New messages',      sub: 'Email when a buyer sends you a message' },
  { key: 'marketing', label: 'Platform updates',  sub: 'Newsletters and product announcements from SouthCaravan' },
];

function getInitials(name: string) {
  return name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2);
}

export default function VendorSettingsPage() {
  const { user } = useAuth();
  const vendor = getVendorProfileForConsole(user);
  const [saving, setSaving] = useState(false);
  const [notifs, setNotifs] = useState<Record<NotifKey, boolean>>({
    orders:    true,
    quotes:    true,
    messages:  true,
    marketing: false,
  });

  if (!vendor) return null;

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    toast.success('Settings saved');
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 max-w-3xl space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your business profile and account preferences
        </p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">
            <Building2 className="h-3.5 w-3.5" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-3.5 w-3.5" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-3.5 w-3.5" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* ── Profile tab ── */}
        <TabsContent value="profile" className="space-y-6 mt-6">
          {/* Company identity card */}
          <Card className="border-border/60">
            <CardContent className="pt-6 pb-6">
              <div className="flex items-center gap-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-xl font-bold select-none">
                  {getInitials(vendor.companyName)}
                </div>
                <div>
                  <p className="font-semibold text-base">{vendor.companyName}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{vendor.email}</p>
                  <Button variant="outline" size="sm" className="mt-2.5 h-7 text-xs gap-1.5">
                    <Upload className="h-3 w-3" />
                    Upload logo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Company info */}
          <Card className="border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Company information
              </CardTitle>
              <CardDescription className="text-xs">
                How buyers see your business in the marketplace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="vendor-company-name" className="text-sm">
                  Company name
                </Label>
                <Input
                  id="vendor-company-name"
                  defaultValue={vendor.companyName}
                  className="max-w-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vendor-desc" className="text-sm">
                  Description
                </Label>
                <Textarea
                  id="vendor-desc"
                  rows={3}
                  defaultValue={vendor.description}
                  className="max-w-lg resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Shown on your public storefront page
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
                <div className="space-y-1.5">
                  <Label htmlFor="vendor-email" className="text-sm flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    Public email
                  </Label>
                  <Input id="vendor-email" type="email" defaultValue={vendor.email} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vendor-phone" className="text-sm flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    Phone
                  </Label>
                  <Input id="vendor-phone" defaultValue={vendor.phone ?? ''} />
                </div>
              </div>
              <div className="space-y-1.5 max-w-lg">
                <Label htmlFor="vendor-website" className="text-sm flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  Website
                </Label>
                <Input
                  id="vendor-website"
                  defaultValue={vendor.website ?? ''}
                  placeholder="https://"
                />
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card className="border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Business location
              </CardTitle>
              <CardDescription className="text-xs">
                Used for shipping, invoicing, and buyer discovery
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5 max-w-lg">
                <Label htmlFor="vendor-address" className="text-sm">Street address</Label>
                <Input id="vendor-address" defaultValue={vendor.address} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg">
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="vendor-city" className="text-sm">City</Label>
                  <Input id="vendor-city" defaultValue={vendor.city} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vendor-state" className="text-sm">State</Label>
                  <Input id="vendor-state" defaultValue={vendor.state} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vendor-zip" className="text-sm">ZIP</Label>
                  <Input id="vendor-zip" defaultValue={vendor.zipCode} />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="min-w-32">
              {saving ? (
                'Saving…'
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save changes
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        {/* ── Notifications tab ── */}
        <TabsContent value="notifications" className="space-y-6 mt-6">
          <Card className="border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Email notifications</CardTitle>
              <CardDescription className="text-xs">
                Choose which events send an email to{' '}
                <span className="font-medium text-foreground">{vendor.email}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border/50">
              {NOTIF_CONFIG.map(({ key, label, sub }) => (
                <div key={key} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                  </div>
                  <Switch
                    checked={notifs[key]}
                    onCheckedChange={(v) => setNotifs((prev) => ({ ...prev, [key]: v }))}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="min-w-32">
              {saving ? (
                'Saving…'
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save preferences
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        {/* ── Security tab ── */}
        <TabsContent value="security" className="space-y-6 mt-6">
          {/* Change password */}
          <Card className="border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                Change password
              </CardTitle>
              <CardDescription className="text-xs">
                Use a strong, unique password for your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-sm">
              <div className="space-y-1.5">
                <Label htmlFor="vendor-cur-pw" className="text-sm">Current password</Label>
                <Input id="vendor-cur-pw" type="password" placeholder="••••••••" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vendor-new-pw" className="text-sm">New password</Label>
                <Input id="vendor-new-pw" type="password" placeholder="••••••••" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vendor-confirm-pw" className="text-sm">Confirm new password</Label>
                <Input id="vendor-confirm-pw" type="password" placeholder="••••••••" />
              </div>
              <Button variant="outline" size="sm">Update password</Button>
            </CardContent>
          </Card>

          {/* Active sessions */}
          <Card className="border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Active sessions</CardTitle>
              <CardDescription className="text-xs">
                Sign out of any device you don't recognise
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/20 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Current session</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Active now · this device
                  </p>
                </div>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  Active
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Danger zone */}
          <Card className="border-red-500/20 bg-red-500/5">
            <CardHeader className="pb-4">
              <CardTitle className="text-base text-red-600 dark:text-red-400">
                Danger zone
              </CardTitle>
              <CardDescription className="text-xs">
                Irreversible actions — proceed with caution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium">Delete vendor account</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Permanently remove your account and all associated data
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 border-red-500/30 text-red-600 hover:bg-red-500/10 dark:text-red-400"
                >
                  Delete account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
