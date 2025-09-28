// StorePage.tsx (Server Component) - PERFORMANCE OPTIMIZED VERSION

import React from 'react';
import { getStoreBySlug } from '@/lib/store-service';
import StoreClient from './StoreClient';
import { Metadata } from 'next';

interface StorePageProps {
  params: { slug: string };
}

// Request-scoped promise cache to prevent duplicate fetches within the same request cycle
const storePromiseCache = new Map<string, { promise: Promise<any>; timestamp: number }>();

// Cache cleanup interval (5 minutes)
const PROMISE_CACHE_TTL = 5 * 60 * 1000;

// Helper function to get or create store promise with request-scoped caching
function getStorePromise(slug: string) {
  const now = Date.now();
  const cacheKey = slug;
  
  // Check if we have a valid cached promise
  const cached = storePromiseCache.get(cacheKey);
  if (cached && (now - cached.timestamp) < PROMISE_CACHE_TTL) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[PROMISE CACHE] Cache hit for slug: ${slug}`);
    }
    return cached.promise;
  }
  
  // Create new promise and cache it
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[PROMISE CACHE] Creating new promise for slug: ${slug}`);
  }
  
  const promise = getStoreBySlug(slug);
  storePromiseCache.set(cacheKey, { promise, timestamp: now });
  
  // Clean up expired entries on every request for optimal cache performance
  const entries = Array.from(storePromiseCache.entries());
  for (const [key, value] of entries) {
    if (now - value.timestamp > PROMISE_CACHE_TTL) {
      storePromiseCache.delete(key);
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[PROMISE CACHE] Cleaned expired entry: ${key}`);
      }
    }
  }
  
  return promise;
}

export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  try {
    // ✅ Production-safe logging
    if (process.env.NODE_ENV !== 'production') {
      console.log('=== GENERATE METADATA START ===');
      console.log('Params slug:', params.slug);
    }
    
    // ✅ Use shared promise to prevent duplicate fetch
    const store = await getStorePromise(params.slug);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('Store data received:', !!store);
    }
    
    if (!store) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('Store not found, returning error metadata');
      }
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
    if (process.env.NODE_ENV !== 'production') {
      console.log('Raw store object:', JSON.stringify(store, null, 2));
    }

    // Debug logging for SEO fields
    if (process.env.NODE_ENV !== 'production') {
      console.log('=== GENERATE METADATA DEBUG START ===');
      console.log('Store slug:', params.slug);
      console.log('Raw store.seo object:', JSON.stringify(store?.seo, null, 2));
      console.log('Raw store.seo.meta_title:', store?.seo?.meta_title);
      console.log('Raw store.seo.meta_description:', store?.seo?.meta_description);
      console.log('Raw store.seo.meta_keywords:', store?.seo?.meta_keywords);
      console.log('Store name fallback:', store?.name);
      console.log('Store short_description fallback:', store?.short_description);
    }

    // Helper function to clean text
    const cleanText = (text: string | null | undefined): string => {
      if (!text || typeof text !== 'string') return '';
      const cleaned = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
      if (process.env.NODE_ENV !== 'production') {
        console.log(`cleanText input: "${text}" -> output: "${cleaned}"`);
      }
      return cleaned;
    };

    // Helper function to check if a string is truly empty or just whitespace
    const isEmptyOrWhitespace = (text: string | null | undefined): boolean => {
      return !text || typeof text !== 'string' || text.trim() === '';
    };

    // Get title with proper prioritization
    let finalTitle: string;
    if (!isEmptyOrWhitespace(store?.seo?.meta_title)) {
      finalTitle = cleanText(store.seo.meta_title);
      if (process.env.NODE_ENV !== 'production') {
        console.log('Using SEO meta_title:', finalTitle);
      }
    } else {
      finalTitle = cleanText(store?.name) || 'Store Not Found';
      if (process.env.NODE_ENV !== 'production') {
        console.log('Using store name fallback:', finalTitle);
      }
    }

    // Get description with proper prioritization
    let description: string;
    if (!isEmptyOrWhitespace(store?.seo?.meta_description)) {
      description = cleanText(store.seo.meta_description);
      if (process.env.NODE_ENV !== 'production') {
        console.log('Using SEO meta_description:', description);
      }
    } else {
      description = cleanText(store?.short_description) || 'Fallback description';
      if (process.env.NODE_ENV !== 'production') {
        console.log('Using short_description fallback:', description);
      }
    }

    // Get keywords with proper prioritization
    let keywords: string;
    if (!isEmptyOrWhitespace(store?.seo?.meta_keywords)) {
      keywords = cleanText(store.seo.meta_keywords);
      if (process.env.NODE_ENV !== 'production') {
        console.log('Using SEO meta_keywords:', keywords);
      }
    } else {
      keywords = `${store?.name} discount codes, ${store?.name} coupons, ${store?.name} deals, savings, exclusive offers`;
      if (process.env.NODE_ENV !== 'production') {
        console.log('Using generated keywords fallback:', keywords);
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('Final metadata values:');
      console.log('- Title:', finalTitle);
      console.log('- Description:', description);
      console.log('- Keywords:', keywords);
      console.log('=== GENERATE METADATA DEBUG END ===');
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
  // ✅ Production-safe logging
  if (process.env.NODE_ENV !== 'production') {
    console.log('=== STORE PAGE COMPONENT DEBUG START ===');
    console.log('Fetching data for slug:', params.slug);
  }
  
  // ✅ Use shared promise to prevent duplicate fetch
  const store = await getStorePromise(params.slug);
  
  if (process.env.NODE_ENV !== 'production') {
    console.log('Store data received in component:', !!store);
  }
  
  if (!store) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Store not found in component');
    }
    return (
      <StoreClient 
        initialStore={null} 
        serverError="Store not found"
      />
    );
  }
  
  if (process.env.NODE_ENV !== 'production') {
    console.log('Initial store data for StoreClient:', JSON.stringify(store, null, 2));
    console.log('Initial store SEO data:', JSON.stringify(store?.seo, null, 2));
    console.log('=== STORE PAGE COMPONENT DEBUG END ===');
  }
  
  return (
    <StoreClient 
      initialStore={store} 
      serverError={undefined}
    />
  );
}