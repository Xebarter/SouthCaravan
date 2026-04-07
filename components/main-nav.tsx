'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  BarChart3,
  Home,
  Package,
  ShoppingCart,
  MessageSquare,
  Settings,
  LogOut,
  Users,
  TrendingUp,
  FileText,
} from 'lucide-react';

export function MainNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  if (!user || pathname === '/login') {
    return null;
  }

  const handleLogout = () => {
    logout();
    const role = user.role;
    const next =
      role === 'admin' ? '/admin' : role === 'vendor' ? '/vendor' : '/buyer';
    router.push(`/auth?role=${encodeURIComponent(role)}&next=${encodeURIComponent(next)}`);
  };

  const navItems = user.role === 'admin' 
    ? [
        { label: 'Dashboard', href: '/dashboard', icon: Home },
        { label: 'Users', href: '/admin/users', icon: Users },
        { label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
        { label: 'Vendors', href: '/admin/vendors', icon: TrendingUp },
        { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
        { label: 'Settings', href: '/admin/settings', icon: Settings },
      ]
    : user.role === 'vendor'
    ? [
        { label: 'Dashboard', href: '/vendor', icon: Home },
        { label: 'Products', href: '/vendor/products', icon: Package },
        { label: 'Orders', href: '/vendor/orders', icon: ShoppingCart },
        { label: 'Messages', href: '/vendor/messages', icon: MessageSquare },
        { label: 'Analytics', href: '/vendor/analytics', icon: BarChart3 },
        { label: 'Settings', href: '/vendor/settings', icon: Settings },
      ]
    : [
        { label: 'Dashboard', href: '/buyer', icon: Home },
        { label: 'Catalog', href: '/catalog', icon: Package },
        { label: 'Orders', href: '/buyer/orders', icon: ShoppingCart },
        { label: 'Quotes', href: '/buyer/quotes', icon: FileText },
        { label: 'Messages', href: '/buyer/messages', icon: MessageSquare },
        { label: 'Settings', href: '/buyer/settings', icon: Settings },
      ];

  return (
    <nav className="border-b border-border bg-card sticky top-0 z-50">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Logo */}
        <Link
          href={user.role === 'vendor' ? '/vendor' : '/dashboard'}
          className="flex items-center gap-2 font-bold text-lg"
        >
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
            SC
          </div>
          <span className="hidden sm:inline">SouthCaravan</span>
        </Link>

        {/* Navigation Items */}
        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/vendor'
                ? pathname === '/vendor'
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-secondary'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden lg:inline">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button id="main-nav-user-menu-trigger" variant="ghost" className="gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                {user.name.charAt(0)}
              </div>
              <span className="hidden sm:inline text-sm">{user.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="text-xs text-muted-foreground">{user.email}</DropdownMenuLabel>
            <DropdownMenuLabel className="text-sm font-bold">{user.name}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
