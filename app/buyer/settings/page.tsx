'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { CheckCircle2, AlertCircle, Lock, Bell, Shield } from 'lucide-react';
import { CURRENCIES, formatCurrencyOption } from '@/lib/currencies';
import { useCurrency } from '@/hooks/use-currency';
import { useAuth } from '@/lib/auth-context';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { currencyPreference, setSelectedCurrency } = useCurrency('AUTO');
  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    newProducts: true,
    vendorMessages: true,
    promo: false,
    newsletter: true,
  });

  const [preferences, setPreferences] = useState({
    language: 'en',
    timeZone: 'UTC',
    allowAnalytics: true,
    personalizedRecommendations: true,
  });

  const settingsPayload = useMemo(() => {
    return {
      notifications,
      preferences: {
        ...preferences,
        currencyPreference,
      },
    };
  }, [notifications, preferences, currencyPreference]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) return;
      setError(null);
      try {
        const [notifRes, prefRes] = await Promise.all([
          fetch('/api/buyer/notification-prefs'),
          fetch('/api/buyer/preferences'),
        ]);

        const notifJson = await notifRes.json().catch(() => null);
        if (!cancelled && notifRes.ok) {
          const p = notifJson?.prefs ?? null;
          if (p) {
            setNotifications({
              orderUpdates: Boolean(p.order_updates),
              newProducts: Boolean(p.new_products),
              vendorMessages: Boolean(p.vendor_messages),
              promo: Boolean(p.promo),
              newsletter: Boolean(p.newsletter),
            });
          }
        }

        const prefJson = await prefRes.json().catch(() => null);
        if (!cancelled && prefRes.ok) {
          const p = prefJson?.prefs ?? null;
          if (p) {
            setPreferences({
              language: typeof p.language === 'string' ? p.language : 'en',
              timeZone: typeof p.time_zone === 'string' ? p.time_zone : 'UTC',
              allowAnalytics: Boolean(p.allow_analytics),
              personalizedRecommendations: Boolean(p.personalized_recommendations),
            });
            if (typeof p.currency_preference === 'string' && p.currency_preference) {
              setSelectedCurrency(String(p.currency_preference));
            }
          }
        }
      } catch {
        if (!cancelled) setError('Failed to load settings');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, setSelectedCurrency]);

  const handleSave = async () => {
    setError(null);
    setLoading(true);
    try {
      const [notifRes, prefRes] = await Promise.all([
        fetch('/api/buyer/notification-prefs', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settingsPayload.notifications),
        }),
        fetch('/api/buyer/preferences', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settingsPayload.preferences),
        }),
      ]);

      const notifJson = await notifRes.json().catch(() => null);
      const prefJson = await prefRes.json().catch(() => null);

      if (!notifRes.ok) throw new Error(notifJson?.error || 'Failed to save notification preferences');
      if (!prefRes.ok) throw new Error(prefJson?.error || 'Failed to save preferences');

      setSuccess('Settings saved successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) {
      setError(typeof e?.message === 'string' ? e.message : 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Account Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account preferences and security</p>
      </div>

      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span className="hidden sm:inline">Preferences</span>
          </TabsTrigger>
        </TabsList>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to be notified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {success && (
                <div className="flex gap-3 p-3 bg-primary/10 border border-primary/30 rounded">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  <p className="text-sm text-primary">{success}</p>
                </div>
              )}

              {error && (
                <div className="flex gap-3 p-3 bg-destructive/10 border border-destructive/30 rounded">
                  <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {[
                {
                  key: 'orderUpdates',
                  label: 'Order Updates',
                  description: 'Get notified when your orders are confirmed, shipped, or delivered',
                },
                {
                  key: 'newProducts',
                  label: 'New Products',
                  description: 'Be notified about new products from your favorite vendors',
                },
                {
                  key: 'vendorMessages',
                  label: 'Vendor Messages',
                  description: 'Receive alerts when vendors send you messages or quotes',
                },
                {
                  key: 'promo',
                  label: 'Promotional Offers',
                  description: 'Get special deals and discount codes',
                },
                {
                  key: 'newsletter',
                  label: 'Newsletter',
                  description: 'Weekly updates about marketplace trends and tips',
                },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                  <div>
                    <p className="font-semibold text-foreground">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <Switch
                    checked={notifications[item.key as keyof typeof notifications]}
                    onCheckedChange={(checked) =>
                      setNotifications({
                        ...notifications,
                        [item.key]: checked,
                      })
                    }
                  />
                </div>
              ))}

              <Button onClick={handleSave} disabled={loading}>
                {loading ? 'Saving...' : 'Save Preferences'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-secondary rounded-lg space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-foreground">Password</p>
                    <p className="text-sm text-muted-foreground">Last changed 45 days ago</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Change Password
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-secondary rounded-lg space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-foreground">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">Not currently enabled</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Enable 2FA
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-secondary rounded-lg space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-foreground">Active Sessions</p>
                    <p className="text-sm text-muted-foreground">1 active session</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Manage Sessions
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-secondary rounded-lg space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-foreground">Connected Apps</p>
                    <p className="text-sm text-muted-foreground">No third-party integrations</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Manage
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences */}
        <TabsContent value="preferences" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>General Preferences</CardTitle>
              <CardDescription>Customize your platform experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {success && (
                <div className="flex gap-3 p-3 bg-primary/10 border border-primary/30 rounded">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  <p className="text-sm text-primary">{success}</p>
                </div>
              )}

              {error && (
                <div className="flex gap-3 p-3 bg-destructive/10 border border-destructive/30 rounded">
                  <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Default Currency</Label>
                <select
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground"
                  value={currencyPreference}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                >
                  <option value="AUTO">AUTO - Detect from location</option>
                  {CURRENCIES.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {formatCurrencyOption(currency)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Default Language</Label>
                <select
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground"
                  value={preferences.language}
                  onChange={(e) => setPreferences((p) => ({ ...p, language: e.target.value }))}
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Time Zone</Label>
                <select
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground"
                  value={preferences.timeZone}
                  onChange={(e) => setPreferences((p) => ({ ...p, timeZone: e.target.value }))}
                >
                  <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                  <option value="America/Chicago">America/Chicago (CST)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>

              <div className="border-t border-border pt-6 space-y-4">
                <h4 className="font-semibold text-foreground">Data & Privacy</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-secondary rounded">
                    <p className="text-sm text-muted-foreground">Allow analytics tracking</p>
                    <Switch
                      checked={preferences.allowAnalytics}
                      onCheckedChange={(v) => setPreferences((p) => ({ ...p, allowAnalytics: v }))}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-secondary rounded">
                    <p className="text-sm text-muted-foreground">Personalized recommendations</p>
                    <Switch
                      checked={preferences.personalizedRecommendations}
                      onCheckedChange={(v) => setPreferences((p) => ({ ...p, personalizedRecommendations: v }))}
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleSave} disabled={loading}>
                {loading ? 'Saving...' : 'Save Preferences'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Danger Zone */}
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border border-destructive/30 rounded-lg space-y-3">
            <p className="font-semibold text-foreground">Delete Account</p>
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={loading || !user}>
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action is permanent. Your orders, RFQs/quotes, messages, wishlist, addresses, and support tickets will be removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={loading}
                    onClick={async (e) => {
                      e.preventDefault();
                      setError(null);
                      setLoading(true);
                      try {
                        const res = await fetch('/api/buyer/account', { method: 'DELETE' });
                        const json = await res.json().catch(() => null);
                        if (!res.ok) {
                          setError(json?.error || 'Failed to delete account');
                          return;
                        }
                        logout();
                        router.replace('/');
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    Yes, delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
