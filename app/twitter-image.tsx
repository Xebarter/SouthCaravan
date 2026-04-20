import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'SouthCaravan'
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
          <div style={{ fontSize: 52, fontWeight: 900, letterSpacing: -1.6, lineHeight: 1.05 }}>
            SouthCaravan
          </div>
          <div style={{ fontSize: 30, opacity: 0.92 }}>
            Professional B2B vendor management platform
          </div>
          <div style={{ fontSize: 22, opacity: 0.85 }}>southcaravan.com</div>
        </div>
      </div>
    ),
    size,
  )
}

