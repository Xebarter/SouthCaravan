import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const PROTECTED_PREFIXES = ['/buyer', '/vendor', '/services']
const ADMIN_PREFIX = '/admin'

const ADMIN_AUTH_DISABLED =
  process.env.DISABLE_ADMIN_AUTH === 'true' || process.env.DISABLE_ADMIN_AUTH === '1'

function isProtectedPath(pathname: string) {
  if (pathname.startsWith('/buyer/services')) return false
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

function inferRoleFromPath(pathname: string) {
  if (pathname.startsWith('/admin')) return 'admin'
  if (pathname.startsWith('/buyer')) return 'buyer'
  if (pathname.startsWith('/vendor')) return 'vendor'
  if (pathname.startsWith('/services')) return 'services'
  return 'buyer'
}

function hasAdminAccess(user: any) {
  const meta = user?.app_metadata ?? {}
  if (meta.role === 'admin') return true
  const roles = Array.isArray(meta.roles) ? meta.roles : []
  return roles.includes('admin')
}

function hasVendorAccess(user: any) {
  const meta = user?.app_metadata ?? {}
  if (meta.role === 'vendor') return true
  const roles = Array.isArray(meta.roles) ? meta.roles : []
  return roles.includes('vendor')
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  const url = request.nextUrl.clone()
  const pathname = url.pathname
  const search = url.search

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // If Supabase env is missing, we still enforce that protected routes cannot be
    // accessed anonymously (production should always have these env vars).
    if (isProtectedPath(pathname)) {
      const role = inferRoleFromPath(pathname)
      const authUrl = request.nextUrl.clone()
      authUrl.pathname = '/auth'
      authUrl.searchParams.set('role', role)
      authUrl.searchParams.set('next', `${pathname}${search}`)
      authUrl.searchParams.set('error', 'auth_unavailable')
      return NextResponse.redirect(authUrl)
    }
    return response
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        for (const cookie of cookiesToSet) {
          response.cookies.set(cookie)
        }
      },
    },
  })

  const code = url.searchParams.get('code')
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.searchParams.delete('code')
      const redirectResponse = NextResponse.redirect(redirectUrl)
      // Forward any Set-Cookie from the exchange.
      for (const cookie of response.cookies.getAll()) {
        redirectResponse.cookies.set(cookie)
      }
      return redirectResponse
    }
  }

  const { data } = await supabase.auth.getUser()
  const user = data.user

  const isAdminPath = pathname === ADMIN_PREFIX || pathname.startsWith(`${ADMIN_PREFIX}/`)
  const isProtected = isProtectedPath(pathname)
  const isVendorPath = pathname === '/vendor' || pathname.startsWith('/vendor/')

  if (!user && isProtected) {
    const role = inferRoleFromPath(pathname)
    const authUrl = request.nextUrl.clone()
    authUrl.pathname = '/auth'
    authUrl.searchParams.set('role', role)
    authUrl.searchParams.set('next', `${pathname}${search}`)
    return NextResponse.redirect(authUrl)
  }

  if (user && isVendorPath && !hasVendorAccess(user)) {
    const authUrl = request.nextUrl.clone()
    authUrl.pathname = '/auth'
    authUrl.searchParams.set('role', 'vendor')
    authUrl.searchParams.set('next', '/vendor')
    authUrl.searchParams.set('error', 'vendor_required')
    return NextResponse.redirect(authUrl)
  }

  if (!user && isAdminPath && !ADMIN_AUTH_DISABLED) {
    const authUrl = request.nextUrl.clone()
    authUrl.pathname = '/auth'
    authUrl.searchParams.set('role', 'admin')
    authUrl.searchParams.set('next', `${pathname}${search}`)
    return NextResponse.redirect(authUrl)
  }

  if (user && isAdminPath && !hasAdminAccess(user) && !ADMIN_AUTH_DISABLED) {
    const authUrl = request.nextUrl.clone()
    authUrl.pathname = '/auth'
    authUrl.searchParams.set('role', 'admin')
    authUrl.searchParams.set('next', '/admin')
    authUrl.searchParams.set('error', 'admin_required')
    return NextResponse.redirect(authUrl)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon\\.svg|.*\\.(?:png|jpg|jpeg|gif|webp|svg)$).*)'],
}

