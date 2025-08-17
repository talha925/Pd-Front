// StorePage.tsx (Server Component)

import React from 'react';
import { fetchStoreServer } from '@/lib/serverData'; // Make sure you have this function
import StoreClient from './StoreClient';
import { Metadata } from 'next';

interface StorePageProps {
  params: { id: string };
}

// Generate metadata for SEO (fetch data once)
export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  const result = await fetchStoreServer(params.id); // Fetch the data once
  
  if (result.error) {
    return {
      title: 'Store Not Found',
      description: 'This store does not exist.',
      openGraph: {
        title: 'Store Not Found',
        description: 'This store does not exist.',
      },
    };
  }

  const store = result.data;
  return {
    title: store ? `${store.name} - Deals & Coupons` : 'Store Not Found',
    description: store?.short_description || store?.about || `Find the best deals and coupons for ${store?.name || 'this store'}`,
    openGraph: {
      title: store ? `${store.name} - Deals & Coupons` : 'Store Not Found',
      description: store?.short_description || store?.about || `Find the best deals and coupons for ${store?.name || 'this store'}`,
      images: store?.image?.url ? [{ url: store.image.url, alt: store.image.alt || store.name }] : [],
    },
  };
}

// Server Component - fetches initial data with ISR
export default async function StorePage({ params }: StorePageProps) {
  const result = await fetchStoreServer(params.id); // Fetch the data for the page
  
  if (result.error) {
    return (
      <StoreClient 
        initialStore={null} 
        serverError="Store not found"
      />
    );
  }

  const initialStore = result.data;
  return (
    <StoreClient 
      initialStore={initialStore} 
      serverError={result.error || undefined}
    />
  );
}
