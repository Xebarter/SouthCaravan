import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Money } from '@/components/money'
import { stripHtmlForPreview } from '@/lib/strip-html'
import { normalizeOfferingImageUrls } from '@/lib/service-offering-images'

type PageProps = { params: Promise<{ id: string }> }

export default async function PublicServiceOfferingPage(props: PageProps) {
  const { id } = await props.params
  if (!id) notFound()

  const { data: offering, error } = await supabaseAdmin
    .from('service_offerings')
    .select(
      'id,title,description,category,subcategory,pricing_type,rate,currency,is_active,is_featured,is_ad,provider_user_id,images,created_at',
    )
    .eq('id', id)
    .eq('is_active', true)
    .maybeSingle()

  if (error || !offering) notFound()

  const { data: vendor } = await supabaseAdmin
    .from('vendors')
    .select('company_name,name,email')
    .eq('id', offering.provider_user_id)
    .maybeSingle()

  const providerLabel =
    vendor?.company_name?.trim() || vendor?.name?.trim() || vendor?.email?.trim() || 'Service provider'
  const pricingType = String(offering.pricing_type ?? 'fixed').toLowerCase() === 'hourly' ? 'hourly' : 'fixed'
  const currency = String(offering.currency ?? 'USD').toUpperCase()
  const gallery = normalizeOfferingImageUrls((offering as { images?: unknown }).images)

  return (
    <div className="min-h-screen bg-linear-to-b from-sky-50 via-white to-slate-50/80">
      <div className="max-w-3xl mx-auto px-4 py-10 sm:py-14 space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3.5 w-3.5" />
            Professional service
          </Badge>
          {offering.is_featured ? (
            <Badge className="bg-amber-500/15 text-amber-800 border border-amber-500/25">Featured</Badge>
          ) : null}
          {offering.is_ad ? (
            <Badge className="bg-violet-500/10 text-violet-700 border border-violet-500/20">Promoted</Badge>
          ) : null}
        </div>

        {gallery.length > 0 ? (
          <div className="space-y-3">
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video sm:aspect-21/9 max-h-[min(420px,50vh)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={gallery[0]}
                alt=""
                className="h-full w-full object-cover"
                loading="eager"
                decoding="async"
              />
            </div>
            {gallery.length > 1 ? (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {gallery.slice(1).map((src) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={src}
                    src={src}
                    alt=""
                    className="h-16 w-24 shrink-0 rounded-lg object-cover border border-slate-200"
                    loading="lazy"
                    decoding="async"
                  />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">{offering.title}</h1>
          <p className="text-sm text-slate-600">
            {offering.category}
            {offering.subcategory ? ` · ${offering.subcategory}` : ''}
          </p>
          <p className="text-sm text-slate-500">Offered by {providerLabel}</p>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Indicative pricing</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  <Money amount={Number(offering.rate ?? 0)} baseCurrency={currency} />
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {pricingType === 'hourly' ? 'Per hour (typical engagements vary)' : 'Starting point — request a quote for scope'}
                </p>
              </div>
              <Button asChild size="lg" className="rounded-full">
                <Link href="/auth?role=buyer&next=/buyer/services">Request this service</Link>
              </Button>
            </div>
            {offering.description ? (
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {stripHtmlForPreview(offering.description) || offering.description}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" asChild className="rounded-full">
            <Link href="/">Back to marketplace</Link>
          </Button>
          <Button variant="outline" asChild className="rounded-full">
            <Link href="/public/vendors">Explore suppliers</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
