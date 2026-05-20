'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import styles from './update-password.module.css'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password,    setPassword]    = useState('')
  const [confirm,     setConfirm]     = useState('')
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [done,        setDone]        = useState(false)
  const [sessionReady,setSessionReady]= useState(false)

  useEffect(() => {
    // Supabase handles the token from the URL automatically
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true)
      }
    })
  }, [])

  async function handleUpdate() {
    setError('')
    if (!password) { setError('Please enter a new password.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setError('Passwords don\'t match.'); return }

    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }
    setDone(true)
    setLoading(false)
    setTimeout(() => router.push('/discover'), 2000)
  }

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>Collective <span>Loft</span></Link>
      </nav>

      <div className={styles.wrap}>
        <div className={styles.card}>
          <div className={styles.eyebrow}>Collective Loft</div>
          <div className={styles.title}>{done ? 'Password updated.' : 'Set a new password.'}</div>
          <div className={styles.sub}>
            {done
              ? 'You\'re all set. Taking you in now…'
              : 'Choose a password you\'ll remember. At least 8 characters.'
            }
          </div>

          {done ? (
            <div className={styles.successBox}>
              <div className={styles.successIcon}>✦</div>
              <div className={styles.successSub}>Password saved. Redirecting you to the platform…</div>
            </div>
          ) : (
            <>
              {error && <div className={styles.errorBox}>{error}</div>}

              <div className={styles.fields}>
                <div className={styles.field}>
                  <label>New password</label>
                  <input
                    type="password"
                    placeholder="Min 8 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleUpdate()}
                  />
                </div>
                <div className={styles.field}>
                  <label>Confirm password</label>
                  <input
                    type="password"
                    placeholder="Repeat your password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleUpdate()}
                  />
                </div>
              </div>

              <button
                className={styles.btnPrimary}
                onClick={handleUpdate}
                disabled={loading}
              >
                {loading ? 'Saving…' : 'Set password & sign in'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}