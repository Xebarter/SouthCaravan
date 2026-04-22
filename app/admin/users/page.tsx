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
import { MoreVertical, Shield, Mail, Plus, Filter, Loader2, Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';

type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'vendor' | 'buyer';
  company: string | null;
  created_at: string | null;
  last_sign_in_at: string | null;
  stats?: { transactions: number; volume: number };
};

export default function AdminUsersPage() {
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState('');

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteSaving, setInviteSaving] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    password: '',
    name: '',
    company: '',
    role: 'buyer' as AdminUser['role'],
  });

  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    company: '',
    role: 'buyer' as AdminUser['role'],
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
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load users');
      setUsers([]);
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
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (!q) return true;
      const hay = `${u.name} ${u.email} ${u.company ?? ''} ${u.id}`.toLowerCase();
      return hay.includes(q);
    });
  }, [users, roleFilter, query]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-500/10 text-purple-400';
      case 'vendor':
        return 'bg-primary/10 text-primary';
      case 'buyer':
        return 'bg-green-500/10 text-green-400';
      default:
        return 'bg-gray-500/10 text-gray-400';
    }
  };

  const stats = useMemo(() => {
    const total = users.length;
    const vendors = users.filter((u) => u.role === 'vendor').length;
    const buyers = users.filter((u) => u.role === 'buyer').length;
    const admins = users.filter((u) => u.role === 'admin').length;
    return { total, vendors, buyers, admins };
  }, [users]);

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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-border/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">Total Users</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.vendors}</div>
              <p className="text-xs text-muted-foreground mt-1">Vendors</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.buyers}</div>
              <p className="text-xs text-muted-foreground mt-1">Buyers</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.admins}</div>
              <p className="text-xs text-muted-foreground mt-1">Admins</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2 items-center">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-48 bg-secondary">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="vendor">Vendor</SelectItem>
              <SelectItem value="buyer">Buyer</SelectItem>
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
            <CardDescription>All registered users on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 overflow-x-auto">
              <div className="inline-block w-full">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">User</th>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Role</th>
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
                            <Badge className={getRoleColor(user.role)}>
                              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </Badge>
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
                <SelectItem value="vendor">Vendor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
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
                <SelectItem value="vendor">Vendor</SelectItem>
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
