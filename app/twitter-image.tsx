import { ImageResponse } from 'next/og'

import { SITE_HOME_TITLE, SITE_TAGLINE } from '@/lib/seo/site'

export const runtime = 'edge'

export const alt = SITE_HOME_TITLE
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0b1620 0%, #0a3f3a 44%, #0c1220 100%)',
          color: '#ffffff',
          padding: 80,
        }}
      >
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ fontSize: 44, fontWeight: 900, letterSpacing: -1.4, lineHeight: 1.1 }}>
            {SITE_HOME_TITLE}
          </div>
          <div style={{ fontSize: 28, opacity: 0.92, marginTop: 8 }}>
            {SITE_TAGLINE}
          </div>
          <div style={{ fontSize: 22, opacity: 0.85 }}>southcaravan.com</div>
        </div>
      </div>
    ),
    size,
  )
}

