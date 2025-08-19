import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Store } from '@/lib/types/store';
import { Blog } from '@/lib/types/blog';

interface SearchResult {
  stores?: Store[];
  blogs?: Blog[];
  total: number;
  isLoading: boolean;
  error: string | null;
}

interface UseSearchOptions {
  debounceMs?: number;
  minQueryLength?: number;
  limit?: number;
}

const DEFAULT_OPTIONS: UseSearchOptions = {
  debounceMs: 300,
  minQueryLength: 2,
  limit: 10
};

export function useSearch(options: UseSearchOptions = {}) {
  const pathname = usePathname();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult>({
    total: 0,
    isLoading: false,
    error: null
  });
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  // Use refs to prevent unnecessary re-renders
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const config = useMemo(() => ({ ...DEFAULT_OPTIONS, ...options }), [options.debounceMs, options.minQueryLength, options.limit]);

  // Determine search type based on current route
  const searchType = useMemo(() => {
    // Store search only for /stores and /store/[id] routes
    if (pathname === '/stores' || pathname.startsWith('/store/')) {
      return 'stores';
    }
    // Blog search for front page (/) and all other routes
    return 'blogs';
  }, [pathname]);

  // Optimized debounce with cleanup
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, config.debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, config.debounceMs]);

  // Perform search when debounced query changes
  useEffect(() => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    if (debouncedQuery.length < config.minQueryLength!) {
      setResults({
        total: 0,
        isLoading: false,
        error: null
      });
      return;
    }

    performSearch(debouncedQuery);
  }, [debouncedQuery, searchType, config.minQueryLength, config.limit]);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setResults(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const endpoint = searchType === 'stores' 
        ? '/api/stores/search' 
        : '/api/blogs/search';
      
      const url = new URL(endpoint, window.location.origin);
      url.searchParams.set('q', searchQuery.trim());
      url.searchParams.set('limit', config.limit!.toString());

      const response = await fetch(url.toString(), {
        signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // Check if request was aborted
      if (signal.aborted) return;
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Check again if request was aborted after response
      if (signal.aborted) return;

      if (searchType === 'stores') {
        setResults({
          stores: data.stores || [],
          total: data.total || 0,
          isLoading: false,
          error: null
        });
      } else {
        setResults({
          blogs: data.blogs || [],
          total: data.total || 0,
          isLoading: false,
          error: null
        });
      }
    } catch (error) {
      // Don't update state if request was aborted
      if (signal.aborted) return;
      
      console.error('Search error:', error);
      setResults({
        total: 0,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Search failed'
      });
    }
  }, [searchType, config.limit]);

  const clearSearch = useCallback(() => {
    // Cancel any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Clear debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    setQuery('');
    setDebouncedQuery('');
    setResults({
      total: 0,
      isLoading: false,
      error: null
    });
  }, []);

  const updateQuery = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    query,
    results,
    searchType,
    isSearching: results.isLoading,
    hasResults: results.total > 0,
    updateQuery,
    clearSearch,
    performSearch: () => performSearch(query)
  };
}