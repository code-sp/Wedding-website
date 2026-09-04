import { NextRequest, NextResponse } from 'next/server';

const API_BASE = `${process.env.SERVER_API_URL || 'http://localhost:3000'}/api`;
const publicPaths = new Set(['/login']);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API requests must reach the Next.js rewrite and then Express.
  // Express owns authentication/authorization for /api/*.
  if (pathname === '/api' || pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const isPublic = publicPaths.has(pathname);
  const accessToken = request.cookies.get('access_token')?.value;

  if (!accessToken) {
    if (isPublic) return NextResponse.next();
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const sessionResponse = await fetch(`${API_BASE}/session`, {
      headers: { cookie: request.headers.get('cookie') || '' },
      cache: 'no-store'
    });

    if (!sessionResponse.ok) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('access_token');
      response.cookies.delete('refresh_token');
      response.cookies.delete('csrf_token');
      return response;
    }

    const session = await sessionResponse.json();
    const complete = Boolean(session.user?.isProfileComplete);

    if (!complete && pathname !== '/onboarding') {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }

    if (complete && (pathname === '/onboarding' || pathname === '/login')) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
  } catch {
    if (isPublic) return NextResponse.next();
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/((?!api(?:/|$)|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)']
};
