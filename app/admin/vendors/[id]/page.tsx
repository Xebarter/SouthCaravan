'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Money } from '@/components/money';
import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  Calendar,
  ExternalLink,
  FileText,
  Loader2,
  Package,
  Pencil,
  ShieldCheck,
  ShoppingBag,
  Store,
  Trash2,
  TrendingUp,
  User,
  BriefcaseBusiness,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type VendorProfile = {
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
  created_at: string;
  updated_at: string;
};

type Vendor = {
  id: string;
  name: string;
  email: string;
  company_name: string;
  is_verified: boolean;
  verified_at: string | null;
  services_verified: boolean;
  services_verified_at: string | null;
  created_at: string;
  updated_at: string;
};

type VendorDetailPayload = {
  vendor: Vendor;
  profile: VendorProfile | null;
  auth: { email: string | null; last_sign_in_at: string | null; created_at: string | null } | null;
  roles: string[];
  stats: {
    product_count: number;
    products_in_stock: number;
    products_featured: number;
    order_count: number;
    quote_count: number;
    revenue: number;
    orders_by_status: Record<string, number>;
  };
  products: Array<{
    id: string;
    name: string;
    price: number;
    unit: string;
    category: string;
    subcategory: string;
    in_stock: boolean;
    is_featured: boolean;
    images: string[] | null;
    created_at: string;
  }>;
  orders: Array<{
    id: string;
    buyer_id: string;
    status: string;
    total_amount: number;
    created_at: string;
    buyer: { id: string; name: string; email: string } | null;
  }>;
  quotes: Array<{
    id: string;
    status: string;
    total_amount: number | null;
    created_at: string;
    buyer: { id: string; name: string; email: string } | null;
  }>;
};

function vendorDisplayName(v: Vendor, profile: VendorProfile | null) {
  return v.company_name || profile?.company_name || v.name || 'Vendor';
}

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function orderStatusBadge(status: string) {
  const s = status.toLowerCase();
  const styles: Record<string, string> = {
    pending: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
    confirmed: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400',
    shipped: 'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-400',
    delivered: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    cancelled: 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400',
  };
  return (
    <Badge variant="outline" className={cn('capitalize', styles[s] ?? '')}>
      {s}
    </Badge>
  );
}

function StatTile({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: typeof Package;
}) {
  return (
    <Card className="rounded-2xl border-border/70 bg-card/90 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
            {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
          </div>
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoRow({ label, value, href }: { label: string; value: React.ReactNode; href?: string }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:gap-4 py-3 border-b border-border/60 last:border-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:w-36 shrink-0">{label}</dt>
      <dd className="text-sm text-foreground min-w-0 flex-1">
        {href && typeof value === 'string' ? (
          <a href={href} className="text-primary hover:underline break-all" target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
            {value}
          </a>
        ) : (
          value ?? <span className="text-muted-foreground">—</span>
        )}
      </dd>
    </div>
  );
}

export default function AdminVendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = typeof params?.id === 'string' ? params.id : '';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<VendorDetailPayload | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editForm, setEditForm] = useState({
    companyName: '',
    name: '',
    email: '',
    description: '',
    phone: '',
    publicEmail: '',
    contactEmail: '',
    website: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  });

  const load = useCallback(async () => {
    if (!vendorId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/vendors/${encodeURIComponent(vendorId)}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to load vendor');
      setData(json as VendorDetailPayload);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load vendor');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    void load();
  }, [load]);

  function openEdit() {
    if (!data) return;
    const { vendor, profile } = data;
    setEditForm({
      companyName: vendor.company_name ?? '',
      name: vendor.name ?? '',
      email: vendor.email ?? '',
      description: profile?.description ?? '',
      phone: profile?.phone ?? '',
      publicEmail: profile?.public_email ?? '',
      contactEmail: profile?.contact_email ?? '',
      website: profile?.website ?? '',
      address: profile?.address ?? '',
      city: profile?.city ?? '',
      state: profile?.state ?? '',
      zipCode: profile?.zip_code ?? '',
      country: profile?.country ?? '',
    });
    setEditOpen(true);
  }

  async function saveEdit() {
    if (!vendorId) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/vendors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: vendorId,
          companyName: editForm.companyName,
          name: editForm.name,
          email: editForm.email,
          profile: {
            companyName: editForm.companyName,
            description: editForm.description,
            phone: editForm.phone,
            publicEmail: editForm.publicEmail,
            contactEmail: editForm.contactEmail,
            website: editForm.website,
            address: editForm.address,
            city: editForm.city,
            state: editForm.state,
            zipCode: editForm.zipCode,
            country: editForm.country,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Update failed');
      toast.success('Vendor updated');
      setEditOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  async function setMarketplaceVerified(isVerified: boolean) {
    if (!vendorId) return;
    const res = await fetch('/api/admin/vendors', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: vendorId, isVerified }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error ?? 'Could not update marketplace verification');
      return;
    }
    toast.success(isVerified ? 'Marketplace verified' : 'Marketplace verification removed');
    await load();
  }

  async function setServicesVerified(servicesVerified: boolean) {
    if (!vendorId) return;
    const res = await fetch('/api/admin/vendors', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: vendorId, servicesVerified }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error ?? 'Could not update services verification');
      return;
    }
    toast.success(servicesVerified ? 'Services verified' : 'Services verification removed');
    await load();
  }

  async function confirmDelete() {
    if (!vendorId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/vendors?id=${encodeURIComponent(vendorId)}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Delete failed');
      toast.success('Vendor removed');
      router.push('/admin/vendors');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  }

  if (!vendorId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center space-y-4">
        <p className="text-muted-foreground">Invalid vendor link.</p>
        <Button variant="outline" asChild className="rounded-xl">
          <Link href="/admin/vendors">Back to vendors</Link>
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <main className="flex-1 overflow-auto bg-linear-to-b from-background via-background to-muted/25">
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center space-y-4">
        <Store className="mx-auto h-12 w-12 text-muted-foreground/40" />
        <p className="font-medium">Vendor not found</p>
        <Button variant="outline" asChild className="rounded-xl">
          <Link href="/admin/vendors">Back to vendors</Link>
        </Button>
      </div>
    );
  }

  const { vendor, profile, auth, roles, stats, products, orders, quotes } = data;
  const displayName = vendorDisplayName(vendor, profile);
  const logoUrl = profile?.logo_url?.trim();
  const addressParts = [profile?.address, profile?.city, profile?.state, profile?.zip_code, profile?.country].filter(Boolean);
  const fullAddress = addressParts.join(', ');

  return (
    <main className="flex-1 overflow-auto bg-linear-to-b from-background via-background to-muted/25">
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 md:py-10 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <Link
              href="/admin/vendors"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              All vendors
            </Link>

            <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start">
              {logoUrl ? (
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl ring-2 ring-border bg-muted">
                  <Image src={logoUrl} alt="" fill className="object-cover" sizes="80px" unoptimized />
                </div>
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-primary/20 to-primary/5 text-2xl font-bold text-primary ring-2 ring-primary/15">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{displayName}</h1>
                  {vendor.is_verified ? (
                    <Badge className="gap-1 border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                      <Store className="h-3.5 w-3.5" />
                      Marketplace verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 border-amber-500/30 text-amber-700 dark:text-amber-400">
                      <Clock className="h-3.5 w-3.5" />
                      Marketplace pending
                    </Badge>
                  )}
                  {vendor.services_verified ? (
                    <Badge className="gap-1 border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-400">
                      <BriefcaseBusiness className="h-3.5 w-3.5" />
                      Services verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 border-violet-500/30 text-violet-700 dark:text-violet-400">
                      <Clock className="h-3.5 w-3.5" />
                      Services pending
                    </Badge>
                  )}
                </div>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                  {profile?.description?.trim() || 'No company description on file.'}
                </p>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Joined {formatDate(vendor.created_at)}
                  </span>
                  {vendor.verified_at ? (
                    <span className="inline-flex items-center gap-1">
                      <Store className="h-3.5 w-3.5" />
                      Marketplace {formatDate(vendor.verified_at)}
                    </span>
                  ) : null}
                  {vendor.services_verified_at ? (
                    <span className="inline-flex items-center gap-1">
                      <BriefcaseBusiness className="h-3.5 w-3.5" />
                      Services {formatDate(vendor.services_verified_at)}
                    </span>
                  ) : null}
                  <span className="font-mono text-[11px] text-muted-foreground/80">ID {vendor.id.slice(0, 8)}…</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <Button variant="outline" size="sm" className="rounded-xl" asChild>
              <Link href={`/supplier/${vendor.id}`} target="_blank">
                <ExternalLink className="mr-2 h-4 w-4" />
                Public profile
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl" onClick={openEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
            {!vendor.is_verified ? (
              <Button size="sm" className="rounded-xl" onClick={() => void setMarketplaceVerified(true)}>
                <Store className="mr-2 h-4 w-4" />
                Verify marketplace
              </Button>
            ) : (
              <Button variant="secondary" size="sm" className="rounded-xl" onClick={() => void setMarketplaceVerified(false)}>
                Revoke marketplace
              </Button>
            )}
            {!vendor.services_verified ? (
              <Button size="sm" variant="outline" className="rounded-xl" onClick={() => void setServicesVerified(true)}>
                <BriefcaseBusiness className="mr-2 h-4 w-4" />
                Verify services
              </Button>
            ) : (
              <Button variant="secondary" size="sm" className="rounded-xl" onClick={() => void setServicesVerified(false)}>
                Revoke services
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl text-destructive hover:text-destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Products" value={stats.product_count} hint={`${stats.products_in_stock} in stock`} icon={Package} />
          <StatTile label="Orders" value={stats.order_count} icon={ShoppingBag} />
          <StatTile
            label="Lifetime revenue"
            value={<Money amountUSD={stats.revenue} notation="compact" />}
            icon={TrendingUp}
          />
          <StatTile label="Quotes sent" value={stats.quote_count} icon={FileText} />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Sidebar: contact & account */}
          <div className="space-y-6 lg:col-span-1">
            <Card className="rounded-2xl border-border/70 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Portal verification
                </CardTitle>
                <CardDescription>Each dashboard is approved independently</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold flex items-center gap-2">
                      <Store className="h-4 w-4 text-emerald-600" />
                      Marketplace
                    </p>
                    {vendor.is_verified ? (
                      <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/20">Verified</Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-700 border-amber-500/30">Pending</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Vendor dashboard, products, and orders</p>
                  <Button
                    size="sm"
                    variant={vendor.is_verified ? 'outline' : 'default'}
                    className="mt-3 w-full rounded-lg"
                    onClick={() => void setMarketplaceVerified(!vendor.is_verified)}
                  >
                    {vendor.is_verified ? 'Revoke marketplace access' : 'Approve marketplace'}
                  </Button>
                </div>
                <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold flex items-center gap-2">
                      <BriefcaseBusiness className="h-4 w-4 text-violet-600" />
                      Services
                    </p>
                    {vendor.services_verified ? (
                      <Badge className="bg-violet-500/15 text-violet-700 border-violet-500/20">Verified</Badge>
                    ) : (
                      <Badge variant="outline" className="text-violet-700 border-violet-500/30">Pending</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Services dashboard and offerings</p>
                  <Button
                    size="sm"
                    variant={vendor.services_verified ? 'outline' : 'default'}
                    className="mt-3 w-full rounded-lg"
                    onClick={() => void setServicesVerified(!vendor.services_verified)}
                  >
                    {vendor.services_verified ? 'Revoke services access' : 'Approve services'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/70 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  Contact & location
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <dl>
                  <InfoRow label="Account email" value={vendor.email} href={`mailto:${vendor.email}`} />
                  <InfoRow
                    label="Public email"
                    value={profile?.public_email || '—'}
                    href={profile?.public_email ? `mailto:${profile.public_email}` : undefined}
                  />
                  <InfoRow
                    label="Contact email"
                    value={profile?.contact_email || '—'}
                    href={profile?.contact_email ? `mailto:${profile.contact_email}` : undefined}
                  />
                  <InfoRow
                    label="Phone"
                    value={profile?.phone || '—'}
                    href={profile?.phone ? `tel:${profile.phone.replace(/\s/g, '')}` : undefined}
                  />
                  <InfoRow
                    label="Website"
                    value={profile?.website || '—'}
                    href={
                      profile?.website
                        ? profile.website.startsWith('http')
                          ? profile.website
                          : `https://${profile.website}`
                        : undefined
                    }
                  />
                  <InfoRow
                    label="Address"
                    value={fullAddress || '—'}
                  />
                </dl>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/70 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Account
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <dl>
                  <InfoRow label="Display name" value={vendor.name} />
                  <InfoRow label="Auth email" value={auth?.email ?? vendor.email} />
                  <InfoRow label="Roles" value={roles.length ? roles.join(', ') : 'vendor'} />
                  <InfoRow label="Last sign-in" value={formatDateTime(auth?.last_sign_in_at)} />
                  <InfoRow label="Profile updated" value={formatDateTime(profile?.updated_at)} />
                </dl>
              </CardContent>
            </Card>

            {Object.keys(stats.orders_by_status).some((k) => stats.orders_by_status[k] > 0) ? (
              <Card className="rounded-2xl border-border/70 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Order breakdown</CardTitle>
                  <CardDescription>By status (recent sample)</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2 pt-0">
                  {Object.entries(stats.orders_by_status)
                    .filter(([, n]) => n > 0)
                    .map(([status, count]) => (
                      <span
                        key={status}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium capitalize"
                      >
                        {status}
                        <span className="tabular-nums text-muted-foreground">{count}</span>
                      </span>
                    ))}
                </CardContent>
              </Card>
            ) : null}
          </div>

          {/* Main tabs */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="w-full justify-start rounded-xl bg-muted/50 p-1 h-auto flex-wrap">
                <TabsTrigger value="overview" className="rounded-lg">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="products" className="rounded-lg">
                  Products ({stats.product_count})
                </TabsTrigger>
                <TabsTrigger value="orders" className="rounded-lg">
                  Orders ({stats.order_count})
                </TabsTrigger>
                <TabsTrigger value="quotes" className="rounded-lg">
                  Quotes ({stats.quote_count})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <Card className="rounded-2xl border-border/70 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Company overview</CardTitle>
                    <CardDescription>Profile and marketplace activity summary</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">About</p>
                      <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                        {profile?.description?.trim() || 'No description provided.'}
                      </p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                        <p className="text-xs text-muted-foreground">Catalog</p>
                        <p className="mt-1 text-lg font-semibold tabular-nums">{stats.product_count} listings</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {stats.products_featured} featured · {stats.products_in_stock} in stock (shown)
                        </p>
                      </div>
                      <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                        <p className="text-xs text-muted-foreground">Sales</p>
                        <p className="mt-1 text-lg font-semibold">
                          <Money amountUSD={stats.revenue} />
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{stats.order_count} total orders</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" className="rounded-xl" asChild>
                        <Link href="/admin/products">
                          <Package className="mr-2 h-4 w-4" />
                          Manage products
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-xl" asChild>
                        <Link href="/admin/orders">
                          <ShoppingBag className="mr-2 h-4 w-4" />
                          All orders
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="products">
                <Card className="rounded-2xl border-border/70 shadow-sm overflow-hidden">
                  <CardHeader className="border-b border-border/60 bg-muted/15">
                    <CardTitle className="text-base">Product catalog</CardTitle>
                    <CardDescription>
                      {products.length < stats.product_count
                        ? `Showing ${products.length} of ${stats.product_count} products`
                        : `${products.length} product${products.length === 1 ? '' : 's'}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {products.length === 0 ? (
                      <p className="p-8 text-center text-sm text-muted-foreground">No products listed yet.</p>
                    ) : (
                      <ul className="divide-y divide-border/60">
                        {products.map((p) => {
                          const img = Array.isArray(p.images) && p.images[0] ? p.images[0] : null;
                          return (
                            <li key={p.id} className="flex gap-4 p-4 sm:p-5 hover:bg-muted/20 transition-colors">
                              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-border">
                                {img ? (
                                  <Image src={img} alt="" fill className="object-cover" sizes="56px" unoptimized />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center">
                                    <Package className="h-5 w-5 text-muted-foreground/50" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-medium truncate">{p.name}</p>
                                  {p.is_featured ? (
                                    <Badge variant="secondary" className="text-[10px]">
                                      Featured
                                    </Badge>
                                  ) : null}
                                  {!p.in_stock ? (
                                    <Badge variant="outline" className="text-[10px]">
                                      Out of stock
                                    </Badge>
                                  ) : null}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {p.category}
                                  {p.subcategory ? ` · ${p.subcategory}` : ''}
                                </p>
                                <p className="text-sm font-semibold text-primary mt-1">
                                  <Money amountUSD={Number(p.price)} /> / {p.unit || 'unit'}
                                </p>
                              </div>
                              <Button variant="ghost" size="sm" className="shrink-0 rounded-lg" asChild>
                                <Link href={`/product/${p.id}`} target="_blank">
                                  View
                                  <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                                </Link>
                              </Button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="orders">
                <Card className="rounded-2xl border-border/70 shadow-sm overflow-hidden">
                  <CardHeader className="border-b border-border/60 bg-muted/15">
                    <CardTitle className="text-base">Recent orders</CardTitle>
                    <CardDescription>Latest marketplace orders for this vendor</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {orders.length === 0 ? (
                      <p className="p-8 text-center text-sm text-muted-foreground">No orders yet.</p>
                    ) : (
                      <ul className="divide-y divide-border/60">
                        {orders.map((o) => (
                          <li key={o.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 hover:bg-muted/20">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <Link
                                  href={`/admin/orders/${o.id}`}
                                  className="font-medium hover:text-primary transition-colors"
                                >
                                  Order #{String(o.id).slice(-8)}
                                </Link>
                                {orderStatusBadge(o.status)}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {o.buyer?.name || 'Buyer'} · {formatDateTime(o.created_at)}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold text-primary">
                                <Money amountUSD={Number(o.total_amount)} />
                              </span>
                              <Button variant="outline" size="sm" className="rounded-lg" asChild>
                                <Link href={`/admin/orders/${o.id}`}>Open</Link>
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="quotes">
                <Card className="rounded-2xl border-border/70 shadow-sm overflow-hidden">
                  <CardHeader className="border-b border-border/60 bg-muted/15">
                    <CardTitle className="text-base">RFQ quotes</CardTitle>
                    <CardDescription>Quotes submitted by this vendor</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {quotes.length === 0 ? (
                      <p className="p-8 text-center text-sm text-muted-foreground">No quotes on record.</p>
                    ) : (
                      <ul className="divide-y divide-border/60">
                        {quotes.map((q) => (
                          <li
                            key={q.id}
                            className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 hover:bg-muted/20"
                          >
                            <div>
                              <p className="font-medium">Quote #{String(q.id).slice(-8)}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {q.buyer?.name || 'Buyer'} · {formatDate(q.created_at)} ·{' '}
                                <span className="capitalize">{q.status}</span>
                              </p>
                            </div>
                            {q.total_amount != null ? (
                              <p className="text-sm font-semibold">
                                <Money amountUSD={Number(q.total_amount)} />
                              </p>
                            ) : (
                              <span className="text-xs text-muted-foreground">Amount TBD</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit vendor</DialogTitle>
            <DialogDescription>Update account and profile details for {displayName}.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Company name</Label>
                <Input
                  value={editForm.companyName}
                  onChange={(e) => setEditForm((f) => ({ ...f, companyName: e.target.value }))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Contact name</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  className="mt-1.5"
                />
              </div>
            </div>
            <div>
              <Label>Account email</Label>
              <Input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="mt-1.5 resize-y"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Phone</Label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Website</Label>
                <Input
                  value={editForm.website}
                  onChange={(e) => setEditForm((f) => ({ ...f, website: e.target.value }))}
                  className="mt-1.5"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Public email</Label>
                <Input
                  value={editForm.publicEmail}
                  onChange={(e) => setEditForm((f) => ({ ...f, publicEmail: e.target.value }))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Contact email</Label>
                <Input
                  value={editForm.contactEmail}
                  onChange={(e) => setEditForm((f) => ({ ...f, contactEmail: e.target.value }))}
                  className="mt-1.5"
                />
              </div>
            </div>
            <div>
              <Label>Street address</Label>
              <Input
                value={editForm.address}
                onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
                className="mt-1.5"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>City</Label>
                <Input
                  value={editForm.city}
                  onChange={(e) => setEditForm((f) => ({ ...f, city: e.target.value }))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>State</Label>
                <Input
                  value={editForm.state}
                  onChange={(e) => setEditForm((f) => ({ ...f, state: e.target.value }))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>ZIP</Label>
                <Input
                  value={editForm.zipCode}
                  onChange={(e) => setEditForm((f) => ({ ...f, zipCode: e.target.value }))}
                  className="mt-1.5"
                />
              </div>
            </div>
            <div>
              <Label>Country</Label>
              <Input
                value={editForm.country}
                onChange={(e) => setEditForm((f) => ({ ...f, country: e.target.value }))}
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={() => void saveEdit()} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete vendor?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes {displayName} and their vendor profile. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
