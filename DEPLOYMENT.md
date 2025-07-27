# Deployment Guide

## Vercel Deployment Setup

### Environment Variables

To fix the "connect ECONNREFUSED 127.0.0.1:3000" error when deploying to Vercel, you need to set the following environment variables in your Vercel project settings:

1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add the following variables:

#### Required Variables:

```
NEXT_PUBLIC_BACKEND_URL=https://coupon-app-backend.vercel.app
JWT_SECRET=your_secure_jwt_secret_here
```

#### Optional Variables:

```
NODE_ENV=production
```

### What This Fixes

- **ECONNREFUSED Error**: The app was trying to connect to localhost:3000 in production
- **Backend URL**: Now uses environment variables to point to the correct production backend
- **Centralized Configuration**: All API calls use the same configuration

### Files Updated

- `src/lib/config.ts` - Centralized backend configuration
- `src/app/api/*/route.ts` - All API routes now use environment variables
- `src/components/blog/BlogForm.tsx` - Upload endpoint uses config
- `src/app/Coupons/page.tsx` - API calls use config
- `src/lib/serverData.ts` - Server-side data fetching uses config

### Testing

After setting the environment variables:

1. Redeploy your Vercel project
2. Test the following endpoints:
   - `/api/proxy-stores`
   - `/api/proxy-categories`
   - `/api/blogs`
   - Blog creation and editing

The app should now work correctly in production without localhost connection errors.
