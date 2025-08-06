# Deployment Guide for Brandwell

## Environment Variables

Ensure the following environment variables are set in your Vercel project:

```
NEXT_PUBLIC_API_BASE_URL=https://coupon-app-backend.vercel.app
NEXT_PUBLIC_SITE_URL=https://your-vercel-app-name.vercel.app
NEXT_PUBLIC_IMAGE_DOMAIN=coupon-app-image.s3.us-east-1.amazonaws.com
NEXT_PUBLIC_API_TIMEOUT=30000
```

## Deployment Steps

1. **Push your code to GitHub**

2. **Connect to Vercel**
   - Log in to Vercel and import your GitHub repository
   - Configure the project settings
   - Set the environment variables as listed above

3. **Build Settings**
   - Framework Preset: Next.js
   - Build Command: `next build`
   - Output Directory: `.next`

4. **Troubleshooting Common Issues**

   - **API Connection Issues**: Ensure `NEXT_PUBLIC_API_BASE_URL` is correctly set to your backend API URL
   - **Image Optimization**: If you encounter issues with images, try setting `unoptimized: true` in your Next.js config for production
   - **Data Fetching**: Make sure all data fetching methods use the correct base URL
   - **Environment Variables**: Verify that all environment variables are correctly set in Vercel

5. **Verifying Deployment**
   - Check that all routes work correctly
   - Verify that data is being fetched properly
   - Test authentication if applicable

## Common Issues and Solutions

### Pages Not Loading Data

If pages are not loading data correctly in production but work fine locally:

1. Check browser console for errors
2. Verify that API calls are using the correct base URL
3. Ensure environment variables are properly set in Vercel
4. Check that server-side data fetching is using the correct API URL

### Image Loading Issues

If images are not loading correctly:

1. Verify that the image domains are correctly configured in `next.config.js`
2. Check that image URLs are correctly formatted
3. Consider using `unoptimized: true` for image optimization in production

### API Connection Issues

If API connections are failing:

1. Verify that CORS is properly configured on your backend
2. Check that the API base URL is correctly set
3. Ensure that authentication tokens are being properly passed