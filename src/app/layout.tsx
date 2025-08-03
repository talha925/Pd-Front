import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { cookies } from 'next/headers'
import Header from '@/components/Header'
import { Providers } from '@/context/Providers'
import ErrorBoundary from '@/components/ErrorBoundary'
import dynamic from 'next/dynamic'

// Dynamically import performance monitoring component
const PerformanceMonitor = dynamic(
  () => import('@/components/ui/PerformanceMonitor'),
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
    default: 'Brandwell',
    template: '%s | Brandwell'
  },
  description: 'Brandwell - Your Coupon and Blog Platform for exclusive deals and insightful content',
  keywords: ['coupons', 'deals', 'blogs', 'discounts', 'savings', 'brandwell'],
  authors: [{ name: 'Brandwell Team' }],
  creator: 'Brandwell',
  publisher: 'Brandwell',
  formatDetection: {
    email: false,
    telephone: false,
    address: false,
  },
  metadataBase: new URL('https://brandwell.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Brandwell',
    description: 'Your Coupon and Blog Platform for exclusive deals and insightful content',
    url: 'https://brandwell.com',
    siteName: 'Brandwell',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Brandwell - Your Coupon and Blog Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Brandwell',
    description: 'Your Coupon and Blog Platform for exclusive deals and insightful content',
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
          href={process.env.NEXT_PUBLIC_API_BASE_URL || "https://coupon-app-backend.vercel.app"}
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
      <body className={`${inter.className} bg-gray-900 text-white`}>
        <ErrorBoundary>
          <Providers initialToken={initialToken}>
            <Header />
            {children}
            {/* Monitor performance metrics */}
            <PerformanceMonitor />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  )
}
