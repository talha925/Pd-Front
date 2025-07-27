import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Function to verify JWT token
async function verifyToken(token: string) {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default_secret_replace_in_production');
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('authToken')?.value;
  const { pathname } = req.nextUrl;

  // Define protected routes
  const protectedRoutes = [
    '/blog/create',
    '/admin',
    '/blog/edit',
  ];

  // Define admin-only routes
  const adminRoutes = [
    '/admin',
  ];

  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Verify the token
    const payload = await verifyToken(token);
    if (!payload) {
      // Clear invalid token and redirect to login
      const response = NextResponse.redirect(new URL('/login', req.url));
      response.cookies.delete('authToken');
      return response;
    }

    // Check admin permissions for admin routes
    if (isAdminRoute && payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return NextResponse.next();
}

// Configure which paths the middleware will run on
export const config = {
  matcher: [
    '/blog/create',
    '/blog/create/:path*',
  ],
}; 