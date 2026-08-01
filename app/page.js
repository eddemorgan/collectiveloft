'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from './landing.module.css'
import Footer from './components/Footer'
import { supabase } from '../lib/supabase'

const DISCIPLINES = ['Visual Art','Music','Writing','Design & Web','Film & Video','Photography','Performance','Creative Tech']

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false)
  const toggle = () => setMenuOpen(o => !o)

  // Signed-in members get "My Profile" instead of Sign in / Join.
  const [member, setMember] = useState(null)
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('firstname, lastname')
        .eq('id', session.user.id)
        .single()
      setMember({
        href: profile
          ? `/profile/${profile.firstname.toLowerCase()}-${profile.lastname.toLowerCase()}`
          : '/onboarding',
      })
    })
  }, [])

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.brand}>
            <span className={styles.mark}>✦</span>
            <span>
              <span className={styles.wm}>Collective <em>Loft</em></span>
              <span className={styles.tag}>Where creatives find each other</span>
            </span>
          </Link>
          <div className={styles.navRight}>
            {member ? (
              <Link href={member.href} className={styles.join}>My Profile</Link>
            ) : (
              <>
                <Link href="/login" className={styles.signin}>Sign in</Link>
                <Link href="/signup" className={styles.join}>Join Collective Loft</Link>
              </>
            )}
            <button
              className={`${styles.burger} ${menuOpen ? styles.burgerOpen : ''}`}
              onClick={toggle}
              aria-label="Open menu"
              aria-expanded={menuOpen}
            >
              <span></span><span></span><span></span>
            </button>
          </div>
        </div>
      </nav>

      <div
        className={`${styles.scrim} ${menuOpen ? styles.scrimOpen : ''}`}
        onClick={toggle}
      />
      <aside className={`${styles.menu} ${menuOpen ? styles.menuOpen : ''}`}>
        <div className={styles.menuSec}>
          <div className={styles.menuLabel}>The platform</div>
          <Link href="/how-it-works" onClick={toggle}>How it works<span className={styles.mSub}>From first hello to finished work</span></Link>
          <Link href="/browse" onClick={toggle}>Discover creatives<span className={styles.mSub}>Browse who&apos;s already here</span></Link>
          <a href="https://collectiveloft.com/blog" onClick={toggle}>The Brief<span className={styles.mSub}>Our journal for the creative class</span></a>
        </div>
        <div className={styles.menuSec}>
          <div className={styles.menuLabel}>Company</div>
          <Link href="/about" onClick={toggle}>About Collective Loft<span className={styles.mSub}>Why we built this, and who it&apos;s for</span></Link>
          <Link href="/morgan-collective" onClick={toggle}>Morgan Collective Group</Link>
          <Link href="/help" onClick={toggle}>Help &amp; support</Link>
        </div>
        <div className={styles.menuSec}>
          {member ? (
            <Link href={member.href} onClick={toggle} className={styles.menuJoin}>My Profile</Link>
          ) : (
            <>
              <Link href="/login" onClick={toggle} className={styles.menuSi}>Already a member? Sign in</Link>
              <Link href="/signup" onClick={toggle} className={styles.menuJoin}>Join Collective Loft</Link>
            </>
          )}
        </div>
      </aside>

      <header className={styles.hero}>
        <div className={styles.heroRule} />
        <div className={styles.heroInner}>
          <div className={styles.heroEyebrow}>A professional network for the creative class</div>
          <div className={styles.heroPromise}>Your people are here.</div>
          <h1 className={styles.heroH1}>Find collaborators, not bosses.</h1>
          <p className={styles.heroSub}>
            The professional network where <span className={styles.k}>artists, musicians, writers, designers, and filmmakers</span> find each other, negotiate real terms, and open a <span className={styles.k}>Loft Studio</span>, a shared workspace built around the work.
          </p>
          <div className={styles.heroCta}>
            <Link href="/signup" className={styles.btnPrimary}>Join Collective Loft</Link>
            <a href="#beat" className={styles.btnGhost}>See how it works</a>
          </div>
          <div className={styles.discRow}>
            {DISCIPLINES.map(d => <span key={d} className={styles.disc}>{d}</span>)}
          </div>
        </div>
      </header>

      <section className={styles.beat} id="beat">
        <div className={styles.beatInner}>
          <div className={styles.beatHead}>
            <div className={styles.beatEyebrow}>Every collaboration leaves a record</div>
            <h2 className={styles.beatTitle}>Do the work. Build the proof.</h2>
            <p className={styles.beatSub}>You put yourself out there, find your people, agree on real terms, and make something together. When it&apos;s done, you walk away with more than the work.</p>
          </div>
          <div className={styles.beatGrid}>
            <div className={styles.card}>
              <div className={styles.cardN}>Terms honored</div>
              <div className={styles.cardT}>Make an agreement</div>
              <div className={styles.cardD}>Every collaboration starts with real terms: <b>compensation, rights, and timeline</b>, agreed before the work begins. On record, for both sides.</div>
            </div>
            <div className={styles.card}>
              <div className={styles.cardN}>Work finished</div>
              <div className={styles.cardT}>Build something real</div>
              <div className={styles.cardD}>Two people work together in a Loft Studio, sharing <b>files, milestones, and messages</b> in one place.</div>
            </div>
            <div className={styles.card}>
              <div className={styles.cardN}>Reputation earned</div>
              <div className={styles.cardT}>Collect ratings</div>
              <div className={styles.cardD}>When the work is complete, you rate each other. Future collaborators can read the feedback and <b>you can build a reputation</b>.</div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.heart}>
        <div className={styles.heartInner}>
          <p className={styles.heartLine}>Built for creatives, <em>selectively curated by design.</em> A safe space to find your people and do your best work.</p>
          <p className={styles.heartSub}>Collective Loft started as a way to help one artist succeed. Somewhere along the way it became something bigger: a home for the creative class. And a commitment to the people who make it.</p>
          <Link href="/about" className={styles.heartMore}>Read why we built this →</Link>
        </div>
      </section>

      <section className={styles.close}>
        <div className={styles.closeInner}>
          <h2 className={styles.closeH}>Your next collaborator<br />is already <em>here.</em></h2>
          <p className={styles.closeSub}>Build a profile. Describe what you&apos;re working on &amp; what type of help you need. Find the people who can make your dream a reality.</p>
          <Link href="/signup" className={styles.btnPrimary}>Join Collective Loft</Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
