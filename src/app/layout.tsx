import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { cookies } from 'next/headers'
import Header from '@/components/Header'
import ConditionalFooter from '@/components/ConditionalFooter'
import { Providers } from '@/context/Providers'
import ErrorBoundary from '@/components/ErrorBoundary'
import dynamic from 'next/dynamic'
import config from '@/lib/config'

// Dynamically import performance monitoring components
const PerformanceMonitor = dynamic(
  () => import('@/components/ui/PerformanceMonitor'),
  { ssr: false }
)

const PerformanceTracker = dynamic(
  () => import('@/components/ui/PerformanceTracker'),
  { ssr: false }
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
      </head>
      <body className={inter.className}>
        <Providers initialToken={initialToken}>
          <ErrorBoundary>
            <Header />
            {children}
            <ConditionalFooter />
            {/* Monitor performance metrics */}
            <PerformanceMonitor />
            <PerformanceTracker />
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  )
}
