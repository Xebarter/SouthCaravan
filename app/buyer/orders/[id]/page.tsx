'use client';

import OrderDetailPage from '../../order/[id]/page';

export default function BuyerOrderDetailPluralRoute({
  params,
}: {
  params: { id: string };
}) {
  return <OrderDetailPage params={params} />;
}

