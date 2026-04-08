'use client';

import { useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { CheckCircle2, AlertCircle, Lock, Bell, Shield } from 'lucide-react';
import { CURRENCIES, formatCurrencyOption } from '@/lib/currencies';
import { useCurrency } from '@/hooks/use-currency';

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const { currencyPreference, setSelectedCurrency } = useCurrency('AUTO');
  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    newProducts: true,
    vendorMessages: true,
    promo: false,
    newsletter: true,
  });

  const handleSave = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSuccess('Settings saved successfully');
    setLoading(false);
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      <Breadcrumbs items={[{ label: 'Settings' }]} />

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
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <p className="text-sm text-primary">{success}</p>
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
                <select className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground">
                  <option>English</option>
                  <option>Spanish</option>
                  <option>French</option>
                  <option>German</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Time Zone</Label>
                <select className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground">
                  <option>America/Los_Angeles (PST)</option>
                  <option>America/Chicago (CST)</option>
                  <option>America/New_York (EST)</option>
                  <option>Europe/London (GMT)</option>
                </select>
              </div>

              <div className="border-t border-border pt-6 space-y-4">
                <h4 className="font-semibold text-foreground">Data & Privacy</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-secondary rounded">
                    <p className="text-sm text-muted-foreground">Allow analytics tracking</p>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-secondary rounded">
                    <p className="text-sm text-muted-foreground">Personalized recommendations</p>
                    <Switch defaultChecked />
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
            <Button variant="destructive">Delete Account</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
