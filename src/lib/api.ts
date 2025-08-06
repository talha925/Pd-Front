/**
 * API client for making authenticated requests
 */

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
  isPublicRoute?: boolean;
}

// List of public API routes that don't require authentication
const PUBLIC_ROUTES = [
  '/api/proxy-stores',
  '/api/proxy-categories',
  '/api/blogs',
  '/api/blog',
  '/api/blog-categories',
  '/api/store',
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/validate'
];

// List of public paths that don't require authentication
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/blog',
  '/stores',
  '/categories',
  '/about',
  '/contact'
];

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    // Use environment variable for base URL if available
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || baseUrl;
    // Remove trailing slash if present
    if (this.baseUrl && this.baseUrl.endsWith('/')) {
      this.baseUrl = this.baseUrl.slice(0, -1);
    }
    console.log('API Client initialized with baseUrl:', this.baseUrl);
  }

  /**
   * Get the authentication token from storage
   */
  private isPublicRoute(path: string): boolean {
    // Check if the path is a public path or starts with a public API route
    return (
      PUBLIC_PATHS.some(publicPath => path === publicPath || path.startsWith(publicPath + '/')) ||
      PUBLIC_ROUTES.some(route => path.startsWith(route))
    );
  }

  private async getAuthToken(options: RequestOptions = {}): Promise<string | null> {
    // Skip auth token for public routes or when explicitly skipped
    if (options.isPublicRoute || options.skipAuth) {
      return null;
    }

    if (typeof window === 'undefined') {
      return null; // Server-side
    }
    
    const currentPath = window.location.pathname;
    
    // Skip token check for public routes
    if (this.isPublicRoute(currentPath)) {
      return null;
    }
    
    // First try to get from localStorage
    const localToken = localStorage.getItem('authToken');
    if (localToken) {
      return localToken;
    }
    
    // Only try to get from HTTP-only cookie if we're on a protected route
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          localStorage.setItem('authToken', data.token);
          return data.token;
        }
      }
    } catch (error) {
      console.error('Error fetching auth token:', error);
    }
    
    return null;
  }

  /**
   * Create headers with authentication if needed
   */
  private async createHeaders(options: RequestOptions = {}): Promise<Headers> {
    const headers = new Headers(options.headers);
    
    // Set default content type if not provided
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    // Skip auth for public routes or when explicitly skipped
    if (options.skipAuth) {
      return headers;
    }

    // Check if this is a public route
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    const isPublic = this.isPublicRoute(currentPath);
    
    // Add auth token only for non-public routes
    if (!isPublic) {
      const token = await this.getAuthToken({ ...options, isPublicRoute: isPublic });
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    return headers;
  }

  /**
   * Handle API errors
   */
  private async handleError(response: Response): Promise<never> {
    // Handle authentication errors
    if (response.status === 401) {
      // Clear token and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      }
    }
    
    let errorMessage = 'An error occurred';
    // Only try to parse the response body if it hasn't been read yet
    if (response.bodyUsed === false) {
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || response.statusText || errorMessage;
      } catch (e) {
        // If we can't parse the error, use the status text
        errorMessage = response.statusText || errorMessage;
      }
    } else {
      // If body was already read, just use status text
      errorMessage = response.statusText || `Error ${response.status}` || errorMessage;
    }
    
    throw new Error(errorMessage);
  }

  /**
   * Make a request
   */
  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const headers = await this.createHeaders(options);
    // Use relative URL for local API routes, absolute URL for external routes
    const url = endpoint.startsWith('/api/') ? endpoint : this.baseUrl + endpoint;
    
    const response = await fetch(url, {
      ...options,
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      return await this.handleError(response);
    }

    // For 204 No Content responses, return null
    if (response.status === 204) {
      return null as any;
    }

    return await response.json();
  }

  /**
   * Make a GET request
   */
  async get<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    // Always use relative URLs for API routes to avoid CORS issues
    let url = endpoint;
    
    // Special handling for blog-categories endpoint
    if (endpoint === '/api/blog-categories' || endpoint.includes('blog-categories')) {
      console.log('Using local proxy for blog categories');
      const headers = await this.createHeaders(options);
      
      try {
        const response = await fetch('/api/blog-categories', {
          ...options,
          method: 'GET',
          headers,
          cache: 'no-store',
        });

        if (!response.ok) {
          console.error('Error fetching blog categories:', response.status, response.statusText);
          return { data: [] } as any;
        }

        return await response.json();
      } catch (error) {
        console.error('Failed to fetch blog categories:', error);
        return { data: [] } as any;
      }
    }
    
    // For all other API routes, ensure we're using relative URLs for local routes
    if (!endpoint.startsWith('/api/') && !endpoint.startsWith('http')) {
      // If it's not a relative API route and not an absolute URL, prepend the baseUrl
      url = this.baseUrl + endpoint;
    }
    
    console.log('API GET request to:', url);
    const headers = await this.createHeaders(options);
    
    try {
      const response = await fetch(url, {
        ...options,
        method: 'GET',
        headers,
        cache: 'no-store',
      });

      if (!response.ok) {
        return await this.handleError(response);
      }

      // For 204 No Content responses, return null
      if (response.status === 204) {
        return null as any;
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
      // For specific endpoints, return empty data instead of throwing
      if (endpoint.includes('categories') || endpoint.includes('blogs')) {
        console.log(`Returning empty data for ${endpoint} due to error`);
        return { data: [] } as any;
      }
      throw error;
    }
  }

  /**
   * Make a POST request
   */
  async post<T = any>(endpoint: string, data: any, options?: RequestOptions): Promise<T> {
    const headers = await this.createHeaders(options);
    // Always use relative URLs for API routes to avoid CORS issues
    let url = endpoint;
    
    // For non-API routes that aren't absolute URLs, prepend the baseUrl
    if (!endpoint.startsWith('/api/') && !endpoint.startsWith('http')) {
      url = this.baseUrl + endpoint;
    }
    
    console.log('API POST request to:', url);
    
    try {
      const response = await fetch(url, {
        ...options,
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        cache: 'no-store',
      });

      if (!response.ok) {
        return await this.handleError(response);
      }

      // For 204 No Content responses, return null
      if (response.status === 204) {
        return null as any;
      }

      return await response.json();
    } catch (error) {
      console.error(`Error posting to ${url}:`, error);
      throw error;
    }
  }

  /**
   * Make a PUT request
   */
  async put<T = any>(endpoint: string, data: any, options?: RequestOptions): Promise<T> {
    const headers = await this.createHeaders(options);
    // Always use relative URLs for API routes to avoid CORS issues
    let url = endpoint;
    
    // For non-API routes that aren't absolute URLs, prepend the baseUrl
    if (!endpoint.startsWith('/api/') && !endpoint.startsWith('http')) {
      url = this.baseUrl + endpoint;
    }
    
    console.log('API PUT request to:', url);
    
    try {
      const response = await fetch(url, {
        ...options,
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
        cache: 'no-store',
      });

      if (!response.ok) {
        return await this.handleError(response);
      }

      // For 204 No Content responses, return null
      if (response.status === 204) {
        return null as any;
      }

      return await response.json();
    } catch (error) {
      console.error(`Error putting to ${url}:`, error);
      throw error;
    }
  }

  /**
   * Make a DELETE request
   */
  async delete<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    const headers = await this.createHeaders(options);
    // Always use relative URLs for API routes to avoid CORS issues
    let url = endpoint;
    
    // For non-API routes that aren't absolute URLs, prepend the baseUrl
    if (!endpoint.startsWith('/api/') && !endpoint.startsWith('http')) {
      url = this.baseUrl + endpoint;
    }
    
    console.log('API DELETE request to:', url);
    
    try {
      const response = await fetch(url, {
        ...options,
        method: 'DELETE',
        headers,
        cache: 'no-store',
      });

      if (!response.ok) {
        return await this.handleError(response);
      }

      // For 204 No Content responses, return null
      if (response.status === 204) {
        return null as any;
      }

      return await response.json();
    } catch (error) {
      console.error(`Error deleting ${url}:`, error);
      throw error;
    }
  }


}

// Create and export a singleton instance
export const api = new ApiClient();

// Export the class for testing or custom instances
export default ApiClient;