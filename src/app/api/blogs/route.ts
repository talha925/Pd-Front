import { NextRequest, NextResponse } from 'next/server';
import config from '@/lib/config';

const API_URL = `${config.api.baseUrl}/api/blogs`;

const getBlogs = async (searchParams?: URLSearchParams) => {
  try {
    // Build the API URL with query parameters
    const apiUrl = new URL(API_URL);
    if (searchParams) {
      // Forward supported query parameters to the external API
      const supportedParams = ['category', 'search', 'page', 'pageSize', 'limit', 'featured', 'isFeaturedForHome', 'frontBanner', 'status', 'sort', 'sortBy', 'sortOrder', 'order'];
      supportedParams.forEach(param => {
        const value = searchParams.get(param);
        if (value) {
          apiUrl.searchParams.set(param, value);
        }
      });

      // Default to newest first (-createdAt) if no sort parameter is specified
      if (!apiUrl.searchParams.has('sort')) {
        apiUrl.searchParams.set('sort', '-createdAt');
      }
    }

    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching blogs:', error);
    throw error;
  }
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isAll = searchParams.get('all') === 'true' || searchParams.get('status') === 'all';
    
    let blogData: any[] = [];
    let pagination = null;

    if (isAll) {
      // For Admin: Fetch both published and draft blogs and combine them
      const pubParams = new URLSearchParams(searchParams);
      pubParams.set('status', 'published');
      pubParams.delete('all');
      pubParams.set('limit', '100');

      const draftParams = new URLSearchParams(searchParams);
      draftParams.set('status', 'draft');
      draftParams.delete('all');
      draftParams.set('limit', '100');

      const [pubRes, draftRes] = await Promise.all([
        getBlogs(pubParams).catch(() => ({})),
        getBlogs(draftParams).catch(() => ({}))
      ]);

      const pubList = pubRes.blogs || pubRes.data?.blogs || pubRes.data || [];
      const draftList = draftRes.blogs || draftRes.data?.blogs || draftRes.data || [];

      // Combine and remove duplicates by _id
      const idMap = new Map();
      [...pubList, ...draftList].forEach((b: any) => {
        if (b && b._id) idMap.set(b._id, b);
      });

      blogData = Array.from(idMap.values()).sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || a.updatedAt || a.publishDate || 0).getTime();
        const dateB = new Date(b.createdAt || b.updatedAt || b.publishDate || 0).getTime();
        return dateB - dateA;
      });
    } else {
      const blogs = await getBlogs(searchParams);
      blogData = blogs.data?.blogs || blogs.blogs || blogs.data || blogs || [];
      pagination = blogs.data?.pagination || blogs.pagination || null;
    }

    const response = NextResponse.json({
      blogs: blogData,
      count: Array.isArray(blogData) ? blogData.length : 0,
      pagination,
      success: true
    });

    // Set headers to prevent any caching of the API response
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error('Failed to fetch blogs:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch blogs. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error',
        blogs: [],
        count: 0,
        success: false
      },
      { status: 500 }
    );
  }
}