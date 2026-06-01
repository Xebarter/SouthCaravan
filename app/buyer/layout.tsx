'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  LayoutGrid,
  ShoppingCart,
  FileText,
  MessageSquare,
  Heart,
  User,
  CircleHelp,
  ArrowLeft,
  MapPin,
} from 'lucide-react';

import {
  DashboardConsoleChrome,
  type SidebarNavItem,
} from '@/components/dashboard/dashboard-workspace-sidebar';
import { useAuth } from '@/lib/auth-context';
import { getBrowserSupabaseClient } from '@/lib/supabase/client';

const navItems = [
  { href: '/buyer', label: 'Dashboard', icon: LayoutGrid },
  { href: '/buyer/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/buyer/quotes', label: 'Quotes', icon: FileText },
  { href: '/buyer/messages', label: 'Messages', icon: MessageSquare },
  { href: '/buyer/wishlist', label: 'Wishlist', icon: Heart },
  { href: '/buyer/addresses', label: 'Addresses', icon: MapPin },
  { href: '/buyer/profile', label: 'Profile', icon: User },
  { href: '/buyer/support', label: 'Support', icon: CircleHelp },
] as const;

type ApiConversationRow = {
  id: string;
  buyer_id: string;
  vendor_user_id: string;
  updated_at: string;
  created_at: string;
};

type ApiMessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  read: boolean;
  created_at: string;
};

export default function BuyerConsoleLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();

  const [buyerName, setBuyerName] = useState<string | null>(null);
  const [buyerEmail, setBuyerEmail] = useState<string | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      const next = pathname || '/buyer';
      router.replace(`/auth?role=buyer&next=${encodeURIComponent(next)}`);
      return;
    }
  }, [isLoading, user, router, pathname]);

  useEffect(() => {
    let cancelled = false;
    if (!user) return;
    const buyerId = user.id;

    async function computeUnread() {
      try {
        const convRes = await fetch('/api/buyer/conversations', { method: 'GET' });
        const convJson = await convRes.json().catch(() => null);
        const conversations = Array.isArray(convJson?.conversations) ? (convJson.conversations as ApiConversationRow[]) : [];
        if (!convRes.ok || cancelled) return;

        const top = conversations.slice(0, 5);
        const results = await Promise.allSettled(
          top.map(async (c) => {
            const res = await fetch(`/api/buyer/conversations/${encodeURIComponent(c.id)}`, { method: 'GET' });
            if (!res.ok) return 0;
            const json = await res.json().catch(() => null);
            const messages = Array.isArray(json?.messages) ? (json.messages as ApiMessageRow[]) : [];
            return messages.filter((m) => m.recipient_id === buyerId && !m.read).length;
          }),
        );

        if (cancelled) return;
        const count = results.reduce((sum, r) => sum + (r.status === 'fulfilled' ? r.value : 0), 0);
        setUnreadMessages(count);
      } catch {
        // non-fatal
      }
    }

    computeUnread();
    const t = window.setInterval(computeUnread, 20000);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    // 1) Initial hydrate from localStorage.
    let initialName: string | null = null;
    let initialEmail: string | null = null;
    try {
      initialName = localStorage.getItem('currentBuyerName');
      initialEmail = localStorage.getItem('currentBuyerEmail');
    } catch {
      initialName = null;
      initialEmail = null;
    }

    if (!cancelled) {
      setBuyerName(initialName);
      setBuyerEmail(initialEmail);
    }

    // 2) Also hydrate from Supabase (in case localStorage is stale/missing).
    (async () => {
      try {
        const supabase = getBrowserSupabaseClient();
        const { data } = await supabase.auth.getUser();
        const email = data.user?.email ?? null;
        if (cancelled) return;

        if (email) {
          setBuyerEmail(email);
          try {
            localStorage.setItem('currentBuyerEmail', email);
          } catch { }

          // If buyerName wasn’t set yet, derive it from the email prefix.
          if (!initialName) {
            const derivedName = email.split('@')[0] || 'User';
            setBuyerName(derivedName);
            try {
              localStorage.setItem('currentBuyerName', derivedName);
            } catch { }
          }
        }
      } catch {
        // If Supabase isn't available / user isn't authenticated, keep localStorage values.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = () => {
    // Auth context clears the expected buyer portal keys and signs out via Supabase.
    logout();
    router.replace('/');
  };

  const sidebarNavItems = useMemo((): SidebarNavItem[] => {
    return navItems.map((item) => ({
      href: item.href,
      label: item.label,
      icon: item.icon,
      ...(item.href === '/buyer/messages' && unreadMessages > 0
        ? { badge: unreadMessages }
        : {}),
    }));
  }, [unreadMessages]);

  return (
    <DashboardConsoleChrome
      portal="buyer"
      sheetTitle="Buyer workspace menu"
      displayName={buyerName ?? 'Account'}
      displayEmail={buyerEmail ?? undefined}
      pathname={pathname}
      navItems={sidebarNavItems}
      footerActions={[{ label: 'Shop', icon: ArrowLeft, href: '/' }]}
      onSignOut={handleLogout}
    >
      {children}
    </DashboardConsoleChrome>
  );
}

