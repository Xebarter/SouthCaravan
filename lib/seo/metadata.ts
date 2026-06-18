import type { Metadata } from 'next'

import { PRIMARY_META_KEYWORDS } from '@/lib/seo/keywords'
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  LOCALE,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  SITE_HOME_TITLE,
  SITE_NAME,
  SITE_NAME_ALT,
  SITE_TAGLINE,
  SITE_URL,
  TWITTER_HANDLE,
} from '@/lib/seo/site'

export type PageMetadataOptions = {
  title: string
  description?: string
  path?: string
  keywords?: string[]
  noIndex?: boolean
  ogType?: 'website' | 'article'
  publishedTime?: string
  modifiedTime?: string
  authors?: string[]
}

function absoluteUrl(path: string) {
  if (path.startsWith('http')) return path
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${SITE_URL}${normalized}`
}

function buildTitle(title: string) {
  const t = title.trim()
  if (t.toLowerCase().includes('south caravan') || t.toLowerCase().includes('southcaravan')) {
    return t
  }
  return `${t} | ${SITE_NAME}`
}

/** Same logo-based preview on every public page. */
function getSiteOgImages() {
  const url = absoluteUrl(DEFAULT_OG_IMAGE)
  return {
    openGraph: [{ url, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT, alt: SITE_NAME }],
    twitter: [url],
  }
}

/** Pages that must never compete with the homepage in search results. */
export function createNoIndexMetadata(title: string): Metadata {
  return {
    title: buildTitle(title),
    robots: {
      index: false,
      follow: false,
      googleBot: { index: false, follow: false, noimageindex: true },
    },
  }
}

/** Filtered /categories views: noindex with canonical pointing at browse-all. */
export function createCategoryDrillDownMetadata(categoryLabel: string): Metadata {
  const canonical = absoluteUrl('/categories')
  const { openGraph: ogImages, twitter: twitterImages } = getSiteOgImages()
  return {
    ...createNoIndexMetadata(categoryLabel),
    alternates: { canonical },
    openGraph: { url: canonical, images: ogImages },
    twitter: { images: twitterImages },
  }
}

export function createPageMetadata(options: PageMetadataOptions): Metadata {
  const description = (options.description ?? DEFAULT_DESCRIPTION).trim()
  const canonical = options.path ? absoluteUrl(options.path) : SITE_URL
  const { openGraph: ogImages, twitter: twitterImages } = getSiteOgImages()
  const keywords = [...new Set([...(options.keywords ?? []), ...PRIMARY_META_KEYWORDS])].slice(0, 50)

  const robots = options.noIndex
    ? { index: false, follow: false }
    : {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large' as const,
          'max-snippet': -1,
        },
      }

  return {
    title: buildTitle(options.title),
    description,
    keywords,
    authors: options.authors?.map((name) => ({ name, url: SITE_URL })),
    creator: SITE_NAME,
    publisher: SITE_NAME,
    applicationName: SITE_NAME_ALT,
    category: 'business',
    alternates: {
      canonical,
    },
    openGraph: {
      type: options.ogType ?? 'website',
      locale: LOCALE,
      url: canonical,
      siteName: SITE_NAME,
      title: buildTitle(options.title),
      description,
      images: ogImages,
      ...(options.publishedTime ? { publishedTime: options.publishedTime } : {}),
      ...(options.modifiedTime ? { modifiedTime: options.modifiedTime } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      site: TWITTER_HANDLE,
      creator: TWITTER_HANDLE,
      title: buildTitle(options.title),
      description,
      images: twitterImages,
    },
    robots,
    metadataBase: new URL(SITE_URL),
  }
}

export const rootMetadata: Metadata = {
  ...createPageMetadata({
    title: SITE_HOME_TITLE,
    description: DEFAULT_DESCRIPTION,
    path: '/',
    keywords: PRIMARY_META_KEYWORDS,
  }),
  manifest: '/manifest.webmanifest',
  other: {
    'geo.region': 'UG',
    'geo.placename': 'Kampala',
    'application-name': SITE_NAME_ALT,
    'apple-mobile-web-app-title': SITE_NAME_ALT,
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
}

export { SITE_HOME_TITLE, SITE_TAGLINE, DEFAULT_DESCRIPTION, SITE_URL, SITE_NAME }
