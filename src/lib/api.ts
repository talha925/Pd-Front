/**
 * API client for making authenticated requests
 */

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  /**
   * Get the authentication token from storage
   */
  private async getAuthToken(): Promise<string | null> {
    if (typeof window === 'undefined') {
      return null; // Server-side
    }
    
    // First try to get from localStorage
    const localToken = localStorage.getItem('authToken');
    if (localToken) {
      return localToken;
    }
    
    // If no local token, try to get from HTTP-only cookie
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
   * Add authentication headers to requests
   */
  private async createHeaders(options?: RequestOptions): Promise<Headers> {
    const headers = new Headers(options?.headers);
    
    // Set default content type if not provided
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    // Add auth token if available and not skipped
    if (!options?.skipAuth) {
      const token = await this.getAuthToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    return headers;
  }

  /**
   * Make a GET request
   */
  async get<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    const url = this.baseUrl + endpoint;
    const headers = await this.createHeaders(options);
    
    const response = await fetch(url, {
      ...options,
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      this.handleError(response);
    }

    return await response.json();
  }

  /**
   * Make a POST request
   */
  async post<T = any>(endpoint: string, data: any, options?: RequestOptions): Promise<T> {
    const url = this.baseUrl + endpoint;
    const headers = await this.createHeaders(options);
    
    const response = await fetch(url, {
      ...options,
      method: 'POST',
      headers,
      body: JSON.stringify(data),
      cache: 'no-store',
    });

    if (!response.ok) {
      this.handleError(response);
    }

    return await response.json();
  }

  /**
   * Make a PUT request
   */
  async put<T = any>(endpoint: string, data: any, options?: RequestOptions): Promise<T> {
    const url = this.baseUrl + endpoint;
    const headers = await this.createHeaders(options);
    
    const response = await fetch(url, {
      ...options,
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
      cache: 'no-store',
    });

    if (!response.ok) {
      this.handleError(response);
    }

    return await response.json();
  }

  /**
   * Make a DELETE request
   */
  async delete<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    const url = this.baseUrl + endpoint;
    const headers = await this.createHeaders(options);
    
    const response = await fetch(url, {
      ...options,
      method: 'DELETE',
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      this.handleError(response);
    }

    return await response.json();
  }

  /**
   * Handle error responses
   */
  private handleError(response: Response): never {
    // Handle authentication errors
    if (response.status === 401) {
      // Clear token and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      }
    }
    
    throw new Error(`HTTP error! status: ${response.status}`);
  }
}

// Create and export a singleton instance
export const api = new ApiClient();

// Export the class for testing or custom instances
export default ApiClient; 