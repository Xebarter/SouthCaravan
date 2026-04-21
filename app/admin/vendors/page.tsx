'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MoreVertical, Mail, Phone, Pencil, Loader2, Package, ShoppingBag, Plus } from 'lucide-react';
import { toast } from 'sonner';

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

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

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

  async function removeVendor(vendorId: string, label: string) {
    if (!confirm(`Delete vendor "${label}"? This removes the vendor row and profile. Products are not deleted.`)) {
      return;
    }
    const response = await fetch(`/api/admin/vendors?id=${encodeURIComponent(vendorId)}`, { method: 'DELETE' });
    const payload = await response.json();
    if (!response.ok) {
      toast.error(payload.error ?? 'Delete failed');
      return;
    }
    toast.success('Vendor removed');
    await fetchVendors();
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

  return (
    <main className="flex-1 overflow-auto">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vendor Management</h1>
            <p className="text-muted-foreground mt-2">Manage vendors and verify seller accounts (live data)</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchVendors()} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Refresh
            </Button>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add vendor
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {(['all', 'pending', 'verified'] as const).map((key) => (
            <Button
              key={key}
              size="sm"
              variant={statusFilter === key ? 'default' : 'outline'}
              onClick={() => setStatusFilter(key)}
            >
              {key === 'all' ? 'All' : key === 'pending' ? 'Pending' : 'Verified'}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-border/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats?.total ?? '—'}</div>
              <p className="text-xs text-muted-foreground mt-1">Total Vendors</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats?.verified ?? '—'}</div>
              <p className="text-xs text-muted-foreground mt-1">Verified</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats?.pending ?? '—'}</div>
              <p className="text-xs text-muted-foreground mt-1">Pending Verification</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4">
              <div className="text-lg font-bold text-primary">
                <Money amountUSD={stats?.platformGmv ?? 0} notation="compact" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Platform GMV (orders)</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Vendors</CardTitle>
            <CardDescription>All registered vendors on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-16 flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading vendors…
              </div>
            ) : vendors.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No vendors in this view.</p>
            ) : (
              <div className="space-y-4">
                {vendors.map((vendor) => {
                  const displayCompany = vendor.company_name || vendor.profile?.company_name || vendor.name || 'Vendor';
                  const displayEmail = vendor.email || vendor.profile?.public_email || '';
                  const phone = vendor.profile?.phone?.trim() || '—';

                  return (
                    <div
                      key={vendor.id}
                      className="flex items-start justify-between p-4 border border-border/50 rounded-lg hover:bg-secondary/50 transition-colors gap-3"
                    >
                      <div className="flex gap-4 flex-1 min-w-0">
                        <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <div className="text-2xl font-bold text-primary">{displayCompany.charAt(0)}</div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-bold text-lg">{displayCompany}</h3>
                            {vendor.is_verified ? (
                              <Badge className="bg-green-500/10 text-green-400 text-xs">Verified</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                Pending
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {vendor.profile?.description?.trim() || 'No profile description yet.'}
                          </p>

                          <div className="flex flex-wrap gap-3 mt-2 text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Mail className="w-4 h-4 shrink-0" />
                              <span className="text-xs break-all">{displayEmail || '—'}</span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Phone className="w-4 h-4 shrink-0" />
                              <span className="text-xs">{phone}</span>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Package className="w-4 h-4" />
                              <span>
                                <span className="text-muted-foreground">Products: </span>
                                <span className="font-medium text-foreground">{vendor.product_count}</span>
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <ShoppingBag className="w-4 h-4" />
                              <span>
                                <span className="text-muted-foreground">Orders: </span>
                                <span className="font-medium text-foreground">{vendor.order_count}</span>
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Revenue: </span>
                              <span className="font-bold text-primary">
                                <Money amountUSD={vendor.revenue} notation="compact" />
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-2 shrink-0">
                        <Button variant="outline" size="sm" onClick={() => openEdit(vendor)} aria-label="Edit vendor">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button id={`admin-vendor-actions-${vendor.id}`} variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!vendor.is_verified && (
                              <DropdownMenuItem
                                className="text-green-400"
                                onClick={() => setVerified(vendor.id, true)}
                              >
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
                            <DropdownMenuItem className="text-destructive" onClick={() => removeVendor(vendor.id, displayCompany)}>
                              Delete vendor
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
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
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-name">Display name (optional)</Label>
              <Input
                id="add-name"
                value={addForm.name}
                onChange={(e) => setAddForm((s) => ({ ...s, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-company">Company name (optional)</Label>
              <Input
                id="add-company"
                value={addForm.companyName}
                onChange={(e) => setAddForm((s) => ({ ...s, companyName: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitAdd} disabled={addSaving || !addForm.userId.trim() || !addForm.email.trim()}>
              {addSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit vendor</DialogTitle>
            <DialogDescription>Update vendor record and public profile fields.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2 max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid gap-2">
              <Label htmlFor="edit-company">Company name</Label>
              <Input
                id="edit-company"
                value={editForm.companyName}
                onChange={(e) => setEditForm((s) => ({ ...s, companyName: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Contact / display name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm((s) => ({ ...s, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm((s) => ({ ...s, email: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-desc">Description</Label>
              <Textarea
                id="edit-desc"
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm((s) => ({ ...s, description: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={editForm.phone}
                onChange={(e) => setEditForm((s) => ({ ...s, phone: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-public-email">Public email</Label>
              <Input
                id="edit-public-email"
                type="email"
                value={editForm.publicEmail}
                onChange={(e) => setEditForm((s) => ({ ...s, publicEmail: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-web">Website</Label>
              <Input
                id="edit-web"
                value={editForm.website}
                onChange={(e) => setEditForm((s) => ({ ...s, website: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={editSaving}>
              {editSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
