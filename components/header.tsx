'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, LayoutDashboard, LogOut, Menu, MessageSquare, MessagesSquare, UserCircle2 } from 'lucide-react';
import { CartNavButton } from '@/components/cart-nav-button';
import { Button } from '@/components/ui/button';
import { HeaderSearch } from '@/components/header-search';
import { AddItemsSidebar } from '@/components/additems-sidebar';
import { SiteLogoMark } from '@/components/site-logo';
import { PostMyRfqButton } from '@/components/post-my-rfq-button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/lib/auth-context';

const HOVER_CLOSE_DELAY_MS = 150;

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function getDashboardHref(role: string): string {
  if (role === 'admin') return '/admin';
  if (role === 'vendor') return '/vendor';
  if (role === 'services') return '/services/orders';
  return '/buyer';
}

function getMessagesHref(role: string): string {
  if (role === 'vendor') return '/vendor/messages';
  if (role === 'services') return '/services/orders';
  return '/buyer/messages';
}

export function Header() {
  const { user, logout } = useAuth();

  const [pinned, setPinned] = useState(false);
  const [hoverOpen, setHoverOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pinnedRef = useRef(false);
  const open = pinned || hoverOpen;

  useEffect(() => {
    pinnedRef.current = pinned;
  }, [pinned]);

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileMenuMode, setProfileMenuMode] = useState<'login' | 'join'>('login');
  const profileCloseTimerRef = useRef<number | null>(null);
  const mobileProfileMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileProfilePopoverRef = useRef<HTMLDivElement | null>(null);
  const desktopProfileMenuRef = useRef<HTMLDivElement | null>(null);

  const cancelCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const handleHoverOpen = () => {
    if (pinned) return;
    cancelCloseTimer();
    setHoverOpen(true);
  };

  const scheduleHoverClose = () => {
    if (pinnedRef.current) return;
    cancelCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      if (!pinnedRef.current) setHoverOpen(false);
    }, HOVER_CLOSE_DELAY_MS);
  };

  const closeSidebar = () => {
    cancelCloseTimer();
    setPinned(false);
    setHoverOpen(false);
  };

  const togglePinned = () => {
    cancelCloseTimer();
    setPinned((prev) => {
      const next = !prev;
      if (next) {
        setHoverOpen(true);
      } else {
        setHoverOpen(false);
      }
      return next;
    });
  };

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSidebar();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  useEffect(() => () => cancelCloseTimer(), []);

  const toggleProfileMenu = () => {
    setProfileMenuOpen((prev) => !prev);
  };

  const clearProfileCloseTimer = () => {
    if (profileCloseTimerRef.current) {
      window.clearTimeout(profileCloseTimerRef.current);
      profileCloseTimerRef.current = null;
    }
  };

  const handleProfileHoverOpen = () => {
    clearProfileCloseTimer();
    setProfileMenuOpen(true);
  };

  const scheduleProfileHoverClose = () => {
    clearProfileCloseTimer();
    profileCloseTimerRef.current = window.setTimeout(() => {
      profileCloseTimerRef.current = null;
      setProfileMenuOpen(false);
      setProfileMenuMode('login');
    }, HOVER_CLOSE_DELAY_MS);
  };

  const closeProfileMenu = () => {
    setProfileMenuOpen(false);
    setProfileMenuMode('login');
  };

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (!profileMenuOpen) return;
      const target = e.target as Node | null;
      if (!target) return;

      const inMobile =
        mobileProfileMenuRef.current?.contains(target) || mobileProfilePopoverRef.current?.contains(target);
      const inDesktop = desktopProfileMenuRef.current?.contains(target);
      if (!inMobile && !inDesktop) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [profileMenuOpen]);

  useEffect(() => () => clearProfileCloseTimer(), []);

  // Shared profile trigger — avatar when signed in, icon when signed out.
  const ProfileTrigger = ({ size = 'md' }: { size?: 'sm' | 'md' }) => {
    const dim = size === 'sm' ? 'h-7 w-7' : 'h-8 w-8';
    if (user) {
      return (
        <Avatar className={dim}>
          <AvatarImage src={user.avatar} alt={user.name} />
          <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
      );
    }
    return <UserCircle2 className="h-5 w-5" />;
  };

  // Dropdown content when the user IS signed in.
  const SignedInDropdown = () => (
    <>
      <div className="px-3 py-2.5">
        <p className="text-sm font-semibold truncate">{user!.name}</p>
        <p className="text-xs text-muted-foreground truncate">{user!.email}</p>
      </div>
      <div className="my-1 h-px bg-border" />
      <Link
        href={getDashboardHref(user!.role)}
        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition"
        onClick={closeProfileMenu}
      >
        <LayoutDashboard className="h-4 w-4 shrink-0" />
        My Dashboard
      </Link>
      <Link
        href={getMessagesHref(user!.role)}
        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition"
        onClick={closeProfileMenu}
      >
        <MessageSquare className="h-4 w-4 shrink-0" />
        Messages
      </Link>
      <div className="my-1 h-px bg-border" />
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition"
        onClick={() => {
          logout();
          closeProfileMenu();
        }}
      >
        <LogOut className="h-4 w-4 shrink-0" />
        Sign Out
      </button>
    </>
  );

  // Dropdown content when the user is NOT signed in.
  const SignedOutDropdown = () => (
    <>
      {profileMenuMode === 'login' ? (
        <>
          <Link
            href="/auth?role=buyer&next=/buyer"
            className="block rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition"
            onClick={closeProfileMenu}
          >
            Login as Buyer
          </Link>
          <Link
            href="/auth?role=vendor&next=/vendor"
            className="block rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition"
            onClick={closeProfileMenu}
          >
            Login as Vendor
          </Link>
          <Link
            href="/auth?role=services&next=/services/orders"
            className="block rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition"
            onClick={closeProfileMenu}
          >
            Login as Service Provider
          </Link>
          <div className="my-1 h-px bg-border" />
          <button
            type="button"
            className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-primary hover:bg-accent transition"
            onClick={() => setProfileMenuMode('join')}
          >
            Join SouthCaravan
          </button>
        </>
      ) : (
        <>
          <Link
            href="/auth?role=buyer&next=/buyer&mode=signup"
            className="block rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition"
            onClick={closeProfileMenu}
          >
            Join as Buyer
          </Link>
          <Link
            href="/auth?role=vendor&next=/vendor&mode=signup"
            className="block rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition"
            onClick={closeProfileMenu}
          >
            Join as Vendor
          </Link>
          <Link
            href="/auth?role=services&next=/services/orders&mode=signup"
            className="block rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition"
            onClick={closeProfileMenu}
          >
            Join as Service Provider
          </Link>
          <div className="my-1 h-px bg-border" />
          <button
            type="button"
            className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-primary hover:bg-accent transition"
            onClick={() => setProfileMenuMode('login')}
          >
            My Account
          </button>
        </>
      )}
    </>
  );

  const messagesHref = user
    ? getMessagesHref(user.role)
    : '/auth?role=buyer&next=/buyer/messages';

  return (
    <>
      {/* Desktop (md+) */}
      <nav className="hidden md:block border-b border-border bg-white/95 backdrop-blur sticky top-0 z-50 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
        <div className="flex h-16 items-center justify-between gap-4 px-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <button
              aria-label="Open categories"
              aria-expanded={open}
              onMouseEnter={handleHoverOpen}
              onMouseLeave={scheduleHoverClose}
              onClick={togglePinned}
              className="inline-flex items-center justify-center rounded-md p-2 hover:bg-accent hover:text-accent-foreground transition"
              type="button"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link href={user ? getDashboardHref(user.role) : '/'} className="flex items-center gap-2 font-bold text-lg" aria-label="SouthCaravan home">
              <SiteLogoMark />
              <span className="hidden sm:inline">SouthCaravan</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-3xl">
            <HeaderSearch />
            <PostMyRfqButton>Post My RFQ</PostMyRfqButton>
            <Button variant="ghost" size="icon" aria-label="Messages" asChild>
              <Link href={messagesHref}>
                <MessagesSquare className="w-5 h-5" />
              </Link>
            </Button>
            <CartNavButton />
            <div
              ref={desktopProfileMenuRef}
              className="relative"
              onMouseEnter={handleProfileHoverOpen}
              onMouseLeave={scheduleProfileHoverClose}
            >
              <button
                aria-label="Open profile menu"
                aria-expanded={profileMenuOpen}
                onClick={toggleProfileMenu}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted px-2.5 py-1.5 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition"
                type="button"
              >
                <ProfileTrigger />
                <ChevronDown className="h-4 w-4" aria-hidden />
              </button>

              {profileMenuOpen ? (
                <div className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-lg z-50">
                  {user ? <SignedInDropdown /> : <SignedOutDropdown />}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile: top row (non-persistent) */}
      <nav className="md:hidden border-b border-border bg-white/95 backdrop-blur shadow-[0_1px_0_rgba(0,0,0,0.04)]">
        <div className="relative flex h-12 items-center justify-between gap-3 px-4 max-w-7xl mx-auto">
          <Link
            href={user ? getDashboardHref(user.role) : '/'}
            aria-label="SouthCaravan home"
            className="shrink-0 inline-flex items-center gap-2 min-w-0"
          >
            <SiteLogoMark />
            <span className="font-semibold text-sm tracking-tight truncate">SouthCaravan</span>
          </Link>

          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" aria-label="Messages" asChild>
              <Link href={messagesHref}>
                <MessagesSquare className="h-5 w-5" />
              </Link>
            </Button>

            <Button size="sm" asChild className="shrink-0">
              <Link href={user ? getDashboardHref(user.role) : '/auth?role=buyer&next=/buyer'}>
                {user ? 'Dashboard' : 'Post RFQ'}
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile: lower row (persistent) */}
      <nav className="md:hidden border-b border-border bg-white/95 backdrop-blur sticky top-0 z-50 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
        <div className="flex h-14 items-center gap-2 px-4 max-w-7xl mx-auto">
          <button
            aria-label="Open categories"
            aria-expanded={open}
            onMouseEnter={handleHoverOpen}
            onMouseLeave={scheduleHoverClose}
            onClick={togglePinned}
            className="inline-flex items-center justify-center rounded-md p-2 hover:bg-accent hover:text-accent-foreground transition shrink-0"
            type="button"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1 min-w-0">
            <HeaderSearch mobile />
          </div>

          <CartNavButton mobile className="shrink-0" />

          <div
            ref={mobileProfileMenuRef}
            className="relative shrink-0"
            onMouseEnter={handleProfileHoverOpen}
            onMouseLeave={scheduleProfileHoverClose}
          >
            <button
              aria-label="Open profile menu"
              aria-expanded={profileMenuOpen}
              onClick={toggleProfileMenu}
              className="inline-flex h-10 items-center justify-center gap-1 rounded-md px-2 hover:bg-accent hover:text-accent-foreground transition"
              type="button"
            >
              <ProfileTrigger size="sm" />
              <ChevronDown className="h-4 w-4" aria-hidden />
            </button>

            {profileMenuOpen ? (
              <div
                ref={mobileProfilePopoverRef}
                className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-lg z-50"
              >
                {user ? <SignedInDropdown /> : <SignedOutDropdown />}
              </div>
            ) : null}
          </div>
        </div>
      </nav>

      {open ? (
        <div
          className="fixed inset-x-0 top-14 md:top-16 bottom-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={closeSidebar}
        />
      ) : null}

      <AddItemsSidebar
        open={open}
        pinned={pinned}
        onRequestClose={closeSidebar}
        onMouseEnter={handleHoverOpen}
        onMouseLeave={scheduleHoverClose}
      />
    </>
  );
}
