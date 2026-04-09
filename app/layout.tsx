import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/lib/auth-context'
import { AppShellWithMenu } from '@/components/app-shell-with-menu'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://southcaravan.com'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans-next',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'SouthCaravan - B2B Vendor Management',
  description: 'Professional B2B vendor management platform for streamlined procurement and supply chain management',
  generator: 'v0.app',
  icons: {
    // Include favicon.ico for browsers that request it early on first load.
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon' },
      { url: '/icon1.png', type: 'image/png' },
      { url: '/logo.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/apple-icon.png', type: 'image/png' }],
    shortcut: '/favicon.ico',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://southcaravan.com',
    siteName: 'SouthCaravan',
    title: 'SouthCaravan - B2B Vendor Management',
    description: 'Professional B2B vendor management platform for streamlined procurement',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'SouthCaravan' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SouthCaravan - B2B Vendor Management',
    description: 'Professional B2B vendor management platform for streamlined procurement and supply chain management',
    images: ['/twitter-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={[
          inter.variable,
          'font-sans antialiased bg-background text-foreground flex flex-col min-h-screen',
        ].join(' ')}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <AppShellWithMenu>{children}</AppShellWithMenu>
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
