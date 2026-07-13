'use client'

import { useState } from 'react'
import Link from 'next/link'
import styles from './landing.module.css'

const DISCIPLINES = ['Visual Art','Music','Writing','Design & Web','Film','Photography','Performance','Creative Tech']

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false)
  const toggle = () => setMenuOpen(o => !o)

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
            <Link href="/login" className={styles.signin}>Sign in</Link>
            <Link href="/signup" className={styles.join}>Join Collective Loft</Link>
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
          <Link href="/about" onClick={toggle}>About Collective Loft<span className={styles.mSub}>Why we built this — and who it&apos;s for</span></Link>
          <Link href="/morgan-collective" onClick={toggle}>Morgan Collective Group</Link>
          <Link href="/help" onClick={toggle}>Help &amp; support</Link>
        </div>
        <div className={styles.menuSec}>
          <Link href="/login" onClick={toggle} className={styles.menuSi}>Already a member? Sign in</Link>
          <Link href="/signup" onClick={toggle} className={styles.menuJoin}>Join Collective Loft</Link>
        </div>
      </aside>

      <header className={styles.hero}>
        <div className={styles.heroRule} />
        <div className={styles.heroInner}>
          <div className={styles.heroEyebrow}>A professional network for the creative class</div>
          <div className={styles.heroPromise}>Your people are out there.</div>
          <h1 className={styles.heroH1}>Collaborators,<br />not bosses.</h1>
          <p className={styles.heroSub}>
            The professional network where <span className={styles.k}>artists, musicians, writers, designers, and filmmakers</span> find each other, negotiate real terms, and open a <span className={styles.k}>Loft Studio</span> — a shared workspace built around the work.
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
              <div className={styles.cardN}>Terms, honored</div>
              <div className={styles.cardT}>An agreement kept</div>
              <div className={styles.cardD}>Every collaboration starts with real terms — <b>compensation, rights, timeline</b> — agreed before the work begins. On record, for both sides.</div>
            </div>
            <div className={styles.card}>
              <div className={styles.cardN}>Work, finished</div>
              <div className={styles.cardT}>Something real, made</div>
              <div className={styles.cardD}>The Loft Studio is where two creatives actually work — <b>files, milestones, and messages</b> in one place — until the thing you agreed on exists.</div>
            </div>
            <div className={styles.card}>
              <div className={styles.cardN}>Reputation, earned</div>
              <div className={styles.cardT}>A rating that vouches</div>
              <div className={styles.cardD}>When it&apos;s complete, you rate each other. Future collaborators can read it — so <b>being great to work with</b> becomes something people can see.</div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.heart}>
        <div className={styles.heartInner}>
          <p className={styles.heartLine}>Built for creatives, <em>protected on purpose.</em> A safe space to find your people and do your best work — by design.</p>
          <p className={styles.heartSub}>Collective Loft started as a way to help one artist succeed. Somewhere along the way it became something bigger: a home for the creative class, and a real commitment to protecting it.</p>
          <Link href="/about" className={styles.heartMore}>Read why we built this →</Link>
        </div>
      </section>

      <section className={styles.close}>
        <div className={styles.closeInner}>
          <h2 className={styles.closeH}>Your next collaborator<br />is already <em>here.</em></h2>
          <p className={styles.closeSub}>Build a profile, say what you&apos;re making, and find the people who&apos;ll help you make it real.</p>
          <Link href="/signup" className={styles.btnPrimary}>Join Collective Loft</Link>
        </div>
      </section>

      <footer className={styles.foot}>
        <div className={styles.footInner}>
          <div className={styles.footTop}>
            <Link href="/" className={styles.brand}>
              <span className={styles.mark}>✦</span>
              <span>
                <span className={styles.wm}>Collective <em>Loft</em></span>
                <span className={styles.tag}>Where creatives find each other</span>
              </span>
            </Link>
            <div className={styles.footLinks}>
              <div className={styles.fcol}>
                <div className={styles.fcolL}>Platform</div>
                <Link href="/how-it-works">How it works</Link>
                <Link href="/browse">Discover</Link>
                <a href="https://collectiveloft.com/blog">The Brief</a>
              </div>
              <div className={styles.fcol}>
                <div className={styles.fcolL}>Company</div>
                <Link href="/about">About</Link>
                <Link href="/morgan-collective">Morgan Collective Group</Link>
                <Link href="/help">Help</Link>
              </div>
              <div className={styles.fcol}>
                <div className={styles.fcolL}>Get started</div>
                <Link href="/signup">Join</Link>
                <Link href="/login">Sign in</Link>
              </div>
            </div>
          </div>
          <div className={styles.footBot}>
            <div className={styles.fine}>© 2026 Collective Loft · A Morgan Collective Group company</div>
            <div className={styles.fine}>Chicago · London</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
