'use client'

import { useState } from 'react'
import Link from 'next/link'
import styles from './member-menu.module.css'

export default function MemberMenu() {
  const [open, setOpen] = useState(false)
  const toggle = () => setOpen(o => !o)

  return (
    <>
      <button
        className={`${styles.burger} ${open ? styles.burgerOpen : ''}`}
        onClick={toggle}
        aria-label="Open menu"
        aria-expanded={open}
      >
        <span></span><span></span><span></span>
      </button>

      <div
        className={`${styles.scrim} ${open ? styles.scrimOpen : ''}`}
        onClick={toggle}
      />
      <aside className={`${styles.menu} ${open ? styles.menuOpen : ''}`}>
        <div className={styles.menuSec}>
          <div className={styles.menuLabel}>The platform</div>
          <Link href="/discover" onClick={toggle}>Discover<span className={styles.mSub}>Find your next collaborator</span></Link>
          <Link href="/briefs" onClick={toggle}>Collabs<span className={styles.mSub}>Open briefs and invitations</span></Link>
          <Link href="/matching" onClick={toggle}>Matching</Link>
          <Link href="/my-studios" onClick={toggle}>My Loft Studios</Link>
          <Link href="/notifications" onClick={toggle}>Notifications</Link>
        </div>
        <div className={styles.menuSec}>
          <div className={styles.menuLabel}>Learn</div>
          <Link href="/guide" onClick={toggle}>Member guide<span className={styles.mSub}>Everything from your profile to getting paid</span></Link>
          <Link href="/how-it-works" onClick={toggle}>How it works</Link>
          <a href="https://collectiveloft.com/blog" onClick={toggle}>The Brief<span className={styles.mSub}>Our journal for the creative class</span></a>
        </div>
        <div className={styles.menuSec}>
          <div className={styles.menuLabel}>Company</div>
          <Link href="/about" onClick={toggle}>About Collective Loft</Link>
          <Link href="/morgan-collective" onClick={toggle}>Morgan Collective Group</Link>
          <Link href="/help" onClick={toggle}>Help &amp; support</Link>
        </div>
      </aside>
    </>
  )
}
