'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import styles from './close.module.css'

const REASONS = [
  'I did not find the collaborators I was looking for',
  'Not enough people here yet',
  'Too expensive',
  'I am not collaborating right now',
  'I did not understand how it works',
  'Something else',
]

export default function CloseAccountPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [working, setWorking] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setUser(data.user)
    })
  }, [router])

  const ready = email.trim() && password && reason && !working

  async function handleClose(e) {
    e.preventDefault()
    setError('')
    setWorking(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          email,
          password,
          reason: note.trim() ? `${reason} — ${note.trim()}` : reason,
        }),
      })
      const j = await res.json()
      if (!res.ok) {
        setError(j.error || 'Could not close the account. Please try again.')
        setWorking(false)
        return
      }
      await supabase.auth.signOut()
      router.push('/?closed=true')
    } catch (err) {
      console.error(err)
      setError('Could not close the account. Please try again.')
      setWorking(false)
    }
  }

  if (!user) return <div className={styles.loading}>Loading…</div>

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.brand}>
          <span className={styles.mark}>✦</span>
          <span>
            <span className={styles.wm}>Collective <em>Loft</em></span>
            <span className={styles.tag}>Where creatives find each other</span>
          </span>
        </Link>
      </nav>

      <div className={styles.wrap}>
        <div className={styles.inner}>
          <div className={styles.eyebrow}>Close your account</div>
          <h1 className={styles.title}>Before you go.</h1>

          <div className={styles.what}>
            <div className={styles.whatLabel}>What happens</div>
            <p>Your profile, photos, portfolio, and links are deleted.</p>
            <p>Any subscription is cancelled immediately, so you are not charged again.</p>
            <p>Collaborations you finished stay on record for the people you worked with, credited to a former member. Their history and ratings are not rewritten by your leaving.</p>
            <p>This cannot be undone.</p>
          </div>

          <p className={styles.alt}>
            If you only want to stop paying, you do not need to do this. Use <strong>Manage
            subscription</strong> on your profile to cancel billing and keep your account.
          </p>

          <form className={styles.form} onSubmit={handleClose}>
            <label className={styles.field}>
              <span className={styles.label}>Confirm your email</span>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="username"
                required
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Confirm your password</span>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </label>

            <div className={styles.field}>
              <span className={styles.label}>Why are you leaving?</span>
              <div className={styles.reasons}>
                {REASONS.map(r => (
                  <button
                    type="button"
                    key={r}
                    className={`${styles.reason} ${reason === r ? styles.reasonOn : ''}`}
                    onClick={() => setReason(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <label className={styles.field}>
              <span className={styles.label}>Anything else? (optional)</span>
              <textarea
                rows={3}
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Tell me what went wrong. I read every one of these."
              />
            </label>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.actions}>
              <button type="submit" className={styles.confirm} disabled={!ready}>
                {working ? 'Closing your account…' : 'Close my account permanently'}
              </button>
              <Link href="/discover" className={styles.keep}>Keep my account</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
