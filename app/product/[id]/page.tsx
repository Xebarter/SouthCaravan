import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowLeft, Building2, CheckCircle2, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductImageGallery } from '@/components/product-image-gallery';
import { ProductRichText } from '@/components/product-rich-text';
import { ProductPurchaseActions } from '@/components/product-purchase-actions';
import { Money } from '@/components/money';
import { getProductById, getRelatedProducts } from '@/lib/product-data';
import { getVendorDisplayName } from '@/lib/vendor-display';
import { productIsRfqRoutable } from '@/lib/platform-rfq-recipient';
import { getPlatformRfqRecipientUserId } from '@/lib/platform-rfq-recipient';
import { isUuid } from '@/lib/is-uuid';

function normalizeSpecs(specs: Record<string, unknown> | null) {
  if (!specs) return [];
  return Object.entries(specs)
    .filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value))
    .slice(0, 8)
    .map(([key, value]) => ({
      key: key.replace(/_/g, ' '),
      value: String(value),
    }));
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  const related = await getRelatedProducts(product);
  const specs = normalizeSpecs(product.specifications);
  const rawVendorId = product.vendor_id == null ? '' : String(product.vendor_id).trim();
  const vendorDisplay = rawVendorId ? getVendorDisplayName(rawVendorId) : 'SouthCaravan';

  let messagingRecipientUserId: string | undefined = undefined;
  if (rawVendorId && isUuid(rawVendorId)) {
    messagingRecipientUserId = rawVendorId;
  } else {
    const platform = await getPlatformRfqRecipientUserId();
    if (platform.ok) messagingRecipientUserId = platform.userId;
  }

  const criticalPreloadUrls = Array.from(
    new Set([product.images?.[0], ...product.images.slice(1, 5)].filter(Boolean)),
  );

  return (
    <div className="bg-background px-4 md:px-6 py-6 md:py-8">
      {criticalPreloadUrls.map((url) => (
        <link key={url} rel="preload" as="image" href={url} />
      ))}
      <div className="max-w-[1500px] mx-auto space-y-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          Back to marketplace
        </Link>

        <div className="grid gap-5 lg:grid-cols-12">
          <Card className="lg:col-span-7 border-slate-200 shadow-sm">
            <CardContent className="p-4 md:p-5 space-y-3">
              {product.images?.length ? (
                <ProductImageGallery images={product.images} alt={product.name} />
              ) : (
                <div className="w-full h-[340px] md:h-[440px] rounded-lg bg-slate-100 flex items-center justify-center">
                  <Package className="h-12 w-12 text-slate-400" />
                </div>
              )}
            </CardContent>
          </Card>

          <div className="lg:col-span-5 space-y-4">
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-5 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-sky-100 text-sky-800 border-sky-200">{product.category}</Badge>
                  <Badge variant="outline">{product.subcategory}</Badge>
                  <Badge variant="outline">{product.in_stock ? 'In production' : 'Temporarily unavailable'}</Badge>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{product.name}</h1>
                <ProductRichText html={product.description} />

                <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div>
                    <p className="text-xs text-slate-500">Reference Unit Price</p>
                    <p className="text-xl font-bold text-slate-900">
                      <Money amountUSD={Number(product.price)} />
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Minimum Order</p>
                    <p className="text-xl font-bold text-slate-900">{product.minimum_order} {product.unit}</p>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
                  <p className="text-sm font-semibold text-slate-900">B2B Trade Snapshot</p>
                  <ul className="space-y-1 text-sm text-slate-600">
                    <li>Lead time: 7-21 days depending on volume</li>
                    <li>Payment terms: T/T, L/C (negotiable)</li>
                    <li>Packaging: Export-grade carton/pallet</li>
                  </ul>
                </div>

                <ProductPurchaseActions
                  productId={product.id}
                  name={product.name}
                  unitPrice={Number(product.price)}
                  minimumOrder={product.minimum_order}
                  unit={product.unit}
                  inStock={product.in_stock}
                  vendorLabel={vendorDisplay}
                  vendorUserId={messagingRecipientUserId}
                  imageUrl={product.images?.[0]}
                  rfqEnabled={productIsRfqRoutable(product)}
                />
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-sky-700" />
                  Supplier
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
              <p className="text-sm font-semibold text-slate-900">{vendorDisplay}</p>
                <p className="text-sm text-slate-600">Focused on export-ready supply for wholesale and repeat B2B procurement.</p>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Basic profile verification completed
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-12">
          <Card className="lg:col-span-8 border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Specifications</CardTitle>
            </CardHeader>
            <CardContent>
              {specs.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-3">
                  {specs.map((item) => (
                    <div key={item.key} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-xs uppercase tracking-wide text-slate-500">{item.key}</p>
                      <p className="text-sm font-medium text-slate-900">{item.value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-600">
                  Detailed technical specifications are available on quote request. Share your requirements to receive a tailored data sheet.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-4 border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Compliance & Docs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-600">
              <p>Commercial invoice and packing list available.</p>
              <p>Certificate requests can be discussed during RFQ.</p>
              <p>Sample policy and quality assurance terms shared before PO confirmation.</p>
            </CardContent>
          </Card>
        </div>

        {related.length > 0 && (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">More from this category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {related.map((item) => (
                  <Link
                    key={item.id}
                    href={`/product/${item.id}`}
                    className="rounded-lg border border-slate-200 bg-white overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {item.images?.[0] ? (
                      <div className="relative h-28 w-full bg-slate-100">
                        <Image
                          src={item.images[0]}
                          alt={item.name}
                          fill
                          loading="lazy"
                          unoptimized
                          sizes="25vw"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-28 w-full bg-slate-100 flex items-center justify-center">
                        <Package className="h-6 w-6 text-slate-400" />
                      </div>
                    )}
                    <div className="p-2.5 space-y-1.5">
                      <p className="text-sm font-medium text-slate-900 line-clamp-2">{item.name}</p>
                      <p className="text-xs text-slate-600">
                        <Money amountUSD={Number(item.price)} /> / {item.unit}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
