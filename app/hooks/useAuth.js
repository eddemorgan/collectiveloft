'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export function useAuth({ required = true } = {}) {
  const router = useRouter()
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function check() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session && required) {
        router.push('/login')
        return
      }
      setUser(session?.user || null)
      setLoading(false)
    }
    check()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && required) {
        router.push('/login')
        return
      }
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}