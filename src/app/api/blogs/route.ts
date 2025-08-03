import { NextResponse } from 'next/server';

const API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL || "https://coupon-app-backend.vercel.app"}/api/blogs`;

const getBlogs = async () => {
  try {
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
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

export async function GET() {
  try {
    const blogs = await getBlogs();
    return NextResponse.json({
      blogs: blogs.data || blogs || [],
      count: (blogs.data || blogs || []).length,
      success: true
    });
  } catch (error) {
    console.error('Failed to fetch blogs:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch blogs. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error',
        blogs: [],
        count: 0
      },
      { status: 500 }
    );
  }
}