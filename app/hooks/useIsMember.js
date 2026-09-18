'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

// One rule for every public page: a member is never asked to join. This hook
// is the shared answer to "is someone signed in", so each public nav and CTA
// can offer the platform instead of the signup form. Defaults to false, which
// means a member sees the visitor version for the blink before the session
// loads. That bias is deliberate: the pages must be right for the ad click
// and the search visitor first.
export function useIsMember() {
  const [state, setState] = useState({ member: false, profileHref: '/onboarding' })
  useEffect(() => {
    let cancelled = false
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled || !session?.user) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('firstname, lastname')
        .eq('id', session.user.id)
        .maybeSingle()
      if (cancelled) return
      setState({
        member: true,
        profileHref: profile?.firstname
          ? `/profile/${profile.firstname.toLowerCase()}-${(profile.lastname || '').toLowerCase()}`
          : '/onboarding',
      })
    })
    return () => { cancelled = true }
  }, [])
  return state
}
