'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  permissions?: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  updateUser: (userData: Partial<User>) => void;
  hasPermission: (permission: string) => boolean;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  refreshToken: async () => false,
  updateUser: () => {},
  hasPermission: () => false,
});

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode; initialToken?: string | null }> = ({ children, initialToken }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(initialToken || null);
  const [isLoading, setIsLoading] = useState(!initialToken);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();
  const hasInitializedRef = useRef(false);

  // Token validation function
  const validateToken = useCallback(async (tokenToValidate: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenToValidate}`,
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }, []);

  // Refresh token function
  const refreshToken = useCallback(async (): Promise<boolean> => {
    if (isRefreshing) return false;
    
    try {
      setIsRefreshing(true);
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include', // Include cookies
      });

      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          setToken(data.token);
          localStorage.setItem('authToken', data.token);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  // Check for existing auth on mount
  useEffect(() => {
    // Prevent multiple initializations
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    
    let isMounted = true;
    
    const initializeAuth = async () => {
      console.log('[AuthContext] Starting auth initialization', { initialToken: !!initialToken });
      
      try {
        // If we have an initial token from SSR, validate it first
        if (initialToken) {
          console.log('[AuthContext] Validating initial token from SSR');
          const isValid = await validateToken(initialToken);
          if (isValid && isMounted) {
            console.log('[AuthContext] Initial token is valid, fetching user data');
            // Get user data from the token
            const userData = await fetch('/api/auth/me', {
              credentials: 'include',
            });
            
            if (userData.ok && isMounted) {
              const userInfo = await userData.json();
              setUser(userInfo.user);
              setToken(initialToken);
              localStorage.setItem('authToken', initialToken);
              localStorage.setItem('user', JSON.stringify(userInfo.user));
              setIsLoading(false);
              console.log('[AuthContext] Auth initialized successfully with SSR token');
              return;
            } else {
              console.log('[AuthContext] Failed to fetch user data with SSR token:', userData.status);
            }
          } else {
            console.log('[AuthContext] Initial token is invalid');
          }
        }

        // If no initial token or invalid, try to get from HTTP-only cookie
        console.log('[AuthContext] Trying to get auth from HTTP-only cookie');
        const cookieResponse = await fetch('/api/auth/me', {
          credentials: 'include',
        });

        if (cookieResponse.ok && isMounted) {
          const userData = await cookieResponse.json();
          setUser(userData.user);
          setToken(userData.token);
          localStorage.setItem('authToken', userData.token);
          localStorage.setItem('user', JSON.stringify(userData.user));
          setIsLoading(false);
          console.log('[AuthContext] Auth initialized successfully from cookie');
          return;
        } else {
          console.log('[AuthContext] No valid auth in cookie:', cookieResponse.status);
        }

        // Fallback to localStorage (client-side)
        console.log('[AuthContext] Trying localStorage fallback');
        const storedToken = localStorage.getItem('authToken');
          const storedUser = localStorage.getItem('user');
        
        if (storedToken && storedUser && isMounted) {
          const parsedUser = JSON.parse(storedUser);
          
          // Validate the stored token
          const isValid = await validateToken(storedToken);
          
          if (isValid && isMounted) {
            setUser(parsedUser);
            setToken(storedToken);
            console.log('[AuthContext] Auth initialized successfully from localStorage');
          } else {
            console.log('[AuthContext] Stored token is invalid, trying refresh');
            // Try to refresh the token
            const refreshSuccess = await refreshToken();
            if (!refreshSuccess && isMounted) {
              console.log('[AuthContext] Token refresh failed, clearing auth state');
            // Clear invalid state
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            } else {
              console.log('[AuthContext] Token refreshed successfully');
            }
          }
        } else {
          console.log('[AuthContext] No stored auth found in localStorage');
        }
      } catch (error) {
        console.error('[AuthContext] Auth initialization error:', error);
        // Clear potentially corrupted state
        if (isMounted) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        }
      } finally {
        if (isMounted) {
        setIsLoading(false);
          console.log('[AuthContext] Auth initialization complete');
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - only run once on mount

  // Auto-refresh token before expiration
  useEffect(() => {
    if (!token) return;

    const tokenRefreshInterval = setInterval(async () => {
      const refreshSuccess = await refreshToken();
      if (!refreshSuccess) {
        // If refresh fails, logout user
        await logout();
      }
    }, 14 * 60 * 1000); // Refresh every 14 minutes (assuming 15-minute token expiry)

    return () => clearInterval(tokenRefreshInterval);
  }, [token, refreshToken]);

  // Login function
  const login = useCallback(async (newToken: string, newUser: User) => {
    try {
    // Save to state
    setToken(newToken);
    setUser(newUser);
    
    // Save to localStorage
    localStorage.setItem('authToken', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    
    // Save to HTTP-only cookie via API call
      await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: newToken }),
      });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
    // Clear state
    setToken(null);
    setUser(null);
    
    // Clear localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    // Clear HTTP-only cookie via API call
      await fetch('/api/auth/logout', {
      method: 'POST',
    });
    
    // Redirect to login
    router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if API call fails, clear local state
      setToken(null);
      setUser(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      router.push('/login');
    }
  }, [router]);

  // Update user function
  const updateUser = useCallback((userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  }, [user]);

  // Permission check function
  const hasPermission = useCallback((permission: string): boolean => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission);
  }, [user]);

  const contextValue: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token,
    isLoading: isLoading || isRefreshing,
    login,
    logout,
    refreshToken,
    updateUser,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 