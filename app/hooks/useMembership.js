'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { isPaidMember } from '../../lib/membership'

// Tells a page whether the signed-in member is on the paid tier, so it can
// gate the two things membership pays for: reaching out, and posting a brief.
// Everything else on the platform is open to every member.
export function useMembership() {
  const [paid,    setPaid]    = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function check() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        if (!cancelled) { setPaid(false); setLoading(false) }
        return
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status, comped_until')
        .eq('id', session.user.id)
        .single()

      if (!cancelled) {
        setPaid(isPaidMember(profile))
        setLoading(false)
      }
    }
    check()

    return () => { cancelled = true }
  }, [])

  return { paid, loading }
}
