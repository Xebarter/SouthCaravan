import { CONTACT_EMAIL, DEFAULT_DESCRIPTION, SITE_NAME, SITE_NAME_ALT, SITE_TAGLINE, SITE_URL } from '@/lib/seo/site'

type JsonLdProps = {
  data: Record<string, unknown> | Record<string, unknown>[]
}

export function JsonLd({ data }: JsonLdProps) {
  const payload = Array.isArray(data) ? data : [data]
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload.length === 1 ? payload[0] : payload) }}
    />
  )
}

export function OrganizationJsonLd() {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: SITE_NAME,
        alternateName: SITE_NAME_ALT,
        '@id': `${SITE_URL}/#organization`,
        url: SITE_URL,
        logo: `${SITE_URL}/logo.svg`,
        description: DEFAULT_DESCRIPTION,
        email: CONTACT_EMAIL,
        areaServed: ['UG', 'KE', 'TZ', 'RW', 'Africa', 'Worldwide'],
        sameAs: [],
      }}
    />
  )
}

export function WebSiteJsonLd() {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: SITE_NAME,
        alternateName: SITE_NAME_ALT,
        url: SITE_URL,
        description: DEFAULT_DESCRIPTION,
        inLanguage: 'en',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${SITE_URL}/?query={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      }}
    />
  )
}

/** Declares the homepage as the primary entity for brand searches. */
export function HomePageJsonLd() {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        '@id': `${SITE_URL}/#homepage`,
        url: SITE_URL,
        name: SITE_NAME,
        description: DEFAULT_DESCRIPTION,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${SITE_URL}/#organization` },
        inLanguage: 'en',
      }}
    />
  )
}

export function BreadcrumbJsonLd({ items }: { items: { name: string; path: string }[] }) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: `${SITE_URL}${item.path.startsWith('/') ? item.path : `/${item.path}`}`,
        })),
      }}
    />
  )
}

export function ProductJsonLd({
  name,
  description,
  image,
  url,
  price,
  currency = 'USD',
  availability = 'InStock',
  brand,
}: {
  name: string
  description: string
  image?: string | string[]
  url: string
  price?: number
  currency?: string
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder'
  brand?: string
}) {
  const images = image ? (Array.isArray(image) ? image : [image]) : undefined
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'Product',
        name,
        description: description.slice(0, 5000),
        ...(images?.length ? { image: images } : {}),
        url,
        ...(brand ? { brand: { '@type': 'Brand', name: brand } } : {}),
        ...(typeof price === 'number' && price > 0
          ? {
              offers: {
                '@type': 'Offer',
                priceCurrency: currency,
                price: String(price),
                availability: `https://schema.org/${availability}`,
                url,
              },
            }
          : {}),
      }}
    />
  )
}

export function ArticleJsonLd({
  title,
  description,
  url,
  image,
  datePublished,
  dateModified,
  authorName,
}: {
  title: string
  description: string
  url: string
  image?: string
  datePublished?: string
  dateModified?: string
  authorName?: string
}) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: title,
        description: description.slice(0, 5000),
        url,
        mainEntityOfPage: url,
        ...(image ? { image: [image] } : {}),
        ...(datePublished ? { datePublished } : {}),
        ...(dateModified ? { dateModified } : {}),
        author: {
          '@type': 'Person',
          name: authorName ?? SITE_NAME,
        },
        publisher: {
          '@type': 'Organization',
          name: SITE_NAME,
          logo: {
            '@type': 'ImageObject',
            url: `${SITE_URL}/logo.svg`,
          },
        },
      }}
    />
  )
}

export function FAQPageJsonLd({ faqs }: { faqs: { question: string; answer: string }[] }) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      }}
    />
  )
}
