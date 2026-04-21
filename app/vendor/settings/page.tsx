'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Building2,
  Globe,
  Loader2,
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

type NotifKey = 'orders' | 'quotes' | 'messages' | 'marketing';

const NOTIF_CONFIG: { key: NotifKey; label: string; sub: string }[] = [
  { key: 'orders', label: 'New orders', sub: 'Email when a buyer places an order with you' },
  { key: 'quotes', label: 'Quote requests', sub: 'Email when a buyer submits a quote request' },
  { key: 'messages', label: 'New messages', sub: 'Email when a buyer sends you a message' },
  { key: 'marketing', label: 'Platform updates', sub: 'Newsletters and product announcements from SouthCaravan' },
];

function getInitials(name: string) {
  return name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2);
}

type VendorProfileApi = {
  user_id: string;
  company_name: string;
  description: string;
  public_email: string;
  contact_email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
};

export default function VendorSettingsPage() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [profile, setProfile] = useState<VendorProfileApi | null>(null);
  const [notifs, setNotifs] = useState<Record<NotifKey, boolean>>({
    orders: true,
    quotes: true,
    messages: true,
    marketing: false,
  });

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    ;(async () => {
      setLoading(true);
      setError('');
      try {
        const [profileRes, prefsRes] = await Promise.all([
          fetch('/api/vendor/profile', { cache: 'no-store' }),
          fetch('/api/vendor/notification-prefs', { cache: 'no-store' }),
        ]);
        const profileJson = await profileRes.json().catch(() => ({}));
        const prefsJson = await prefsRes.json().catch(() => ({}));
        if (!profileRes.ok) throw new Error(profileJson?.error ?? 'Failed to load profile');
        if (!prefsRes.ok) throw new Error(prefsJson?.error ?? 'Failed to load notification preferences');
        if (!cancelled) {
          setProfile(profileJson?.profile ?? null);
          const p = prefsJson?.prefs ?? {};
          setNotifs({
            orders: Boolean(p.orders),
            quotes: Boolean(p.quotes),
            messages: Boolean(p.messages),
            marketing: Boolean(p.marketing),
          });
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load settings');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const vendorDisplay = useMemo(() => {
    const companyName = profile?.company_name || user?.email?.split('@')?.[0] || 'Vendor';
    const email = profile?.public_email || user?.email || '';
    return { companyName, email };
  }, [profile, user]);

  if (!user) return null;

  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 max-w-3xl">
        <div className="flex items-center gap-2 text-muted-foreground py-24 justify-center">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading settings…</span>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const profilePayload = profile
        ? {
            companyName: profile.company_name,
            description: profile.description,
            publicEmail: profile.public_email,
            phone: profile.phone,
            website: profile.website,
            address: profile.address,
            city: profile.city,
            state: profile.state,
            zipCode: profile.zip_code,
            country: profile.country,
          }
        : {};

      const [profileRes, prefsRes] = await Promise.all([
        fetch('/api/vendor/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profilePayload),
        }),
        fetch('/api/vendor/notification-prefs', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(notifs),
        }),
      ]);

      const profileJson = await profileRes.json().catch(() => ({}));
      const prefsJson = await prefsRes.json().catch(() => ({}));
      if (!profileRes.ok) throw new Error(profileJson?.error ?? 'Failed to save profile');
      if (!prefsRes.ok) throw new Error(prefsJson?.error ?? 'Failed to save notification preferences');

      setProfile(profileJson?.profile ?? profile);
      toast.success('Settings saved');
    } catch (e: any) {
      setError(e?.message || 'Failed to save settings');
      toast.error(e?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
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

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

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
                  {getInitials(vendorDisplay.companyName)}
                </div>
                <div>
                  <p className="font-semibold text-base">{vendorDisplay.companyName}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{vendorDisplay.email}</p>
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
                  value={profile?.company_name ?? ''}
                  onChange={(e) => setProfile((p) => (p ? { ...p, company_name: e.target.value } : p))}
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
                  value={profile?.description ?? ''}
                  onChange={(e) => setProfile((p) => (p ? { ...p, description: e.target.value } : p))}
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
                  <Input
                    id="vendor-email"
                    type="email"
                    value={profile?.public_email ?? ''}
                    onChange={(e) => setProfile((p) => (p ? { ...p, public_email: e.target.value } : p))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vendor-phone" className="text-sm flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    Phone
                  </Label>
                  <Input
                    id="vendor-phone"
                    value={profile?.phone ?? ''}
                    onChange={(e) => setProfile((p) => (p ? { ...p, phone: e.target.value } : p))}
                  />
                </div>
              </div>
              <div className="space-y-1.5 max-w-lg">
                <Label htmlFor="vendor-website" className="text-sm flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  Website
                </Label>
                <Input
                  id="vendor-website"
                  value={profile?.website ?? ''}
                  onChange={(e) => setProfile((p) => (p ? { ...p, website: e.target.value } : p))}
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
                <Input
                  id="vendor-address"
                  value={profile?.address ?? ''}
                  onChange={(e) => setProfile((p) => (p ? { ...p, address: e.target.value } : p))}
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg">
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="vendor-city" className="text-sm">City</Label>
                  <Input
                    id="vendor-city"
                    value={profile?.city ?? ''}
                    onChange={(e) => setProfile((p) => (p ? { ...p, city: e.target.value } : p))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vendor-state" className="text-sm">State</Label>
                  <Input
                    id="vendor-state"
                    value={profile?.state ?? ''}
                    onChange={(e) => setProfile((p) => (p ? { ...p, state: e.target.value } : p))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vendor-zip" className="text-sm">ZIP</Label>
                  <Input
                    id="vendor-zip"
                    value={profile?.zip_code ?? ''}
                    onChange={(e) => setProfile((p) => (p ? { ...p, zip_code: e.target.value } : p))}
                  />
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
