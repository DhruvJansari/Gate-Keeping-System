import { NextResponse } from 'next/server';

export function middleware(request) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Function to decode JWT payload safely (works in Edge Runtime)
  const decodeToken = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  const payload = token ? decodeToken(token) : null;
  const role = payload?.roleName; // Note: payload uses roleName as per login route

  // Define role access rules
  // Admin/SuperAdmin can access everything under /admin
  // Gatekeeper can only access /gatekeeper
  // Others similarly
  
  // API Protection
  if (pathname.startsWith('/api')) {
    // We allow pass-through for APIs because they validate the Authorization header themselves.
    // The strict cookie check breaks the frontend which relies on localStorage tokens.
    // Future improvement: Validate Authorization header in middleware if needed.
    return NextResponse.next();
  }

  // Role Access Rules for Pages
  if (pathname.startsWith('/admin')) {
    if (!role || (role !== 'Admin' && role !== 'SuperAdmin')) {
       if (role === 'Gatekeeper') {
         return NextResponse.redirect(new URL('/gatekeeper', request.url));
       }
       return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  if (pathname.startsWith('/gatekeeper')) {
    if (!role || role !== 'Gatekeeper') {
       if (role === 'Admin' || role === 'SuperAdmin') {
         return NextResponse.redirect(new URL('/admin', request.url));
       }
       return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/gatekeeper/:path*',
    '/api/:path*',
  ],
};
