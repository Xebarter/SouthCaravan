'use client';

import { useCallback, useEffect, useMemo, useState, type ElementType } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2,
  Plus,
  Trash2,
  Search,
  RefreshCw,
  Store,
  ShieldCheck,
  X,
  CheckCircle2,
  BriefcaseBusiness,
  Sparkles,
  Clock,
  Users,
  Filter,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VendorDirectoryList } from '@/components/admin/vendor-directory-list';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  filterByListSegment,
  filterByVerification,
  type AdminVendorListRow,
} from '@/lib/admin-vendor-membership';

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

type VendorAccountType = 'marketplace_vendor' | 'service_provider' | 'hybrid';

type VendorRow = {
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
  profile: VendorProfile | null;
  product_count: number;
  order_count: number;
  revenue: number;
  offerings_count?: number;
  roles?: string[];
  account_type: VendorAccountType;
};

type Stats = {
  total: number;
  verified: number;
  pending: number;
  marketplaceVerified?: number;
  marketplacePending?: number;
  servicesVerified?: number;
  servicesPending?: number;
  platformGmv: number;
};

type StatusFilter = 'all' | 'pending' | 'verified';

function vendorDisplayName(v: VendorRow) {
  return v.company_name || v.profile?.company_name || v.name || 'Vendor';
}

const STAT_ACCENT = {
  primary: {
    icon: 'bg-primary/10 text-primary ring-primary/20',
    bar: 'bg-primary',
  },
  emerald: {
    icon: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400',
    bar: 'bg-emerald-500',
  },
  violet: {
    icon: 'bg-violet-500/10 text-violet-600 ring-violet-500/20 dark:text-violet-400',
    bar: 'bg-violet-500',
  },
  indigo: {
    icon: 'bg-indigo-500/10 text-indigo-600 ring-indigo-500/20 dark:text-indigo-400',
    bar: 'bg-indigo-500',
  },
} as const;

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
  accent?: keyof typeof STAT_ACCENT;
}) {
  const styles = STAT_ACCENT[accent];

  return (
    <Card className="relative overflow-hidden rounded-xl border-border/60 bg-card/90 shadow-sm">
      <div className={cn('absolute inset-y-0 left-0 w-0.5', styles.bar)} aria-hidden />
      <CardContent className="py-2.5 pl-3.5 pr-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
          <span
            className={cn(
              'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md ring-1',
              styles.icon,
            )}
          >
            <Icon className="h-3 w-3" />
          </span>
        </div>
        {loading ? (
          <Skeleton className="mt-1.5 h-6 w-12 rounded-md" />
        ) : (
          <p className="mt-1 text-xl font-semibold tabular-nums leading-none tracking-tight text-foreground">
            {value}
          </p>
        )}
        <p className="mt-1 line-clamp-1 text-[10px] leading-tight text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

function formatLastUpdated(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [listCounts, setListCounts] = useState<{ marketplace: number; services: number; hybrid: number } | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [listTab, setListTab] = useState<'marketplace' | 'services'>('marketplace');
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
      const qs = new URLSearchParams({ limit: '500', status: 'all' });
      const response = await fetch(`/api/admin/vendors?${qs.toString()}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Failed to load vendors');
      setVendors(payload.vendors ?? []);
      setStats(payload.stats ?? null);
      setListCounts(payload.listCounts ?? null);
      setLastFetchedAt(new Date().toISOString());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load vendors');
      setVendors([]);
      setStats(null);
      setListCounts(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [statusFilter, listTab]);

  const searchedVendors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return vendors as AdminVendorListRow[];
    return (vendors as AdminVendorListRow[]).filter((v) => {
      const company = vendorDisplayName(v);
      const hay = `${company} ${v.name} ${v.email} ${v.profile?.public_email ?? ''} ${v.id}`.toLowerCase();
      return hay.includes(q);
    });
  }, [vendors, searchQuery]);

  const marketplaceRows = useMemo(() => {
    const segment = filterByListSegment(searchedVendors, 'marketplace');
    return filterByVerification(segment, 'marketplace', statusFilter);
  }, [searchedVendors, statusFilter]);

  const serviceProviderRows = useMemo(() => {
    const segment = filterByListSegment(searchedVendors, 'services');
    return filterByVerification(segment, 'services', statusFilter);
  }, [searchedVendors, statusFilter]);

  const activeRows = listTab === 'marketplace' ? marketplaceRows : serviceProviderRows;

  const allSelected = activeRows.length > 0 && activeRows.every((v) => selectedIds.has(v.id));
  const someSelected = selectedIds.size > 0;

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(activeRows.map((v) => v.id)));
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

  async function setMarketplaceVerified(vendorId: string, isVerified: boolean) {
    const response = await fetch('/api/admin/vendors', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: vendorId, isVerified }),
    });
    const payload = await response.json();
    if (!response.ok) {
      toast.error(payload.error ?? 'Could not update marketplace verification');
      return;
    }
    toast.success(isVerified ? 'Marketplace vendor verified' : 'Marketplace verification removed');
    await fetchVendors();
  }

  async function setServicesVerified(vendorId: string, servicesVerified: boolean) {
    const response = await fetch('/api/admin/vendors', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: vendorId, servicesVerified }),
    });
    const payload = await response.json();
    if (!response.ok) {
      toast.error(payload.error ?? 'Could not update services verification');
      return;
    }
    toast.success(
      servicesVerified ? 'Service provider verified' : 'Services verification removed',
    );
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

  async function bulkSetMarketplaceVerified(isVerified: boolean) {
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
          ? `${payload.updated ?? ids.length} marketplace vendor(s) verified`
          : `${payload.updated ?? ids.length} marketplace verification(s) removed`,
      );
      setSelectedIds(new Set());
      await fetchVendors();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setBulkBusy(false);
    }
  }

  async function bulkSetServicesVerified(servicesVerified: boolean) {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    setBulkBusy(true);
    try {
      const response = await fetch('/api/admin/vendors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, servicesVerified }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Could not update providers');
      toast.success(
        servicesVerified
          ? `${payload.updated ?? ids.length} service provider(s) verified`
          : `${payload.updated ?? ids.length} services verification(s) removed`,
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

  const verificationCounts = useMemo(() => {
    const base = filterByListSegment(searchedVendors, listTab);
    const pending = base.filter((v) =>
      listTab === 'marketplace' ? !v.is_verified : !v.services_verified,
    ).length;
    const verified = base.filter((v) =>
      listTab === 'marketplace' ? v.is_verified : Boolean(v.services_verified),
    ).length;
    return { all: base.length, pending, verified };
  }, [listTab, searchedVendors]);

  const filterTabs: { key: StatusFilter; label: string; count: number; icon: ElementType }[] = [
    { key: 'all', label: 'All', count: verificationCounts.all, icon: Users },
    { key: 'pending', label: 'Pending', count: verificationCounts.pending, icon: Clock },
    { key: 'verified', label: 'Verified', count: verificationCounts.verified, icon: ShieldCheck },
  ];

  const portalLabel = listTab === 'marketplace' ? 'marketplace' : 'services';
  const hasSearch = Boolean(searchQuery.trim());

  return (
    <main className="relative flex-1 overflow-auto bg-linear-to-b from-muted/20 via-background to-background">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 pb-24 sm:px-6 md:py-10 lg:px-8">
        <header className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 space-y-3">
            <Badge variant="outline" className="rounded-md font-medium text-muted-foreground">
              Admin · Accounts
            </Badge>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Vendor & provider management
            </h1>
            {lastFetchedAt && !loading ? (
              <p className="text-xs text-muted-foreground">
                Last updated {formatLastUpdated(lastFetchedAt)}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => void fetchVendors()}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
            <Button className="rounded-xl shadow-sm" onClick={() => setAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add account
            </Button>
          </div>
        </header>

        <section aria-label="Overview metrics">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard
              label="Marketplace"
              value={listCounts?.marketplace ?? '—'}
              hint="Seller directory"
              icon={Store}
              loading={loading}
              accent="emerald"
            />
            <StatCard
              label="Services"
              value={listCounts?.services ?? '—'}
              hint="Provider directory"
              icon={BriefcaseBusiness}
              loading={loading}
              accent="violet"
            />
            <StatCard
              label="Hybrid"
              value={listCounts?.hybrid ?? '—'}
              hint="Both portals"
              icon={Sparkles}
              loading={loading}
              accent="indigo"
            />
            <StatCard
              label="Mkt. verified"
              value={stats?.marketplaceVerified ?? stats?.verified ?? '—'}
              hint={`${stats?.marketplacePending ?? stats?.pending ?? 0} marketplace pending`}
              icon={ShieldCheck}
              loading={loading}
              accent="emerald"
            />
            <StatCard
              label="Svc. verified"
              value={stats?.servicesVerified ?? '—'}
              hint={`${stats?.servicesPending ?? 0} services pending`}
              icon={ShieldCheck}
              loading={loading}
              accent="violet"
            />
          </div>
        </section>

        <Card className="overflow-hidden rounded-2xl border-border/60 bg-card shadow-sm">
          <Tabs
            value={listTab}
            onValueChange={(v) => setListTab(v as 'marketplace' | 'services')}
            className="gap-0"
          >
            <div className="border-b border-border/50 bg-muted/15">
              <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                <TabsList className="grid h-auto w-full max-w-lg grid-cols-2 gap-1 rounded-xl bg-muted/60 p-1.5">
                  <TabsTrigger
                    value="marketplace"
                    className={cn(
                      'gap-2 rounded-lg py-2.5 text-sm data-[state=active]:shadow-md',
                      'data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-900 dark:data-[state=active]:text-emerald-100',
                    )}
                  >
                    <Store className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span className="font-medium">Marketplace</span>
                    <Badge variant="secondary" className="ml-0.5 h-5 min-w-5 rounded-md px-1.5 text-[10px] tabular-nums">
                      {loading ? '…' : (listCounts?.marketplace ?? 0)}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger
                    value="services"
                    className={cn(
                      'gap-2 rounded-lg py-2.5 text-sm data-[state=active]:shadow-md',
                      'data-[state=active]:bg-violet-500/10 data-[state=active]:text-violet-900 dark:data-[state=active]:text-violet-100',
                    )}
                  >
                    <BriefcaseBusiness className="h-4 w-4 shrink-0 text-violet-600" />
                    <span className="font-medium">Services</span>
                    <Badge variant="secondary" className="ml-0.5 h-5 min-w-5 rounded-md px-1.5 text-[10px] tabular-nums">
                      {loading ? '…' : (listCounts?.services ?? 0)}
                    </Badge>
                  </TabsTrigger>
                </TabsList>

                {!loading && (listCounts?.hybrid ?? 0) > 0 ? (
                  <p className="flex items-center gap-2 text-xs text-muted-foreground lg:max-w-xs lg:justify-end">
                    <Sparkles className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                    {listCounts?.hybrid} hybrid {(listCounts?.hybrid ?? 0) === 1 ? 'account' : 'accounts'} on both tabs
                  </p>
                ) : null}
              </div>

              <Separator className="opacity-50" />

              <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Filter className="h-3.5 w-3.5" />
                    {listTab === 'marketplace' ? 'Marketplace' : 'Services'} verification
                  </span>
                  <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Verification filter">
                    {filterTabs.map((tab) => {
                      const TabIcon = tab.icon;
                      const active = statusFilter === tab.key;
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          role="tab"
                          aria-selected={active}
                          onClick={() => setStatusFilter(tab.key)}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
                            active
                              ? listTab === 'marketplace'
                                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-900 shadow-sm dark:text-emerald-100'
                                : 'border-violet-500/40 bg-violet-500/10 text-violet-900 shadow-sm dark:text-violet-100'
                              : 'border-transparent bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground',
                          )}
                        >
                          <TabIcon className="h-3.5 w-3.5 opacity-70" />
                          {tab.label}
                          <span
                            className={cn(
                              'rounded-md px-1.5 py-px text-[10px] font-bold tabular-nums',
                              active ? 'bg-background/60' : 'bg-background/80',
                            )}
                          >
                            {loading ? '…' : tab.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="relative w-full lg:max-w-sm">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name, email, or ID…"
                    className="rounded-xl border-border/60 bg-background pl-9 pr-9"
                    aria-label="Search accounts"
                  />
                  {hasSearch ? (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            <CardHeader className="border-b border-border/50 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <CardTitle className="text-sm font-semibold">
                  {listTab === 'marketplace' ? 'Marketplace directory' : 'Services directory'}
                </CardTitle>
                <CardDescription className="text-xs">
                  {loading
                    ? 'Loading accounts…'
                    : `${activeRows.length} ${activeRows.length === 1 ? 'account' : 'accounts'} · ${portalLabel} ${statusFilter} filter`}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {loading ? (
                <div className="divide-y divide-border/50">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 border-l-[3px] border-l-muted px-4 py-5 sm:px-6">
                      <Skeleton className="h-4 w-4 rounded" />
                      <Skeleton className="h-12 w-12 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-56" />
                        <Skeleton className="h-6 w-48 sm:hidden" />
                      </div>
                      <Skeleton className="hidden h-8 w-20 sm:block" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <TabsContent value="marketplace" className="mt-0 outline-none">
                    <VendorDirectoryList
                      kind="marketplace"
                      rows={marketplaceRows}
                      selectedIds={selectedIds}
                      onToggleAll={toggleAll}
                      onToggleOne={toggleOne}
                      onEdit={(row) => {
                        const full = vendors.find((v) => v.id === row.id);
                        openEdit((full ?? row) as VendorRow);
                      }}
                      onDelete={(id, label) => setDeleteTarget({ id, label })}
                      onVerifyMarketplace={setMarketplaceVerified}
                      onVerifyServices={setServicesVerified}
                      emptySearch={hasSearch}
                      emptyFilter={statusFilter !== 'all'}
                      onClearSearch={() => setSearchQuery('')}
                      onAdd={() => setAddOpen(true)}
                    />
                  </TabsContent>
                  <TabsContent value="services" className="mt-0 outline-none">
                    <VendorDirectoryList
                      kind="services"
                      rows={serviceProviderRows}
                      selectedIds={selectedIds}
                      onToggleAll={toggleAll}
                      onToggleOne={toggleOne}
                      onEdit={(row) => {
                        const full = vendors.find((v) => v.id === row.id);
                        openEdit((full ?? row) as VendorRow);
                      }}
                      onDelete={(id, label) => setDeleteTarget({ id, label })}
                      onVerifyMarketplace={setMarketplaceVerified}
                      onVerifyServices={setServicesVerified}
                      emptySearch={hasSearch}
                      emptyFilter={statusFilter !== 'all'}
                      onClearSearch={() => setSearchQuery('')}
                      onAdd={() => setAddOpen(true)}
                    />
                  </TabsContent>
                </>
              )}
            </CardContent>
          </Tabs>
        </Card>
      </div>

      {someSelected ? (
        <div
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-card/95 px-4 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md sm:px-6"
          role="region"
          aria-label="Bulk actions"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {selectedIds.size}
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {selectedIds.size} {selectedIds.size === 1 ? 'account' : 'accounts'} selected
                </p>
                <p className="text-xs text-muted-foreground">
                  Bulk actions apply to {portalLabel} verification
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {listTab === 'marketplace' ? (
                <>
                  <Button
                    size="sm"
                    className="rounded-lg bg-emerald-600 text-white hover:bg-emerald-600/90"
                    disabled={bulkBusy}
                    onClick={() => void bulkSetMarketplaceVerified(true)}
                  >
                    {bulkBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    Verify
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg"
                    disabled={bulkBusy}
                    onClick={() => void bulkSetMarketplaceVerified(false)}
                  >
                    Revoke
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    className="rounded-lg bg-violet-600 text-white hover:bg-violet-600/90"
                    disabled={bulkBusy}
                    onClick={() => void bulkSetServicesVerified(true)}
                  >
                    {bulkBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    Verify
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg"
                    disabled={bulkBusy}
                    onClick={() => void bulkSetServicesVerified(false)}
                  >
                    Revoke
                  </Button>
                </>
              )}
              <Button
                size="sm"
                variant="outline"
                className="rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={bulkBusy}
                onClick={() => setBulkDeleteOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="rounded-lg"
                disabled={bulkBusy}
                onClick={() => setSelectedIds(new Set())}
              >
                <X className="mr-2 h-4 w-4" />
                Clear
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add account</DialogTitle>
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
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit account</DialogTitle>
            <DialogDescription>Update profile and contact details shown in the directory.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2 max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid gap-2">
              <Label htmlFor="edit-company">Company name</Label>
              <Input
                id="edit-company"
                value={editForm.companyName}
                onChange={(e) => setEditForm((s) => ({ ...s, companyName: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Display name</Label>
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
                <Label htmlFor="edit-website">Website</Label>
                <Input
                  id="edit-website"
                  value={editForm.website}
                  onChange={(e) => setEditForm((s) => ({ ...s, website: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm((s) => ({ ...s, description: e.target.value }))}
                rows={4}
                className="rounded-xl resize-y"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button className="rounded-xl" onClick={() => void saveEdit()} disabled={editSaving}>
              {editSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
