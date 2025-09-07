import { NextRequest, NextResponse } from 'next/server';
import config from '@/lib/config';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = searchParams.get('limit') || '10';
    const page = searchParams.get('page') || '1';

    // Validate input parameters
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 10));
    const pageNum = Math.max(1, parseInt(page, 10) || 1);

    if (!query || query.trim().length === 0) {
      return NextResponse.json({
        stores: [],
        total: 0,
        page: pageNum,
        limit: limitNum,
        success: true
      });
    }

    // Sanitize query to prevent injection attacks
    const sanitizedQuery = query.trim().replace(/[<>"'&]/g, '');
    
    if (sanitizedQuery.length === 0) {
      return NextResponse.json({
        stores: [],
        total: 0,
        page: pageNum,
        limit: limitNum,
        success: true
      });
    }

    // Use optimized backend search endpoint
    const searchUrl = new URL(`${config.api.baseUrl}/api/stores/search`);
    searchUrl.searchParams.set('query', sanitizedQuery);
    searchUrl.searchParams.set('page', pageNum.toString());
    searchUrl.searchParams.set('limit', limitNum.toString());

    const fetchResponse = await fetch(searchUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
      next: {
        revalidate: 300, // Cache for 5 minutes for search results
        tags: ['stores-search']
      }
    });

    // Handle different response statuses gracefully
    if (!fetchResponse.ok) {
      console.warn(`External API returned ${fetchResponse.status} for stores search`);
      
      // Return empty results instead of throwing error
      return NextResponse.json({
        stores: [],
        total: 0,
        page: pageNum,
        limit: limitNum,
        success: true,
        message: 'No stores found for your search query'
      });
    }

    const data = await fetchResponse.json();
    
    // Handle backend search response structure
    if (data.status === 'success' && Array.isArray(data.data)) {
      return NextResponse.json({
        stores: data.data,
        total: data.data.length,
        page: data.currentPage || pageNum,
        limit: limitNum,
        success: true
      });
    }
    
    // Fallback for different response structures
    const stores = Array.isArray(data.stores) ? data.stores : 
                  Array.isArray(data.data) ? data.data : 
                  Array.isArray(data) ? data : [];
    
    return NextResponse.json({
      stores: stores.slice(0, limitNum),
      total: stores.length,
      page: pageNum,
      limit: limitNum,
      success: true
    });
  } catch (error) {
    console.error('Store search error:', error);
    
    const { searchParams } = new URL(request.url);
    
    // Always return 200 with empty results instead of 500 error
    const errorResponse = NextResponse.json({
      stores: [],
      total: 0,
      page: parseInt(searchParams?.get('page') || '1', 10),
      limit: parseInt(searchParams?.get('limit') || '10', 10),
      success: true,
      message: 'Search temporarily unavailable. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? 
        (error instanceof Error ? error.message : 'Unknown error') : undefined
    });
    
    // Add minimal caching for error responses
    errorResponse.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    
    return errorResponse;
  }
}