import type { MetadataRoute } from 'next';

import { SITE_NAME, SITE_SUBTAGLINE, SITE_TAGLINE } from '@/lib/seo/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: 'SouthCaravan',
    description: `${SITE_TAGLINE}. ${SITE_SUBTAGLINE}`,
    icons: [
      {
        src: '/logo.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
    theme_color: '#ffffff',
    background_color: '#ffffff',
    start_url: '/',
    scope: '/',
    display: 'minimal-ui',
  };
}
