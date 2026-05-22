'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function Nav() {
  const router   = useRouter()
  const pathname = usePathname()

  const [user,      setUser]      = useState(null)
  const [profile,   setProfile]   = useState(null)
  const [menuOpen,  setMenuOpen]  = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        loadProfile(session.user.id)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setProfile(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('firstname, lastname')
      .eq('id', userId)
      .single()
    setProfile(data)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const profileSlug = profile
    ? `${profile.firstname.toLowerCase()}-${profile.lastname.toLowerCase()}`
    : null

  const isActive = (href) => pathname === href

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.85rem 2rem',
      borderBottom: '0.5px solid var(--rule)',
      background: 'var(--bg)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <Link href="/" style={{
        fontFamily: 'var(--serif)',
        fontSize: '2.2rem',
        color: 'var(--cream)',
        textDecoration: 'none',
        lineHeight: 1,
      }}>
        Collective <span style={{ color: 'var(--gold)' }}>Loft</span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <Link href="/discover" style={navLinkStyle(isActive('/discover'))}>Discover</Link>
        <Link href="/briefs"   style={navLinkStyle(isActive('/briefs'))}>Collabs</Link>
        <Link href="/matching" style={navLinkStyle(isActive('/matching'))}>Matching</Link>
        <Link href="/my-studios" style={navLinkStyle(isActive('/my-studios'))}>My Loft Studios</Link>

        {user && profileSlug && (
          <Link href={`/profile/${profileSlug}`} style={{
            ...navLinkStyle(pathname.startsWith('/profile')),
            color: pathname.startsWith('/profile') ? 'var(--gold)' : 'var(--cream)',
            fontWeight: 500,
          }}>
            My Profile
          </Link>
        )}

        {!user && (
          <Link href="/login" style={navLinkStyle(false)}>Sign in</Link>
        )}
      </div>
    </nav>
  )
}

function navLinkStyle(active) {
  return {
    fontFamily: 'var(--sans)',
    fontSize: '0.72rem',
    letterSpacing: '0.04em',
    color: active ? 'var(--gold)' : 'rgba(240,236,227,0.55)',
    textDecoration: 'none',
    transition: 'color 0.15s',
  }
}