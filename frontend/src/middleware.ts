// frontend/src/middleware.ts
// AutoPilot Template — protect the full workspace except the public dashboard routes.

import { getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'

const PROTECTED_PATHS = ['/workbench', '/ai/manager', '/ai/policies', '/ai/insights', '/settings']

function isProtectedPath(pathname: string) {
  return PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/api/auth') || pathname.startsWith('/auth')) {
    return NextResponse.next()
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET || 'dev-secret-change-me' })

  if (isProtectedPath(pathname) && !token) {
    const signInUrl = new URL('/auth/signin', request.url)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.ico).*)',
  ],
}
