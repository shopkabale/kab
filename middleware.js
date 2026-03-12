import { NextResponse } from 'next/server';

export function middleware(request) {
  // 1. Check if the user is trying to access an /admin route
  if (request.nextUrl.pathname.startsWith('/admin')) {
    
    // 2. Check for our custom admin cookie
    const hasAdminCookie = request.cookies.get('kabale_admin_session')?.value === 'true';

    // 3. If the cookie is missing, instantly bounce them to the home page
    if (!hasAdminCookie) {
      // You can redirect them to '/' or a custom '/unauthorized' page
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Otherwise, let them proceed normally
  return NextResponse.next();
}

// 4. Tell Next.js to ONLY run this middleware on /admin routes to save performance
export const config = {
  matcher: ['/admin/:path*'],
};
