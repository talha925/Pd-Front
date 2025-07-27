'use client';

import React from 'react';
import { StoreGrid } from '@/components/store';
import { useAuthAwareGet } from '@/hooks/useAuthAwareDataFetching';
import { Store } from '@/lib/types/store';

interface StoresClientProps {
  initialStores: Store[];
  serverError: string | null;
}

export function StoresClient({ initialStores, serverError }: StoresClientProps) {
  // Use auth-aware data fetching with server-side initial data
  const { 
    data, 
    loading, 
    error, 
    isInitialized 
  } = useAuthAwareGet('/api/proxy-stores', {
    initialData: { data: initialStores },
    refetchOnAuthReady: true, // Refetch when auth becomes ready
    debug: false, // Disable debug in production
  });

  // Use server data initially, then client data once initialized
  const stores = isInitialized ? (data?.data || []) : initialStores;
  const finalError = isInitialized ? error : serverError;
  const isLoading = loading && isInitialized; // Only show loading after auth is ready

  return (
    <StoreGrid 
      stores={stores} 
      loading={isLoading} 
      error={finalError} 
    />
  );
} 