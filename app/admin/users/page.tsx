'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { MoreVertical, Shield, Mail, Plus, Filter } from 'lucide-react';
import { mockUsers, mockOrders, mockVendors } from '@/lib/mock-data';

export default function AdminUsersPage() {
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const filteredUsers = roleFilter === 'all'
    ? mockUsers
    : mockUsers.filter(u => u.role === roleFilter);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-500/10 text-purple-400';
      case 'vendor':
        return 'bg-blue-500/10 text-blue-400';
      case 'buyer':
        return 'bg-green-500/10 text-green-400';
      default:
        return 'bg-gray-500/10 text-gray-400';
    }
  };

  const getUserStats = (userId: string) => {
    const orders = mockOrders.filter(o => o.buyerId === userId);
    const vendor = mockVendors.find(v => v.userId === userId);
    const vendorOrders = vendor ? mockOrders.filter(o => o.vendorId === vendor.id) : [];
    
    return {
      orders: orders.length + vendorOrders.length,
      revenue: (orders.concat(vendorOrders).reduce((sum, o) => sum + o.totalAmount, 0) / 1000).toFixed(1),
    };
  };

  return (
    <main className="flex-1 overflow-auto">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground mt-2">Manage all platform users and their access</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Invite User
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-border/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{mockUsers.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Total Users</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{mockUsers.filter(u => u.role === 'vendor').length}</div>
              <p className="text-xs text-muted-foreground mt-1">Vendors</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{mockUsers.filter(u => u.role === 'buyer').length}</div>
              <p className="text-xs text-muted-foreground mt-1">Buyers</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{mockUsers.filter(u => u.role === 'admin').length}</div>
              <p className="text-xs text-muted-foreground mt-1">Admins</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="mb-6 flex gap-2 items-center">
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
                    {filteredUsers.map(user => {
                      const stats = getUserStats(user.id);
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
                              <p className="text-foreground font-medium">{stats.orders} transactions</p>
                              <p className="text-muted-foreground">${stats.revenue}k volume</p>
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
                                <DropdownMenuItem>View Profile</DropdownMenuItem>
                                <DropdownMenuItem>Edit User</DropdownMenuItem>
                                {user.role !== 'admin' && (
                                  <>
                                    <DropdownMenuItem>
                                      <Shield className="w-4 h-4 mr-2" />
                                      Change Role
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive">
                                      Suspend Account
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
