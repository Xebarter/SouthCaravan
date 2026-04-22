/** @type {import('next').NextConfig} */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseHostname = '';
try {
  supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : '';
} catch {
  supabaseHostname = '';
}

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    return [
      { source: '/landing', destination: '/', permanent: true },
    ];
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Keep Next image optimization enabled for fast, professional loads.
    unoptimized: false,
    // iOS Safari compatibility: avoid serving AVIF from the optimizer.
    // If a browser doesn't support WebP, Next will fall back to the original format.
    formats: ['image/webp'],
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: 'https',
            hostname: supabaseHostname,
            pathname: '/storage/v1/object/public/**',
          },
        ]
      : [],
  },
}

export default nextConfig
