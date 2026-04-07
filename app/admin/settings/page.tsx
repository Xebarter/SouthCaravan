'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Lock, Mail, Palette, Settings as SettingsIcon } from 'lucide-react';

export default function AdminSettingsPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsLoading(false);
  };

  return (
    <main className="flex-1 overflow-auto">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-2">Configure platform settings and preferences</p>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">
              <SettingsIcon className="w-4 h-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security">
              <Lock className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="appearance">
              <Palette className="w-4 h-4 mr-2" />
              Appearance
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-4">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Manage your platform configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="platform-name">Platform Name</FieldLabel>
                    <Input
                      id="platform-name"
                      placeholder="SouthCaravan"
                      defaultValue="SouthCaravan"
                      className="bg-secondary"
                    />
                  </Field>
                </FieldGroup>

                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="support-email">Support Email</FieldLabel>
                    <Input
                      id="support-email"
                      type="email"
                      placeholder="support@southcaravan.com"
                      defaultValue="support@southcaravan.com"
                      className="bg-secondary"
                    />
                  </Field>
                </FieldGroup>

                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="commission">Commission Rate (%)</FieldLabel>
                    <Input
                      id="commission"
                      type="number"
                      placeholder="15"
                      defaultValue="15"
                      className="bg-secondary"
                    />
                  </Field>
                </FieldGroup>

                <div className="pt-4">
                  <Button onClick={handleSave} disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-4">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Configure how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {[
                    { id: 'new-orders', label: 'New Orders', desc: 'Receive alerts for new orders' },
                    { id: 'vendor-signup', label: 'Vendor Sign-ups', desc: 'Get notified when new vendors join' },
                    { id: 'disputes', label: 'Disputes & Issues', desc: 'Alert on customer disputes' },
                    { id: 'daily-report', label: 'Daily Summary', desc: 'Receive daily platform statistics' },
                  ].map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                      <input
                        type="checkbox"
                        id={item.id}
                        defaultChecked={true}
                        className="w-4 h-4 rounded bg-secondary border-border"
                      />
                      <label htmlFor={item.id} className="flex-1 cursor-pointer">
                        <div className="font-medium text-sm">{item.label}</div>
                        <div className="text-xs text-muted-foreground">{item.desc}</div>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <Button onClick={handleSave} disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save Preferences'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security" className="space-y-4">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your account security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="current-password">Current Password</FieldLabel>
                    <Input
                      id="current-password"
                      type="password"
                      placeholder="••••••••"
                      className="bg-secondary"
                    />
                  </Field>
                </FieldGroup>

                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="new-password">New Password</FieldLabel>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="••••••••"
                      className="bg-secondary"
                    />
                  </Field>
                </FieldGroup>

                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      className="bg-secondary"
                    />
                  </Field>
                </FieldGroup>

                <div className="pt-4">
                  <Button onClick={handleSave} disabled={isLoading}>
                    {isLoading ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance */}
          <TabsContent value="appearance" className="space-y-4">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize the look and feel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-3">Theme</label>
                    <div className="space-y-2">
                      {[
                        { id: 'auto', label: 'Auto (System)' },
                        { id: 'light', label: 'Light' },
                        { id: 'dark', label: 'Dark' },
                      ].map(theme => (
                        <label key={theme.id} className="flex items-center gap-3 p-3 border border-border/50 rounded-lg cursor-pointer hover:bg-secondary/50">
                          <input
                            type="radio"
                            name="theme"
                            value={theme.id}
                            defaultChecked={theme.id === 'dark'}
                            className="w-4 h-4"
                          />
                          <span className="text-sm font-medium">{theme.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button onClick={handleSave} disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save Appearance'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
