import { NextResponse } from 'next/server';
import { getStoreBySlug } from '@/lib/store-service';

// Dev-only logging
const log = (msg: string) => {
  if (process.env.NODE_ENV !== 'production') console.log(msg);
};

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
        'public, s-maxage=60, stale-while-revalidate=60'
      );
    }

    log(`[API ROUTE] Fetching store via service layer (noCache=${noCache}) for slug: ${params.slug}`);

    // CRITICAL FIX: Use direct service layer instead of internal HTTP calls
    const store = await getStoreBySlug(params.slug, noCache);
    
    if (!store) {
      return NextResponse.json({ message: 'Store not found' }, { status: 404 });
    }

    log(`[API ROUTE] Store found via service layer: ${store.name}`);

    return new NextResponse(JSON.stringify(store), {
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
