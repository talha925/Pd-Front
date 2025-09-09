import { NextResponse } from 'next/server';
import config from '@/lib/config';
import { Store } from '@/lib/types/store';

// Dev-only logging
const log = (msg: string) => {
  if (process.env.NODE_ENV !== 'production') console.log(msg);
};

// --- In-memory cache ---
let storesCache: { data: Store[]; timestamp: number } | null = null;
const CACHE_DURATION = 30000; // 30s in-memory cache
const ISR_REVALIDATE = 60; // 60s ISR for CDN

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  try {
    const { searchParams } = new URL(req.url);
    const noCache = searchParams.get('noCache') === 'true';

    // Cache headers
    const headers = new Headers();
    if (noCache) {
      headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    } else {
      headers.set(
        'Cache-Control',
        `public, s-maxage=${ISR_REVALIDATE}, stale-while-revalidate=${ISR_REVALIDATE}`
      );
    }

    log(`Fetching stores (noCache=${noCache}) for slug: ${params.slug}`);

    let stores: Store[] = [];
    const now = Date.now();

    // --- Use in-memory cache if valid ---
    if (!noCache && storesCache && now - storesCache.timestamp < CACHE_DURATION) {
      stores = storesCache.data;
      log('Using in-memory cache');
    } else {
      // --- Fetch fresh data ---
      const fetchOptions: RequestInit = noCache
        ? { cache: 'no-store' }
        : { next: { revalidate: ISR_REVALIDATE, tags: ['stores'] } };

      const res = await fetch(`${config.api.baseUrl}/api/stores`, fetchOptions);

      if (!res.ok) throw new Error(`Failed to fetch stores: ${res.status}`);

      const response = await res.json();

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid response structure from API');
      }

      stores = response.data;

      // --- Sync in-memory cache ---
      storesCache = { data: stores, timestamp: now };
      log('Fetched fresh data and updated in-memory cache');
    }

    // --- Find the specific store ---
    const store = stores.find((s) => s.slug === params.slug);
    if (!store) {
      return NextResponse.json({ message: 'Store not found' }, { status: 404 });
    }

    // --- Add SEO / JSON-LD structured data ---
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Store",
      "name": store.name,
      "image": store.image?.url || "",
      "description": store.short_description || "",
      "url": `${config.api.siteUrl}/stores/${store.slug}`
    };

    const body = {
      ...store,
      seo: jsonLd
    };

    return new NextResponse(JSON.stringify(body), {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Error fetching store:', error);
    return NextResponse.json(
      {
        message: 'Error fetching store',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
