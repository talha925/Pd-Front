

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

// In-memory cache for stores data (for optimization)
let storesCache: { data: Store[], timestamp: number } | null = null;
const CACHE_DURATION = 30000; // 30 seconds cache

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    let stores: Store[] = [];
    
    // Check if we have valid cached data
    const now = Date.now();
    if (storesCache && (now - storesCache.timestamp) < CACHE_DURATION) {
      stores = storesCache.data;
    } else {
      // Fetch fresh data from external API
      const res = await fetch(`${config.api.baseUrl}/api/stores`, {
        cache: 'no-store'
      });
      
      if (!res.ok) {
        throw new Error(`Failed to fetch stores: ${res.status}`);
      }

      const response = await res.json();
      
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid response structure from external API');
      }
      
      stores = response.data;
      // Update cache
      storesCache = { data: stores, timestamp: now };
    }
    
    // Find the specific store by ID
    const store = stores.find((store: Store) => store._id === params.id);
    
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