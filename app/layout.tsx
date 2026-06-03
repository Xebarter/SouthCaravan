import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Inter } from 'next/font/google'
import { AppShellWithMenu } from '@/components/app-shell-with-menu'
import { OrganizationJsonLd, WebSiteJsonLd } from '@/lib/seo/json-ld'
import { rootMetadata } from '@/lib/seo/metadata'
import './globals.css'

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
  themeColor: '#0a3f3a',
}

export const metadata: Metadata = {
  ...rootMetadata,
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon' },
      { url: '/icon1.png', type: 'image/png' },
      { url: '/logo.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/apple-icon.png', type: 'image/png' }],
    shortcut: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="light" style={{ colorScheme: 'light' }}>
      <body
        className={[
          inter.variable,
          'font-sans antialiased bg-background text-foreground flex flex-col min-h-screen',
        ].join(' ')}
      >
        <OrganizationJsonLd />
        <WebSiteJsonLd />
        <AppShellWithMenu>{children}</AppShellWithMenu>
        <Analytics />
      </body>
    </html>
  )
}
