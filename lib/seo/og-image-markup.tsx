import { SITE_NAME, SITE_OG_LOGO, SITE_URL } from '@/lib/seo/site'

export const ogImageSize = {
  width: 1200,
  height: 630,
} as const

export const ogImageAlt = SITE_NAME

export function getOgLogoUrl() {
  return `${SITE_URL}${SITE_OG_LOGO}`
}

/** Shared 1200×630 preview: site logo centered on brand background. */
export function OgImageMarkup({ logoUrl = getOgLogoUrl() }: { logoUrl?: string }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0b1620 0%, #0a3f3a 44%, #0c1220 100%)',
        padding: 80,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 28,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt=""
          width={360}
          height={360}
          style={{
            objectFit: 'contain',
          }}
        />
        <div
          style={{
            fontSize: 52,
            fontWeight: 800,
            letterSpacing: -1.2,
            color: '#ffffff',
            textAlign: 'center',
          }}
        >
          {SITE_NAME}
        </div>
      </div>
    </div>
  )
}
