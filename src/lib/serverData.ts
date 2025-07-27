import { cookies } from 'next/headers';
import { buildApiUrl, BACKEND_CONFIG } from '@/lib/config';

// Server-side data fetching utilities
export async function fetchStoresServer() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('authToken')?.value;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || buildApiUrl(BACKEND_CONFIG.ENDPOINTS.STORES)}`, {
      headers,
      cache: 'no-store', // Always fetch fresh data
    });
    
    if (!response.ok) {
      console.error('Failed to fetch stores server-side:', response.status);
      return { data: [], error: `HTTP ${response.status}` };
    }
    
    const data = await response.json();
    return { data: data.data || [], error: null };
  } catch (error) {
    console.error('Server-side stores fetch error:', error);
    return { data: [], error: 'Failed to fetch stores' };
  }
}

export async function fetchCategoriesServer() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('authToken')?.value;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || buildApiUrl(BACKEND_CONFIG.ENDPOINTS.CATEGORIES)}`, {
      headers,
      cache: 'no-store', // Always fetch fresh data
    });
    
    if (!response.ok) {
      console.error('Failed to fetch categories server-side:', response.status);
      return { data: [], error: `HTTP ${response.status}` };
    }
    
    const data = await response.json();
    return { data: data.data?.categories || [], error: null };
  } catch (error) {
    console.error('Server-side categories fetch error:', error);
    return { data: [], error: 'Failed to fetch categories' };
  }
}

// Helper to get auth token server-side
export async function getServerAuthToken() {
  const cookieStore = cookies();
  return cookieStore.get('authToken')?.value || null;
} 