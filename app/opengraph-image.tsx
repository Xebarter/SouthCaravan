import { ImageResponse } from 'next/og'

import { OgImageMarkup, ogImageAlt, ogImageSize } from '@/lib/seo/og-image-markup'

export const runtime = 'edge'

export const alt = ogImageAlt
export const size = ogImageSize
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(<OgImageMarkup />, size)
}
