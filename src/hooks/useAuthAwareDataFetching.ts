'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';

interface UseAuthAwareDataFetchingOptions<T> {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  skipAuth?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  autoFetch?: boolean;
  dependencies?: any[];
  debug?: boolean;
  initialData?: T | null; // Server-side initial data
  refetchOnAuthReady?: boolean; // Whether to refetch when auth becomes ready
}

interface UseAuthAwareDataFetchingReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  mutate: (newData: T) => void;
  isInitialized: boolean; // Whether auth is ready and initial fetch is complete
}

// Request deduplication cache
const requestCache = new Map<string, Promise<any>>();

export function useAuthAwareDataFetching<T = any>({
  url,
  method = 'GET',
  body,
  headers = {},
  skipAuth = false,
  onSuccess,
  onError,
  autoFetch = true,
  dependencies = [],
  debug = false,
  initialData = null,
  refetchOnAuthReady = true,
}: UseAuthAwareDataFetchingOptions<T>): UseAuthAwareDataFetchingReturn<T> {
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const fetchCountRef = useRef(0);
  const hasInitializedRef = useRef(false);
  
  const { addNotification, setLoading: setGlobalLoading } = useApp();
  const { token, isAuthenticated, isLoading: authLoading } = useAuth();

  const fetchData = useCallback(async () => {
    // Don't fetch if auth is still loading and we need auth
    if (!skipAuth && authLoading) {
      if (debug) {
        console.log(`[useAuthAwareDataFetching] Skipping fetch for ${url} - auth still loading`);
      }
      return;
    }

    // Debug logging
    if (debug) {
      fetchCountRef.current += 1;
      console.log(`[useAuthAwareDataFetching] Fetch #${fetchCountRef.current} for ${url}`, {
        method,
        body,
        headers,
        authLoading,
        isAuthenticated,
        hasToken: !!token
      });
    }

    // Create a unique key for this request
    const requestKey = `${method}:${url}:${JSON.stringify(body)}:${JSON.stringify(headers)}`;
    
    // Check if there's already a pending request for this key
    if (requestCache.has(requestKey)) {
      if (debug) {
        console.log(`[useAuthAwareDataFetching] Using cached request for ${url}`);
      }
      const cachedPromise = requestCache.get(requestKey);
      if (cachedPromise) {
        try {
          const result = await cachedPromise;
          setData(result);
          setIsInitialized(true);
          return;
        } catch (error) {
          // If cached request failed, continue with new request
          requestCache.delete(requestKey);
        }
      }
    }

    // Abort previous request if it exists
    if (abortControllerRef.current) {
      if (debug) {
        console.log(`[useAuthAwareDataFetching] Aborting previous request for ${url}`);
      }
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setLoading(true);
      setError(null);
      setGlobalLoading(true);

      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers,
      };

      if (!skipAuth && isAuthenticated && token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      }

      const requestOptions: RequestInit = {
        method,
        headers: requestHeaders,
        signal: controller.signal,
      };

      if (body && method !== 'GET') {
        requestOptions.body = JSON.stringify(body);
      }

      // Create the fetch promise and cache it
      const fetchPromise = fetch(url, requestOptions).then(async (response) => {
        // Check if request was aborted
        if (controller.signal.aborted) {
          throw new Error('Request aborted');
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'An error occurred' }));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        return response.json();
      });

      // Cache the promise
      requestCache.set(requestKey, fetchPromise);

      const result = await fetchPromise;
      
      // Remove from cache after successful completion
      requestCache.delete(requestKey);
      
      setData(result);
      setIsInitialized(true);
      onSuccess?.(result);

      // Show success notification for non-GET requests
      if (method !== 'GET') {
        addNotification({
          type: 'success',
          title: 'Success',
          message: 'Operation completed successfully',
          duration: 3000,
        });
      }

      if (debug) {
        console.log(`[useAuthAwareDataFetching] Successfully fetched ${url}`, result);
      }
    } catch (err) {
      // Clean up cache on error
      requestCache.delete(requestKey);
      
      // Don't show error if request was aborted
      if (err instanceof Error && err.name === 'AbortError') {
        if (debug) {
          console.log(`[useAuthAwareDataFetching] Request aborted for ${url}`);
        }
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      setIsInitialized(true);
      onError?.(errorMessage);

      // Show error notification
      addNotification({
        type: 'error',
        title: 'Error',
        message: errorMessage,
        duration: 5000,
      });

      if (debug) {
        console.error(`[useAuthAwareDataFetching] Error fetching ${url}:`, errorMessage);
      }
    } finally {
      setLoading(false);
      setGlobalLoading(false);
      abortControllerRef.current = null;
    }
  }, [url, method, body, headers, skipAuth, isAuthenticated, token, onSuccess, onError, addNotification, setGlobalLoading, debug, authLoading]);

  const mutate = useCallback((newData: T) => {
    setData(newData);
  }, []);

  // Memoize dependencies to prevent unnecessary re-renders
  const stableDependencies = useRef(dependencies);
  stableDependencies.current = dependencies;

  // Effect to handle initial fetch and auth-ready refetch
  useEffect(() => {
    if (!autoFetch) return;

    // If we have initial data and haven't initialized yet, mark as initialized
    if (initialData && !hasInitializedRef.current) {
      setIsInitialized(true);
      hasInitializedRef.current = true;
    }

    // If auth is loading, wait for it to complete
    if (!skipAuth && authLoading) {
      if (debug) {
        console.log(`[useAuthAwareDataFetching] Waiting for auth to load for ${url}`);
      }
      return;
    }

    // If auth just became ready and we should refetch, do it
    if (refetchOnAuthReady && !authLoading && !hasInitializedRef.current) {
      if (debug) {
        console.log(`[useAuthAwareDataFetching] Auth ready, fetching ${url}`);
      }
      fetchData();
      hasInitializedRef.current = true;
      return;
    }

    // Normal auto-fetch behavior
    if (!hasInitializedRef.current) {
      fetchData();
      hasInitializedRef.current = true;
    }
  }, [fetchData, autoFetch, authLoading, skipAuth, refetchOnAuthReady, initialData, debug]);

  // Cleanup effect to abort pending requests on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    mutate,
    isInitialized,
  };
}

// Specialized hooks for common operations
export function useAuthAwareGet<T = any>(
  url: string, 
  options?: Omit<UseAuthAwareDataFetchingOptions<T>, 'url' | 'method'>
) {
  return useAuthAwareDataFetching<T>({ url, method: 'GET', ...options });
}

export function useAuthAwarePost<T = any>(
  url: string, 
  body?: any, 
  options?: Omit<UseAuthAwareDataFetchingOptions<T>, 'url' | 'method' | 'body'>
) {
  return useAuthAwareDataFetching<T>({ url, method: 'POST', body, ...options });
}

export function useAuthAwarePut<T = any>(
  url: string, 
  body?: any, 
  options?: Omit<UseAuthAwareDataFetchingOptions<T>, 'url' | 'method' | 'body'>
) {
  return useAuthAwareDataFetching<T>({ url, method: 'PUT', body, ...options });
}

export function useAuthAwareDelete<T = any>(
  url: string, 
  options?: Omit<UseAuthAwareDataFetchingOptions<T>, 'url' | 'method'>
) {
  return useAuthAwareDataFetching<T>({ url, method: 'DELETE', ...options });
} 