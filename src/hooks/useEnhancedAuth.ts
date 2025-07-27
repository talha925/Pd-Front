'use client';

import { useAuth } from '@/context/AuthContext';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface UseEnhancedAuthOptions {
  redirectTo?: string;
  redirectIfAuthenticated?: boolean;
  requireAuth?: boolean;
  permissions?: string[];
}

interface UseEnhancedAuthReturn {
  // Auth state
  user: any;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Auth actions
  login: (token: string, user: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  
  // Enhanced permission checks
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  
  // Session management
  isSessionExpired: boolean;
  sessionTimeRemaining: number;
  extendSession: () => Promise<boolean>;
  
  // Redirect helpers
  redirectToLogin: () => void;
  redirectToHome: () => void;
}

export function useEnhancedAuth(options: UseEnhancedAuthOptions = {}): UseEnhancedAuthReturn {
  const {
    redirectTo,
    redirectIfAuthenticated = false,
    requireAuth = false,
    permissions = [],
  } = options;

  const auth = useAuth();
  const router = useRouter();

  // Session management
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(0);

  // Enhanced permission checks
  const hasPermission = useCallback((permission: string): boolean => {
    if (!auth.user?.permissions) return false;
    return auth.user.permissions.includes(permission);
  }, [auth.user?.permissions]);

  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  }, [hasPermission]);

  const hasAllPermissions = useCallback((permissions: string[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  }, [hasPermission]);

  // Session timeout management
  const startSessionTimer = useCallback(() => {
    if (!auth.token) return;

    // Set session timeout to 14 minutes (same as token refresh)
    const sessionDuration = 14 * 60 * 1000;
    const startTime = Date.now();

    const updateTimer = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, sessionDuration - elapsed);
      
      setSessionTimeRemaining(remaining);
      
      if (remaining <= 0) {
        setIsSessionExpired(true);
      } else {
        setTimeout(updateTimer, 1000);
      }
    };

    updateTimer();
  }, [auth.token]);

  // Extend session
  const extendSession = useCallback(async (): Promise<boolean> => {
    const success = await auth.refreshToken();
    if (success) {
      setIsSessionExpired(false);
      startSessionTimer();
    }
    return success;
  }, [auth.refreshToken, startSessionTimer]);

  // Redirect helpers
  const redirectToLogin = useCallback(() => {
    const returnUrl = encodeURIComponent(window.location.pathname);
    router.push(`/login?returnUrl=${returnUrl}`);
  }, [router]);

  const redirectToHome = useCallback(() => {
    router.push('/');
  }, [router]);

  // Enhanced login with session timer
  const login = useCallback(async (token: string, user: any) => {
    await auth.login(token, user);
    startSessionTimer();
    setIsSessionExpired(false);
  }, [auth.login, startSessionTimer]);

  // Enhanced logout with cleanup
  const logout = useCallback(async () => {
    setIsSessionExpired(false);
    setSessionTimeRemaining(0);
    await auth.logout();
  }, [auth.logout]);

  // Effects
  useEffect(() => {
    // Start session timer when authenticated
    if (auth.isAuthenticated) {
      startSessionTimer();
    }
  }, [auth.isAuthenticated, startSessionTimer]);

  // Auto-redirect logic
  useEffect(() => {
    if (auth.isLoading) return;

    if (requireAuth && !auth.isAuthenticated) {
      redirectToLogin();
      return;
    }

    if (redirectIfAuthenticated && auth.isAuthenticated) {
      redirectToHome();
      return;
    }

    if (permissions.length > 0 && !hasAnyPermission(permissions)) {
      redirectToLogin();
      return;
    }
  }, [
    auth.isLoading,
    auth.isAuthenticated,
    requireAuth,
    redirectIfAuthenticated,
    permissions,
    hasAnyPermission,
    redirectToLogin,
    redirectToHome,
  ]);

  return {
    // Auth state
    user: auth.user,
    token: auth.token,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    
    // Auth actions
    login,
    logout,
    refreshToken: auth.refreshToken,
    
    // Enhanced permission checks
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    
    // Session management
    isSessionExpired,
    sessionTimeRemaining,
    extendSession,
    
    // Redirect helpers
    redirectToLogin,
    redirectToHome,
  };
} 