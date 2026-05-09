import './globals.css'
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { cookies } from 'next/headers'
import Header from '@/components/Header'
import ConditionalFooter from '@/components/ConditionalFooter'
import { Providers } from '@/context/Providers'
import ErrorBoundary from '@/components/ErrorBoundary'
import dynamic from 'next/dynamic'
import config from '@/lib/config'

// Dynamically import WebSocket components for real-time functionality
const RealTimeUpdates = dynamic(
  () => import('@/components/common/RealTimeUpdates').then(mod => ({ default: mod.RealTimeUpdates })),
  {
    ssr: false,
    loading: () => null
  }
)

// Load Inter font with display: swap for better performance
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
})

// Enhanced metadata for better SEO
export const metadata: Metadata = {
  title: {
    default: "Penny Scroll - Discover the Best Deals, Reviews, and Lifestyle Tips",
    template: "%s | Penny Scroll"
  },
  description: "Your ultimate guide to smart shopping and better living. Discover amazing deals, expert reviews, travel tips, health advice, and lifestyle inspiration at Penny Scroll.",
  keywords: ['deals', 'reviews', 'lifestyle tips', 'travel', 'health', 'wellness', 'fashion', 'technology', 'smart shopping', 'pennyscroll'],
  authors: [{ name: "Penny Scroll Team" }],
  creator: "Penny Scroll",
  publisher: "Penny Scroll",
  formatDetection: {
    email: false,
    telephone: false,
    address: false,
  },
  // Explicitly set icons to override any default favicon
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: ['/favicon.svg'],
    apple: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
  },
  metadataBase: new URL('https://www.pennyscroll.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Penny Scroll - Discover the Best Deals, Reviews, and Lifestyle Tips",
    description: "Your ultimate guide to smart shopping and better living. Discover amazing deals, expert reviews, travel tips, health advice, and lifestyle inspiration.",
    url: 'https://www.pennyscroll.com',
    siteName: "Penny Scroll",
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: "Penny Scroll - Your ultimate guide to smart shopping and better living",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Penny Scroll - Discover the Best Deals, Reviews, and Lifestyle Tips",
    description: "Your ultimate guide to smart shopping and better living. Discover amazing deals, expert reviews, travel tips, health advice, and lifestyle inspiration.",
    images: ['/images/twitter-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: "Lz5ILa9zCmzuTvlPRQr1DEan6HB4UXEyIHxMmY5OWwQ",
  },
}



export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Server-side cookie reading for SSR hydration
  const cookieStore = cookies()
  const initialToken = cookieStore.get('authToken')?.value ?? null

  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        {/* Impact Site Verifications*/}
        {/* @ts-ignore - 'value' is a custom attribute required by Impact  */}
        {/* <meta name="impact-site-verification" value="cec0f8fd-5fdc-4b05-946e-082045c985d2" /> */}
        <meta name="impact-site-verification" {...({ value: "cec0f8fd-5fdc-4b05-946e-082045c985d2" } as any)} />
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-EEDR5X7C4S"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-EEDR5X7C4S');
              gtag('event', 'conversion', {
                  'send_to': 'AW-17582430046/iCXoCKrCu-cbEN6u-r9B',
                  'value': 1.0,
                  'currency': 'USD'
              });
            `,
          }}
        />
        {/* Preconnect to API domain */}
        <link
          rel="preconnect"
          href={config.api.baseUrl}
          crossOrigin="anonymous"
        />
        {/* Preconnect to Google Fonts */}
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* Standard favicon */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className={inter.className}>
        <Providers initialToken={initialToken}>
          <ErrorBoundary>
            <Header />
            {children}
            <ConditionalFooter />
            {/* Performance monitoring is available in admin dashboard only */}
            {/* Real-time updates notifications */}
            <RealTimeUpdates />
            <SpeedInsights />
            <Analytics />
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  )
}
