'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import styles from './subscribe.module.css'

export default function SubscribePage() {
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)
  const [cancelled, setCancelled] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setCancelled(params.get('cancelled') === 'true')
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  const trialEnd = (() => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  })()

  const handleSubscribe = async () => {
    if (!user) { window.location.href = '/login'; return }
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, email: user.email }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Something went wrong. Please try again.')
        setLoading(false)
      }
    } catch (err) {
      console.error(err)
      alert('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const features = [
    'Full access to Discover and Matching',
    'Post and apply to Collab Briefs',
    'A Loft Studio for every active collaboration',
    'Portfolio and profile tools',
    'Direct messaging with collaborators',
  ]

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoRow}>
            <span className={styles.mark}>✦</span>
            <span className={styles.wm}>Collective <em>Loft</em></span>
          </span>
          <span className={styles.logoRule} />
          <span className={styles.tag}>Where creatives find each other</span>
        </Link>
      </nav>

      <div className={styles.wrap}>
        <div className={styles.inner}>
          {cancelled && (
            <div className={styles.cancelled}>
              Checkout cancelled — no charge was made. You can start your trial whenever you&apos;re ready.
            </div>
          )}

          <div className={styles.eyebrow}>One last step</div>
          <h1 className={styles.title}>Membership is what keeps<br /><em>Collective Loft</em> a safe space.</h1>
          <p className={styles.why}>
            Your membership is what keeps the people who exploit creatives out — so this stays a protected place to find your people and do real work. That&apos;s what your $15 protects.
          </p>
          <p className={styles.reassure}>
            Your first 7 days are free. You won&apos;t be charged until <strong>{trialEnd}</strong>, and you can cancel anytime.
          </p>

          <div className={styles.card}>
            <div className={styles.price}>
              $15<span className={styles.per}>/month</span>
            </div>
            <p className={styles.priceNote}>After your 7-day free trial</p>

            <div className={styles.features}>
              {features.map(f => (
                <div key={f} className={styles.feature}>
                  <span className={styles.fmark}>✦</span>{f}
                </div>
              ))}
            </div>

            <button className={styles.btn} onClick={handleSubscribe} disabled={loading}>
              {loading ? 'Taking you to secure checkout…' : 'Start my 7-day free trial →'}
            </button>
            <p className={styles.secure}>Secure checkout powered by Stripe. Cancel anytime before {trialEnd} and you won&apos;t be charged.</p>
          </div>

          <p className={styles.footer}>
            Already a member? <Link href="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
