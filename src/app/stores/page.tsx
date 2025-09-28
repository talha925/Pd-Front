import React from 'react';
import { StoreGrid } from '@/components/store';
import { fetchStoresServer } from '@/lib/serverData';
import { StoresClient } from './StoresClient';
import type { Metadata } from 'next';

// Enable ISR with 1 hour revalidation
export const revalidate = 3600;

// Generate metadata for SEO
export const metadata: Metadata = {
  title: 'All Stores - Find Your Favorite Brands',
  description: 'Browse all available stores and discover amazing deals from your favorite brands. Find coupons, discounts, and exclusive offers.',
  openGraph: {
    title: 'All Stores - Find Your Favorite Brands',
    description: 'Browse all available stores and discover amazing deals from your favorite brands.',
  },
};

// Server Component - fetches initial data
export default async function StorePage() {
  // Fetch data server-side with caching enabled for ISR
  const { data: initialStores, error: serverError } = await fetchStoresServer({ noCache: false });
  
  return (
    <StoresClient 
      initialStores={initialStores} 
      serverError={serverError} 
    />
  );
}
