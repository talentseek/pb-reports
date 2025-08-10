import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware()

export const config = {
  matcher: [
    // Protect all routes under /dashboard, /reports, /settings, and API routes
    '/((?!.+\.[\w]+$|_next).*)',
    '/',
    '/(api|trpc)(.*)'
  ],
}
