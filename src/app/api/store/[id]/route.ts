

import { NextResponse } from 'next/server';
import config from '@/lib/config';

type Store = {
  _id: string;
  name: string;
  image: { url: string; alt: string };
  about?: string;
  coupons: {
    _id: string;
    offerDetails: string;
    code: string;
    active: boolean;
    isValid: boolean;
  }[];
};

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    // ISR: Enable caching with revalidation for individual store
    const res = await fetch(`${config.api.baseUrl}/api/stores`, {
      next: { 
        revalidate: 300, // Revalidate every 5 minutes
        tags: ['stores', `store-${params.id}`] // Enable tag-based revalidation
      }
    });
    
    if (!res.ok) {
      throw new Error(`Failed to fetch stores: ${res.status}`);
    }

    const json = await res.json();
    const store = (json.data as Store[]).find((s: Store) => s._id === params.id);

    if (!store) {
      return NextResponse.json({ message: "Store not found" }, { status: 404 });
    }

    return NextResponse.json(store);
  } catch (error) {
    console.error("Error fetching store:", error);
    return NextResponse.json(
      { 
        message: "Error fetching store",
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}