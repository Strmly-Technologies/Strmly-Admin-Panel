import { NextResponse } from 'next/server'

export function middleware(request) {
  // Get the pathname from the request
  const { pathname } = request.nextUrl

  // Define public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/login',
    '/api/auth/send-otp',
    '/api/auth/verify-otp',
    '/favicon.ico'
  ]

  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(route => pathname === route)

  // If it's a public route, allow access
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Check for authentication token in cookies
  const token = request.cookies.get('token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '')

  // For client-side routes, we need to check localStorage token differently
  // Since we can't access localStorage in middleware, we'll rely on a cookie or header
  
  // If no token is found, redirect to login
  if (!token) {
    // Create the login URL
    const loginUrl = new URL('/login', request.url)
    
    // Optionally add a redirect parameter to send user back after login
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname)
    }
    
    return NextResponse.redirect(loginUrl)
  }

  // If token exists, allow the request to continue
  return NextResponse.next()
}

// Configure which routes this middleware should run on
export const config = {
  // Match all routes except static files and images
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * But include specific API auth routes
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
