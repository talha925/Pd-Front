  /**
   * Centralized Store Service
   * Direct service layer access that bypasses API routes for server components
   * Implements proper TTL caching with promise coalescing to eliminate duplicate fetches
   */

  import { cookies } from 'next/headers';
  import config from './config';
  import { Store, Coupon } from './types/store';

  // TTL Cache implementation with promise coalescing
  interface CacheEntry {
    data?: Store[];
    timestamp: number;
    promise?: Promise<Store[]>;
    error?: any;
  }

  interface StoreCacheEntry {
    data?: Store | null;
    timestamp: number;
    promise?: Promise<Store | null>;
    error?: any;
  }

  // In-memory cache with TTL and promise coalescing
  let storesCache: CacheEntry | null = null;
  let storeCache = new Map<string, StoreCacheEntry>();

  // CRITICAL: Proper TTL configuration with environment overrides
  // In development, default to no caching to avoid stale data
  const DEV_MODE = process.env.NODE_ENV !== 'production';
  const CACHE_TTL = Number(
    process.env.STORE_CACHE_TTL_MS ?? (DEV_MODE ? 0 : 60000)
  ); // ms
  const STALE_WHILE_REVALIDATE = Number(
    process.env.STORE_CACHE_STALE_MS ?? (DEV_MODE ? 0 : 300000)
  ); // ms

  // Dev-only logging for debugging cache behavior
  const log = (msg: string) => {
    if (process.env.NODE_ENV !== 'production') console.log(`[StoreService] ${msg}`);
  };

  /**
   * Check if cache is valid (within TTL)
   */
  function isCacheValid(timestamp: number): boolean {
    const age = Date.now() - timestamp;
    return age < CACHE_TTL;
  }

  /**
   * Check if cache is stale but still usable
   */
  function isCacheStale(timestamp: number): boolean {
    const age = Date.now() - timestamp;
    return age >= CACHE_TTL && age < STALE_WHILE_REVALIDATE;
  }

  /**
   * Fetch all stores from external API with proper promise coalescing
   * CRITICAL: This prevents cache stampedes by reusing pending promises
   */
  async function fetchAllStores(forceRefresh: boolean = false): Promise<Store[]> {
    const now = Date.now();
    
    // STEP 1: Check for valid cache (within TTL)
    if (!forceRefresh && storesCache && isCacheValid(storesCache.timestamp) && storesCache.data) {
      log('Cache hit - returning cached stores');
      return storesCache.data;
    }
    
    // STEP 2: Return stale data while revalidating in background
    if (!forceRefresh && storesCache && isCacheStale(storesCache.timestamp) && storesCache.data) {
      log('Cache stale - returning stale data and revalidating in background');
      
      // CRITICAL FIX: Only start background refresh if no promise is already running
      if (!storesCache.promise) {
        // Start background refresh without waiting
        const backgroundPromise = (async () => {
          try {
            await fetchAllStores(true);
          } catch (err) {
            log(`Background refresh failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        })();
        
        // Don't store the background promise to avoid blocking future requests
      }
      
      return storesCache.data;
    }
    
    // STEP 3: CRITICAL - Promise coalescing to prevent duplicate concurrent requests
    if (storesCache?.promise) {
      log('Promise coalescing - reusing existing fetch promise');
      return storesCache.promise;
    }
    
    // STEP 4: Create new fetch promise
    log('Cache miss - fetching fresh stores data');
    
    const fetchPromise = (async (): Promise<Store[]> => {
      try {
        const cookieStore = cookies();
        const token = cookieStore.get('authToken')?.value;
        
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        // In dev or when forcing refresh, bypass Next.js fetch cache entirely
        const fetchOptions = (DEV_MODE || forceRefresh)
          ? { headers, cache: 'no-store' as const }
          : { headers, next: { revalidate: 60, tags: ['stores'] } };

        const apiUrl = new URL(`${config.api.baseUrl}/api/stores`);
        // Use reasonable limit for list fetches; slug uses direct endpoint
        apiUrl.searchParams.set('limit', '50');
        apiUrl.searchParams.set('page', '1');
        if (DEV_MODE || forceRefresh) {
          apiUrl.searchParams.set('_ts', String(Date.now()));
        }
        const response = await fetch(apiUrl.toString(), fetchOptions);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch stores: ${response.status}`);
        }
        
        const data = await response.json();
        const stores = data?.data || [];
        
        // Update cache with successful result
        storesCache = {
          data: stores,
          timestamp: now,
          promise: undefined // Clear promise after success
        };
        
        log(`Fresh stores fetched and cached (${stores.length} stores)`);
        return stores;
        
      } catch (error) {
        // Clear promise on error but keep stale data if available
        if (storesCache) {
          storesCache.promise = undefined;
          storesCache.error = error;
        }
        
        log(`Fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
      }
    })();
    
    // Initialize cache entry with promise to enable coalescing
    if (!storesCache) {
      storesCache = { timestamp: now };
    }
    storesCache.promise = fetchPromise;
    
    return fetchPromise;
  }

  /**
   * Attempt to fetch a store by slug using backend search endpoint
   * Returns the first exact slug match, or null if not found
   */
  async function fetchStoreBySlugDirect(slug: string, forceRefresh: boolean = false): Promise<Store | null> {
    try {
      const cookieStore = cookies();
      const token = cookieStore.get('authToken')?.value;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const url = `${config.api.baseUrl}/api/stores/slug/${encodeURIComponent(slug)}`;
      const fetchOptions = (DEV_MODE || forceRefresh)
        ? { headers, cache: 'no-store' as const }
        : { headers, next: { revalidate: 3600, tags: [`store-${slug}`] } };

      const response = await fetch(url, fetchOptions);
      if (!response.ok) {
        if (response.status === 404) {
          log(`Direct slug endpoint returned 404 for ${slug}`);
          return null;
        }
        throw new Error(`Direct slug fetch failed: ${response.status}`);
      }

      const data = await response.json();
      const store = (data?.data && typeof data.data === 'object') ? data.data as Store : null;
      return store || null;
    } catch (err) {
      log(`Direct slug fetch error for ${slug}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return null;
    }
  }

  /**
   * Get store by slug with proper promise coalescing and TTL caching
   * CRITICAL: This is the main function that replaces API route calls
   */
  export async function getStoreBySlug(slug: string, forceRefresh: boolean = false): Promise<Store | null> {
    const now = Date.now();
    const cacheKey = slug;
    
    // Check individual store cache first
    const cachedStore = storeCache.get(cacheKey);
    
    // STEP 1: Return valid cached store
    if (!forceRefresh && cachedStore && isCacheValid(cachedStore.timestamp) && cachedStore.data !== undefined) {
      log(`Store cache hit for slug: ${slug}`);
      return cachedStore.data;
    }
    
    // STEP 2: Return stale data while revalidating
    if (!forceRefresh && cachedStore && isCacheStale(cachedStore.timestamp) && cachedStore.data !== undefined) {
      log(`Store cache stale for slug: ${slug} - returning stale data and revalidating`);
      
      // CRITICAL FIX: Only start background refresh if no promise is already running
      if (!cachedStore.promise) {
        // Start background refresh without waiting
        const backgroundPromise = (async () => {
          try {
            await getStoreBySlug(slug, true);
          } catch (err) {
            log(`Background store refresh failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        })();
        
        // Don't store the background promise to avoid blocking future requests
      }
      
      return cachedStore.data;
    }
    
    // STEP 3: CRITICAL - Promise coalescing for individual stores
    if (cachedStore?.promise) {
      log(`Store promise coalescing for slug: ${slug}`);
      return cachedStore.promise;
    }
    
    // STEP 4: Create new fetch promise for this specific store
    log(`Store cache miss for slug: ${slug} - fetching fresh data`);
    
    const fetchPromise = (async (): Promise<Store | null> => {
      try {
        // First attempt: direct backend slug endpoint
        let store = await fetchStoreBySlugDirect(slug, forceRefresh);

        // Fallback: fetch all stores and find by slug if direct endpoint returns null
        if (!store) {
          const stores = await fetchAllStores(forceRefresh);
          store = stores.find(s => (s.slug || '').toLowerCase() === slug.toLowerCase()) || null;
        }
        
        // CRITICAL: Add SEO/JSON-LD structured data (preserve existing logic)
        let enrichedStore = store as Store | null;
        if (store) {
          const jsonLd = {
            "@context": "https://schema.org",
            "@type": "Store",
            "name": store.name,
            "image": store.image?.url || "",
            "description": store.short_description || "",
            "url": `${config.api.siteUrl}/store/${store.slug}`
          };
          const finalSeoObject = {
            ...jsonLd,
            ...store.seo
          };

          let hydratedCoupons: Coupon[] = [];
          try {
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            const fetchOptions = (DEV_MODE || forceRefresh)
              ? { headers, cache: 'no-store' as const }
              : { headers, next: { revalidate: 60, tags: [`store-${store.slug}-coupons`] } };
            const listRes = await fetch(`${config.api.baseUrl}/api/coupons?storeId=${store._id}`, fetchOptions);
            if (listRes.ok) {
              const listJson = await listRes.json();
              const allCoupons: Coupon[] = Array.isArray(listJson?.data) ? listJson.data : [];
              const storeCouponIds = Array.isArray(store.coupons) ? (store.coupons as any[]).filter((x) => typeof x === 'string') as string[] : [];
              if (storeCouponIds.length > 0) {
                const idSet = new Set(storeCouponIds);
                hydratedCoupons = allCoupons.filter((c) => idSet.has(c._id));
                hydratedCoupons.sort((a, b) => storeCouponIds.indexOf(a._id) - storeCouponIds.indexOf(b._id));
              } else {
                hydratedCoupons = allCoupons.filter((c: any) => c.storeId === store._id);
              }
            }
            if (hydratedCoupons.length === 0) {
              const storeCouponIds = Array.isArray(store.coupons) ? (store.coupons as any[]).filter((x) => typeof x === 'string') as string[] : [];
              if (storeCouponIds.length > 0) {
                const fetchOptionsId = (DEV_MODE || forceRefresh)
                  ? { cache: 'no-store' as const }
                  : { next: { revalidate: 60, tags: storeCouponIds.map((id) => `coupon-${id}`) } };
                const byId = await Promise.all(
                  storeCouponIds.map(async (id) => {
                    try {
                      const r = await fetch(`${config.api.baseUrl}/api/coupons/${id}`, fetchOptionsId);
                      if (!r.ok) return null;
                      const j = await r.json();
                      return j?.data || null;
                    } catch {
                      return null;
                    }
                  })
                );
                hydratedCoupons = (byId.filter(Boolean) as Coupon[]);
                hydratedCoupons.sort((a, b) => storeCouponIds.indexOf(a._id) - storeCouponIds.indexOf(b._id));
              }
            }
          } catch {}

          enrichedStore = {
            ...store,
            coupons: hydratedCoupons,
            seo: finalSeoObject
          } as Store;
        }
        
        // Cache the individual store result
        storeCache.set(cacheKey, {
          data: enrichedStore,
          timestamp: now,
          promise: undefined // Clear promise after success
        });
        
        if (enrichedStore) {
          log(`Store found and cached: ${slug}`);
        } else {
          log(`Store not found: ${slug}`);
        }
        
        return enrichedStore;
        
      } catch (error) {
        // Clear promise on error but keep stale data if available
        const existing = storeCache.get(cacheKey);
        if (existing) {
          existing.promise = undefined;
          existing.error = error;
        }
        
        log(`Store fetch failed for ${slug}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        // Graceful fallback: when forceRefresh fails, return stale cache if available
        if (forceRefresh) {
          // Prefer individual store cache if it has data
          if (existing && typeof existing.data !== 'undefined') {
            log(`Returning stale cached store for slug: ${slug}`);
            return existing.data ?? null;
          }
          // Fallback to global stores cache if present
          if (storesCache?.data && Array.isArray(storesCache.data)) {
            const fallbackStore = storesCache.data.find(s => s.slug === slug) || null;
            if (fallbackStore) {
              const jsonLd = {
                "@context": "https://schema.org",
                "@type": "Store",
                "name": fallbackStore.name,
                "image": fallbackStore.image?.url || "",
                "description": fallbackStore.short_description || "",
                "url": `${config.api.siteUrl}/store/${fallbackStore.slug}`
              };
              const finalSeoObject = { ...jsonLd, ...fallbackStore.seo };
              const enrichedFallback: Store = { ...fallbackStore, seo: finalSeoObject } as Store;
              // Cache the fallback result to avoid repeated failures
              storeCache.set(cacheKey, {
                data: enrichedFallback,
                timestamp: storesCache.timestamp ?? now,
                promise: undefined,
                error
              });
              log(`Returned stale store from global cache for slug: ${slug}`);
              return enrichedFallback;
            }
          }
        }
        throw error;
      }
    })();
    
    // Store promise in cache for coalescing
    storeCache.set(cacheKey, {
      timestamp: now,
      promise: fetchPromise
    });
    
    return fetchPromise;
  }

  /**
   * Invalidate all caches (useful for admin operations)
   */
  export function invalidateStoreCache(): void {
    storesCache = null;
    storeCache.clear();
    log('All caches invalidated');
  }

  /**
   * Get cache statistics for debugging performance issues
   */
  export function getCacheStats() {
    return {
      storesCache: storesCache ? {
        hasData: !!storesCache.data,
        timestamp: storesCache.timestamp,
        age: Date.now() - storesCache.timestamp,
        isValid: storesCache.data ? isCacheValid(storesCache.timestamp) : false,
        isStale: storesCache.data ? isCacheStale(storesCache.timestamp) : false,
        hasPendingPromise: !!storesCache.promise,
        storeCount: storesCache.data?.length || 0
      } : null,
      storeCacheSize: storeCache.size,
      individualStores: Array.from(storeCache.entries()).map(([slug, entry]) => ({
        slug,
        hasData: entry.data !== undefined,
        timestamp: entry.timestamp,
        age: Date.now() - entry.timestamp,
        isValid: entry.data !== undefined ? isCacheValid(entry.timestamp) : false,
        isStale: entry.data !== undefined ? isCacheStale(entry.timestamp) : false,
        hasPendingPromise: !!entry.promise
      }))
    };
  }