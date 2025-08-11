'use client';

import { useAuth } from '@/context/AuthContext';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface UseOptimizedAuthOptions {
  redirectTo?: string;
  redirectIfAuthenticated?: boolean;
  requireAuth?: boolean;
  permissions?: string[];
}

interface UseOptimizedAuthReturn {
  // Auth state
  user: any;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Auth actions
  login: (token: string, user: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  
  // Permission checks
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  
  // Session management
  isSessionExpired: boolean;
  sessionTimeRemaining: number;
  extendSession: () => Promise<boolean>;
  
  // Offline support
  isOnline: boolean;
  syncOfflineActions: () => Promise<void>;
  
  // Redirect helpers
  redirectToLogin: () => void;
  redirectToHome: () => void;
}

export function useOptimizedAuth(options: UseOptimizedAuthOptions = {}): UseOptimizedAuthReturn {
  const {
    redirectTo,
    redirectIfAuthenticated = false,
    requireAuth = false,
    permissions = [],
  } = options;

  const auth = useAuth();
  const router = useRouter();
  const sessionTimeoutRef = useRef<NodeJS.Timeout>();
  const offlineActionsRef = useRef<Array<{ action: string; data: any; timestamp: number }>>([]);
  const isOnlineRef = useRef(navigator.onLine);

  // Session management
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(0);

  // Online/offline detection
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
    }

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
        sessionTimeoutRef.current = setTimeout(updateTimer, 1000);
      }
    };

    updateTimer();
  }, [auth.token]);

  // Extend session
  const extendSession = useCallback(async () => {
    const success = await auth.refreshToken();
    if (success) {
      setIsSessionExpired(false);
      startSessionTimer();
    }
    return success;
  }, [auth.refreshToken, startSessionTimer]);

  // Offline action queue
  const queueOfflineAction = useCallback((action: string, data: any) => {
    offlineActionsRef.current.push({
      action,
      data,
      timestamp: Date.now(),
    });
    
    // Store in localStorage for persistence
    localStorage.setItem('offlineActions', JSON.stringify(offlineActionsRef.current));
  }, []);

  // Sync offline actions when back online
  const syncOfflineActions = useCallback(async () => {
    if (!isOnline || !auth.isAuthenticated) return;

    const actions = offlineActionsRef.current;
    if (actions.length === 0) return;

    console.log(`[useOptimizedAuth] Syncing ${actions.length} offline actions`);

    for (const action of actions) {
      try {
        // Process each offline action
        switch (action.action) {
          case 'create_blog':
            // await createBlog(action.data);
            break;
          case 'update_profile':
            // await updateProfile(action.data);
            break;
          // Add more action types as needed
        }
      } catch (error) {
        console.error(`Failed to sync action ${action.action}:`, error);
      }
    }

    // Clear processed actions
    offlineActionsRef.current = [];
    localStorage.removeItem('offlineActions');
  }, [isOnline, auth.isAuthenticated]);

  // Redirect helpers
  const redirectToLogin = useCallback(() => {
    const returnUrl = encodeURIComponent(window.location.pathname);
    router.push(`/login?returnUrl=${returnUrl}`);
  }, [router]);

  const redirectToHome = useCallback(() => {
    router.push('/');
  }, [router]);

  // Enhanced login with offline support
  const login = useCallback(async (token: string, user: any) => {
    await auth.login(token, user);
    startSessionTimer();
    setIsSessionExpired(false);
  }, [auth.login, startSessionTimer]);

  // Enhanced logout with cleanup
  const logout = useCallback(async () => {
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
    }
    offlineActionsRef.current = [];
    localStorage.removeItem('offlineActions');
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

    // Load offline actions from localStorage
    const storedActions = localStorage.getItem('offlineActions');
    if (storedActions) {
      try {
        offlineActionsRef.current = JSON.parse(storedActions);
      } catch (error) {
        console.error('Failed to parse offline actions:', error);
      }
    }

    return () => {
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }
    };
  }, [auth.isAuthenticated, startSessionTimer]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      isOnlineRef.current = true;
      syncOfflineActions();
    };

    const handleOffline = () => {
      setIsOnline(false);
      isOnlineRef.current = false;
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncOfflineActions]);

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
    
    // Permission checks
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    
    // Session management
    isSessionExpired,
    sessionTimeRemaining,
    extendSession,
    
    // Offline support
    isOnline,
    syncOfflineActions,
    
    // Redirect helpers
    redirectToLogin,
    redirectToHome,
  };
} 