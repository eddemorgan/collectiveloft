'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import styles from './login.module.css'

export default function LoginPage() {
  const router = useRouter()
  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [showPw,     setShowPw]     = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')
  const [resetMode,  setResetMode]  = useState(false)
  const [resetSent,  setResetSent]  = useState(false)

  async function handleLogin() {
    if (!email || !password) { setError('Please enter your email and password.'); return }
    setLoading(true); setError('')
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) { setError(err.message); setLoading(false); return }
    const { data: profile } = await supabase
      .from('profiles')
      .select('firstname, lastname')
      .eq('id', data.user.id)
      .single()
    if (profile) {
      router.push(`/profile/${profile.firstname.toLowerCase()}-${profile.lastname.toLowerCase()}`)
    } else {
      router.push('/discover')
    }
  }

  async function handleReset() {
    if (!email) { setError('Enter your email address above.'); return }
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    })
    if (err) { setError(err.message) } else { setResetSent(true) }
    setLoading(false)
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
          <span style={{ fontFamily: 'var(--sans)', fontSize: '8.5px', letterSpacing: '0.18em', textTransform: 'uppercase', lineHeight: 1, color: '#7A7060' }}>Where creatives find each other</span>
        </Link>
      </nav>

      <div className={styles.wrap}>
        <div className={styles.card}>
          <div className={styles.eyebrow}>Collective Loft</div>
          <div className={styles.title}>{resetMode ? 'Reset your password' : 'Welcome back.'}</div>
          <div className={styles.sub}>
            {resetMode
              ? 'Enter your email and we\'ll send you a reset link. Click it to set a new password.'
              : 'Sign in to your account.'
            }
          </div>

          {resetSent ? (
            <div className={styles.successBox}>
              <div className={styles.successIcon}>✦</div>
              <div className={styles.successTitle}>Check your email</div>
              <div className={styles.successSub}>
                We sent a password reset link to {email}. Click it to set a new password and you'll be logged in automatically.
              </div>
              <button className={styles.linkBtn} onClick={() => { setResetMode(false); setResetSent(false) }}>
                Back to sign in
              </button>
            </div>
          ) : (
            <>
              {error && <div className={styles.errorBox}>{error}</div>}

              <div className={styles.fields}>
                <div className={styles.field}>
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !resetMode && handleLogin()}
                  />
                </div>
                {!resetMode && (
                  <div className={styles.field}>
                    <label>Password</label>
                    <div className={styles.pwWrap}>
                      <input
                        type={showPw ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleLogin()}
                      />
                      <button type="button" className={styles.pwEye} onClick={() => setShowPw(v => !v)}>
                        {showPw ? '🙈' : '👁'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                className={styles.btnPrimary}
                onClick={resetMode ? handleReset : handleLogin}
                disabled={loading}
              >
                {loading
                  ? 'Please wait…'
                  : resetMode ? 'Send reset link' : 'Sign in'
                }
              </button>

              <div className={styles.footer}>
                {resetMode ? (
                  <button className={styles.linkBtn} onClick={() => { setResetMode(false); setError('') }}>
                    Back to sign in
                  </button>
                ) : (
                  <button className={styles.linkBtn} onClick={() => { setResetMode(true); setError('') }}>
                    Forgot your password?
                  </button>
                )}
                <span className={styles.footerDivider}>·</span>
                <Link href="/signup" className={styles.linkBtn}>Create an account</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
