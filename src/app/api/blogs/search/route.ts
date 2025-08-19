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
        blogs: [],
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
        blogs: [],
        total: 0,
        page: pageNum,
        limit: limitNum,
        success: true
      });
    }

    // Fetch all blogs from external API for client-side filtering
    // This ensures accurate search results with proper relevance scoring
    const searchUrl = new URL(`${config.api.baseUrl}/api/blogs`);
    searchUrl.searchParams.set('limit', '1000'); // Get more blogs for better filtering
    searchUrl.searchParams.set('page', '1');

    const fetchResponse = await fetch(searchUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
      next: {
        revalidate: 300, // Cache for 5 minutes for search results
        tags: ['blogs-search']
      }
    });

    // Handle different response statuses gracefully
    if (!fetchResponse.ok) {
      console.warn(`External API returned ${fetchResponse.status} for blogs search`);
      
      // Return empty results instead of throwing error
      return NextResponse.json({
        blogs: [],
        total: 0,
        page: pageNum,
        limit: limitNum,
        success: true,
        message: 'No blogs found for your search query'
      });
    }

    const data = await fetchResponse.json();
    
    // Safely extract blogs data with fallbacks - handle nested structure
    const allBlogs = Array.isArray(data.data?.blogs) ? data.data.blogs : 
                    Array.isArray(data.data) ? data.data : 
                    Array.isArray(data.blogs) ? data.blogs : 
                    Array.isArray(data) ? data : [];
    
    // Implement client-side search with relevance scoring
    const searchTerms = sanitizedQuery.toLowerCase().split(/\s+/).filter(term => term.length > 0);
    
    const searchResults = allBlogs.map((blog: any) => {
      let relevanceScore = 0;
      const title = (blog.title || '').toLowerCase();
      const shortDescription = (blog.shortDescription || '').toLowerCase();
      const longDescription = (blog.longDescription || '').toLowerCase();
      const slug = (blog.slug || '').toLowerCase();
      const authorName = (blog.author?.name || '').toLowerCase();
      const categoryName = (blog.category?.name || '').toLowerCase();
      const storeName = (blog.store?.name || '').toLowerCase();
      const tags = Array.isArray(blog.tags) ? blog.tags.join(' ').toLowerCase() : '';
      
      // Calculate relevance score for each search term
      searchTerms.forEach(term => {
        // Exact title match gets highest score
        if (title === term) relevanceScore += 100;
        else if (title.includes(term)) relevanceScore += 50;
        
        // Exact slug match gets high score
        if (slug === term) relevanceScore += 80;
        else if (slug.includes(term)) relevanceScore += 40;
        
        // Store name and category matches
        if (storeName.includes(term)) relevanceScore += 30;
        if (categoryName.includes(term)) relevanceScore += 25;
        if (authorName.includes(term)) relevanceScore += 20;
        
        // Description matches
        if (shortDescription.includes(term)) relevanceScore += 15;
        if (longDescription.includes(term)) relevanceScore += 10;
        
        // Tags matches
        if (tags.includes(term)) relevanceScore += 20;
      });
      
      return { ...blog, relevanceScore };
    })
    .filter((blog: any) => blog.relevanceScore > 0) // Only include blogs with matches
    .sort((a: any, b: any) => b.relevanceScore - a.relevanceScore); // Sort by relevance
    
    // Implement pagination on filtered results
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedBlogs = searchResults.slice(startIndex, endIndex);
    
    // Remove relevanceScore from final results
    const blogs = paginatedBlogs.map(({ relevanceScore, ...blog }: any) => blog);
    
    const jsonResponse = NextResponse.json({
      blogs,
      total: searchResults.length,
      page: pageNum,
      limit: limitNum,
      success: true
    });
    
    // Add caching headers for better performance
    jsonResponse.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    jsonResponse.headers.set('CDN-Cache-Control', 'public, s-maxage=300');
    jsonResponse.headers.set('Vercel-CDN-Cache-Control', 'public, s-maxage=300');
    
    return jsonResponse;
  } catch (error) {
    console.error('Blog search error:', error);
    
    const { searchParams } = new URL(request.url);
    
    // Always return 200 with empty results instead of 500 error
    const errorResponse = NextResponse.json({
      blogs: [],
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