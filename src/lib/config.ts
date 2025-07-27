// Backend API configuration
export const BACKEND_CONFIG = {
  // Base URL for the backend API
  BASE_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'https://coupon-app-backend.vercel.app',
  
  // API endpoints
  ENDPOINTS: {
    BLOGS: '/api/blogs',
    STORES: '/api/stores',
    CATEGORIES: '/api/categories',
    COUPONS: '/api/coupons',
    UPLOAD: '/api/upload',
    AUTH: {
      LOGIN: '/api/auth/login',
      LOGOUT: '/api/auth/logout',
      VALIDATE: '/api/auth/validate',
      REFRESH: '/api/auth/refresh',
      ME: '/api/auth/me',
    }
  }
};

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${BACKEND_CONFIG.BASE_URL}${endpoint}`;
};

// Environment check
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production'; 