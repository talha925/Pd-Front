import { cookies } from 'next/headers';
import config from './config';

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
    
    // ISR: Enable caching with revalidation for stores data
    const response = await fetch(`${config.api.siteUrl}/api/proxy-stores`, {
      headers,
      next: { 
        revalidate: 300, // Revalidate every 5 minutes
        tags: ['stores'] // Enable tag-based revalidation
      }
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
    
    // ISR: Enable caching with revalidation for categories data
    const response = await fetch(`${config.api.siteUrl}/api/proxy-categories`, {
      headers,
      next: { 
        revalidate: 300, // Revalidate every 5 minutes
        tags: ['categories'] // Enable tag-based revalidation
      }
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

/**
 * Server-side data fetching for individual store
 */
export async function fetchStoreServer(storeId: string) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('authToken')?.value;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // ISR: Enable caching with revalidation for individual store data
    const response = await fetch(`${config.api.siteUrl}/api/store/${storeId}`, {
      headers,
      next: { 
        revalidate: 300, // Revalidate every 5 minutes
        tags: ['stores', `store-${storeId}`] // Enable tag-based revalidation
      }
    });
    
    if (!response.ok) {
      console.error('Failed to fetch store server-side:', response.status);
      return { data: null, error: `HTTP ${response.status}` };
    }
    
    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    console.error('Server-side store fetch error:', error);
    return { data: null, error: 'Failed to fetch store' };
  }
}

/**
 * Get the server-side authentication token from cookies
 */
export const getServerAuthToken = () => {
  const cookieStore = cookies();
  return cookieStore.get('authToken')?.value || null;
}