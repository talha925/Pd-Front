import React from 'react';
import { StoreGrid } from '@/components/store';
import { fetchStoresServer } from '@/lib/serverData';
import { StoresClient } from './StoresClient';

// Server Component - fetches initial data
export default async function StorePage() {
  // Fetch data server-side
  const { data: initialStores, error: serverError } = await fetchStoresServer();
  
  return (
    <StoresClient 
      initialStores={initialStores} 
      serverError={serverError} 
    />
  );
}
