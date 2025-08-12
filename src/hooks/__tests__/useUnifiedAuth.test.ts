import { renderHook, act } from '@testing-library/react';
import { useUnifiedAuth } from '../useUnifiedAuth';
import { authService } from '@/services/AuthService';

// Mock the AuthService
jest.mock('@/services/AuthService');
const mockAuthService = authService as jest.Mocked<typeof authService>;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('useUnifiedAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    
    // Mock the subscription methods
    mockAuthService.onAuthStateChange = jest.fn().mockReturnValue(() => {});
    mockAuthService.onSessionExpiring = jest.fn().mockReturnValue(() => {});
    mockAuthService.onTokenRefresh = jest.fn().mockReturnValue(() => {});
  });

  it('should initialize with default state', () => {
    mockAuthService.getAuthState = jest.fn().mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      sessionTimeRemaining: 0,
      isOnline: true,
    });

    const { result } = renderHook(() => useUnifiedAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle successful login', async () => {
    const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' };
    const mockToken = { accessToken: 'mock-jwt-token', expiresAt: Date.now() + 3600000, tokenType: 'Bearer' as const };
    
    mockAuthService.login = jest.fn().mockResolvedValue({
      user: mockUser,
      token: mockToken,
    });

    mockAuthService.getAuthState = jest.fn().mockReturnValue({
      user: mockUser,
      token: mockToken,
      isAuthenticated: true,
      isLoading: false,
      sessionTimeRemaining: 3600000,
      isOnline: true,
    });

    const { result } = renderHook(() => useUnifiedAuth());

    await act(async () => {
      await result.current.login({ email: 'test@example.com', password: 'password' });
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle login failure', async () => {
    const mockError = new Error('Invalid credentials');
    
    mockAuthService.login = jest.fn().mockRejectedValue(mockError);
    mockAuthService.getAuthState = jest.fn().mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      sessionTimeRemaining: 0,
      isOnline: true,
    });

    const { result } = renderHook(() => useUnifiedAuth());

    await act(async () => {
      try {
        await result.current.login({ email: 'test@example.com', password: 'wrong-password' });
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle logout', async () => {
    mockAuthService.logout = jest.fn().mockResolvedValue(undefined);
    mockAuthService.getAuthState = jest.fn().mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      sessionTimeRemaining: 0,
      isOnline: true,
    });

    const { result } = renderHook(() => useUnifiedAuth());

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(mockAuthService.logout).toHaveBeenCalled();
  });

  it('should check permissions correctly', () => {
    const mockUser = { 
      id: '1', 
      email: 'admin@example.com', 
      name: 'Admin User',
      role: 'admin',
      permissions: ['read', 'write', 'delete']
    };

    mockAuthService.getAuthState = jest.fn().mockReturnValue({
      user: mockUser,
      token: { accessToken: 'token', expiresAt: Date.now() + 3600000, tokenType: 'Bearer' as const },
      isAuthenticated: true,
      isLoading: false,
      sessionTimeRemaining: 3600000,
      isOnline: true,
    });

    mockAuthService.hasPermission = jest.fn().mockImplementation((permission: string) => {
      return mockUser.permissions?.includes(permission) || false;
    });

    const { result } = renderHook(() => useUnifiedAuth());

    expect(result.current.hasPermission('read')).toBe(true);
    expect(result.current.hasPermission('write')).toBe(true);
    expect(result.current.hasPermission('admin')).toBe(false);
  });

  it('should restore authentication state from localStorage', () => {
    const mockToken = { accessToken: 'stored-token', expiresAt: Date.now() + 3600000, tokenType: 'Bearer' as const };
    const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' };
    
    mockAuthService.getAuthState = jest.fn().mockReturnValue({
      user: mockUser,
      token: mockToken,
      isAuthenticated: true,
      isLoading: false,
      sessionTimeRemaining: 3600000,
      isOnline: true,
    });

    mockAuthService.validateToken = jest.fn().mockResolvedValue(true);

    const { result } = renderHook(() => useUnifiedAuth());

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should handle token refresh', async () => {
    const mockNewToken = { accessToken: 'new-token', expiresAt: Date.now() + 3600000, tokenType: 'Bearer' as const };
    
    mockAuthService.refreshToken = jest.fn().mockResolvedValue(mockNewToken);
    mockAuthService.getAuthState = jest.fn().mockReturnValue({
      user: { id: '1', email: 'test@example.com', name: 'Test User' },
      token: mockNewToken,
      isAuthenticated: true,
      isLoading: false,
      sessionTimeRemaining: 3600000,
      isOnline: true,
    });

    const { result } = renderHook(() => useUnifiedAuth());

    await act(async () => {
      await result.current.refreshToken();
    });

    expect(mockAuthService.refreshToken).toHaveBeenCalled();
  });
});