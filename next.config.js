/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['coupon-app-backend.vercel.app', 'coupon-app-image.s3.us-east-1.amazonaws.com', 'cdn.pixabay.com'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Using remotePatterns (recommended approach) instead of domains
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'coupon-app-backend.vercel.app',
      },
      {
        protocol: 'https',
        hostname: 'coupon-app-image.s3.us-east-1.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.pixabay.com',
      },
    ],
  },
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
  // Reduce JavaScript bundle size
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Enable gzip compression
  compress: true,
  // Increase build performance
  swcMinify: true,
  // Optimize fonts
  optimizeFonts: true,
};

// Add bundle analyzer in analyze mode
const withBundleAnalyzer = require('./src/lib/bundle-analyzer');

module.exports = process.env.ANALYZE === 'true' ? withBundleAnalyzer(nextConfig) : nextConfig;