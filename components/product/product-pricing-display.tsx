import { Badge } from '@/components/ui/badge';
import { Money } from '@/components/money';
import {
  hasDualPricing,
  pricingFieldsFromProduct,
  type ProductPricingFields,
} from '@/lib/product-pricing';

type Props = {
  price: number;
  retailPrice?: number | null;
  minimumOrder: number;
  unit: string;
  className?: string;
};

export function ProductPricingDisplay({
  price,
  retailPrice,
  minimumOrder,
  unit,
  className,
}: Props) {
  const fields: ProductPricingFields = pricingFieldsFromProduct({
    price,
    retail_price: retailPrice,
    minimum_order: minimumOrder,
  });
  const dual = hasDualPricing(fields);
  const moq = fields.minimum_order;

  if (!dual) {
    return (
      <div className={className ?? 'grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4'}>
        <div>
          <p className="text-xs font-medium text-slate-500">Unit price</p>
          <p className="mt-0.5 text-xl font-bold text-slate-900">
            <Money amountUSD={price} />
          </p>
          <p className="text-xs text-slate-500">Per {unit}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500">Minimum order</p>
          <p className="mt-0.5 text-xl font-bold text-slate-900">
            {moq} {unit}
          </p>
          <p className="text-xs text-slate-500">MOQ</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className ?? 'space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4'}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="text-[10px]">
          Single &amp; bulk pricing
        </Badge>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg border border-slate-200/80 bg-white px-3 py-2.5">
          <p className="text-xs font-medium text-slate-500">Retail price</p>
          <p className="mt-0.5 text-lg font-bold text-slate-900">
            <Money amountUSD={fields.retail_price ?? 0} />
          </p>
          <p className="text-xs text-slate-500">Per {unit} · below MOQ</p>
        </div>
        <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/50 px-3 py-2.5">
          <p className="text-xs font-medium text-emerald-800/80">Bulk price</p>
          <p className="mt-0.5 text-lg font-bold text-emerald-950">
            <Money amountUSD={price} />
          </p>
          <p className="text-xs text-emerald-800/70">
            Per {unit} · from {moq} {unit}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200/80 bg-white px-3 py-2.5">
          <p className="text-xs font-medium text-slate-500">MOQ</p>
          <p className="mt-0.5 text-lg font-bold text-slate-900">
            {moq} {unit}
          </p>
          <p className="text-xs text-slate-500">Bulk threshold</p>
        </div>
      </div>
    </div>
  );
}
