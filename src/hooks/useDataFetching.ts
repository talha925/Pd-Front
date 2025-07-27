'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';

interface UseDataFetchingOptions<T> {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  skipAuth?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  autoFetch?: boolean;
  dependencies?: any[];
  debug?: boolean; // Add debug mode
}

interface UseDataFetchingReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  mutate: (newData: T) => void;
}

// Request deduplication cache
const requestCache = new Map<string, Promise<any>>();

export function useDataFetching<T = any>({
  url,
  method = 'GET',
  body,
  headers = {},
  skipAuth = false,
  onSuccess,
  onError,
  autoFetch = true,
  dependencies = [],
  debug = false, // Default to false
}: UseDataFetchingOptions<T>): UseDataFetchingReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const fetchCountRef = useRef(0); // Track fetch count for debugging
  
  const { addNotification, setLoading: setGlobalLoading } = useApp();
  const { token, isAuthenticated } = useAuth();

  const fetchData = useCallback(async () => {
    // Debug logging
    if (debug) {
      fetchCountRef.current += 1;
      console.log(`[useDataFetching] Fetch #${fetchCountRef.current} for ${url}`, {
        method,
        body,
        headers,
        dependencies: stableDependencies.current
      });
    }

    // Create a unique key for this request
    const requestKey = `${method}:${url}:${JSON.stringify(body)}:${JSON.stringify(headers)}`;
    
    // Check if there's already a pending request for this key
    if (requestCache.has(requestKey)) {
      if (debug) {
        console.log(`[useDataFetching] Using cached request for ${url}`);
      }
      const cachedPromise = requestCache.get(requestKey);
      if (cachedPromise) {
        try {
          const result = await cachedPromise;
          setData(result);
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
        console.log(`[useDataFetching] Aborting previous request for ${url}`);
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
        console.log(`[useDataFetching] Successfully fetched ${url}`, result);
      }
    } catch (err) {
      // Clean up cache on error
      requestCache.delete(requestKey);
      
      // Don't show error if request was aborted
      if (err instanceof Error && err.name === 'AbortError') {
        if (debug) {
          console.log(`[useDataFetching] Request aborted for ${url}`);
        }
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      onError?.(errorMessage);

      // Show error notification
      addNotification({
        type: 'error',
        title: 'Error',
        message: errorMessage,
        duration: 5000,
      });

      if (debug) {
        console.error(`[useDataFetching] Error fetching ${url}:`, errorMessage);
      }
    } finally {
      setLoading(false);
      setGlobalLoading(false);
      abortControllerRef.current = null;
    }
  }, [url, method, body, headers, skipAuth, isAuthenticated, token, onSuccess, onError, addNotification, setGlobalLoading, debug]);

  const mutate = useCallback((newData: T) => {
    setData(newData);
  }, []);

  // Memoize dependencies to prevent unnecessary re-renders
  const stableDependencies = useRef(dependencies);
  stableDependencies.current = dependencies;

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [fetchData, autoFetch]);

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
  };
}

// Specialized hooks for common operations
export function useGet<T = any>(url: string, options?: Omit<UseDataFetchingOptions<T>, 'url' | 'method'>) {
  return useDataFetching<T>({ url, method: 'GET', ...options });
}

export function usePost<T = any>(url: string, body?: any, options?: Omit<UseDataFetchingOptions<T>, 'url' | 'method' | 'body'>) {
  return useDataFetching<T>({ url, method: 'POST', body, ...options });
}

export function usePut<T = any>(url: string, body?: any, options?: Omit<UseDataFetchingOptions<T>, 'url' | 'method' | 'body'>) {
  return useDataFetching<T>({ url, method: 'PUT', body, ...options });
}

export function useDelete<T = any>(url: string, options?: Omit<UseDataFetchingOptions<T>, 'url' | 'method'>) {
  return useDataFetching<T>({ url, method: 'DELETE', ...options });
} 