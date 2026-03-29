import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/login', '/register']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes through without any session check
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Redirect root to login (or dashboard if session exists — handled by root page)
  if (pathname === '/') {
    return NextResponse.next()
  }

  // Check for the session cookie existence (iron-session stores it as "rekru-session").
  // We only check if the cookie exists here — full validation (user existence, status,
  // org membership) happens in the layout via getOrgContext().
  const sessionCookie = request.cookies.get('rekru-session')

  if (!sessionCookie?.value) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf|eot)$|api/).*)',
  ],
}
