'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { canInitiate as canInitiateFn, membershipTier } from '../../lib/membership'

// Whether the signed-in member may start things: post a brief, or reach out
// first. Everything else on the platform is open to every member, so this is
// the only membership question the UI ever needs to ask.
//
// It is a courtesy, not a control. The insert policies on briefs and
// collab_terms are what actually enforce it; this exists so a free member sees
// an honest upgrade prompt instead of a button that fails.
//
// Defaults to allowing while loading, so a paid member never sees their own
// buttons flicker into an upgrade prompt on a slow connection. A free member
// who slips through the gap meets the database, which does not budge.
export function useMembership() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        if (!cancelled) { setProfile(null); setLoading(false) }
        return
      }
      const { data } = await supabase
        .from('profiles')
        .select('subscription_status, comped_until, student_until')
        .eq('id', user.id)
        .maybeSingle()
      if (!cancelled) { setProfile(data || null); setLoading(false) }
    }
    load()
    return () => { cancelled = true }
  }, [])

  return {
    loading,
    profile,
    canInitiate: loading ? true : canInitiateFn(profile),
    tier: membershipTier(profile),
  }
}
