import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { cookies } from 'next/headers'
import Header from '@/components/Header'
import { Providers } from '@/context/Providers'
import ErrorBoundary from '@/components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Brandwell',
  description: 'Brandwell - Your Coupon and Blog Platform',
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
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ErrorBoundary>
          <Providers initialToken={initialToken}>
            <Header />
            {children}
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  )
}
