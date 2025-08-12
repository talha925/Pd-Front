'use client';

import React from 'react';
import { StoreGrid } from '@/components/store';
import { useUnifiedDataFetching } from '@/hooks/useUnifiedDataFetching';
import { Store } from '@/lib/types/store';

interface StoresClientProps {
  initialStores: Store[];
  serverError: string | null;
}

export function StoresClient({ initialStores, serverError }: StoresClientProps) {
  // Use unified data fetching with server-side initial data
  const { 
    data, 
    isLoading: loading, 
    error, 
    isInitialized 
  } = useUnifiedDataFetching('/api/proxy-stores', {
    method: 'GET',
    requireAuth: true,
    autoFetch: true,
    cacheKey: 'stores-list',
    cacheTTL: 5 * 60 * 1000, // 5 minutes
    debug: false, // Disable debug in production
    onSuccess: (data) => {
      // Handle successful data fetch
    }
  });

  // Use server data initially, then client data once initialized
  const stores = data?.data || initialStores;
  const finalError = error?.message || serverError;
  const isLoading = loading; // Show loading state

  return (
    <StoreGrid 
      stores={stores} 
      loading={isLoading} 
      error={finalError} 
    />
  );
}