'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import styles from '../../login/login.module.css'

// Where a school-email signup lands after the code email goes out, and where a lapsed
// student comes back each year. One input, one job: type the six digits, get
// the year. The heavy lifting lives in /api/student/confirm; this page just
// carries the code there and routes on the answer.

export default function StudentVerifyPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setEmail(user.email || '')
    })
  }, [router])

  async function token() {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }

  async function handleConfirm() {
    if (!/^\d{6}$/.test(code.trim())) {
      setError('Enter the six-digit code from your email.')
      return
    }
    setLoading(true)
    setError('')
    setNotice('')
    try {
      const t = await token()
      if (!t) { router.push('/login'); return }
      const res = await fetch('/api/student/confirm', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      })
      const j = await res.json()
      if (!res.ok) {
        setError(j.error || 'Something went wrong. Try again.')
        setLoading(false)
        return
      }
      // Verified. A first-timer still needs a profile; a returning student
      // already has one. Onboarding redirects members with a discipline, so
      // one destination serves both.
      router.push('/onboarding?onboarding=true')
    } catch {
      setError('Something went wrong. Try again.')
      setLoading(false)
    }
  }

  async function handleResend() {
    setResending(true)
    setError('')
    setNotice('')
    try {
      const t = await token()
      if (!t) { router.push('/login'); return }
      const res = await fetch('/api/student/request', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}` },
      })
      const j = await res.json()
      if (!res.ok) {
        setError(j.error || 'Could not send a new code.')
      } else {
        setNotice('New code sent. Check your inbox.')
      }
    } catch {
      setError('Could not send a new code.')
    }
    setResending(false)
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
          <div className={styles.eyebrow}>Student membership</div>
          <div className={styles.title}>Check your school inbox.</div>
          <div className={styles.sub}>
            We sent a six-digit code to {email || 'your school address'}. Enter it here and your membership is free for the next year. Students pay nothing on Collective Loft.
          </div>

          {error && <div className={styles.errorBox}>{error}</div>}
          {notice && !error && (
            <div style={{ fontSize: '0.8rem', color: '#5a7d5a', marginBottom: '0.75rem' }}>{notice}</div>
          )}

          <div className={styles.fields}>
            <div className={styles.field}>
              <label>Verification code</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                maxLength={6}
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                onKeyDown={e => e.key === 'Enter' && handleConfirm()}
              />
            </div>
          </div>

          <button
            className={styles.btnPrimary}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Checking…' : 'Confirm student membership'}
          </button>

          <div className={styles.footer}>
            <button type="button" className={styles.linkBtn} onClick={handleResend} disabled={resending} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              {resending ? 'Sending…' : 'Send a new code'}
            </button>
            <span className={styles.footerDivider}>·</span>
            <Link href="/subscribe" className={styles.linkBtn}>Join as a paid member instead</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
