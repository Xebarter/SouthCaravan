'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Menu, MessagesSquare, UserCircle2, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HeaderSearch } from '@/components/header-search';
import { AddItemsSidebar } from '@/components/additems-sidebar';
import { SiteLogoMark } from '@/components/site-logo';
import { PostMyRfqButton } from '@/components/post-my-rfq-button';

const HOVER_CLOSE_DELAY_MS = 150;

export function Header() {
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

  return (
    <>
      {/* Desktop (md+): keep the existing header as-is. */}
      <nav className="hidden md:block border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
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

            <Link href="/" className="flex items-center gap-2 font-bold text-lg" aria-label="SouthCaravan home">
              <SiteLogoMark />
              <span className="hidden sm:inline">SouthCaravan</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-3xl">
            <HeaderSearch />
            <PostMyRfqButton>Post My RFQ</PostMyRfqButton>
            <Button variant="ghost" size="icon" aria-label="Messages" asChild>
              <Link href="/auth?role=buyer&next=/buyer/messages">
                <MessagesSquare className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" aria-label="Shopping cart" asChild>
              <Link href="/cart">
                <ShoppingCart className="w-5 h-5" />
              </Link>
            </Button>
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
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition"
                type="button"
              >
                <UserCircle2 className="h-5 w-5" />
                <ChevronDown className="h-4 w-4" aria-hidden />
              </button>

              {profileMenuOpen ? (
                <div className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-lg z-50">
                  {profileMenuMode === 'login' ? (
                    <>
                      <Link
                        href="/auth?role=buyer&next=/buyer"
                        className="block rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        Login as Buyer
                      </Link>
                      <Link
                        href="/auth?role=vendor&next=/vendor"
                        className="block rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        Login as Vendor
                      </Link>
                      <Link
                        href="/auth?role=services&next=/services/orders"
                        className="block rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition"
                        onClick={() => setProfileMenuOpen(false)}
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
                        href="/auth?role=buyer&next=/buyer"
                        className="block rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        Join as Buyer
                      </Link>
                      <Link
                        href="/auth?role=vendor&next=/vendor"
                        className="block rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition"
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        Join as Vendor
                      </Link>
                      <Link
                        href="/auth?role=services&next=/services/orders"
                        className="block rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition"
                        onClick={() => setProfileMenuOpen(false)}
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
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile: top row (non-persistent). */}
      <nav className="md:hidden border-b border-border bg-background/95 backdrop-blur">
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
            <Button variant="ghost" size="icon" aria-label="Messages" asChild>
              <Link href="/auth?role=buyer&next=/buyer/messages">
                <MessagesSquare className="h-5 w-5" />
              </Link>
            </Button>

            <Button size="sm" asChild className="shrink-0">
              <Link href="/auth?role=buyer&next=/buyer">Post RFQ</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile: lower row (persistent). */}
      <nav className="md:hidden border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
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

          <Button variant="ghost" size="icon" aria-label="Shopping cart" asChild className="shrink-0">
            <Link href="/cart">
              <ShoppingCart className="h-5 w-5" />
            </Link>
          </Button>

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
              <UserCircle2 className="h-5 w-5" />
              <ChevronDown className="h-4 w-4" aria-hidden />
            </button>

            {profileMenuOpen ? (
              <div
                ref={mobileProfilePopoverRef}
                className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-lg z-50"
              >
                {profileMenuMode === 'login' ? (
                  <>
                    <Link
                      href="/auth?role=buyer&next=/buyer"
                      className="block rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      Login as Buyer
                    </Link>
                    <Link
                      href="/auth?role=vendor&next=/vendor"
                      className="block rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      Login as Vendor
                    </Link>
                    <Link
                      href="/auth?role=services&next=/services/orders"
                      className="block rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      Login as Service Provider
                    </Link>
                    <div className="my-1 h-px bg-border" />
                    <button
                      type="button"
                      className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-primary hover:bg-accent transition"
                      onClick={() => setProfileMenuMode('join')}
                    >
                      Join MyGarage
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth?role=buyer&next=/buyer"
                      className="block rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      Join as Buyer
                    </Link>
                    <Link
                      href="/auth?role=vendor&next=/vendor"
                      className="block rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      Join as Vendor
                    </Link>
                    <Link
                      href="/auth?role=services&next=/services/orders"
                      className="block rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition"
                      onClick={() => setProfileMenuOpen(false)}
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

