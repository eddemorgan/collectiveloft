'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import ReAccept from './ReAccept'
import { LEGAL_VERSION } from '../../lib/legal'

// Pages a logged-out visitor may see. Matched exactly.
const PUBLIC_PATHS = ['/', '/login', '/subscribe', '/signup', '/onboarding', '/student/verify', '/students', '/browse', '/how-it-works', '/morgan-collective', '/help', '/about', '/guide', '/Collective_Loft_User_Guide.pdf']

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

// Named for what it used to do. It no longer guards a subscription: it keeps
// logged-out visitors out of member pages and pushes half-finished profiles
// back to onboarding.
export default function SubscriptionGuard({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)
  const [reaccept, setReaccept] = useState(null) // profile row, when re-consent is due

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
        .select('id, disciplines, terms_version, marketing_opt_in')
        .eq('id', user.id)
        .single()

      // No paywall here any more. Membership decides what you can START, not
      // whether you can be here: posting a brief and reaching out first are the
      // paid actions, gated at their own buttons and enforced by the insert
      // policies on briefs and collab_terms. A free member is a real member,
      // and locking them out would empty the room of exactly the people the
      // paying members come here to find. See lib/membership.js.

      // Discipline is what the platform runs on: Discover, Matching, and
      // Briefs all key off it, and a profile without one cannot be found.
      // Signup creates the profile row, so a member who abandons onboarding
      // reaches the platform empty. Send them back until they finish.
      const hasDiscipline = profile && Array.isArray(profile.disciplines) && profile.disciplines.length > 0
      if (!hasDiscipline) {
        router.push('/onboarding?onboarding=true')
        return
      }

      // Re-consent gate. LEGAL_VERSION is a date, so the version string itself
      // says when it takes effect: once that day arrives, every member who
      // consented to an older version sees the re-accept screen exactly once.
      // Until the day arrives, nobody is interrupted.
      const inForce = Date.now() >= Date.parse(LEGAL_VERSION + 'T00:00:00Z')
      if (inForce && profile && profile.terms_version !== LEGAL_VERSION) {
        setReaccept(profile)
        setChecking(false)
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

  if (reaccept) {
    return <ReAccept profile={reaccept} onDone={() => setReaccept(null)} />
  }

  return children
}
