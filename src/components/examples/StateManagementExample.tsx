'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';
import { useAuthAwareGet } from '@/hooks/useAuthAwareDataFetching';

// Example component showing complete state management usage
export function StateManagementExample() {
  // Basic auth usage
  const { user, isAuthenticated, login, logout, hasPermission } = useAuth();
  
  // Theme management
  const { theme, setTheme, toggleTheme, resolvedTheme } = useTheme();
  
  // Global app state
  const { 
    state: { notifications, isLoading, preferences },
    addNotification,
    setLoading,
    updatePreferences
  } = useApp();
  
  // Enhanced auth with session management
  const {
    isSessionExpired,
    sessionTimeRemaining,
    extendSession,
    hasAnyPermission,
    hasAllPermissions
  } = useEnhancedAuth({
    requireAuth: true,
    permissions: ['read:blogs', 'write:blogs']
  });
  
  // Auth-aware data fetching
  const { data: blogs, loading: blogsLoading, error: blogsError } = useAuthAwareGet('/api/blogs', {
    refetchOnAuthReady: true
  });

  // Example handlers
  const handleLogin = async () => {
    setLoading(true);
    try {
      // Simulate login
      await login('fake-token', { id: '1', name: 'John Doe', email: 'john@example.com' });
      addNotification({
        type: 'success',
        title: 'Login Successful',
        message: 'Welcome back!'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Login Failed',
        message: 'Please try again'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    addNotification({
      type: 'info',
      title: 'Logged Out',
      message: 'Come back soon!'
    });
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    addNotification({
      type: 'success',
      title: 'Theme Updated',
      message: `Switched to ${newTheme} theme`
    });
  };

  const handlePreferenceUpdate = () => {
    updatePreferences({
      language: 'es',
      currency: 'EUR',
      notifications: {
        email: true,
        push: false,
        sms: true
      }
    });
  };

  // Session management
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isSessionExpired) {
    return (
      <div className="p-4 bg-yellow-100 border border-yellow-400 rounded">
        <h3 className="text-yellow-800 font-bold">Session Expired</h3>
        <p className="text-yellow-700">Your session has expired. Please extend it to continue.</p>
        <button 
          onClick={extendSession}
          className="mt-2 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          Extend Session
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">State Management Example</h1>
      
      {/* Authentication Section */}
      <section className="border rounded p-4">
        <h2 className="text-xl font-semibold mb-4">Authentication</h2>
        
        {isAuthenticated ? (
          <div className="space-y-2">
            <p><strong>User:</strong> {user?.name} ({user?.email})</p>
            <p><strong>Session Time:</strong> {formatTime(sessionTimeRemaining)}</p>
            <p><strong>Permissions:</strong> {user?.permissions?.join(', ') || 'None'}</p>
            
            <div className="space-x-2">
              <button 
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Logout
              </button>
              
              {hasPermission('admin') && (
                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">
                  Admin Access
                </span>
              )}
            </div>
          </div>
        ) : (
          <div>
            <p className="text-gray-600 mb-2">Not authenticated</p>
            <button 
              onClick={handleLogin}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Login
            </button>
          </div>
        )}
      </section>

      {/* Theme Section */}
      <section className="border rounded p-4">
        <h2 className="text-xl font-semibold mb-4">Theme Management</h2>
        
        <div className="space-y-2">
          <p><strong>Current Theme:</strong> {theme} ({resolvedTheme})</p>
          
          <div className="space-x-2">
            <button 
              onClick={() => handleThemeChange('light')}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              Light
            </button>
            <button 
              onClick={() => handleThemeChange('dark')}
              className="px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-900"
            >
              Dark
            </button>
            <button 
              onClick={() => handleThemeChange('system')}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              System
            </button>
            <button 
              onClick={toggleTheme}
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Toggle
            </button>
          </div>
        </div>
      </section>

      {/* Global State Section */}
      <section className="border rounded p-4">
        <h2 className="text-xl font-semibold mb-4">Global App State</h2>
        
        <div className="space-y-4">
          <div>
            <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
            <p><strong>Notifications:</strong> {notifications.length}</p>
            <p><strong>Language:</strong> {preferences.language}</p>
            <p><strong>Currency:</strong> {preferences.currency}</p>
          </div>
          
          <div className="space-x-2">
            <button 
              onClick={handlePreferenceUpdate}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Update Preferences
            </button>
            
            <button 
              onClick={() => addNotification({
                type: 'info',
                title: 'Test Notification',
                message: 'This is a test notification'
              })}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add Notification
            </button>
          </div>
        </div>
      </section>

      {/* Data Fetching Section */}
      <section className="border rounded p-4">
        <h2 className="text-xl font-semibold mb-4">Data Fetching</h2>
        
        <div className="space-y-2">
          <p><strong>Loading:</strong> {blogsLoading ? 'Yes' : 'No'}</p>
          <p><strong>Error:</strong> {blogsError || 'None'}</p>
          <p><strong>Blogs Count:</strong> {blogs?.data?.length || 0}</p>
          
          {blogsError && (
            <p className="text-red-600">Error loading blogs: {blogsError}</p>
          )}
          
          {blogs?.data && blogs.data.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold">Recent Blogs:</h3>
              <ul className="list-disc list-inside">
                {blogs.data.slice(0, 3).map((blog: any) => (
                  <li key={blog.id}>{blog.title}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* Permission Checks */}
      <section className="border rounded p-4">
        <h2 className="text-xl font-semibold mb-4">Permission Checks</h2>
        
        <div className="space-y-2">
          <p><strong>Can Read Blogs:</strong> {hasPermission('read:blogs') ? 'Yes' : 'No'}</p>
          <p><strong>Can Write Blogs:</strong> {hasPermission('write:blogs') ? 'Yes' : 'No'}</p>
          <p><strong>Has Any Blog Permission:</strong> {hasAnyPermission(['read:blogs', 'write:blogs']) ? 'Yes' : 'No'}</p>
          <p><strong>Has All Blog Permissions:</strong> {hasAllPermissions(['read:blogs', 'write:blogs']) ? 'Yes' : 'No'}</p>
        </div>
      </section>
    </div>
  );
} 