'use client';

import { useCallback, useEffect, useMemo, useState, type ElementType } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Money } from '@/components/money';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  MoreVertical,
  Mail,
  Phone,
  Pencil,
  Loader2,
  Package,
  ShoppingBag,
  Plus,
  Trash2,
  Search,
  RefreshCw,
  Store,
  ShieldCheck,
  Clock,
  TrendingUp,
  X,
  CheckCircle2,
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
};

type VendorRow = {
  id: string;
  name: string;
  email: string;
  company_name: string;
  is_verified: boolean;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
  profile: VendorProfile | null;
  product_count: number;
  order_count: number;
  revenue: number;
};

type Stats = {
  total: number;
  verified: number;
  pending: number;
  platformGmv: number;
};

type StatusFilter = 'all' | 'pending' | 'verified';

function vendorDisplayName(v: VendorRow) {
  return v.company_name || v.profile?.company_name || v.name || 'Vendor';
}

function formatJoined(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  loading,
  accent = 'primary',
}: {
  label: string;
  value: React.ReactNode;
  hint: string;
  icon: ElementType;
  loading?: boolean;
  accent?: 'primary' | 'emerald' | 'amber' | 'violet';
}) {
  const accentMap = {
    primary: 'bg-primary/10 text-primary ring-primary/15',
    emerald: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/15 dark:text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-600 ring-amber-500/15 dark:text-amber-400',
    violet: 'bg-violet-500/10 text-violet-600 ring-violet-500/15 dark:text-violet-400',
  };

  return (
    <Card className="rounded-2xl border-border/70 bg-card/80 shadow-sm backdrop-blur">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-medium tracking-wide text-muted-foreground">{label}</p>
          <span
            className={cn(
              'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ring-1',
              accentMap[accent],
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
        </div>
        {loading ? (
          <Skeleton className="mt-3 h-8 w-20 rounded-lg" />
        ) : (
          <div className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
            {value}
          </div>
        )}
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [addOpen, setAddOpen] = useState(false);
  const [addSaving, setAddSaving] = useState(false);
  const [addForm, setAddForm] = useState({ userId: '', email: '', name: '', companyName: '' });

  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editVendor, setEditVendor] = useState<VendorRow | null>(null);
  const [editForm, setEditForm] = useState({
    companyName: '',
    name: '',
    email: '',
    description: '',
    phone: '',
    publicEmail: '',
    website: '',
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ limit: '200', status: statusFilter });
      const response = await fetch(`/api/admin/vendors?${qs.toString()}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Failed to load vendors');
      setVendors(payload.vendors ?? []);
      setStats(payload.stats ?? null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load vendors');
      setVendors([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [statusFilter]);

  const filteredVendors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return vendors;
    return vendors.filter((v) => {
      const company = vendorDisplayName(v);
      const hay = `${company} ${v.name} ${v.email} ${v.profile?.public_email ?? ''} ${v.id}`.toLowerCase();
      return hay.includes(q);
    });
  }, [vendors, searchQuery]);

  const allSelected =
    filteredVendors.length > 0 && filteredVendors.every((v) => selectedIds.has(v.id));
  const someSelected = selectedIds.size > 0;

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredVendors.map((v) => v.id)));
    }
  }

  function toggleOne(vendorId: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(vendorId);
      else next.delete(vendorId);
      return next;
    });
  }

  function openEdit(v: VendorRow) {
    setEditVendor(v);
    setEditForm({
      companyName: v.company_name ?? '',
      name: v.name ?? '',
      email: v.email ?? '',
      description: v.profile?.description ?? '',
      phone: v.profile?.phone ?? '',
      publicEmail: v.profile?.public_email ?? '',
      website: v.profile?.website ?? '',
    });
    setEditOpen(true);
  }

  async function saveEdit() {
    if (!editVendor) return;
    setEditSaving(true);
    try {
      const response = await fetch('/api/admin/vendors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editVendor.id,
          companyName: editForm.companyName,
          name: editForm.name,
          email: editForm.email,
          profile: {
            description: editForm.description,
            phone: editForm.phone,
            publicEmail: editForm.publicEmail,
            website: editForm.website,
            companyName: editForm.companyName,
          },
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Update failed');
      toast.success('Vendor updated');
      setEditOpen(false);
      setEditVendor(null);
      await fetchVendors();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setEditSaving(false);
    }
  }

  async function setVerified(vendorId: string, isVerified: boolean) {
    const response = await fetch('/api/admin/vendors', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: vendorId, isVerified }),
    });
    const payload = await response.json();
    if (!response.ok) {
      toast.error(payload.error ?? 'Could not update verification');
      return;
    }
    toast.success(isVerified ? 'Vendor verified' : 'Vendor marked as not verified');
    await fetchVendors();
  }

  async function deleteVendors(ids: string[]) {
    if (ids.length === 0) return false;
    const response = await fetch(
      `/api/admin/vendors?ids=${ids.map((id) => encodeURIComponent(id)).join(',')}`,
      { method: 'DELETE' },
    );
    const payload = await response.json();
    if (!response.ok) {
      toast.error(payload.error ?? 'Delete failed');
      return false;
    }
    toast.success(
      ids.length === 1 ? 'Vendor removed' : `${payload.deleted ?? ids.length} vendors removed`,
    );
    setSelectedIds(new Set());
    setDeleteTarget(null);
    await fetchVendors();
    return true;
  }

  async function bulkSetVerified(isVerified: boolean) {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    setBulkBusy(true);
    try {
      const response = await fetch('/api/admin/vendors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, isVerified }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Could not update vendors');
      toast.success(
        isVerified
          ? `${payload.updated ?? ids.length} vendor(s) verified`
          : `${payload.updated ?? ids.length} vendor(s) marked not verified`,
      );
      setSelectedIds(new Set());
      await fetchVendors();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setBulkBusy(false);
    }
  }

  async function confirmBulkDelete() {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    setBulkBusy(true);
    try {
      const ok = await deleteVendors(ids);
      if (ok) setBulkDeleteOpen(false);
    } finally {
      setBulkBusy(false);
    }
  }

  async function submitAdd() {
    setAddSaving(true);
    try {
      const response = await fetch('/api/admin/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: addForm.userId.trim(),
          email: addForm.email.trim(),
          name: addForm.name.trim() || undefined,
          companyName: addForm.companyName.trim() || undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Could not create vendor');
      toast.success('Vendor created');
      setAddOpen(false);
      setAddForm({ userId: '', email: '', name: '', companyName: '' });
      await fetchVendors();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create vendor');
    } finally {
      setAddSaving(false);
    }
  }

  const filterTabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: stats?.total ?? 0 },
    { key: 'pending', label: 'Pending', count: stats?.pending ?? 0 },
    { key: 'verified', label: 'Verified', count: stats?.verified ?? 0 },
  ];

  return (
    <main className="flex-1 overflow-auto bg-linear-to-b from-background via-background to-muted/25">
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 md:py-10 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-wide text-muted-foreground">Admin console</p>
            <h1 className="mt-1 flex items-center gap-2.5 text-2xl font-semibold tracking-tight md:text-3xl">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
                <Store className="h-5 w-5" />
              </span>
              Vendor management
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Review seller accounts, verify vendors, and monitor catalog and order activity across the marketplace.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => fetchVendors()}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
            <Button size="sm" className="rounded-xl" onClick={() => setAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add vendor
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total vendors"
            value={stats?.total ?? '—'}
            hint="Registered seller accounts"
            icon={Store}
            loading={loading}
            accent="primary"
          />
          <StatCard
            label="Verified"
            value={stats?.verified ?? '—'}
            hint="Approved for selling"
            icon={ShieldCheck}
            loading={loading}
            accent="emerald"
          />
          <StatCard
            label="Pending review"
            value={stats?.pending ?? '—'}
            hint="Awaiting verification"
            icon={Clock}
            loading={loading}
            accent="amber"
          />
          <StatCard
            label="Platform GMV"
            value={<Money amountUSD={stats?.platformGmv ?? 0} notation="compact" />}
            hint="Gross order value (all vendors)"
            icon={TrendingUp}
            loading={loading}
            accent="violet"
          />
        </div>

        {/* Filters */}
        <Card className="rounded-2xl border-border/70 bg-card/80 shadow-sm">
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex flex-wrap gap-1.5">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors',
                    statusFilter === tab.key
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  {tab.label}
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-px text-[10px] font-bold tabular-nums',
                      statusFilter === tab.key ? 'bg-primary-foreground/20' : 'bg-background/80',
                    )}
                  >
                    {loading ? '…' : tab.count}
                  </span>
                </button>
              ))}
            </div>
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vendors…"
                className="rounded-xl bg-muted/40 pl-9"
                aria-label="Search vendors"
              />
            </div>
          </CardContent>
        </Card>

        {/* Vendor list */}
        <Card className="overflow-hidden rounded-2xl border-border/70 bg-card/80 shadow-sm">
          <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-base">Vendor directory</CardTitle>
                <CardDescription>
                  {loading
                    ? 'Loading…'
                    : `${filteredVendors.length} vendor${filteredVendors.length === 1 ? '' : 's'} in this view`}
                </CardDescription>
              </div>
              {someSelected ? (
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2">
                  <span className="text-xs font-medium text-foreground">
                    {selectedIds.size} selected
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 rounded-lg text-xs"
                    disabled={bulkBusy}
                    onClick={() => bulkSetVerified(true)}
                  >
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                    Verify
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 rounded-lg text-xs"
                    disabled={bulkBusy}
                    onClick={() => bulkSetVerified(false)}
                  >
                    Unverify
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 rounded-lg text-xs text-destructive hover:text-destructive"
                    disabled={bulkBusy}
                    onClick={() => setBulkDeleteOpen(true)}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    Delete
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 rounded-lg p-0"
                    disabled={bulkBusy}
                    onClick={() => setSelectedIds(new Set())}
                    aria-label="Clear selection"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : null}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-0 divide-y divide-border/60">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-4 py-4 sm:px-6">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-11 w-11 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-64" />
                    </div>
                    <Skeleton className="hidden h-8 w-24 sm:block" />
                  </div>
                ))}
              </div>
            ) : filteredVendors.length === 0 ? (
              <Empty className="border-0 py-16">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Store />
                  </EmptyMedia>
                  <EmptyTitle>No vendors found</EmptyTitle>
                  <EmptyDescription>
                    {searchQuery.trim()
                      ? 'Try a different search term or clear filters.'
                      : 'No vendors match this filter. Add a vendor or switch to another tab.'}
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent className="flex flex-wrap justify-center gap-2">
                  {searchQuery.trim() ? (
                    <Button variant="outline" className="rounded-xl" onClick={() => setSearchQuery('')}>
                      Clear search
                    </Button>
                  ) : null}
                  <Button className="rounded-xl" onClick={() => setAddOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add vendor
                  </Button>
                </EmptyContent>
              </Empty>
            ) : (
              <>
                <div className="hidden border-b border-border/60 bg-muted/10 px-4 py-2.5 sm:grid sm:grid-cols-[auto_1fr_repeat(3,minmax(0,5rem))_auto] sm:items-center sm:gap-4 sm:px-6">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                    onCheckedChange={() => toggleAll()}
                    aria-label="Select all vendors"
                  />
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Vendor
                  </span>
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground text-center">
                    Products
                  </span>
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground text-center">
                    Orders
                  </span>
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground text-right">
                    Revenue
                  </span>
                  <span className="sr-only">Actions</span>
                </div>

                <ul className="divide-y divide-border/60">
                  {filteredVendors.map((vendor) => {
                    const displayCompany = vendorDisplayName(vendor);
                    const displayEmail = vendor.email || vendor.profile?.public_email || '';
                    const phone = vendor.profile?.phone?.trim();
                    const isSelected = selectedIds.has(vendor.id);

                    return (
                      <li
                        key={vendor.id}
                        className={cn(
                          'transition-colors',
                          isSelected ? 'bg-primary/5' : 'hover:bg-muted/30',
                        )}
                      >
                        <div className="flex flex-col gap-4 p-4 sm:grid sm:grid-cols-[auto_1fr_repeat(3,minmax(0,5rem))_auto] sm:items-center sm:gap-4 sm:px-6 sm:py-4">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => toggleOne(vendor.id, checked === true)}
                            aria-label={`Select ${displayCompany}`}
                            className="self-start sm:self-center"
                          />

                          <div className="flex min-w-0 flex-1 gap-3 sm:col-span-1">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary/15 to-primary/5 text-base font-bold text-primary ring-1 ring-primary/10">
                              {displayCompany.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="truncate font-semibold text-foreground">{displayCompany}</p>
                                {vendor.is_verified ? (
                                  <Badge className="gap-1 border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                                    <ShieldCheck className="h-3 w-3" />
                                    Verified
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="border-amber-500/30 text-amber-700 dark:text-amber-400">
                                    Pending
                                  </Badge>
                                )}
                              </div>
                              <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                                {vendor.profile?.description?.trim() || 'No profile description'}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                {displayEmail ? (
                                  <span className="inline-flex max-w-full items-center gap-1">
                                    <Mail className="h-3.5 w-3.5 shrink-0" />
                                    <span className="truncate">{displayEmail}</span>
                                  </span>
                                ) : null}
                                {phone ? (
                                  <span className="inline-flex items-center gap-1">
                                    <Phone className="h-3.5 w-3.5 shrink-0" />
                                    {phone}
                                  </span>
                                ) : null}
                                <span className="text-muted-foreground/80">
                                  Joined {formatJoined(vendor.created_at)}
                                </span>
                              </div>

                              <div className="mt-3 flex flex-wrap gap-3 sm:hidden">
                                <span className="inline-flex items-center gap-1 text-xs">
                                  <Package className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="font-medium tabular-nums">{vendor.product_count}</span> products
                                </span>
                                <span className="inline-flex items-center gap-1 text-xs">
                                  <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="font-medium tabular-nums">{vendor.order_count}</span> orders
                                </span>
                                <span className="text-xs font-semibold text-primary">
                                  <Money amountUSD={vendor.revenue} notation="compact" />
                                </span>
                              </div>
                            </div>
                          </div>

                          <p className="hidden text-center text-sm font-medium tabular-nums sm:block">
                            {vendor.product_count}
                          </p>
                          <p className="hidden text-center text-sm font-medium tabular-nums sm:block">
                            {vendor.order_count}
                          </p>
                          <p className="hidden text-right text-sm font-semibold text-primary sm:block">
                            <Money amountUSD={vendor.revenue} notation="compact" />
                          </p>

                          <div className="flex shrink-0 gap-1 self-end sm:self-center">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-lg"
                              onClick={() => openEdit(vendor)}
                              aria-label={`Edit ${displayCompany}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg"
                                  aria-label={`Actions for ${displayCompany}`}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                {!vendor.is_verified && (
                                  <DropdownMenuItem onClick={() => setVerified(vendor.id, true)}>
                                    <ShieldCheck className="mr-2 h-4 w-4 text-emerald-600" />
                                    Verify vendor
                                  </DropdownMenuItem>
                                )}
                                {vendor.is_verified && (
                                  <DropdownMenuItem onClick={() => setVerified(vendor.id, false)}>
                                    Mark not verified
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem asChild>
                                  <Link href="/admin/products">View products</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href="/admin/orders">View orders</Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() =>
                                    setDeleteTarget({ id: vendor.id, label: displayCompany })
                                  }
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete vendor
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add vendor</DialogTitle>
            <DialogDescription>
              Link an existing Auth user to a vendor row. Use the user&apos;s UUID from Supabase Authentication and the
              same email as their account.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-2">
              <Label htmlFor="add-user-id">Auth user ID (UUID)</Label>
              <Input
                id="add-user-id"
                value={addForm.userId}
                onChange={(e) => setAddForm((s) => ({ ...s, userId: e.target.value }))}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                autoComplete="off"
                className="rounded-xl"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-email">Email</Label>
              <Input
                id="add-email"
                type="email"
                value={addForm.email}
                onChange={(e) => setAddForm((s) => ({ ...s, email: e.target.value }))}
                placeholder="vendor@example.com"
                className="rounded-xl"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-name">Display name (optional)</Label>
              <Input
                id="add-name"
                value={addForm.name}
                onChange={(e) => setAddForm((s) => ({ ...s, name: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-company">Company name (optional)</Label>
              <Input
                id="add-company"
                value={addForm.companyName}
                onChange={(e) => setAddForm((s) => ({ ...s, companyName: e.target.value }))}
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              className="rounded-xl"
              onClick={submitAdd}
              disabled={addSaving || !addForm.userId.trim() || !addForm.email.trim()}
            >
              {addSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedIds.size} vendor{selectedIds.size === 1 ? '' : 's'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This removes the selected vendor rows and profiles. Linked products are not deleted. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={bulkBusy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                void confirmBulkDelete();
              }}
            >
              {bulkBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete {selectedIds.size} vendor{selectedIds.size === 1 ? '' : 's'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.label}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the vendor row and profile. Products are not deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                if (deleteTarget) void deleteVendors([deleteTarget.id]);
              }}
            >
              Delete vendor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit vendor</DialogTitle>
            <DialogDescription>Update vendor record and public profile fields.</DialogDescription>
          </DialogHeader>
          <div className="grid max-h-[60vh] gap-3 overflow-y-auto py-2 pr-1">
            <div className="grid gap-2">
              <Label htmlFor="edit-company">Company name</Label>
              <Input
                id="edit-company"
                value={editForm.companyName}
                onChange={(e) => setEditForm((s) => ({ ...s, companyName: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Contact / display name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm((s) => ({ ...s, name: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm((s) => ({ ...s, email: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-desc">Description</Label>
              <Textarea
                id="edit-desc"
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm((s) => ({ ...s, description: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((s) => ({ ...s, phone: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-public-email">Public email</Label>
                <Input
                  id="edit-public-email"
                  type="email"
                  value={editForm.publicEmail}
                  onChange={(e) => setEditForm((s) => ({ ...s, publicEmail: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-web">Website</Label>
              <Input
                id="edit-web"
                value={editForm.website}
                onChange={(e) => setEditForm((s) => ({ ...s, website: e.target.value }))}
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button className="rounded-xl" onClick={saveEdit} disabled={editSaving}>
              {editSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
