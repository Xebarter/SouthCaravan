'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useCurrencyOptional } from '@/components/currency/currency-provider';
import { CURRENCIES, formatCurrencyOption } from '@/lib/currencies';

const PRIORITY_CODES = ['AUTO', 'USD', 'EUR', 'GBP', 'KES', 'UGX', 'TZS', 'RWF', 'ZAR', 'NGN', 'GHS'];

export function CurrencySelector({ compact = false }: { compact?: boolean }) {
  const ctx = useCurrencyOptional();
  const [open, setOpen] = useState(false);

  const options = useMemo(() => {
    const enabled = ctx?.enabledCurrencies ?? CURRENCIES;
    const enabledCodes = new Set(enabled.map((c) => c.code));
    const priority = PRIORITY_CODES.filter((c) => c === 'AUTO' || enabledCodes.has(c));
    const rest = enabled.filter((c) => !priority.includes(c.code)).map((c) => c.code);
    return [...priority, ...rest];
  }, [ctx?.enabledCurrencies]);

  const label = ctx?.preference === 'AUTO'
    ? `Auto (${ctx.displayCurrency})`
    : (ctx?.displayCurrency ?? 'USD');

  if (!ctx) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size={compact ? 'sm' : 'default'}
          className={cn('gap-1.5 font-medium tabular-nums', compact ? 'h-8 px-2 text-xs' : 'h-9')}
          aria-label="Select display currency"
        >
          <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="max-w-[5rem] truncate sm:max-w-none">{label}</span>
          <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="end">
        <Command>
          <CommandInput placeholder="Search currency..." />
          <CommandList>
            <CommandEmpty>No currency found.</CommandEmpty>
            <CommandGroup heading="Display currency">
              {options.map((code) => {
                const currency = CURRENCIES.find((c) => c.code === code);
                const optionLabel = code === 'AUTO' ? 'Auto-detect (recommended)' : formatCurrencyOption(currency ?? { code, name: code, symbol: code, country: '' });
                const selected = ctx.preference === code || (code !== 'AUTO' && ctx.preference === code);

                return (
                  <CommandItem
                    key={code}
                    value={`${code} ${currency?.name ?? ''}`}
                    onSelect={() => {
                      ctx.setPreference(code);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn('mr-2 h-4 w-4', selected ? 'opacity-100' : 'opacity-0')} />
                    {optionLabel}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
