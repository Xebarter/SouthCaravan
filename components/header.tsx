'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, LayoutGrid, Menu, MessagesSquare, UserCircle2 } from 'lucide-react';
import { CartNavButton } from '@/components/cart-nav-button';
import { CurrencySelector } from '@/components/currency/currency-selector';
import { Button } from '@/components/ui/button';
import { HeaderSearch } from '@/components/header-search';
import { AddItemsSidebar } from '@/components/additems-sidebar';
import { SiteLogoMark } from '@/components/site-logo';
import { PostMyRfqButton } from '@/components/post-my-rfq-button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ProfileMenuPanel,
  SignedInProfileMenu,
  SignedOutProfileMenu,
} from '@/components/header-profile-menu';
import { useDashboardNav } from '@/components/dashboard-nav-context';
import { useOverlayHistory } from '@/hooks/use-overlay-history';
import { useAuth } from '@/lib/auth-context';
import { getDashboardConsoleKind, getMessagesHrefForPath } from '@/lib/dashboard-console-path';
import {
  isPortalSellConfirmOpen,
  isPortalSellConfirmTarget,
} from '@/lib/portal-sell-confirm-guard';
import { cn } from '@/lib/utils';

const HOVER_CLOSE_DELAY_MS = 150;

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function WorkspaceMenuButton({ className }: { className?: string }) {
  const dashboardNav = useDashboardNav();
  const pathname = usePathname();
  const consoleKind = getDashboardConsoleKind(pathname);

  if (!consoleKind || !dashboardNav) return null;

  return (
    <button
      type="button"
      aria-label="Open workspace menu"
      className={cn(
        'inline-flex items-center justify-center rounded-md p-2 hover:bg-accent hover:text-accent-foreground transition shrink-0',
        className,
      )}
      onClick={() => dashboardNav.openNav()}
    >
      <LayoutGrid className="h-5 w-5" />
    </button>
  );
}

export function Header({ showMobile = true }: { showMobile?: boolean } = {}) {
  const pathname = usePathname();
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
  const [isMobileViewport, setIsMobileViewport] = useState(false);
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

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobileViewport(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useOverlayHistory(open, 'marketplace-menu', closeSidebar, isMobileViewport);

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
    if (isPortalSellConfirmOpen()) return;
    clearProfileCloseTimer();
    profileCloseTimerRef.current = window.setTimeout(() => {
      profileCloseTimerRef.current = null;
      if (isPortalSellConfirmOpen()) return;
      setProfileMenuOpen(false);
      setProfileMenuMode('login');
    }, HOVER_CLOSE_DELAY_MS);
  };

  const closeProfileMenu = () => {
    setProfileMenuOpen(false);
    setProfileMenuMode('login');
  };

  useOverlayHistory(profileMenuOpen, 'profile-menu', closeProfileMenu, isMobileViewport);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (!profileMenuOpen) return;
      if (isPortalSellConfirmOpen() || isPortalSellConfirmTarget(e.target)) return;
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

  const messagesHref = user
    ? getMessagesHrefForPath(pathname, user.role)
    : '/auth?role=buyer&next=/buyer/messages';

  return (
    <>
      {/* Desktop (md+) */}
      <nav className="hidden md:block border-b border-border bg-white/95 backdrop-blur sticky top-0 z-50 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
        <div className="flex h-16 items-center justify-between gap-4 px-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <WorkspaceMenuButton />
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

            <Link href="/" className="flex items-center gap-2 font-bold text-lg" aria-label="SouthCaravan home">
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
            <CurrencySelector compact />
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
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted px-2.5 py-1.5 text-sm text-foreground transition',
                  profileMenuOpen
                    ? 'border-primary/30 bg-background shadow-sm ring-2 ring-primary/15'
                    : 'hover:bg-accent hover:text-accent-foreground',
                )}
                type="button"
              >
                <ProfileTrigger />
                <ChevronDown
                  className={cn('h-4 w-4 transition-transform', profileMenuOpen && 'rotate-180')}
                  aria-hidden
                />
              </button>

              {profileMenuOpen ? (
                <div className="absolute right-0 mt-2 z-50 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200">
                  <ProfileMenuPanel>
                    {user ? (
                      <SignedInProfileMenu
                        user={user}
                        onClose={closeProfileMenu}
                        onLogout={logout}
                      />
                    ) : (
                      <SignedOutProfileMenu
                        mode={profileMenuMode}
                        onModeChange={setProfileMenuMode}
                        onClose={closeProfileMenu}
                      />
                    )}
                  </ProfileMenuPanel>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </nav>

      {showMobile ? (
        <>
          {/* Mobile: top row (non-persistent) */}
          <nav className="md:hidden border-b border-border bg-white/95 backdrop-blur shadow-[0_1px_0_rgba(0,0,0,0.04)]">
            <div className="relative flex h-12 items-center justify-between gap-3 px-4 max-w-7xl mx-auto">
              <Link
                href="/"
                aria-label="SouthCaravan home"
                className="shrink-0 inline-flex items-center gap-2 min-w-0"
              >
                <SiteLogoMark />
                <span className="font-semibold text-sm tracking-tight truncate">SouthCaravan</span>
              </Link>

              <div className="flex items-center gap-1.5">
                <CurrencySelector compact />
                <Button variant="ghost" size="icon" aria-label="Messages" asChild>
                  <Link href={messagesHref}>
                    <MessagesSquare className="h-5 w-5" />
                  </Link>
                </Button>
                <PostMyRfqButton size="sm" className="shrink-0 h-8 px-2.5 text-xs" />
              </div>
            </div>
          </nav>

          {/* Mobile: lower row (persistent) */}
          <nav className="md:hidden border-b border-border bg-white/95 backdrop-blur sticky top-0 z-50 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
            <div className="flex h-14 items-center gap-2 px-4 max-w-7xl mx-auto">
              <WorkspaceMenuButton />
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

              <PostMyRfqButton size="sm" className="shrink-0 h-8 px-2.5 text-xs hidden min-[480px]:inline-flex" />
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
                  className={cn(
                    'inline-flex h-10 items-center justify-center gap-1 rounded-lg border px-2 transition',
                    profileMenuOpen
                      ? 'border-primary/30 bg-background shadow-sm ring-2 ring-primary/15'
                      : 'border-transparent hover:bg-accent hover:text-accent-foreground',
                  )}
                  type="button"
                >
                  <ProfileTrigger size="sm" />
                  <ChevronDown
                    className={cn('h-4 w-4 transition-transform', profileMenuOpen && 'rotate-180')}
                    aria-hidden
                  />
                </button>

                {profileMenuOpen ? (
                  <div
                    ref={mobileProfilePopoverRef}
                    className="absolute right-0 mt-2 z-50 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200"
                  >
                    <ProfileMenuPanel>
                      {user ? (
                        <SignedInProfileMenu
                          user={user}
                          onClose={closeProfileMenu}
                          onLogout={logout}
                        />
                      ) : (
                        <SignedOutProfileMenu
                          mode={profileMenuMode}
                          onModeChange={setProfileMenuMode}
                          onClose={closeProfileMenu}
                        />
                      )}
                    </ProfileMenuPanel>
                  </div>
                ) : null}
              </div>
            </div>
          </nav>
        </>
      ) : null}

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
