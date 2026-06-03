/** Canonical production URL — override with NEXT_PUBLIC_SITE_URL in env. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://southcaravan.com').replace(/\/$/, '')

export const SITE_NAME = 'South Caravan'
export const SITE_NAME_ALT = 'SouthCaravan'

export const SITE_TAGLINE = 'B2B marketplace connecting buyers and suppliers across Africa and the world'

export const DEFAULT_DESCRIPTION =
  'South Caravan is a B2B marketplace for wholesale trade, verified suppliers, RFQs, and cross-border sourcing. Connect with Uganda, East Africa, and global exporters on one trusted platform.'

export const DEFAULT_OG_IMAGE = '/opengraph-image'

export const TWITTER_HANDLE = '@southcaravan'

export const CONTACT_EMAIL = 'hello@southcaravan.com'

export const LOCALE = 'en_US'

export const GEO_REGION = 'UG'
export const GEO_PLACENAME = 'Kampala, Uganda'
