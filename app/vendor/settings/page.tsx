'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  Building2,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  Save,
  Shield,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
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
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { getBrowserSupabaseClient } from '@/lib/supabase/client';
import { ProductDescriptionEditor } from '@/components/product-description-editor';
import { VendorShowcaseGalleryCard } from '@/components/vendor/vendor-showcase-gallery-card';
import { sanitizeProductHtml } from '@/lib/sanitize-product-html';
import { notifyVendorCompanyNameUpdated, resolveVendorSidebarDisplayName } from '@/lib/vendor-display-name';
import { stripHtmlForPreview } from '@/lib/strip-html';
import type { ShowcaseImage } from '@/lib/vendor-showcase';

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
  logo_url: string;
  public_profile_enabled?: boolean;
  public_profile?: Record<string, any>;
};

type VendorProfilePayload = {
  companyName: string;
  description: string;
  publicEmail: string;
  contactEmail: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  logoUrl: string;
  publicProfileEnabled: boolean;
  publicProfile: Record<string, any>;
};

function buildProfilePayload(profile: VendorProfileApi | null): VendorProfilePayload | null {
  if (!profile) return null;
  return {
    companyName: profile.company_name ?? '',
    description: sanitizeProductHtml(profile.description ?? ''),
    publicEmail: profile.public_email ?? '',
    contactEmail: profile.contact_email ?? '',
    phone: profile.phone ?? '',
    website: profile.website ?? '',
    address: profile.address ?? '',
    city: profile.city ?? '',
    state: profile.state ?? '',
    zipCode: profile.zip_code ?? '',
    country: profile.country ?? '',
    logoUrl: profile.logo_url ?? '',
    publicProfileEnabled: Boolean(profile.public_profile_enabled),
    publicProfile: (profile.public_profile ?? {}) as Record<string, any>,
  };
}

function computeProfileCompleteness(
  profile: VendorProfileApi | null,
  showcaseCount: number,
): { percent: number; label: string } {
  if (!profile) return { percent: 0, label: 'Complete your profile to build buyer trust' };

  const checks = [
    { ok: Boolean(profile.company_name?.trim()), weight: 20 },
    { ok: Boolean(stripHtmlForPreview(profile.description ?? '').trim()), weight: 20 },
    { ok: Boolean(profile.public_email?.trim() || profile.contact_email?.trim()), weight: 15 },
    { ok: Boolean(profile.phone?.trim()), weight: 10 },
    { ok: Boolean(profile.logo_url?.trim()), weight: 15 },
    { ok: Boolean(profile.city?.trim() && profile.country?.trim()), weight: 10 },
    {
      ok: !profile.public_profile_enabled || showcaseCount > 0,
      weight: 10,
    },
  ];

  const percent = checks.reduce((sum, item) => sum + (item.ok ? item.weight : 0), 0);
  const label =
    percent >= 90
      ? 'Your profile looks strong — buyers can trust what they see'
      : percent >= 60
        ? 'Good progress — add a few more details to stand out'
        : 'Complete your profile to build buyer trust';

  return { percent, label };
}

function VendorSettingsSkeleton() {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 max-w-5xl mx-auto space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-full max-w-xl" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-6 w-36 rounded-full" />
        </div>
      </div>
      <Skeleton className="h-11 w-full rounded-2xl" />
      <div className="rounded-2xl border border-border/60 overflow-hidden">
        <Skeleton className="h-14 w-full" />
        <div className="p-6 flex gap-4">
          <Skeleton className="h-16 w-16 rounded-2xl shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-8 w-28" />
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-border/60 p-6 space-y-4">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-10 w-full max-w-lg" />
        <Skeleton className="h-32 w-full max-w-2xl" />
        <div className="grid sm:grid-cols-2 gap-4 max-w-lg">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function VendorSettingsPage() {
  const { user, logout } = useAuth();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [profile, setProfile] = useState<VendorProfileApi | null>(null);
  const [savedProfileSnapshot, setSavedProfileSnapshot] = useState<string>('');
  const [savedNotifsSnapshot, setSavedNotifsSnapshot] = useState<string>('');
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputId = 'vendor-logo-input';
  const [logoUploading, setLogoUploading] = useState(false);
  const [showcaseImages, setShowcaseImages] = useState<ShowcaseImage[]>([]);
  const [notifs, setNotifs] = useState<Record<NotifKey, boolean>>({
    orders: true,
    quotes: true,
    messages: true,
    marketing: false,
  });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwShowCurrent, setPwShowCurrent] = useState(false);
  const [pwShowNew, setPwShowNew] = useState(false);
  const [pwShowConfirm, setPwShowConfirm] = useState(false);
  const [accountDeleteOpen, setAccountDeleteOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security'>('profile');
  const [baselineProfile, setBaselineProfile] = useState<VendorProfileApi | null>(null);
  const [baselineNotifs, setBaselineNotifs] = useState<Record<NotifKey, boolean>>({
    orders: true,
    quotes: true,
    messages: true,
    marketing: false,
  });

  const userId = user?.id ?? '';
  const dirtyRef = useRef(false);
  const initialLoadDoneRef = useRef(false);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    ;(async () => {
      // Only show the blocking loader on the very first load.
      if (!initialLoadDoneRef.current) {
        setLoading(true);
      }
      setError('');
      try {
        const [profileRes, prefsRes, showcaseRes] = await Promise.all([
          fetch('/api/vendor/profile', { cache: 'no-store' }),
          fetch('/api/vendor/notification-prefs', { cache: 'no-store' }),
          fetch('/api/vendor/showcase-images', { cache: 'no-store' }),
        ]);
        const profileJson = await profileRes.json().catch(() => ({}));
        const prefsJson = await prefsRes.json().catch(() => ({}));
        const showcaseJson = await showcaseRes.json().catch(() => ({}));
        if (!profileRes.ok) throw new Error(profileJson?.error ?? 'Failed to load profile');
        if (!prefsRes.ok) throw new Error(prefsJson?.error ?? 'Failed to load notification preferences');
        if (!showcaseRes.ok) throw new Error(showcaseJson?.error ?? 'Failed to load showcase images');
        if (!cancelled) {
          // Never clobber the user's in-progress edits with background refreshes.
          if (dirtyRef.current && initialLoadDoneRef.current) {
            return;
          }
          const nextProfile = (profileJson?.profile ?? null) as VendorProfileApi | null;
          setProfile(nextProfile);
          const p = prefsJson?.prefs ?? {};
          const nextNotifs = {
            orders: Boolean(p.orders),
            quotes: Boolean(p.quotes),
            messages: Boolean(p.messages),
            marketing: Boolean(p.marketing),
          };
          setNotifs(nextNotifs);
          setShowcaseImages(Array.isArray(showcaseJson?.images) ? showcaseJson.images : []);
          setBaselineProfile(nextProfile ? { ...nextProfile } : null);
          setBaselineNotifs(nextNotifs);

          // baseline snapshots for "unsaved changes" UX
          setSavedProfileSnapshot(JSON.stringify(buildProfilePayload(nextProfile) ?? {}));
          setSavedNotifsSnapshot(JSON.stringify(nextNotifs));
          initialLoadDoneRef.current = true;
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
  }, [userId]);

  const vendorDisplay = useMemo(() => {
    const companyName = resolveVendorSidebarDisplayName(profile?.company_name, user);
    const email = profile?.public_email?.trim() || user?.email || '';
    return { companyName, email };
  }, [profile, user]);

  const profileCompleteness = useMemo(
    () => computeProfileCompleteness(profile, showcaseImages.length),
    [profile, showcaseImages.length],
  );

  const publicProfileHref = useMemo(() => {
    if (!userId) return '';
    if (!profile?.public_profile_enabled) return '';
    return `/supplier/${userId}`;
  }, [userId, profile?.public_profile_enabled]);

  const hasUnsavedChanges = useMemo(() => {
    const profileSnap = JSON.stringify(buildProfilePayload(profile) ?? {});
    const notifsSnap = JSON.stringify(notifs);
    return profileSnap !== savedProfileSnapshot || notifsSnap !== savedNotifsSnapshot;
  }, [profile, notifs, savedProfileSnapshot, savedNotifsSnapshot]);

  // Keep a ref in sync so background refreshes don't clobber in-progress edits.
  dirtyRef.current = hasUnsavedChanges;

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleDiscardChanges = () => {
    if (baselineProfile) setProfile({ ...baselineProfile });
    setNotifs({ ...baselineNotifs });
    toast.message('Changes discarded');
  };

  if (!user) return null;

  if (loading) {
    return <VendorSettingsSkeleton />;
  }

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const profilePayload = buildProfilePayload(profile) ?? {};

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

      const nextProfile = (profileJson?.profile ?? profile) as VendorProfileApi | null;
      setProfile(nextProfile);
      setSavedProfileSnapshot(JSON.stringify(buildProfilePayload(nextProfile) ?? {}));
      setSavedNotifsSnapshot(JSON.stringify(notifs));
      setBaselineProfile(nextProfile ? { ...nextProfile } : null);
      setBaselineNotifs({ ...notifs });
      notifyVendorCompanyNameUpdated(nextProfile?.company_name ?? '');
      toast.success('Settings saved');
    } catch (e: any) {
      setError(e?.message || 'Failed to save settings');
      toast.error(e?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoPicked = async (file: File | null) => {
    if (!file) return;
    if (!user) return;
    setError('');
    setLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/vendor/logo', { method: 'POST', body: formData });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? 'Failed to upload logo');

      const nextProfile = json?.profile ?? null;
      if (nextProfile) setProfile(nextProfile);
      toast.success('Logo uploaded');
    } catch (e: any) {
      setError(e?.message || 'Failed to upload logo');
      toast.error(e?.message || 'Failed to upload logo');
    } finally {
      setLogoUploading(false);
    }
  };

  const handlePasswordUpdate = async () => {
    setError('');
    const current = pwCurrent.trim();
    const next = pwNew.trim();
    const confirm = pwConfirm.trim();
    if (!current || !next || !confirm) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (next.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (next !== confirm) {
      toast.error('New password and confirmation do not match');
      return;
    }

    setPwSaving(true);
    try {
      const supabase = getBrowserSupabaseClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email ?? '',
        password: current,
      });
      if (signInError) throw new Error('Current password is incorrect');

      const { error: updateError } = await supabase.auth.updateUser({ password: next });
      if (updateError) throw updateError;

      setPwCurrent('');
      setPwNew('');
      setPwConfirm('');
      setPwShowCurrent(false);
      setPwShowNew(false);
      setPwShowConfirm(false);
      toast.success('Password updated');
    } catch (e: any) {
      setError(e?.message || 'Failed to update password');
      toast.error(e?.message || 'Failed to update password');
    } finally {
      setPwSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setError('');
    try {
      const res = await fetch('/api/vendor/account', { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? 'Failed to delete account');
      logout();
      window.location.href = '/';
    } catch (e: any) {
      setError(e?.message || 'Failed to delete account');
      toast.error(e?.message || 'Failed to delete account');
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 max-w-5xl mx-auto space-y-6 pb-28">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
              Workspace
            </p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Settings</h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Manage your supplier profile, buyer-facing visibility, notifications, and account security.
            </p>
          </div>

          <div className="rounded-xl border border-border/60 bg-card/80 p-4 shadow-sm max-w-xl">
            <div className="flex items-center justify-between gap-3 mb-2">
              <p className="text-sm font-medium">Profile completeness</p>
              <span className="text-sm font-semibold tabular-nums text-violet-700 dark:text-violet-300">
                {profileCompleteness.percent}%
              </span>
            </div>
            <Progress value={profileCompleteness.percent} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">{profileCompleteness.label}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={hasUnsavedChanges ? 'warning' : 'success'} className="gap-1">
              {hasUnsavedChanges ? null : <CheckCircle2 className="h-3 w-3" />}
              {hasUnsavedChanges ? 'Unsaved changes' : 'All changes saved'}
            </Badge>
            {publicProfileHref ? (
              <Button asChild variant="outline" size="sm" className="h-7 text-xs gap-1.5">
                <a href={publicProfileHref} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-3 w-3" />
                  View public profile
                </a>
              </Button>
            ) : (
              <Badge variant="secondary">Public profile off</Badge>
            )}
          </div>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as typeof activeTab)}
        className="w-full"
      >
        <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-2xl border border-border/60 bg-muted/40 p-1.5">
          <TabsTrigger
            value="profile"
            className="gap-2 rounded-xl py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Building2 className="h-4 w-4 shrink-0" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="gap-2 rounded-xl py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Bell className="h-4 w-4 shrink-0" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="gap-2 rounded-xl py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Shield className="h-4 w-4 shrink-0" />
            <span>Security</span>
          </TabsTrigger>
        </TabsList>

        {/* ── Profile tab ── */}
        <TabsContent value="profile" className="space-y-6 mt-6">
          {/* Company identity card */}
          <Card className="rounded-2xl border-border/70 shadow-sm overflow-hidden">
            <div className="h-16 w-full bg-gradient-to-r from-violet-500/10 via-background to-sky-500/10" />
            <CardContent className="pt-0 pb-6">
              <div className="-mt-7 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
                <div className="h-16 w-16 shrink-0 rounded-2xl overflow-hidden border border-border/60 bg-background shadow-sm ring-4 ring-background">
                  {profile?.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.logo_url}
                      alt={`${vendorDisplay.companyName} logo`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-violet-600 text-white text-xl font-bold select-none">
                      {getInitials(vendorDisplay.companyName)}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-base">{vendorDisplay.companyName}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{vendorDisplay.email}</p>
                  <div className="mt-2.5 flex items-center gap-2">
                    <input
                      id={logoInputId}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        e.target.value = '';
                        void handleLogoPicked(file);
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1.5"
                      disabled={logoUploading}
                      onClick={() => document.getElementById(logoInputId)?.click()}
                    >
                      <Upload className="h-3 w-3" />
                      {logoUploading ? 'Uploading…' : 'Upload logo'}
                    </Button>
                    {profile?.logo_url ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        disabled={logoUploading}
                        onClick={() => setProfile((p) => (p ? { ...p, logo_url: '' } : p))}
                      >
                        Remove
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Company info */}
          <Card className="rounded-2xl border-border/70 shadow-sm">
            <CardHeader className="pb-4 border-b border-border/50 bg-muted/20">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Company information
              </CardTitle>
              <CardDescription className="text-xs">
                What buyers see across your storefront and product pages
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
                <div className="max-w-2xl">
                  <ProductDescriptionEditor
                    value={profile?.description ?? ''}
                    onChange={(html) =>
                      setProfile((p) =>
                        p ? { ...p, description: html } : p,
                      )
                    }
                    placeholder="Write a clear, buyer-facing overview of your company: what you make, who you serve, and what quality standards you follow."
                  />
                </div>
                <p className="text-xs text-muted-foreground max-w-2xl">
                  Keep it factual and scannable. Use headings and bullet points for capabilities, lead times, MOQs, and certifications.
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
                  <Label htmlFor="vendor-contact-email" className="text-sm flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    Contact email
                  </Label>
                  <Input
                    id="vendor-contact-email"
                    type="email"
                    value={profile?.contact_email ?? ''}
                    onChange={(e) => setProfile((p) => (p ? { ...p, contact_email: e.target.value } : p))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Used for platform communication (orders, payouts, support)
                  </p>
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

          {/* Public profile */}
          <Card className="rounded-2xl border-border/70 shadow-sm">
            <CardHeader className="pb-4 border-b border-border/50 bg-muted/20">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                Public profile
              </CardTitle>
              <CardDescription className="text-xs">
                Create a professional supplier profile buyers can view from product pages.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4 rounded-lg border border-border/50 bg-secondary/20 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Make profile public</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    When enabled, buyers can open your supplier page and view your showcase gallery.
                  </p>
                </div>
                <Switch
                  checked={Boolean(profile?.public_profile_enabled)}
                  onCheckedChange={(v) =>
                    setProfile((p) => (p ? { ...p, public_profile_enabled: v } : p))
                  }
                />
              </div>

              {publicProfileHref ? (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-border/50 bg-secondary/10 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Preview your public supplier page</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{publicProfileHref}</p>
                  </div>
                  <Button asChild variant="outline" size="sm" className="shrink-0">
                    <a href={publicProfileHref} target="_blank" rel="noreferrer">
                      View public page
                    </a>
                  </Button>
                </div>
              ) : null}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="vendor-headline" className="text-sm">Headline</Label>
                  <Input
                    id="vendor-headline"
                    value={String(profile?.public_profile?.headline ?? '')}
                    onChange={(e) =>
                      setProfile((p) =>
                        p
                          ? {
                              ...p,
                              public_profile: { ...(p.public_profile ?? {}), headline: e.target.value },
                            }
                          : p,
                      )
                    }
                    placeholder="e.g. Export-grade manufacturing with consistent lead times"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vendor-operating-since" className="text-sm">Operating since</Label>
                  <Input
                    id="vendor-operating-since"
                    value={String(profile?.public_profile?.operatingSince ?? '')}
                    onChange={(e) =>
                      setProfile((p) =>
                        p
                          ? {
                              ...p,
                              public_profile: { ...(p.public_profile ?? {}), operatingSince: e.target.value },
                            }
                          : p,
                      )
                    }
                    placeholder="e.g. 2016"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="vendor-capabilities" className="text-sm">Capabilities (comma separated)</Label>
                <Input
                  id="vendor-capabilities"
                  value={String(profile?.public_profile?.capabilities ?? '')}
                  onChange={(e) =>
                    setProfile((p) =>
                      p
                        ? {
                            ...p,
                            public_profile: { ...(p.public_profile ?? {}), capabilities: e.target.value },
                          }
                        : p,
                    )
                  }
                  placeholder="e.g. OEM/ODM, Bulk production, Quality inspection, Custom packaging"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="vendor-certifications" className="text-sm">Certifications (comma separated)</Label>
                <Input
                  id="vendor-certifications"
                  value={String(profile?.public_profile?.certifications ?? '')}
                  onChange={(e) =>
                    setProfile((p) =>
                      p
                        ? {
                            ...p,
                            public_profile: { ...(p.public_profile ?? {}), certifications: e.target.value },
                          }
                        : p,
                    )
                  }
                  placeholder="e.g. ISO 9001, CE, SGS, FDA"
                />
              </div>
            </CardContent>
          </Card>

          <VendorShowcaseGalleryCard
            images={showcaseImages}
            onImagesChange={setShowcaseImages}
            publicProfileEnabled={Boolean(profile?.public_profile_enabled)}
            publicProfileHref={publicProfileHref}
            onError={setError}
          />

          {/* Location */}
          <Card className="rounded-2xl border-border/70 shadow-sm">
            <CardHeader className="pb-4 border-b border-border/50 bg-muted/20">
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
              <div className="space-y-1.5 max-w-lg">
                <Label htmlFor="vendor-country" className="text-sm">Country</Label>
                <Input
                  id="vendor-country"
                  value={profile?.country ?? ''}
                  onChange={(e) => setProfile((p) => (p ? { ...p, country: e.target.value } : p))}
                />
              </div>
            </CardContent>
          </Card>

        </TabsContent>

        {/* ── Notifications tab ── */}
        <TabsContent value="notifications" className="space-y-6 mt-7">
          <Card className="rounded-2xl border-border/70 shadow-sm">
            <CardHeader className="pb-4 border-b border-border/50 bg-muted/20">
              <CardTitle className="text-base">Email notifications</CardTitle>
              <CardDescription className="text-xs">
                Choose which events send an email to{' '}
                <span className="font-medium text-foreground">{vendorDisplay.email}</span>
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
        </TabsContent>

        {/* ── Security tab ── */}
        <TabsContent value="security" className="space-y-6 mt-7">
          {/* Change password */}
          <Card className="rounded-2xl border-border/70 shadow-sm">
            <CardHeader className="pb-4 border-b border-border/50 bg-muted/20">
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
                <div className="relative">
                  <Input
                    id="vendor-cur-pw"
                    type={pwShowCurrent ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={pwCurrent}
                    onChange={(e) => setPwCurrent(e.target.value)}
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setPwShowCurrent((v) => !v)}
                    aria-label={pwShowCurrent ? 'Hide password' : 'View password'}
                  >
                    {pwShowCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vendor-new-pw" className="text-sm">New password</Label>
                <div className="relative">
                  <Input
                    id="vendor-new-pw"
                    type={pwShowNew ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={pwNew}
                    onChange={(e) => setPwNew(e.target.value)}
                    autoComplete="new-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setPwShowNew((v) => !v)}
                    aria-label={pwShowNew ? 'Hide password' : 'View password'}
                  >
                    {pwShowNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vendor-confirm-pw" className="text-sm">Confirm new password</Label>
                <div className="relative">
                  <Input
                    id="vendor-confirm-pw"
                    type={pwShowConfirm ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={pwConfirm}
                    onChange={(e) => setPwConfirm(e.target.value)}
                    autoComplete="new-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setPwShowConfirm((v) => !v)}
                    aria-label={pwShowConfirm ? 'Hide password' : 'View password'}
                  >
                    {pwShowConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button variant="outline" size="sm" disabled={pwSaving} onClick={handlePasswordUpdate}>
                {pwSaving ? 'Updating…' : 'Update password'}
              </Button>
            </CardContent>
          </Card>

          {/* Active sessions */}
          <Card className="rounded-2xl border-border/70 shadow-sm">
            <CardHeader className="pb-4 border-b border-border/50 bg-muted/20">
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
          <Card className="border-red-500/20 bg-red-500/5 shadow-sm">
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
                <AlertDialog open={accountDeleteOpen} onOpenChange={setAccountDeleteOpen}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 border-red-500/30 text-red-600 hover:bg-red-500/10 dark:text-red-400"
                    >
                      Delete account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete your vendor account?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action is permanent. Your vendor profile and associated data will be removed and you’ll be signed out.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={async (e) => {
                          e.preventDefault();
                          setAccountDeleteOpen(false);
                          await handleDeleteAccount();
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
        </TabsContent>
      </Tabs>

      {/* Sticky action bar */}
      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80',
          'pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 px-4 sm:px-6',
        )}
      >
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {activeTab === 'profile'
                  ? 'Profile settings'
                  : activeTab === 'notifications'
                    ? 'Notification preferences'
                    : 'Security'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {hasUnsavedChanges
                  ? 'You have unsaved changes.'
                  : 'Everything is up to date.'}
              </p>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
              {hasUnsavedChanges ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  onClick={handleDiscardChanges}
                  className="w-full sm:w-auto"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Discard
                </Button>
              ) : null}
              <Button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving || !hasUnsavedChanges}
                className="w-full sm:w-auto min-w-32"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
