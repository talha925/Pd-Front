'use client';

import React from 'react';
import { CategoryGrid } from '@/components/category';
import { useAuthAwareGet } from '@/hooks/useAuthAwareDataFetching';
import { Category } from '@/lib/types/category';

interface CategoriesClientProps {
  initialCategories: Category[];
  serverError: string | null;
}

export function CategoriesClient({ initialCategories, serverError }: CategoriesClientProps) {
  // Use auth-aware data fetching with server-side initial data
  const { 
    data, 
    loading, 
    error, 
    isInitialized 
  } = useAuthAwareGet('/api/proxy-categories', {
    initialData: { data: { categories: initialCategories } },
    refetchOnAuthReady: true, // Refetch when auth becomes ready
    debug: false, // Disable debug in production
  });

  // Use server data initially, then client data once initialized
  const categories = isInitialized ? (data?.data?.categories || []) : initialCategories;
  const finalError = isInitialized ? error : serverError;
  const isLoading = loading && isInitialized; // Only show loading after auth is ready

  return (
    <CategoryGrid 
      categories={categories} 
      loading={isLoading} 
      error={finalError} 
    />
  );
} 