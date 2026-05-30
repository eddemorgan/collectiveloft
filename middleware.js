import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  const res = NextResponse.next()
  const { pathname } = req.nextUrl

  const publicPaths = ['/', '/login', '/subscribe']
  if (
    publicPaths.includes(pathname) ||
    pathname.startsWith('/api/stripe') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return res
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status')
    .eq('id', user.id)
    .single()

  const activeStatuses = ['active', 'trialing']

  if (!profile || !activeStatuses.includes(profile.subscription_status)) {
    return NextResponse.redirect(new URL('/subscribe', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|fonts|images).*)'],
}