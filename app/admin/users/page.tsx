'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  MoreVertical,
  Shield,
  Mail,
  Plus,
  Filter,
  Loader2,
  Trash2,
  Pencil,
  Store,
  BriefcaseBusiness,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  ACCOUNT_SEGMENT_META,
  portalRoleBadges,
  type AdminUserAccountSegment,
} from '@/lib/admin-user-account-segment';
import type { UserRole } from '@/lib/types';

type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  roles: string[];
  account_segment: AdminUserAccountSegment;
  company: string | null;
  created_at: string | null;
  last_sign_in_at: string | null;
  stats?: { transactions: number; volume: number };
};

type SegmentFilter = 'all' | AdminUserAccountSegment;

const EMPTY_SEGMENT_COUNTS: Record<AdminUserAccountSegment, number> = {
  admin: 0,
  buyer: 0,
  marketplace_vendor: 0,
  service_provider: 0,
  hybrid: 0,
};

export default function AdminUsersPage() {
  const [segmentFilter, setSegmentFilter] = useState<SegmentFilter>('all');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [segmentCounts, setSegmentCounts] =
    useState<Record<AdminUserAccountSegment, number>>(EMPTY_SEGMENT_COUNTS);
  const [query, setQuery] = useState('');

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteSaving, setInviteSaving] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    password: '',
    name: '',
    company: '',
    role: 'buyer' as UserRole,
  });

  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    company: '',
    role: 'buyer' as UserRole,
  });

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users?includeStats=true', { cache: 'no-store' });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || 'Failed to load users');
      setUsers(Array.isArray(json?.users) ? json.users : []);
      setSegmentCounts(
        json?.segmentCounts && typeof json.segmentCounts === 'object'
          ? { ...EMPTY_SEGMENT_COUNTS, ...json.segmentCounts }
          : EMPTY_SEGMENT_COUNTS,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load users');
      setUsers([]);
      setSegmentCounts(EMPTY_SEGMENT_COUNTS);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (segmentFilter !== 'all' && u.account_segment !== segmentFilter) return false;
      if (!q) return true;
      const hay = `${u.name} ${u.email} ${u.company ?? ''} ${u.id} ${u.account_segment} ${(u.roles ?? []).join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
  }, [users, segmentFilter, query]);

  const stats = useMemo(() => {
    const total = users.length;
    return {
      total,
      ...segmentCounts,
    };
  }, [users.length, segmentCounts]);

  async function createUser() {
    setInviteSaving(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || 'Failed to create user');
      toast.success('User created');
      setInviteOpen(false);
      setInviteForm({ email: '', password: '', name: '', company: '', role: 'buyer' });
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create user');
    } finally {
      setInviteSaving(false);
    }
  }

  function openEdit(u: AdminUser) {
    setEditUser(u);
    setEditForm({ name: u.name ?? '', company: u.company ?? '', role: u.role });
    setEditOpen(true);
  }

  async function saveEdit() {
    if (!editUser) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(editUser.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || 'Failed to update user');
      toast.success('User updated');
      setEditOpen(false);
      setEditUser(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update user');
    } finally {
      setEditSaving(false);
    }
  }

  function openDelete(u: AdminUser) {
    setDeleteUser(u);
    setDeleteOpen(true);
  }

  async function confirmDelete() {
    if (!deleteUser) return;
    setDeleteSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(deleteUser.id)}`, { method: 'DELETE' });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error || 'Failed to delete user');
      toast.success('User deleted');
      setDeleteOpen(false);
      setDeleteUser(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete user');
    } finally {
      setDeleteSaving(false);
    }
  }

  return (
    <main className="flex-1 overflow-auto">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground mt-2">Manage all platform users and their access</p>
          </div>
          <Button onClick={() => setInviteOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Invite User
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          <Card className="border-border/50">
            <CardContent className="py-3">
              <div className="text-xl font-bold tabular-nums">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-0.5">Total</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="py-3">
              <div className="text-xl font-bold tabular-nums text-sky-600">{stats.buyer}</div>
              <p className="text-xs text-muted-foreground mt-0.5">Buyers</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="py-3">
              <div className="text-xl font-bold tabular-nums text-emerald-600">{stats.marketplace_vendor}</div>
              <p className="text-xs text-muted-foreground mt-0.5">Vendors</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="py-3">
              <div className="text-xl font-bold tabular-nums text-violet-600">{stats.service_provider}</div>
              <p className="text-xs text-muted-foreground mt-0.5">Service providers</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="py-3">
              <div className="text-xl font-bold tabular-nums text-indigo-600">{stats.hybrid}</div>
              <p className="text-xs text-muted-foreground mt-0.5">Hybrid</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="py-3">
              <div className="text-xl font-bold tabular-nums text-purple-600">{stats.admin}</div>
              <p className="text-xs text-muted-foreground mt-0.5">Admins</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2 items-center">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={segmentFilter} onValueChange={(v) => setSegmentFilter(v as SegmentFilter)}>
            <SelectTrigger className="w-56 bg-secondary">
              <SelectValue placeholder="Filter by account type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All account types</SelectItem>
              <SelectItem value="buyer">Buyers</SelectItem>
              <SelectItem value="marketplace_vendor">Marketplace vendors</SelectItem>
              <SelectItem value="service_provider">Service providers</SelectItem>
              <SelectItem value="hybrid">Vendor &amp; services (hybrid)</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
            </SelectContent>
          </Select>
          </div>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, company…"
            className="sm:w-[320px] bg-secondary"
          />
        </div>

        {/* Users Table */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>
              Buyers, marketplace vendors, service providers, and hybrid accounts (both portals)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 overflow-x-auto">
              <div className="inline-block w-full">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">User</th>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Account type</th>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Company</th>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Activity</th>
                      <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td className="py-10 px-4 text-center text-muted-foreground" colSpan={6}>
                          <span className="inline-flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading users…
                          </span>
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td className="py-10 px-4 text-center text-muted-foreground" colSpan={6}>
                          No users found.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => {
                        const uStats = user.stats ?? { transactions: 0, volume: 0 };
                        const volumeK = (uStats.volume / 1000).toFixed(1);
                        return (
                        <tr key={user.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                                {user.name.charAt(0)}
                              </div>
                              <p className="font-medium">{user.name}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Mail className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs">{user.email}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <AccountTypeCell user={user} />
                          </td>
                          <td className="py-3 px-4">{user.company || '—'}</td>
                          <td className="py-3 px-4">
                            <div className="text-xs">
                              <p className="text-foreground font-medium">{uStats.transactions} transactions</p>
                              <p className="text-muted-foreground">${volumeK}k volume</p>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  id={`admin-user-actions-${user.id}`}
                                  variant="ghost"
                                  size="sm"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEdit(user)}>
                                  <Pencil className="w-4 h-4 mr-2" />
                                  Edit user
                                </DropdownMenuItem>
                                {user.role !== 'admin' && (
                                  <>
                                    <DropdownMenuItem>
                                      <Shield className="w-4 h-4 mr-2" />
                                      Change Role
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive" onClick={() => openDelete(user)}>
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete user
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create user</DialogTitle>
            <DialogDescription>Creates an auth user and assigns a portal role.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Input
              placeholder="Email"
              value={inviteForm.email}
              onChange={(e) => setInviteForm((p) => ({ ...p, email: e.target.value }))}
            />
            <Input
              placeholder="Temporary password (min 8 chars)"
              type="password"
              value={inviteForm.password}
              onChange={(e) => setInviteForm((p) => ({ ...p, password: e.target.value }))}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                placeholder="Name"
                value={inviteForm.name}
                onChange={(e) => setInviteForm((p) => ({ ...p, name: e.target.value }))}
              />
              <Input
                placeholder="Company (optional)"
                value={inviteForm.company}
                onChange={(e) => setInviteForm((p) => ({ ...p, company: e.target.value }))}
              />
            </div>
            <Select value={inviteForm.role} onValueChange={(v) => setInviteForm((p) => ({ ...p, role: v as any }))}>
              <SelectTrigger className="bg-secondary">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buyer">Buyer</SelectItem>
                <SelectItem value="vendor">Marketplace vendor</SelectItem>
                <SelectItem value="services">Service provider</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Hybrid accounts need both vendor and services roles in the database. Creating a user sets one portal role only.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)} disabled={inviteSaving}>
              Cancel
            </Button>
            <Button onClick={() => void createUser()} disabled={inviteSaving}>
              {inviteSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
            <DialogDescription>Updates profile fields and role.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Input value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} />
            <Input
              placeholder="Company (optional)"
              value={editForm.company}
              onChange={(e) => setEditForm((p) => ({ ...p, company: e.target.value }))}
            />
            <Select value={editForm.role} onValueChange={(v) => setEditForm((p) => ({ ...p, role: v as any }))}>
              <SelectTrigger className="bg-secondary">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buyer">Buyer</SelectItem>
                <SelectItem value="vendor">Marketplace vendor</SelectItem>
                <SelectItem value="services">Service provider</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={editSaving}>
              Cancel
            </Button>
            <Button onClick={() => void saveEdit()} disabled={editSaving || !editUser}>
              {editSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the auth user and related profile rows. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
              disabled={deleteSaving || !deleteUser}
            >
              {deleteSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

function AccountTypeCell({ user }: { user: AdminUser }) {
  const segment = user.account_segment ?? 'buyer';
  const meta = ACCOUNT_SEGMENT_META[segment] ?? ACCOUNT_SEGMENT_META.buyer;
  const roleChips = portalRoleBadges(user.roles ?? [user.role]);

  const SegmentIcon =
    segment === 'admin'
      ? Shield
      : segment === 'buyer'
        ? ShoppingBag
        : segment === 'marketplace_vendor'
          ? Store
          : segment === 'service_provider'
            ? BriefcaseBusiness
            : Sparkles;

  return (
    <div className="space-y-1.5 min-w-[10rem]">
      <Badge variant="outline" className={cn('gap-1 font-medium border', meta.badgeClass)}>
        <SegmentIcon className="h-3 w-3 shrink-0" />
        {meta.shortLabel}
      </Badge>
      {roleChips.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {roleChips.map((chip) => (
            <span
              key={chip.role}
              className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
            >
              {chip.label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
