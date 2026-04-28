import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Money } from '@/components/money';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { isUuid } from '@/lib/is-uuid';
import { ArrowLeft, Building2, Globe, Mail, MapPin, Package, Phone } from 'lucide-react';

function splitCommaList(value: unknown): string[] {
  if (typeof value !== 'string') return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 16);
}

export default async function SupplierPublicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vendorUserId = String(id ?? '').trim();
  if (!vendorUserId || !isUuid(vendorUserId)) notFound();

  const [{ data: profile }, { data: images }, { data: products }] = await Promise.all([
    supabaseAdmin
      .from('vendor_profiles')
      .select(
        'user_id,company_name,description,public_email,phone,website,address,city,state,zip_code,country,logo_url,public_profile_enabled,public_profile',
      )
      .eq('user_id', vendorUserId)
      .maybeSingle(),
    supabaseAdmin
      .from('vendor_profile_showcase_images')
      .select('id,url,kind,caption,sort_order,created_at')
      .eq('user_id', vendorUserId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('products')
      .select('id,name,price,unit,images,in_stock,category,subcategory')
      .eq('vendor_id', vendorUserId)
      .order('created_at', { ascending: false })
      .limit(24),
  ]);

  if (!profile || profile.public_profile_enabled !== true) {
    return (
      <div className="bg-background px-4 md:px-6 py-6 md:py-10 pb-24 md:pb-10">
        <div className="max-w-[980px] mx-auto space-y-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
            Back to marketplace
          </Link>

          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className="h-1.5 w-full bg-slate-200" />
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Supplier profile not public yet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600 max-w-2xl">
                This supplier hasn’t enabled a public profile. You can still browse the catalog and come back later.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button asChild className="w-full sm:w-auto">
                  <Link href="/catalog">Browse products</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const publicProfile = (profile.public_profile && typeof profile.public_profile === 'object' && !Array.isArray(profile.public_profile)
    ? profile.public_profile
    : {}) as Record<string, unknown>;

  const headline = typeof publicProfile.headline === 'string' ? publicProfile.headline.trim() : '';
  const operatingSince = typeof publicProfile.operatingSince === 'string' ? publicProfile.operatingSince.trim() : '';
  const capabilities = splitCommaList(publicProfile.capabilities);
  const certifications = splitCommaList(publicProfile.certifications);

  const locationBits = [profile.city, profile.state, profile.country].map((v) => String(v ?? '').trim()).filter(Boolean);
  const location = locationBits.join(', ');

  const showcase = Array.isArray(images) ? images : [];
  const supplierProducts = Array.isArray(products) ? products : [];

  return (
    <div className="bg-background px-4 md:px-6 py-6 md:py-10 pb-24 md:pb-10">
      <div className="max-w-[1200px] mx-auto space-y-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          Back to marketplace
        </Link>

        {/* Header */}
        <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
          <div className="relative">
            <div className="h-16 md:h-20 w-full bg-slate-50" />
          </div>
          <CardContent className="p-5 md:p-6 -mt-10 md:-mt-12">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl border border-slate-200 bg-white overflow-hidden shrink-0 shadow-sm ring-4 ring-white">
                  {profile.logo_url ? (
                    <Image
                      src={profile.logo_url}
                      alt={`${profile.company_name} logo`}
                      width={80}
                      height={80}
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-slate-400">
                      <Building2 className="h-7 w-7" />
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                      {profile.company_name || 'Supplier'}
                    </h1>
                    <Badge variant="outline">Supplier</Badge>
                  </div>
                  {headline ? (
                    <p className="text-sm md:text-base text-slate-700 max-w-2xl">{headline}</p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                    {operatingSince ? <span>Operating since {operatingSince}</span> : null}
                    {operatingSince && location ? <span>•</span> : null}
                    {location ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {location}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 min-w-[280px]">
                {profile.public_email ? (
                  <Button asChild className="w-full">
                    <a href={`mailto:${profile.public_email}`} aria-label="Email supplier">
                      <Mail className="h-4 w-4 mr-2" />
                      Email supplier
                    </a>
                  </Button>
                ) : (
                  <Button asChild className="w-full">
                    <Link href="/login">Sign in to contact</Link>
                  </Button>
                )}
                <Button asChild className="w-full">
                  <Link href="/catalog">Browse catalog</Link>
                </Button>
              </div>
            </div>

            <Separator className="my-5" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5" />
                  Website
                </p>
                {profile.website ? (
                  <a
                    href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                    className="mt-1 block text-sm font-semibold text-sky-700 hover:underline wrap-break-word"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {profile.website}
                  </a>
                ) : (
                  <p className="mt-1 text-sm text-slate-600">Not provided</p>
                )}
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  Phone
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900 wrap-break-word">
                  {profile.phone || 'Not provided'}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  Address
                </p>
                <p className="mt-1 text-sm text-slate-700 wrap-break-word">
                  {[profile.address, location, profile.zip_code]
                    .map((v) => String(v ?? '').trim())
                    .filter(Boolean)
                    .join(' · ') || 'Not provided'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-5 lg:grid-cols-12 lg:items-start">
          <Card className="lg:col-span-7 border-slate-200 shadow-sm bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">About this supplier</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-700 whitespace-pre-line">
                {profile.description?.trim() || 'This supplier is preparing a detailed company overview.'}
              </p>
              {capabilities.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-900">Capabilities</p>
                  <div className="flex flex-wrap gap-2">
                    {capabilities.map((c) => (
                      <Badge key={c} className="bg-sky-100 text-sky-800 border-sky-200">
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
              {certifications.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-900">Certifications</p>
                  <div className="flex flex-wrap gap-2">
                    {certifications.map((c) => (
                      <Badge key={c} variant="outline">
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="lg:col-span-5 lg:sticky lg:top-20 border-slate-200 shadow-sm bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Buyer-ready highlights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-700">
              <p>For faster sourcing, include your ideal MOQ, lead times, and packing standards in your RFQ.</p>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">What to ask for</p>
                <ul className="mt-2 space-y-1 text-sm text-slate-600 list-disc list-inside">
                  <li>Production capacity per month and typical lead time</li>
                  <li>QC process (incoming, in-process, final inspection)</li>
                  <li>Incoterms and export documentation support</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Showcase gallery</CardTitle>
          </CardHeader>
          <CardContent>
            {showcase.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {showcase.map((img: any) => (
                  <div key={img.id} className="rounded-xl overflow-hidden border border-slate-200 bg-white">
                    <div className="relative h-44 w-full bg-slate-100">
                      <Image
                        src={img.url}
                        alt={img.caption || 'Supplier image'}
                        fill
                        unoptimized
                        sizes="33vw"
                        className="object-cover"
                      />
                    </div>
                    <div className="p-3 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline" className="capitalize">
                          {String(img.kind || 'other')}
                        </Badge>
                      </div>
                      {img.caption ? (
                        <p className="text-sm text-slate-700 line-clamp-2">{String(img.caption)}</p>
                      ) : (
                        <p className="text-sm text-slate-500"> </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                <p className="font-medium text-slate-900">No showcase yet</p>
                <p className="mt-1">This supplier hasn’t added showcase images.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">More products from this supplier</CardTitle>
          </CardHeader>
          <CardContent>
            {supplierProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {supplierProducts.map((p: any) => (
                  <Link
                    key={p.id}
                    href={`/product/${p.id}`}
                    className="rounded-xl border border-slate-200 bg-white overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {Array.isArray(p.images) && p.images[0] ? (
                      <div className="relative h-40 w-full bg-slate-100">
                        <Image
                          src={p.images[0]}
                          alt={p.name || 'Product image'}
                          fill
                          unoptimized
                          sizes="33vw"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-40 w-full bg-slate-100 flex items-center justify-center">
                        <Package className="h-10 w-10 text-slate-400" />
                      </div>
                    )}

                    <div className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900 line-clamp-2">{p.name}</p>
                        <Badge variant="outline" className="shrink-0">
                          {p.in_stock ? 'In production' : 'Unavailable'}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500">
                        {String(p.category ?? '')}
                        {p.subcategory ? ` · ${String(p.subcategory)}` : ''}
                      </p>
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-900">
                          <Money amountUSD={Number(p.price ?? 0)} />
                          <span className="text-xs font-medium text-slate-500"> / {String(p.unit ?? 'unit')}</span>
                        </p>
                        <span className="text-xs text-slate-500">View details</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                <p className="font-medium text-slate-900">No products listed</p>
                <p className="mt-1">This supplier doesn’t have public products in the catalog yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

