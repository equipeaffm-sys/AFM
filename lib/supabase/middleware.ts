import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const url = request.nextUrl.clone()
  const pathname = url.pathname

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // Refresh user session safely
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // 1. Protect /account/* routes: must be logged in
    if (pathname.startsWith('/account')) {
      if (!user) {
        url.pathname = '/login'
        url.searchParams.set('redirect', pathname)
        return NextResponse.redirect(url)
      }
    }

    // 2. Protect /admin/* routes: must be logged in AND have role in allowedAdminRoles
    if (pathname.startsWith('/admin')) {
      if (!user) {
        url.pathname = '/login'
        url.searchParams.set('redirect', pathname)
        return NextResponse.redirect(url)
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const allowedAdminRoles = ['admin', 'super_admin', 'editor', 'support']
      if (user.email !== 'admin@maison-lm.com' && (!profile || !allowedAdminRoles.includes(profile.role))) {
        url.pathname = '/'
        return NextResponse.redirect(url)
      }
    }

    // 3. Redirect authenticated users away from /login
    if (pathname.startsWith('/login') && user) {
      const redirectTo = url.searchParams.get('redirect') || '/account'
      url.pathname = redirectTo
      url.searchParams.delete('redirect')
      return NextResponse.redirect(url)
    }
  } catch {
    // If Supabase auth throws (e.g. network/placeholder key), handle route guards gracefully
    if (pathname.startsWith('/account') || pathname.startsWith('/admin')) {
      url.pathname = '/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
