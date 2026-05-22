'use client'
 
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '../../lib/supabase'
 
export default function Nav() {
  const router   = useRouter()
  const pathname = usePathname()
 
  const [user,           setUser]           = useState(null)
  const [profile,        setProfile]        = useState(null)
  const [notifCount,     setNotifCount]     = useState(0)
 
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        loadProfile(session.user.id)
        loadNotifCount(session.user.id)
      }
    })
 
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null)
      if (session?.user) {
        loadProfile(session.user.id)
        loadNotifCount(session.user.id)
      } else {
        setProfile(null)
        setNotifCount(0)
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
 
  async function loadNotifCount(userId) {
    let count = 0
 
    // Terms waiting for my approval (I'm the partner, status pending)
    const { count: pendingTerms } = await supabase
      .from('collab_terms')
      .select('id', { count: 'exact', head: true })
      .eq('partner_id', userId)
      .eq('status', 'pending')
 
    count += pendingTerms || 0
 
    // Completed studios I haven't rated yet
    const { count: unrated } = await supabase
      .from('collab_terms')
      .select('id', { count: 'exact', head: true })
      .or(`initiator_id.eq.${userId},partner_id.eq.${userId}`)
      .eq('status', 'complete')
      .eq('rated', false)
 
    count += unrated || 0
 
    // Applications to my briefs (briefs I posted)
    const { data: myBriefs } = await supabase
      .from('briefs')
      .select('id')
      .eq('poster_id', userId)
      .eq('status', 'open')
 
    if (myBriefs && myBriefs.length > 0) {
      const briefIds = myBriefs.map(b => b.id)
      const { count: apps } = await supabase
        .from('applications')
        .select('id', { count: 'exact', head: true })
        .in('brief_id', briefIds)
        .eq('seen', false)
 
      count += apps || 0
    }
 
    setNotifCount(count)
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
        <Link href="/discover"   style={navLinkStyle(isActive('/discover'))}>Discover</Link>
        <Link href="/briefs"     style={navLinkStyle(isActive('/briefs'))}>Collabs</Link>
        <Link href="/matching"   style={navLinkStyle(isActive('/matching'))}>Matching</Link>
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
 
        {/* Envelope notification icon */}
        {user && (
          <Link href="/notifications" style={{ position: 'relative', display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <span style={{
              fontSize: '1.05rem',
              color: isActive('/notifications') ? 'var(--gold)' : notifCount > 0 ? 'var(--cream)' : 'rgba(240,236,227,0.35)',
              transition: 'color 0.15s',
              lineHeight: 1,
            }}>
              ✉
            </span>
            {notifCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-6px',
                right: '-8px',
                background: 'var(--gold)',
                color: '#0D0D0D',
                fontSize: '0.5rem',
                fontWeight: 700,
                fontFamily: 'var(--sans)',
                borderRadius: '10px',
                padding: '1px 4px',
                minWidth: '14px',
                textAlign: 'center',
                lineHeight: '14px',
              }}>
                {notifCount > 9 ? '9+' : notifCount}
              </span>
            )}
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