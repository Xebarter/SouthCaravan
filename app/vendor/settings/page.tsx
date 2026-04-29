'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  Building2,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { sanitizeProductHtml } from '@/lib/sanitize-product-html';

type NotifKey = 'orders' | 'quotes' | 'messages' | 'marketing';

const NOTIF_CONFIG: { key: NotifKey; label: string; sub: string }[] = [
  { key: 'orders', label: 'New orders', sub: 'Email when a buyer places an order with you' },
  { key: 'quotes', label: 'Quote requests', sub: 'Email when a buyer submits a quote request' },
  { key: 'messages', label: 'New messages', sub: 'Email when a buyer sends you a message' },
  { key: 'marketing', label: 'Platform updates', sub: 'Newsletters and product announcements from SouthCaravan' },
];

const SHOWCASE_KINDS = [
  { value: 'premises', label: 'Premises' },
  { value: 'machinery', label: 'Machinery' },
  { value: 'storage', label: 'Storage' },
  { value: 'team', label: 'Team' },
  { value: 'qa', label: 'Quality control' },
  { value: 'packaging', label: 'Packaging' },
  { value: 'logistics', label: 'Logistics' },
  { value: 'other', label: 'Other' },
] as const;

type ShowcaseKind = (typeof SHOWCASE_KINDS)[number]['value'];

type ShowcaseImage = { id: string; url: string; kind: string; caption: string; sort_order: number };

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
  const showcaseInputId = 'vendor-showcase-input';
  const [showcaseUploadKind, setShowcaseUploadKind] = useState<ShowcaseKind>('premises');
  const [showcaseBusy, setShowcaseBusy] = useState(false);
  const [showcaseImages, setShowcaseImages] = useState<ShowcaseImage[]>([]);
  const [pendingShowcaseDeleteId, setPendingShowcaseDeleteId] = useState<string | null>(null);
  const replaceFileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingReplaceIdRef = useRef<string>('');
  const captionUpdateTimersRef = useRef<Record<string, ReturnType<typeof window.setTimeout> | undefined>>({});
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
    const companyName = profile?.company_name || user?.email?.split('@')?.[0] || 'Vendor';
    const email = profile?.public_email || user?.email || '';
    return { companyName, email };
  }, [profile, user]);

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

  const uploadShowcaseImage = async (opts: {
    file: File;
    kind?: string;
    caption?: string;
    replaceId?: string;
  }): Promise<ShowcaseImage> => {
    const formData = new FormData();
    formData.append('file', opts.file);
    if (opts.kind) formData.append('kind', opts.kind);
    if (opts.caption) formData.append('caption', opts.caption);
    if (opts.replaceId) formData.append('replaceId', opts.replaceId);

    const res = await fetch('/api/vendor/showcase-images', { method: 'POST', body: formData });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.error ?? 'Failed to upload image');
    if (!json?.image) throw new Error(json?.error ?? 'Failed to upload image');
    return json.image as ShowcaseImage;
  };

  const handleShowcasePicked = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError('');
    const toUpload = Array.from(files);
    if (toUpload.length === 0) return;

    setShowcaseBusy(true);
    try {
      const uploadedImages = await Promise.all(
        toUpload.map((file) =>
          uploadShowcaseImage({
            file,
            kind: showcaseUploadKind,
            caption: '',
          }),
        ),
      );

      setShowcaseImages((prev) => {
        const merged = [...prev, ...uploadedImages];
        merged.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        return merged;
      });

      toast.success(toUpload.length === 1 ? 'Showcase image uploaded' : 'Showcase images uploaded');
    } catch (e: any) {
      setError(e?.message || 'Failed to upload image(s)');
      toast.error(e?.message || 'Failed to upload image(s)');
    } finally {
      setShowcaseBusy(false);
    }
  };

  const handleReplaceShowcaseImage = async (replaceId: string, file: File | null) => {
    if (!replaceId) return;
    if (!file) return;
    setError('');
    setShowcaseBusy(true);
    try {
      const updated = await uploadShowcaseImage({
        file,
        replaceId,
      });
      setShowcaseImages((prev) => {
        const next = prev.map((img) => (img.id === updated.id ? updated : img));
        next.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        return next;
      });
      toast.success('Image replaced');
    } catch (e: any) {
      setError(e?.message || 'Failed to replace image');
      toast.error(e?.message || 'Failed to replace image');
    } finally {
      setShowcaseBusy(false);
    }
  };

  const handleDeleteShowcaseImage = async (id: string) => {
    setError('');
    const existingTimer = captionUpdateTimersRef.current[id];
    if (existingTimer) clearTimeout(existingTimer);
    delete captionUpdateTimersRef.current[id];
    try {
      const res = await fetch(`/api/vendor/showcase-images?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? 'Failed to delete image');
      setShowcaseImages((prev) => prev.filter((img) => img.id !== id));
      toast.success('Image removed');
    } catch (e: any) {
      setError(e?.message || 'Failed to delete image');
      toast.error(e?.message || 'Failed to delete image');
    }
  };

  const persistShowcasePatch = async (
    updates: { id: string; kind?: string; caption?: string; sortOrder?: number }[],
  ) => {
    const res = await fetch('/api/vendor/showcase-images', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.error ?? 'Failed to update images');
  };

  const scheduleCaptionUpdate = (id: string, caption: string) => {
    const nextCaption = (caption ?? '').slice(0, 140);

    // Optimistic UI update: captions feel instant.
    setShowcaseImages((prev) => prev.map((img) => (img.id === id ? { ...img, caption: nextCaption } : img)));

    const existingTimer = captionUpdateTimersRef.current[id];
    if (existingTimer) clearTimeout(existingTimer);

    captionUpdateTimersRef.current[id] = window.setTimeout(() => {
      void persistShowcasePatch([{ id, caption: nextCaption }]).catch((e: any) => {
        toast.error(e?.message || 'Failed to update caption');
      });
      delete captionUpdateTimersRef.current[id];
    }, 650);
  };

  const flushCaptionUpdate = async (id: string, caption: string) => {
    const nextCaption = (caption ?? '').slice(0, 140);

    const existingTimer = captionUpdateTimersRef.current[id];
    if (existingTimer) clearTimeout(existingTimer);
    delete captionUpdateTimersRef.current[id];

    try {
      await persistShowcasePatch([{ id, caption: nextCaption }]);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update caption');
    }
  };

  const handleMoveShowcaseImage = async (id: string, direction: 'up' | 'down') => {
    const idx = showcaseImages.findIndex((img) => img.id === id);
    if (idx < 0) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= showcaseImages.length) return;

    const a = showcaseImages[idx]!;
    const b = showcaseImages[targetIdx]!;

    const prevSnapshot = showcaseImages.map((img) => ({ ...img }));
    const nextAOrder = b.sort_order;
    const nextBOrder = a.sort_order;

    // Optimistic swap.
    setShowcaseImages((prev) => {
      const swapped = prev.map((img) => {
        if (img.id === a.id) return { ...img, sort_order: nextAOrder };
        if (img.id === b.id) return { ...img, sort_order: nextBOrder };
        return img;
      });
      swapped.sort((x, y) => (x.sort_order ?? 0) - (y.sort_order ?? 0));
      return swapped;
    });

    try {
      await persistShowcasePatch([
        { id: a.id, sortOrder: nextAOrder },
        { id: b.id, sortOrder: nextBOrder },
      ]);
    } catch (e: any) {
      setShowcaseImages(prevSnapshot);
      toast.error(e?.message || 'Failed to reorder image');
    }
  };

  const updateShowcaseImage = async (
    id: string,
    patch: { kind?: string; caption?: string; sortOrder?: number },
  ) => {
    setShowcaseImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, ...('caption' in patch ? { caption: patch.caption ?? '' } : {}), ...('kind' in patch ? { kind: patch.kind ?? 'other' } : {}), ...('sortOrder' in patch ? { sort_order: patch.sortOrder ?? img.sort_order } : {}) } : img)),
    );
    try {
      await persistShowcasePatch([{ id, ...patch }]);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update image');
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
    <div className="w-full px-4 sm:px-6 lg:px-8 py-10 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Keep your supplier profile accurate, control buyer-facing visibility, and manage security preferences.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant={hasUnsavedChanges ? 'warning' : 'success'}>
              {hasUnsavedChanges ? 'Unsaved changes' : 'All changes saved'}
            </Badge>
            {publicProfileHref ? (
              <Button asChild variant="outline" size="sm" className="h-7 text-xs">
                <a href={publicProfileHref} target="_blank" rel="noreferrer">
                  View public profile
                </a>
              </Button>
            ) : (
              <Badge variant="secondary">Public profile is off</Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            disabled={!hasUnsavedChanges || saving}
            onClick={() => {
              setProfile((p) => (p ? { ...p } : p));
              void handleSave();
            }}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as typeof activeTab)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3 rounded-2xl bg-slate-100 p-1.5">
          <TabsTrigger value="profile" className="gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
            <span className="sm:hidden">Profile</span>
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
            <span className="sm:hidden">Notifs</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
            <span className="sm:hidden">Security</span>
          </TabsTrigger>
        </TabsList>

        {/* ── Profile tab ── */}
        <TabsContent value="profile" className="space-y-6 mt-7">
          {/* Company identity card */}
          <Card className="border-slate-200/70 shadow-sm overflow-hidden">
            <div className="h-14 w-full bg-linear-to-r from-slate-50 to-sky-50" />
            <CardContent className="pt-0 pb-6">
              <div className="-mt-7 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
                <div className="h-16 w-16 shrink-0 rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm ring-4 ring-white">
                  {profile?.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.logo_url}
                      alt={`${vendorDisplay.companyName} logo`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-900 text-white text-xl font-bold select-none">
                      {getInitials(vendorDisplay.companyName)}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-base text-slate-900">{vendorDisplay.companyName}</p>
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
          <Card className="border-slate-200/70 shadow-sm">
            <CardHeader className="pb-4">
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
          <Card className="border-slate-200/70 shadow-sm">
            <CardHeader className="pb-4">
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

          {/* Showcase images */}
          <Card className="border-slate-200/70 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="h-4 w-4 text-muted-foreground" />
                Showcase gallery
              </CardTitle>
              <CardDescription className="text-xs">
                Upload professional images of your premises, machinery, storage, packaging, quality control, and logistics.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                id={showcaseInputId}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = e.target.files;
                  e.target.value = '';
                  void handleShowcasePicked(files);
                }}
              />
              <input
                ref={replaceFileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  e.target.value = '';
                  const replaceId = pendingReplaceIdRef.current;
                  pendingReplaceIdRef.current = '';
                  void handleReplaceShowcaseImage(replaceId, file);
                }}
              />
              <div
                className="rounded-xl border border-dashed border-slate-300/80 bg-secondary/10 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (showcaseBusy) return;
                  void handleShowcasePicked(e.dataTransfer.files);
                }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5"
                    disabled={showcaseBusy}
                    onClick={() => document.getElementById(showcaseInputId)?.click()}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {showcaseBusy ? 'Uploading…' : 'Upload images'}
                  </Button>

                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Default category</Label>
                    <Select value={showcaseUploadKind} onValueChange={(v) => setShowcaseUploadKind(v as ShowcaseKind)}>
                      <SelectTrigger size="sm" className="h-8 w-[170px]">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {SHOWCASE_KINDS.map((k) => (
                          <SelectItem key={k.value} value={k.value}>
                            {k.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Tip: Use wide, well-lit photos (clean backgrounds, branded safety gear, clear equipment shots).
                </p>
              </div>

              {showcaseImages.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {showcaseImages.map((img, idx) => (
                    <div key={img.id} className="rounded-xl border border-border/60 overflow-hidden bg-card">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt={img.caption || 'Showcase image'} className="h-44 w-full object-cover" />
                      <div className="p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground">Category</Label>
                          <Select
                            value={img.kind}
                            onValueChange={(value) => void updateShowcaseImage(img.id, { kind: value })}
                          >
                            <SelectTrigger size="sm" className="h-8 w-[160px]">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {SHOWCASE_KINDS.map((k) => (
                                <SelectItem key={k.value} value={k.value}>
                                  {k.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="ml-auto flex items-center gap-1.5">
                            <span className="hidden sm:inline text-xs text-muted-foreground tabular-nums">#{idx + 1}</span>

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              disabled={showcaseBusy || idx === 0}
                              onClick={() => void handleMoveShowcaseImage(img.id, 'up')}
                              aria-label="Move image up"
                              title="Move up"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              disabled={showcaseBusy || idx === showcaseImages.length - 1}
                              onClick={() => void handleMoveShowcaseImage(img.id, 'down')}
                              aria-label="Move image down"
                              title="Move down"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8"
                              disabled={showcaseBusy}
                              onClick={() => {
                                pendingReplaceIdRef.current = img.id;
                                replaceFileInputRef.current?.click();
                              }}
                            >
                              Replace
                            </Button>
                            <AlertDialog
                              open={pendingShowcaseDeleteId === img.id}
                              onOpenChange={(open) => setPendingShowcaseDeleteId(open ? img.id : null)}
                            >
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8" disabled={showcaseBusy}>
                                  Remove
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove this image?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This removes the image from your public supplier profile. You can upload it again later.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={async (e) => {
                                      e.preventDefault();
                                      setPendingShowcaseDeleteId(null);
                                      await handleDeleteShowcaseImage(img.id);
                                    }}
                                  >
                                    Remove image
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-3">
                            <Label className="text-xs text-muted-foreground">Caption</Label>
                            <p className="text-[11px] text-muted-foreground tabular-nums">
                              {(img.caption ?? '').length}/140
                            </p>
                          </div>
                          <Input
                            value={img.caption ?? ''}
                            onChange={(e) => scheduleCaptionUpdate(img.id, e.target.value)}
                            onBlur={(e) => void flushCaptionUpdate(img.id, e.target.value)}
                            placeholder="e.g. Finished goods warehouse (FIFO storage)"
                          />
                          <p className="text-xs text-muted-foreground">Keep it short and factual (max 140 characters).</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-border/60 bg-secondary/10 px-4 py-6 text-sm text-muted-foreground">
                  <p className="font-medium text-slate-900">No showcase images yet</p>
                  <p className="mt-1">
                    Upload 3-6 professional photos to help buyers trust your facilities, equipment, and QC process.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location */}
          <Card className="border-slate-200/70 shadow-sm">
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
          <Card className="border-slate-200/70 shadow-sm">
            <CardHeader className="pb-4">
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
          <Card className="border-slate-200/70 shadow-sm">
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
          <Card className="border-slate-200/70 shadow-sm">
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
          'sticky bottom-0 z-40 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8',
          'pb-4 pt-3',
        )}
      >
        <div className="rounded-2xl border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 px-4 py-3 shadow-sm">
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
                  ? 'You have changes that haven’t been saved yet.'
                  : 'Everything is up to date.'}
              </p>
            </div>

            <div className="flex items-center gap-2 justify-end">
              <Badge variant={hasUnsavedChanges ? 'warning' : 'success'}>
                {hasUnsavedChanges ? 'Unsaved' : 'Saved'}
              </Badge>
              <Button onClick={handleSave} disabled={saving || !hasUnsavedChanges} className="min-w-32">
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
