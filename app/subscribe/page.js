'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function SubscribePage() {
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)
  const [cancelled, setCancelled] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setCancelled(params.get('cancelled') === 'true')

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })
  }, [])

  const handleSubscribe = async () => {
    if (!user) {
      window.location.href = '/login'
      return
    }

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

  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--background)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}>
      <div style={{
        maxWidth: '480px',
        width: '100%',
        textAlign: 'center',
      }}>
        <img src="/logo.png" alt="Collective Loft" style={{ height: '48px', marginBottom: '2rem' }} />

        {cancelled && (
          <p style={{ color: 'var(--gold)', marginBottom: '1rem', fontSize: '0.9rem' }}>
            Payment cancelled. No worries -- you can try again whenever you're ready.
          </p>
        )}

        <h1 style={{ fontSize: '1.8rem', marginBottom: '0.75rem', color: 'var(--cream)' }}>
          Join Collective Loft
        </h1>

        <p style={{ color: 'var(--cream-muted)', marginBottom: '0.5rem', lineHeight: '1.6' }}>
          A curated network for creatives who are serious about collaboration.
        </p>

        <p style={{ color: 'var(--cream-muted)', marginBottom: '2.5rem', fontSize: '0.9rem' }}>
          7-day free trial, then $15/month. Cancel anytime.
        </p>

        <div style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--rule)',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '1.5rem',
        }}>
          <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--cream)', marginBottom: '0.25rem' }}>
            $15
            <span style={{ fontSize: '1rem', fontWeight: '400', color: 'var(--cream-muted)' }}>/month</span>
          </div>
          <p style={{ color: 'var(--cream-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            After your 7-day free trial
          </p>

          <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
            {[
              'Full access to Discover and Matching',
              'Post and apply to Collab Briefs',
              'Loft Studio for active collabs',
              'Portfolio and profile tools',
              'Direct messaging with collaborators',
            ].map((feature) => (
              <div key={feature} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.6rem',
                color: 'var(--cream)',
                fontSize: '0.9rem',
              }}>
                <span style={{ color: 'var(--gold)' }}>✦</span>
                {feature}
              </div>
            ))}
          </div>

          <button
            onClick={handleSubscribe}
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.9rem',
              background: 'var(--gold)',
              color: 'var(--background)',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Redirecting...' : 'Start Free Trial'}
          </button>
        </div>

        <p style={{ color: 'var(--cream-muted)', fontSize: '0.8rem' }}>
          Already a member?{' '}
          <a href="/login" style={{ color: 'var(--gold)', textDecoration: 'none' }}>Sign in</a>
        </p>
      </div>
    </main>
  )
}