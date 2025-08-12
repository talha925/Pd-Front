import HttpClient from '../HttpClient';
import { getApiUrl } from '@/lib/config';

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock config
jest.mock('@/lib/config', () => ({
  getApiUrl: jest.fn(() => 'https://api.example.com'),
  config: {
    api: {
      baseUrl: 'https://api.example.com',
      timeout: 5000,
      retryAttempts: 3,
    },
  },
}));

describe('HttpClient', () => {
  let httpClient: HttpClient;

  beforeEach(() => {
    httpClient = new HttpClient();
    jest.clearAllMocks();
  });

  describe('GET requests', () => {
    it('should make successful GET request', async () => {
      const mockData = { id: 1, title: 'Test Blog' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response);

      const result = await httpClient.get('/blogs/1');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/blogs/1',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result).toEqual(mockData);
    });

    it('should handle GET request with query parameters', async () => {
      const mockData = { blogs: [], total: 0 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response);

      await httpClient.get('/blogs', { params: { page: 1, limit: 10 } });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/blogs?page=1&limit=10',
        expect.any(Object)
      );
    });
  });

  describe('POST requests', () => {
    it('should make successful POST request', async () => {
      const requestData = { title: 'New Blog', content: 'Blog content' };
      const responseData = { id: 1, ...requestData };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => responseData,
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response);

      const result = await httpClient.post('/blogs', requestData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/blogs',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(requestData),
        })
      );
      expect(result).toEqual(responseData);
    });
  });

  describe('PUT requests', () => {
    it('should make successful PUT request', async () => {
      const requestData = { title: 'Updated Blog', content: 'Updated content' };
      const responseData = { id: 1, ...requestData };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => responseData,
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response);

      const result = await httpClient.put('/blogs/1', requestData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/blogs/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(requestData),
        })
      );
      expect(result).toEqual(responseData);
    });
  });

  describe('DELETE requests', () => {
    it('should make successful DELETE request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => ({}),
        headers: new Headers(),
      } as Response);

      await httpClient.delete('/blogs/1');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/blogs/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('Error handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(httpClient.get('/blogs')).rejects.toThrow('Network error');
    });

    it('should handle HTTP error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Blog not found' }),
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response);

      await expect(httpClient.get('/blogs/999')).rejects.toThrow();
    });

    it('should handle server errors with retry', async () => {
      // First two calls fail, third succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('Server error'))
        .mockRejectedValueOnce(new Error('Server error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true }),
          headers: new Headers({ 'content-type': 'application/json' }),
        } as Response);

      const result = await httpClient.get('/blogs');

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result).toEqual({ success: true });
    });
  });

  describe('Authentication', () => {
    it('should include authorization header when token is provided', async () => {
      const token = 'bearer-token';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response);

      await httpClient.get('/protected', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/protected',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${token}`,
          }),
        })
      );
    });

    it('should make request without authorization header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response);

      await httpClient.get('/public');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/public',
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Authorization': expect.any(String),
          }),
        })
      );
    });
  });

  describe('Request timeout', () => {
    it('should timeout requests after configured time', async () => {
      // Mock a request that never resolves
      mockFetch.mockImplementationOnce(
        () => new Promise(() => {}) // Never resolves
      );

      await expect(httpClient.get('/slow-endpoint')).rejects.toThrow('timeout');
    }, 10000); // Increase test timeout
  });
});