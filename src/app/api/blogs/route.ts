import { NextRequest, NextResponse } from 'next/server';
import config from '@/lib/config';

const API_URL = `${config.api.baseUrl}/api/blogs`;

const getBlogs = async (searchParams?: URLSearchParams) => {
  try {
    // Build the API URL with query parameters
    const apiUrl = new URL(API_URL);
    if (searchParams) {
      // Forward supported query parameters to the external API
      const supportedParams = ['category', 'search', 'page', 'pageSize', 'limit', 'featured'];
      supportedParams.forEach(param => {
        const value = searchParams.get(param);
        if (value) {
          apiUrl.searchParams.set(param, value);
        }
      });
    }

    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { 
        revalidate: 300, // Revalidate every 5 minutes
        tags: ['blogs'] // Enable tag-based revalidation
      }
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
    const blogs = await getBlogs(searchParams);
    
    // Handle different response structures from the external API
    const blogData = blogs.data?.blogs || blogs.blogs || blogs.data || blogs || [];
    const pagination = blogs.data?.pagination || blogs.pagination || null;
    
    return NextResponse.json({
      blogs: blogData,
      count: Array.isArray(blogData) ? blogData.length : 0,
      pagination,
      success: true
    });
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