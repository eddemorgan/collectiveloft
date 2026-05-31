'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
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
      .update({ firstname, lastname })
      .eq('id', data.user.id)

    router.push('/subscribe')
  }

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>Collective <span>Loft</span></Link>
      </nav>

      <div className={styles.wrap}>
        <div className={styles.card}>
          <div className={styles.eyebrow}>Collective Loft</div>
          <div className={styles.title}>Create your account.</div>
          <div className={styles.sub}>
            Join a curated network of creatives. 7-day free trial, then $15/month.
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