import { NextResponse } from 'next/server'
import { auth } from './src/lib/auth'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl
  const role = req.auth?.user?.role

  // Public paths
  if (pathname.startsWith('/api/auth') || pathname.startsWith('/api/cron') || pathname.startsWith('/api/mobile') || pathname === '/login') {
    if (isLoggedIn && pathname === '/login') {
      // Redirect to correct dashboard if trying to access login while logged in
      if (role === 'PHOTOGRAPHER') return NextResponse.redirect(new URL('/photographer', req.url))
      if (role === 'PUBLISHER') return NextResponse.redirect(new URL('/publisher', req.url))
      if (role === 'MANAGER') return NextResponse.redirect(new URL('/manager', req.url))
    }
    return NextResponse.next()
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Root redirect
  if (pathname === '/') {
    if (role === 'PHOTOGRAPHER') return NextResponse.redirect(new URL('/photographer', req.url))
    if (role === 'PUBLISHER') return NextResponse.redirect(new URL('/publisher', req.url))
    if (role === 'MANAGER') return NextResponse.redirect(new URL('/manager', req.url))
  }

  // Role based protection
  if (pathname.startsWith('/photographer') && role !== 'PHOTOGRAPHER') {
    return NextResponse.redirect(new URL('/', req.url))
  }
  
  if (pathname.startsWith('/publisher') && role !== 'PUBLISHER' && role !== 'MANAGER') {
    // We let managers see publisher things maybe, but let's restrict for now
    if (role !== 'PUBLISHER') return NextResponse.redirect(new URL('/', req.url))
  }

  if (pathname.startsWith('/manager') && role !== 'MANAGER') {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
