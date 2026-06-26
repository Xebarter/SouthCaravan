'use client';

import { useWatch, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { hasDualPricing, validateDualPricingConfig } from '@/lib/product-pricing';
import { useCurrencyOptional } from '@/components/currency/currency-provider';
import { getCurrencyByCode } from '@/lib/currencies';

type PricingFormValues = {
  price: number;
  retailPrice?: number | '' | null;
  minimumOrder: number;
  unit?: string;
};

type Props<T extends FieldValues & PricingFormValues> = {
  control: Control<T>;
  unitFieldName?: FieldPath<T>;
  showUnitField?: boolean;
  unitOptions?: React.ReactNode;
  currencyCode?: string;
  currencyLoading?: boolean;
};

export function DualPricingFormSection<T extends FieldValues & PricingFormValues>({
  control,
  unitFieldName,
  showUnitField = false,
  unitOptions,
  currencyCode,
  currencyLoading = false,
}: Props<T>) {
  const ctx = useCurrencyOptional();
  const code = (currencyCode ?? ctx?.pricingCurrency ?? 'USD').toUpperCase();
  const currency = getCurrencyByCode(code);
  const symbol = currency?.symbol ?? code;

  if (currencyLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-3 sm:p-5">
        <p className="text-sm text-muted-foreground">Loading currency settings…</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-3 sm:p-5 space-y-4">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold sm:text-base">Pricing</h3>
          <Badge variant="secondary" className="text-[10px] font-medium">
            Single &amp; bulk
          </Badge>
          <Badge variant="outline" className="text-[10px] font-semibold tabular-nums">
            {code}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
          Enter amounts in <strong>{code}</strong> ({currency?.name ?? code}). This matches your base pricing currency
          from vendor settings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FormField
          control={control}
          name={'price' as FieldPath<T>}
          render={({ field }) => (
            <FormItem data-field="price" className="min-w-0">
              <FormLabel>Bulk price ({code}) *</FormLabel>
              <FormControl>
                <Input {...field} type="number" step="0.01" min={0} placeholder="9.00" />
              </FormControl>
              <FormDescription className="text-xs">
                Applied when quantity meets or exceeds MOQ.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={'retailPrice' as FieldPath<T>}
          render={({ field }) => (
            <FormItem data-field="retailPrice" className="min-w-0">
              <FormLabel>Retail price ({code})</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value === null || field.value === undefined ? '' : field.value}
                  onChange={(event) => {
                    const raw = event.target.value;
                    field.onChange(raw === '' ? '' : raw);
                  }}
                  type="number"
                  step="0.01"
                  min={0}
                  placeholder="12.00 (optional)"
                />
              </FormControl>
              <FormDescription className="text-xs">
                Single-purchase price below MOQ. Optional.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={'minimumOrder' as FieldPath<T>}
          render={({ field }) => (
            <FormItem data-field="minimumOrder" className="min-w-0">
              <FormLabel>Minimum order quantity (MOQ) *</FormLabel>
              <FormControl>
                <Input {...field} type="number" step="1" min={1} placeholder="20" />
              </FormControl>
              <FormDescription className="text-xs">
                Bulk price applies from this quantity upward.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {showUnitField && unitFieldName && unitOptions ? (
          <FormField
            control={control}
            name={unitFieldName}
            render={({ field }) => (
              <FormItem data-field="unit" className="min-w-0">
                <FormLabel>Unit *</FormLabel>
                <FormControl>{unitOptions}</FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}
      </div>

      <PricingPreview control={control} symbol={symbol} currencyCode={code} />
    </div>
  );
}

function PricingPreview<T extends FieldValues & PricingFormValues>({
  control,
  symbol,
  currencyCode,
}: {
  control: Control<T>;
  symbol: string;
  currencyCode: string;
}) {
  const watched = useWatch({ control });
  const values = watched as PricingFormValues;
  const bulk = Number(values?.price) || 0;
  const retailRaw = values?.retailPrice;
  const retail =
    retailRaw === '' || retailRaw == null ? null : Number.isFinite(Number(retailRaw)) ? Number(retailRaw) : null;
  const moq = Math.max(1, Math.floor(Number(values?.minimumOrder) || 1));
  const unit = values?.unit || 'unit';

  const fields = { price: bulk, retail_price: retail, minimum_order: moq };
  const dual = hasDualPricing(fields);
  const configError = validateDualPricingConfig(bulk, retail, moq);

  return (
    <div className="rounded-lg border border-dashed border-border/80 bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground space-y-1">
      <p className="font-medium text-foreground">Buyer preview ({currencyCode})</p>
      {dual ? (
        <>
          <p>
            Retail: <span className="font-semibold text-foreground">{symbol}{retail?.toFixed(2)}</span> each (below {moq}{' '}
            {unit})
          </p>
          <p>
            Bulk: <span className="font-semibold text-foreground">{symbol}{bulk.toFixed(2)}</span> each (from {moq} {unit})
          </p>
        </>
      ) : (
        <p>
          Bulk only: <span className="font-semibold text-foreground">{symbol}{bulk.toFixed(2)}</span> each · MOQ {moq} {unit}
        </p>
      )}
      {configError ? <p className="text-amber-700">{configError}</p> : null}
    </div>
  );
}
