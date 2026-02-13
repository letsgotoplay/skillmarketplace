import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Allow the request to proceed
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Public routes that don't require authentication
        const publicPaths = ['/', '/login', '/register', '/marketplace', '/docs'];
        if (publicPaths.some((path) => pathname.startsWith(path))) {
          return true;
        }

        // Public API routes (they handle their own authentication)
        if (pathname.startsWith('/api/skills') && pathname.includes('/feedback')) {
          return true;
        }

        // API routes for authentication
        if (pathname.startsWith('/api/auth')) {
          return true;
        }

        // Static files
        if (
          pathname.startsWith('/_next') ||
          pathname.startsWith('/favicon') ||
          pathname.includes('.')
        ) {
          return true;
        }

        // All other routes require authentication
        return !!token;
      },
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
