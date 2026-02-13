import { NextRequest, NextResponse } from 'next/server'

/**
 * NH-1: Server-side auth guard middleware.
 *
 * Checks for the presence of the `laravel_session` cookie on protected routes.
 * If the cookie is missing, redirects to /login BEFORE any page content is rendered.
 * This prevents dashboard HTML/JS from being served to unauthenticated users.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check for auth cookie (Sanctum SPA session)
  const hasSession = request.cookies.has('laravel_session')

  // Protected routes: redirect to login if no session
  const protectedPaths = ['/dashboard', '/settings', '/profile', '/favorites', '/payments']
  const isProtectedRoute = protectedPaths.some(path => pathname.startsWith(path))

  if (isProtectedRoute && !hasSession) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Auth routes: redirect to dashboard if already logged in
  const authPaths = ['/login', '/register']
  const isAuthRoute = authPaths.some(path => pathname.startsWith(path))

  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/settings/:path*',
    '/profile/:path*',
    '/favorites/:path*',
    '/payments/:path*',
    '/login',
    '/register',
  ],
}
