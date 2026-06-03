'use client';

import type { ElementType, ReactNode } from 'react';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Money } from '@/components/money';
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
  Mail,
  MoreHorizontal,
  Package,
  Pencil,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Trash2,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  type AdminVendorListRow,
  vendorDisplayName,
} from '@/lib/admin-vendor-membership';

export type VendorDirectoryListKind = 'marketplace' | 'services';

function formatJoined(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function VerificationBadge({
  portal,
  verified,
}: {
  portal: 'marketplace' | 'services';
  verified: boolean;
}) {
  const isMarketplace = portal === 'marketplace';
  const label = isMarketplace ? 'Marketplace' : 'Services';
  if (verified) {
    return (
      <Badge
        variant="outline"
        className={cn(
          'gap-1 rounded-md px-2 py-0 text-[10px] font-semibold',
          isMarketplace
            ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
            : 'border-violet-500/35 bg-violet-500/10 text-violet-800 dark:text-violet-300',
        )}
      >
        <ShieldCheck className="h-3 w-3" />
        {label} verified
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="gap-1 rounded-md border-amber-500/35 bg-amber-500/10 px-2 py-0 text-[10px] font-semibold text-amber-900 dark:text-amber-200"
    >
      <Clock className="h-3 w-3" />
      {label} pending
    </Badge>
  );
}

const LIST_THEME = {
  marketplace: {
    accent: 'emerald',
    border: 'border-l-emerald-500',
    ring: 'ring-emerald-500/20',
    hover: 'hover:bg-emerald-500/[0.03]',
    selected: 'bg-emerald-500/[0.06]',
    avatar:
      'bg-linear-to-br from-emerald-500/25 to-emerald-600/5 text-emerald-800 ring-emerald-500/20 dark:text-emerald-300',
    emptyIcon: Store,
    verifyBtn: 'text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300',
    metricLabel: 'Products',
  },
  services: {
    accent: 'violet',
    border: 'border-l-violet-500',
    ring: 'ring-violet-500/20',
    hover: 'hover:bg-violet-500/[0.03]',
    selected: 'bg-violet-500/[0.06]',
    avatar:
      'bg-linear-to-br from-violet-500/25 to-violet-600/5 text-violet-800 ring-violet-500/20 dark:text-violet-300',
    emptyIcon: BriefcaseBusiness,
    verifyBtn: 'text-violet-700 hover:bg-violet-500/10 dark:text-violet-300',
    metricLabel: 'Offerings',
  },
} as const;

function MetricPill({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/30 px-2.5 py-1 text-xs">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums text-foreground">{value}</span>
    </span>
  );
}

export type VendorDirectoryListProps = {
  kind: VendorDirectoryListKind;
  rows: AdminVendorListRow[];
  selectedIds: Set<string>;
  onToggleAll: () => void;
  onToggleOne: (id: string, checked: boolean) => void;
  onEdit: (row: AdminVendorListRow) => void;
  onDelete: (id: string, label: string) => void;
  onVerifyMarketplace: (id: string, verified: boolean) => void;
  onVerifyServices: (id: string, verified: boolean) => void;
  emptySearch?: boolean;
  emptyFilter?: boolean;
  onClearSearch?: () => void;
  onAdd?: () => void;
};

export function VendorDirectoryList({
  kind,
  rows,
  selectedIds,
  onToggleAll,
  onToggleOne,
  onEdit,
  onDelete,
  onVerifyMarketplace,
  onVerifyServices,
  emptySearch,
  emptyFilter,
  onClearSearch,
  onAdd,
}: VendorDirectoryListProps) {
  const theme = LIST_THEME[kind];
  const EmptyIcon = theme.emptyIcon;
  const allSelected = rows.length > 0 && rows.every((r) => selectedIds.has(r.id));
  const someSelected = rows.some((r) => selectedIds.has(r.id));
  const portalVerified = (v: AdminVendorListRow) =>
    kind === 'marketplace' ? v.is_verified : Boolean(v.services_verified);

  if (rows.length === 0) {
    return (
      <Empty className="border-0 py-20">
        <EmptyHeader>
          <EmptyMedia variant="icon" className="rounded-2xl">
            <EmptyIcon />
          </EmptyMedia>
          <EmptyTitle>
            {emptySearch
              ? 'No matches for your search'
              : emptyFilter
                ? 'No accounts in this filter'
                : kind === 'marketplace'
                  ? 'No marketplace vendors yet'
                  : 'No service providers yet'}
          </EmptyTitle>
          <EmptyDescription className="max-w-md">
            {emptySearch
              ? 'Try another name, email, or user ID—or clear the search to see the full directory.'
              : emptyFilter
                ? 'Switch to All or Pending to see more accounts in this directory.'
                : kind === 'marketplace'
                  ? 'Sellers appear here when they have a vendor role or active product listings.'
                  : 'Providers appear here when they have a services role or published offerings.'}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="flex flex-wrap justify-center gap-2">
          {emptySearch && onClearSearch ? (
            <Button variant="outline" className="rounded-xl" onClick={onClearSearch}>
              Clear search
            </Button>
          ) : null}
          {onAdd ? (
            <Button className="rounded-xl" onClick={onAdd}>
              Add account
            </Button>
          ) : null}
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="hidden border-b border-border/50 bg-muted/20 px-4 py-3 xl:grid xl:grid-cols-[auto_minmax(0,1fr)_repeat(3,5rem)_auto] xl:items-center xl:gap-4 xl:px-6">
        <Checkbox
          checked={allSelected ? true : someSelected && !allSelected ? 'indeterminate' : false}
          onCheckedChange={onToggleAll}
          aria-label="Select all visible accounts"
        />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {kind === 'marketplace' ? 'Marketplace vendor' : 'Service provider'}
        </span>
        <span className="text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {theme.metricLabel}
        </span>
        <span className="text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {kind === 'marketplace' ? 'Orders' : 'Products'}
        </span>
        <span className="text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {kind === 'marketplace' ? 'Revenue' : 'Orders'}
        </span>
        <span className="sr-only">Actions</span>
      </div>

      <ul className="divide-y divide-border/50">
        {rows.map((vendor) => {
          const displayCompany = vendorDisplayName(vendor);
          const displayEmail = vendor.email || vendor.profile?.public_email || '';
          const phone = vendor.profile?.phone?.trim();
          const isSelected = selectedIds.has(vendor.id);
          const isHybrid = vendor.account_type === 'hybrid';
          const verified = portalVerified(vendor);
          const primaryMetric =
            kind === 'marketplace' ? vendor.product_count : (vendor.offerings_count ?? 0);
          const secondaryMetric =
            kind === 'marketplace' ? vendor.order_count : vendor.product_count;
          const tertiary =
            kind === 'marketplace' ? (
              <Money amountUSD={vendor.revenue} notation="compact" />
            ) : (
              vendor.order_count
            );

          return (
            <li
              key={`${kind}-${vendor.id}`}
              className={cn(
                'group border-l-[3px] transition-[background-color,box-shadow]',
                theme.border,
                isSelected ? cn(theme.selected, 'ring-1 ring-inset', theme.ring) : theme.hover,
              )}
            >
              <div className="flex flex-wrap items-start gap-3 p-4 sm:gap-4 sm:px-6 sm:py-4 xl:flex-nowrap xl:grid xl:grid-cols-[auto_minmax(0,1fr)_repeat(3,5rem)_auto] xl:items-center xl:gap-4">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => onToggleOne(vendor.id, checked === true)}
                  aria-label={`Select ${displayCompany}`}
                  className="mt-1 shrink-0 xl:mt-0"
                />

                <div className="flex min-w-0 flex-[1_1_16rem] gap-3 sm:flex-1 sm:gap-3.5 xl:min-w-0">
                  <Link
                    href={`/admin/vendors/${vendor.id}`}
                    className={cn(
                      'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-bold ring-1 transition-all group-hover:ring-2 sm:h-12 sm:w-12 sm:text-lg',
                      theme.avatar,
                    )}
                  >
                    {displayCompany.charAt(0).toUpperCase()}
                  </Link>

                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Link
                      href={`/admin/vendors/${vendor.id}`}
                      className="group/name inline-flex max-w-full items-start gap-1.5 text-base font-semibold leading-snug text-foreground transition-colors hover:text-primary"
                      title={displayCompany}
                    >
                      <span className="break-words [overflow-wrap:anywhere]">{displayCompany}</span>
                      <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-40 transition-opacity group-hover/name:opacity-100" />
                    </Link>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {isHybrid ? (
                        <Badge
                          variant="outline"
                          className="gap-1 rounded-md border-indigo-500/30 bg-indigo-500/10 px-2 py-0 text-[10px] text-indigo-800 dark:text-indigo-300"
                        >
                          <Sparkles className="h-3 w-3" />
                          {kind === 'marketplace' ? 'Also services' : 'Also marketplace'}
                        </Badge>
                      ) : null}
                      <VerificationBadge
                        portal={kind === 'marketplace' ? 'marketplace' : 'services'}
                        verified={verified}
                      />
                    </div>

                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {vendor.profile?.description?.trim() || 'No public description'}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {displayEmail ? (
                        <span className="inline-flex min-w-0 max-w-full items-center gap-1">
                          <Mail className="h-3.5 w-3.5 shrink-0 opacity-70" />
                          <span className="break-all">{displayEmail}</span>
                        </span>
                      ) : null}
                      {phone ? (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5 shrink-0 opacity-70" />
                          {phone}
                        </span>
                      ) : null}
                      <span className="text-muted-foreground/80">Joined {formatJoined(vendor.created_at)}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-0.5 xl:hidden">
                      <MetricPill
                        icon={kind === 'marketplace' ? Package : BriefcaseBusiness}
                        label={theme.metricLabel}
                        value={primaryMetric}
                      />
                      <MetricPill
                        icon={kind === 'marketplace' ? ShoppingBag : Package}
                        label={kind === 'marketplace' ? 'Orders' : 'Products'}
                        value={secondaryMetric}
                      />
                      <MetricPill
                        icon={ShoppingBag}
                        label={kind === 'marketplace' ? 'Revenue' : 'Orders'}
                        value={tertiary}
                      />
                    </div>
                  </div>
                </div>

                <p className="hidden text-center text-sm font-semibold tabular-nums xl:block">{primaryMetric}</p>
                <p className="hidden text-center text-sm font-medium tabular-nums text-muted-foreground xl:block">
                  {secondaryMetric}
                </p>
                <p className="hidden text-right text-sm font-semibold tabular-nums xl:block">{tertiary}</p>

                <div className="ml-auto flex w-full shrink-0 items-center justify-end gap-1 sm:w-auto xl:ml-0 xl:w-auto">
                  {!verified ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn('h-8 rounded-lg text-xs font-medium', theme.verifyBtn)}
                      onClick={() =>
                        kind === 'marketplace'
                          ? onVerifyMarketplace(vendor.id, true)
                          : onVerifyServices(vendor.id, true)
                      }
                    >
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                      Verify
                    </Button>
                  ) : null}
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                    onClick={() => onEdit(vendor)}
                    aria-label={`Edit ${displayCompany}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg xl:hidden" asChild>
                    <Link href={`/admin/vendors/${vendor.id}`} aria-label={`View ${displayCompany}`}>
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg"
                        aria-label={`More actions for ${displayCompany}`}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/vendors/${vendor.id}`} className="cursor-pointer">
                          View full profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(vendor)}>Edit account</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {kind === 'marketplace' ? (
                        <DropdownMenuItem
                          onClick={() => onVerifyMarketplace(vendor.id, !vendor.is_verified)}
                        >
                          <Store className="mr-2 h-4 w-4 text-emerald-600" />
                          {vendor.is_verified ? 'Revoke marketplace' : 'Verify marketplace'}
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => onVerifyServices(vendor.id, !vendor.services_verified)}
                        >
                          <BriefcaseBusiness className="mr-2 h-4 w-4 text-violet-600" />
                          {vendor.services_verified ? 'Revoke services' : 'Verify services'}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem asChild>
                        <Link href={kind === 'marketplace' ? '/admin/products' : '/admin/services'}>
                          {kind === 'marketplace' ? 'Browse products' : 'Services admin'}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => onDelete(vendor.id, displayCompany)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete account
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between border-t border-border/50 bg-muted/15 px-4 py-2.5 text-xs text-muted-foreground sm:px-6">
        <span>
          Showing <span className="font-medium text-foreground">{rows.length}</span>{' '}
          {rows.length === 1 ? 'account' : 'accounts'}
        </span>
        <span className="hidden sm:inline">Select rows for bulk verification or deletion</span>
      </div>
    </div>
  );
}
