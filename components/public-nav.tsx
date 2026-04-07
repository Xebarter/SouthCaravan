'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, MessageSquare, ShoppingCart, User } from 'lucide-react';
import { HeaderSearch } from '@/components/header-search';

/** Radix DropdownMenu IDs can mismatch SSR vs client; render menu only after mount. */
function MobileProfileMenu() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" aria-label="Open profile menu" type="button">
        <User className="w-5 h-5" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open profile menu">
          <User className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href="/login">Post My RFQ</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/login">Messages</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/cart">Shopping cart</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/login">Sign in / Join</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function PublicNav({
  onMenuToggle,
  onDesktopMenuHoverStart,
  onDesktopMenuHoverEnd,
}: {
  onMenuToggle: () => void;
  onDesktopMenuHoverStart?: () => void;
  onDesktopMenuHoverEnd?: () => void;
}) {

  return (
    <nav className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
      <div className="flex h-16 items-center justify-between gap-4 px-6 max-w-7xl mx-auto">
        {/* Logo + Hamburger */}
        <div className="flex items-center gap-2">
          <div
            className="hidden md:inline-flex"
            onMouseEnter={onDesktopMenuHoverStart}
            onMouseLeave={onDesktopMenuHoverEnd}
          >
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:inline-flex"
              aria-label="Open marketplace menu"
              onClick={onMenuToggle}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
          <div
            className="md:hidden inline-flex"
            onMouseEnter={onDesktopMenuHoverStart}
            onMouseLeave={onDesktopMenuHoverEnd}
          >
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open marketplace menu"
              onClick={onMenuToggle}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
          <Link href="/" className="hidden md:flex items-center gap-2 font-bold text-lg">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
              SC
            </div>
            <span className="hidden sm:inline">SouthCaravan</span>
          </Link>
        </div>

        {/* Search + Quick Actions */}
        <div className="hidden md:flex items-center gap-2 flex-1 max-w-3xl">
          <HeaderSearch />
          <Button asChild>
            <Link href="/login">Post My RFQ</Link>
          </Button>
          <Button variant="ghost" size="icon" aria-label="Messages" asChild>
            <Link href="/login">
              <MessageSquare className="w-5 h-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" aria-label="Shopping cart" asChild>
            <Link href="/cart">
              <ShoppingCart className="w-5 h-5" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/login" className="gap-2">
              <User className="w-4 h-4" />
              Sign in / Join
            </Link>
          </Button>
        </div>

        {/* Mobile: search + profile menu */}
        <div className="flex md:hidden items-center gap-2 flex-1">
          <HeaderSearch mobile />
          <MobileProfileMenu />
        </div>
      </div>
    </nav>
  );
}
