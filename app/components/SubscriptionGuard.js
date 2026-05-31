'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '../../lib/supabase'

const PUBLIC_PATHS = ['/', '/login', '/subscribe', '/signup']

export default function SubscriptionGuard({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/api')) {
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
        .select('subscription_status')
        .eq('id', user.id)
        .single()

      const activeStatuses = ['active', 'trialing']

      if (!profile || !activeStatuses.includes(profile.subscription_status)) {
        router.push('/subscribe')
        return
      }

      setChecking(false)
    }

    check()
  }, [pathname])

  if (checking && !PUBLIC_PATHS.includes(pathname)) {
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