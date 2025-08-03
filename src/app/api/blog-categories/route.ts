import { NextResponse } from 'next/server';

const API_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL || "https://coupon-app-backend.vercel.app"}/api/blogCategories`;

const getBlogCategories = async () => {
  try {
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching blog categories:', error);
    throw error;
  }
};

export async function GET() {
  try {
    const categories = await getBlogCategories();
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch categories',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}