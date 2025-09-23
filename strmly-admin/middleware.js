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

  // Check for authentication token in request headers
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  
  // For API routes, check the Authorization header
  if (pathname.startsWith('/api/')) {
    if (!token) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }
    return NextResponse.next()
  }
  
  // For page routes, we'll let the client handle authentication
  // This prevents redirect loops when localStorage has a token but headers don't
  return NextResponse.next()
}

// Configure which routes this middleware should run on
export const config = {
  // Match all routes except static files and images
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * But include specific API auth routes
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
    