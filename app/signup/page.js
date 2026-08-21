'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { eduDomain } from '../../lib/students'
import styles from '../login/login.module.css'

export default function SignupPage() {
  const router = useRouter()
  const [firstname, setFirstname] = useState('')
  const [lastname,  setLastname]  = useState('')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [showPw,    setShowPw]    = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  // Founding invite links carry ?email=, so members sign up with the exact
  // address on the allowlist and get recognized. Pre-fill it for them.
  useEffect(() => {
    const e = new URLSearchParams(window.location.search).get('email')
    if (e) setEmail(e)
  }, [])

  async function handleSignup() {
    if (!firstname || !lastname || !email || !password) {
      setError('Please fill in all fields.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    setError('')

    const { data, error: err } = await supabase.auth.signUp({ email, password })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    // Auto sign in immediately after signup
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })

    if (signInErr) {
      setError(signInErr.message)
      setLoading(false)
      return
    }

    // Save name to profile
    await supabase
      .from('profiles')
      .upsert({ id: data.user.id, firstname, lastname })

    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token

    // Founding recognition. If this email is on the founding allowlist, the
    // server grants founding status and 90 days free, and we skip the paywall
    // straight into building the profile. Everyone else goes to the trial.
    // `comped` covers both: a founding member on the allowlist, and anyone who
    // joined during the launch window and got their first month free. Either
    // way they have access, so they skip the paywall and go build a profile.
    let comped = false
    if (token) {
      try {
        const res = await fetch('/api/founding/redeem', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
        const j = await res.json()
        comped = !!j.founding || !!j.launch_comp
      } catch { /* no comp, fall through to the normal path */ }
    }

    // Send the welcome email. Fire and forget: a mail hiccup never blocks
    // signup. Runs after founding recognition so the owner notification
    // reports founding status correctly.
    if (token) {
      fetch('/api/send-welcome', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {})
    }

    // Students skip the paywall a different way: a school sign-in address earns
    // a verification code and a free year once it is entered. Founding status
    // wins if both apply, since 90 days comped plus a badge beats a bare comp.
    if (!comped && eduDomain(email) && token) {
      try {
        await fetch('/api/student/request', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
        router.push('/student/verify')
        return
      } catch { /* code send failed, fall through to the normal path */ }
    }

    router.push(comped ? '/onboarding?onboarding=true' : '/subscribe')
  }

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', textDecoration: 'none', lineHeight: 1 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--serif)', fontSize: '1.6rem', fontWeight: 400, lineHeight: 1, letterSpacing: '0.02em' }}>
            <span style={{ color: '#B8922E' }}>✦</span>
            <span style={{ color: '#1A1A1A' }}>Collective <em style={{ fontStyle: 'italic', color: '#B8922E' }}>Loft</em></span>
          </span>
          <span style={{ alignSelf: 'stretch', height: '0.5px', background: 'rgba(184,146,46,0.35)', margin: '5px 0' }} />
          <span style={{ fontFamily: 'var(--sans)', fontSize: '0.5312rem', letterSpacing: '0.18em', textTransform: 'uppercase', lineHeight: 1, color: '#7A7060' }}>Where creatives find each other</span>
        </Link>
      </nav>

      <div className={styles.wrap}>
        <div className={styles.card}>
          <div className={styles.eyebrow}>Collective Loft</div>
          <div className={styles.title}>Create your account.</div>
          <div className={styles.sub}>
            Join a curated network of creatives. 7-day free trial, then $15/month.
            Students join free: sign up with your school email and we verify it, no card ever.
          </div>

          {error && <div className={styles.errorBox}>{error}</div>}

          <div className={styles.fields}>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div className={styles.field} style={{ flex: 1 }}>
                <label>First name</label>
                <input
                  type="text"
                  placeholder="Jane"
                  value={firstname}
                  onChange={e => setFirstname(e.target.value)}
                />
              </div>
              <div className={styles.field} style={{ flex: 1 }}>
                <label>Last name</label>
                <input
                  type="text"
                  placeholder="Doe"
                  value={lastname}
                  onChange={e => setLastname(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.field}>
              <label>Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label>Password</label>
              <div className={styles.pwWrap}>
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="8+ characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSignup()}
                />
                <button type="button" className={styles.pwEye} onClick={() => setShowPw(v => !v)}>
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>
          </div>

          <button
            className={styles.btnPrimary}
            onClick={handleSignup}
            disabled={loading}
          >
            {loading ? 'Creating account…' : 'Continue to membership'}
          </button>

          <div className={styles.footer}>
            <span className={styles.linkBtn}>Already a member?</span>
            <span className={styles.footerDivider}>·</span>
            <Link href="/login" className={styles.linkBtn}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
