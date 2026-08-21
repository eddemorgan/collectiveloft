'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { eduDomain } from '../../lib/students'
import styles from './subscribe.module.css'

// Paddle.js is loaded from their CDN rather than added as a dependency: it is
// the only supported way to open Paddle's overlay checkout, and it has to be
// their build for card fields to stay inside their iframe.
const PADDLE_JS = 'https://cdn.paddle.com/paddle/v2/paddle.js'

// Paddle finds the inline frame by CSS class name, so this one cannot come
// from the CSS module: module class names are hashed at build time.
const CHECKOUT_FRAME_CLASS = 'paddle-checkout-frame'

export default function SubscribePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)
  const [cancelled, setCancelled] = useState(false)
  const [paddleReady, setPaddleReady] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [studentSending, setStudentSending] = useState(false)
  const [studentError, setStudentError] = useState('')
  const [wasStudent, setWasStudent] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setCancelled(params.get('cancelled') === 'true')
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user)
      // A lapsed student lands here when student_until expires. Knowing they
      // verified before changes the offer from "students join free" to
      // "still a student? re-verify", which is the honest version of both.
      if (data.user && eduDomain(data.user.email)) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('student_domain')
          .eq('id', data.user.id)
          .maybeSingle()
        setWasStudent(!!profile?.student_domain)
      }
    })
  }, [])

  // The school-email path around the paywall: send the code, go type it in. Serves
  // both the brand-new student and the annual re-verify, because the flow is
  // identical and the server does not care which one you are.
  const handleStudentVerify = async () => {
    setStudentSending(true)
    setStudentError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) { window.location.href = '/login'; return }
      const res = await fetch('/api/student/request', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const j = await res.json()
      if (!res.ok) {
        setStudentError(j.error || 'Could not send a code. Try again.')
        setStudentSending(false)
        return
      }
      router.push('/student/verify')
    } catch {
      setStudentError('Could not send a code. Try again.')
      setStudentSending(false)
    }
  }

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN
    if (!token) return

    function init() {
      if (!window.Paddle) return
      if (process.env.NEXT_PUBLIC_PADDLE_ENV !== 'production') {
        window.Paddle.Environment.set('sandbox')
      }
      window.Paddle.Initialize({ token })
      setPaddleReady(true)
    }

    if (window.Paddle) { init(); return }

    const existing = document.querySelector(`script[src="${PADDLE_JS}"]`)
    if (existing) { existing.addEventListener('load', init); return }

    const s = document.createElement('script')
    s.src = PADDLE_JS
    s.async = true
    s.onload = init
    document.body.appendChild(s)
  }, [])

  const trialEnd = (() => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  })()

  const handleSubscribe = async () => {
    if (!user) { window.location.href = '/login'; return }
    if (!paddleReady || !window.Paddle) {
      alert('Checkout is still loading. Give it a second and try again.')
      return
    }
    setLoading(true)
    setCheckoutOpen(true)
    try {
      // Inline, so checkout renders inside the page rather than as a popup:
      // the member stays on Collective Loft instead of feeling handed off.
      // Card fields still live in Paddle's iframe, so nothing sensitive
      // touches this site. user_id rides along as custom data and comes back
      // on every webhook, which is how a payment finds its profile.
      window.Paddle.Checkout.open({
        items: [{ priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID, quantity: 1 }],
        customer: { email: user.email },
        customData: { user_id: user.id },
        settings: {
          displayMode: 'inline',
          frameTarget: CHECKOUT_FRAME_CLASS,
          frameInitialHeight: 460,
          frameStyle: 'width:100%; min-width:312px; background-color:transparent; border:none;',
          theme: 'light',
          successUrl: `${window.location.origin}/onboarding?onboarding=true`,
        },
      })
      setLoading(false)
    } catch (err) {
      console.error(err)
      alert('Something went wrong. Please try again.')
      setCheckoutOpen(false)
      setLoading(false)
    }
  }

  const features = [
    'Find your people by discipline, skill, and distance',
    'Post a brief. Say what you are making and who you need.',
    'Set real terms before the work starts. Paid, revenue share, or creative exchange.',
    'A Loft Studio for every collaboration. Files, milestones, and messages in one room.',
    'A reputation built from finished work, not followers.',
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
              Checkout cancelled. No charge was made. You can start your trial whenever you&apos;re ready.
            </div>
          )}

          <div className={styles.eyebrow}>One last step</div>
          <h1 className={styles.title}>A room with a lock<br /><em>on the door.</em></h1>
          <p className={styles.why}>
            Your membership is what keeps the people who exploit creatives out. Everyone inside has agreed to real terms and has skin in the game. The fee is the filter. That&apos;s what your $15 protects.
          </p>
          <p className={styles.why}>
            Collective Loft is the first room of something bigger. A place to record. A label and a publishing arm built to protect the people who make the work. That&apos;s the plan, and it only happens if this room works first. You&apos;re early.
          </p>
          <p className={styles.reassure}>
            Your first 7 days are free. You won&apos;t be charged until <strong>{trialEnd}</strong>, and you can cancel anytime.
          </p>

          {user && eduDomain(user.email) && (
            <div className={styles.card} style={{ marginBottom: '1.25rem' }}>
              <div className={styles.priceNote} style={{ marginBottom: '0.5rem' }}>
                {wasStudent
                  ? 'Your student year is up. Still enrolled? Re-verify your school email and the next year is free too.'
                  : 'You signed up with a school email. Students pay nothing on Collective Loft: verify it and skip this page entirely.'}
              </div>
              {studentError && (
                <div className={styles.priceNote} style={{ color: '#a05b47', marginBottom: '0.5rem' }}>{studentError}</div>
              )}
              <button className={styles.btn} onClick={handleStudentVerify} disabled={studentSending}>
                {studentSending
                  ? 'Sending your code…'
                  : wasStudent ? 'Re-verify my student email →' : 'Verify my student email →'}
              </button>
            </div>
          )}

          <div className={styles.card}>
            <div className={styles.price}>
              $15<span className={styles.per}>/month</span>
            </div>
            <p className={styles.priceNote}>After your 7-day free trial</p>

            {!checkoutOpen && (
              <>
                <div className={styles.features}>
                  {features.map(f => (
                    <div key={f} className={styles.feature}>
                      <span className={styles.fmark}>✦</span>{f}
                    </div>
                  ))}
                </div>

                <button className={styles.btn} onClick={handleSubscribe} disabled={loading}>
                  {loading ? 'Opening secure checkout…' : 'Start my 7-day free trial →'}
                </button>
              </>
            )}

            {/* Paddle mounts its iframe here once checkout opens. Kept mounted
                and hidden beforehand so the target exists when Paddle looks. */}
            <div
              className={CHECKOUT_FRAME_CLASS}
              style={{ display: checkoutOpen ? 'block' : 'none', marginTop: '0.5rem' }}
            />

            <p className={styles.secure}>Secure checkout powered by Paddle. Cancel anytime before {trialEnd} and you won&apos;t be charged.</p>
          </div>

          <p className={styles.footer}>
            Already a member? <Link href="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
