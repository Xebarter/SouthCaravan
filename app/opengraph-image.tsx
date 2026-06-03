import { ImageResponse } from 'next/og'

import { SITE_NAME, SITE_SUBTAGLINE, SITE_TAGLINE } from '@/lib/seo/site'

export const runtime = 'edge'

export const alt = SITE_NAME
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default function OpenGraphImage() {
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
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 22,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 18,
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                background: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 36,
                fontWeight: 700,
              }}
            >
              SC
            </div>
            <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: -1 }}>{SITE_NAME}</div>
          </div>

          <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.08 }}>
            {SITE_TAGLINE}
          </div>
          <div style={{ fontSize: 26, opacity: 0.9, maxWidth: 900, lineHeight: 1.3 }}>
            {SITE_SUBTAGLINE}
          </div>

          <div
            style={{
              marginTop: 12,
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            {['Catalog', 'RFQs', 'Wholesale', 'Verified suppliers'].map((label) => (
              <div
                key={label}
                style={{
                  padding: '10px 14px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.10)',
                  border: '1px solid rgba(255,255,255,0.16)',
                  fontSize: 20,
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  )
}

