import { NextResponse } from 'next/server';
import config from '@/lib/config';

export async function GET() {
  try {
    // ISR: Enable caching with revalidation for categories proxy API
    const res = await fetch(`${config.api.baseUrl}/api/categories`, {
      next: { 
        revalidate: 300, // Revalidate every 5 minutes
        tags: ['categories'] // Enable tag-based revalidation
      }
    });
    
    if (!res.ok) {
      throw new Error('Failed to fetch categories');
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
