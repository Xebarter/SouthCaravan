/** Canonical production URL — override with NEXT_PUBLIC_SITE_URL in env. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://southcaravan.com').replace(/\/$/, '')

export const SITE_NAME = 'South Caravan'
export const SITE_NAME_ALT = 'SouthCaravan'

/** Default browser / SEO title (homepage and social default). */
export const SITE_HOME_TITLE = 'South Caravan | Connect Buyers and Suppliers Worldwide'

/** Short hook for OG images, manifest, and UI subcopy. */
export const SITE_TAGLINE = 'Connect buyers and suppliers worldwide'

/** One-line supporting message under the tagline. */
export const SITE_SUBTAGLINE =
  'Wholesale trade, verified partners, and RFQs — from Uganda and Africa to the world.'

/** Meta description & footer blurb (relatable, search-friendly). */
export const DEFAULT_DESCRIPTION =
  'South Caravan connects buyers and suppliers worldwide — discover wholesale products, request quotes, and build trusted trade across Uganda, Africa, and global markets.'

export const DEFAULT_OG_IMAGE = '/opengraph-image'

/** PNG logo for social previews (SVG is poorly supported by OG crawlers). */
export const SITE_OG_LOGO = '/web-app-manifest-512x512.png'

export const OG_IMAGE_WIDTH = 1200
export const OG_IMAGE_HEIGHT = 630

export const TWITTER_HANDLE = '@southcaravan'

export const CONTACT_EMAIL = 'hello@southcaravan.com'

export const LOCALE = 'en_US'

export const GEO_REGION = 'UG'
export const GEO_PLACENAME = 'Kampala, Uganda'
