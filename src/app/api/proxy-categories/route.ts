import { NextResponse } from 'next/server';
import config from '@/lib/config';

export async function GET() {
  try {
    const res = await fetch(`${config.api.baseUrl}/api/categories`);
    
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
