import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public paths that do not require auth
const PUBLIC_PATHS = ["/", "/demo", "/login", "/signup", "/logout", "/legal"];

function isPublicPath(path: string) {
  if (path === "/") return true;
  for (const p of PUBLIC_PATHS) {
    if (path === p) return true;
    if (path.startsWith(p + "/")) return true;
  }
  // Also allow static assets and API routes
  if (path.startsWith("/_next") || path.startsWith("/api") || path.includes(".")) {
    return true;
  }
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // If this is a demo-prefixed app route like /demo/overview,
  // rewrite it to the corresponding internal path (/overview) so the
  // same app pages render, while keeping the browser URL as /demo/overview.
  // We skip rewriting the /demo root itself.
  if (pathname.startsWith('/demo') && pathname !== '/demo' && pathname !== '/demo/') {
    // avoid rewriting static or api routes accidentally
    if (!pathname.startsWith('/demo/_next') && !pathname.startsWith('/demo/api')) {
      const target = pathname.replace(/^\/demo/, '') || '/';
      const url = req.nextUrl.clone();
      url.pathname = target;
      return NextResponse.rewrite(url);
    }
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Check for auth by calling backend session endpoint
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  if (apiUrl) {
    try {
      const response = await fetch(`${apiUrl}/auth/session`, {
        headers: {
          cookie: req.headers.get('cookie') || '',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.user || data.authenticated) {
          return NextResponse.next();
        }
      }
    } catch (error) {
      // If backend is down, fall back to cookie check
      console.warn('Auth backend check failed, falling back to cookie check');
    }
  }

  // Fallback: Check for auth cookie
  const cookies = req.cookies;
  if (cookies.get('ls_session') || cookies.get('ls_jwt') || cookies.get('session')) {
    return NextResponse.next();
  }

  // Redirect to login with return URL
  const loginUrl = new URL('/login', req.url);
  if (pathname !== '/login') {
    loginUrl.searchParams.set('redirect', pathname);
  }
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
};
