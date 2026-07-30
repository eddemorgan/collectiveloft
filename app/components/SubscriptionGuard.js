'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '../../lib/supabase'

// Pages a logged-out visitor may see. Matched exactly.
const PUBLIC_PATHS = ['/', '/login', '/subscribe', '/signup', '/onboarding', '/browse', '/how-it-works', '/morgan-collective', '/help', '/about', '/guide', '/Collective_Loft_User_Guide.pdf']

// Whole public sections, matched by prefix. An exact-match list cannot cover
// these: /blog/some-post is never equal to /blog, so every post and every
// legal page would bounce a logged-out reader, and every search crawler, to
// the login screen. The blog lives on main and arrives at the merge; the
// prefix is here now so the guard and the pages agree the moment they meet.
const PUBLIC_PREFIXES = ['/legal', '/blog', '/faq']

function isPublic(pathname) {
  if (!pathname) return false
  if (PUBLIC_PATHS.includes(pathname)) return true
  if (pathname.startsWith('/api')) return true
  return PUBLIC_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))
}

export default function SubscriptionGuard({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (isPublic(pathname)) {
      setChecking(false)
      return
    }

    async function check() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status, comped_until')
        .eq('id', user.id)
        .single()

      const activeStatuses = ['active', 'trialing']
      const subscribed = profile && activeStatuses.includes(profile.subscription_status)
      // A founding member with an active comp gets full access and never sees
      // the paywall while the comp lasts. At day 90 the comp lapses and normal
      // subscription rules apply, which is when the add-a-card flow begins.
      const comped = profile && profile.comped_until && new Date(profile.comped_until) > new Date()

      if (!subscribed && !comped) {
        router.push('/subscribe')
        return
      }

      setChecking(false)
    }

    check()
  }, [pathname])

  if (checking && !isPublic(pathname)) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--background)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ color: 'var(--cream-muted)', fontSize: '0.9rem' }}>Loading...</div>
      </div>
    )
  }

  return children
}
