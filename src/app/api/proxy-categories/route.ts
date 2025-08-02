import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://coupon-app-backend.vercel.app/api/categories');
    
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
