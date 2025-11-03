// StorePage.tsx (Server Component) - PERFORMANCE OPTIMIZED VERSION

import React from 'react';
import { getStoreBySlug } from '@/lib/store-service';
import StoreClient from './StoreClient';
import { Metadata } from 'next';

// Force dynamic rendering to avoid Next.js caching of this page
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface StorePageProps {
  params: { slug: string };
}

// Helper function to get store data directly from store-service
function getStorePromise(slug: string) {
  return getStoreBySlug(slug);
}

export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  try {
    // Use shared promise to prevent duplicate fetch
    const store = await getStorePromise(params.slug);
    
    if (!store) {
      return {
        title: 'Store Not Found',
        description: 'This store does not exist.',
        openGraph: {
          title: 'Store Not Found',
          description: 'This store does not exist.',
        },
      };
    }
    
    // ✅ Production-safe debug logging
    // Helper function to clean text
    const cleanText = (text: string | null | undefined): string => {
      if (!text || typeof text !== 'string') return '';
      return text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
    };

    // Helper function to check if a string is truly empty or just whitespace
    const isEmptyOrWhitespace = (text: string | null | undefined): boolean => {
      return !text || typeof text !== 'string' || text.trim() === '';
    };

    // Get title with proper prioritization
    let finalTitle: string;
    if (!isEmptyOrWhitespace(store?.seo?.meta_title)) {
      finalTitle = cleanText(store?.seo?.meta_title);
    } else {
      finalTitle = cleanText(store?.name) || 'Store Not Found';
    }

    // Get description with proper prioritization
    let description: string;
    if (!isEmptyOrWhitespace(store?.seo?.meta_description)) {
      description = cleanText(store?.seo?.meta_description);
    } else {
      description = cleanText(store?.short_description) || 'Fallback description';
    }

    // Get keywords with proper prioritization
    let keywords: string;
    if (!isEmptyOrWhitespace(store?.seo?.meta_keywords)) {
      keywords = cleanText(store?.seo?.meta_keywords);
    } else {
      keywords = `${store?.name} discount codes, ${store?.name} coupons, ${store?.name} deals, savings, exclusive offers`;
    }

    return {
      title: finalTitle,
      description,
      keywords,
      openGraph: {
        title: finalTitle,
        description,
        images: store?.image?.url ? [{ url: store.image.url, alt: store.image.alt || `${store.name} Store Image` }] : [],
        url: `https://www.pennyscroll.com/store/${params.slug}`,
        type: 'website',
        siteName: 'Penny Scroll',
      },
      twitter: {
        card: 'summary_large_image',
        title: finalTitle,
        description,
        images: store?.image?.url ? [store.image.url] : [],
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
      alternates: {
        canonical: `https://www.pennyscroll.com/store/${params.slug}`,
      },
    };
  } catch (error) {
    console.error('Error fetching store for metadata:', error);
    return {
      title: 'Store Not Found',
      description: 'This store does not exist.',
      openGraph: {
        title: 'Store Not Found',
        description: 'This store does not exist.',
      },
    };
  }
}

// Server Component - fetches initial data with shared promise
export default async function StorePage({ params }: StorePageProps) {
  // Use shared promise to prevent duplicate fetch
  const store = await getStorePromise(params.slug);
  
  if (!store) {
    return (
      <StoreClient 
        initialStore={null} 
        serverError="Store not found"
      />
    );
  }

  return (
    <StoreClient 
      initialStore={store} 
      serverError={undefined}
    />
  );
}