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
    formats: ['image/avif', 'image/webp'],
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
