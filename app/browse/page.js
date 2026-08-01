'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from './browse.module.css'

const DISC_ICON = {
  'Visual Art': '🎨',
  'Music': '🎵',
  'Writing': '✍️',
  'Writing & Poetry': '✍️',
  'Design & Web': '🖥',
  'Film & Video': '🎬',
  'Photography': '📷',
  'Performance': '🎭',
  'Creative Tech': '💻',
}

export default function BrowsePage() {
  const [creatives, setCreatives] = useState(null)

  useEffect(() => {
    fetch('/api/browse')
      .then(r => r.json())
      .then(d => setCreatives(Array.isArray(d.creatives) ? d.creatives : []))
      .catch(() => setCreatives([]))
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
          <Link href="/signup" className={styles.join}>Join Collective Loft</Link>
        </div>
      </nav>

      <header className={styles.hero}>
        <div className={styles.eyebrow}>Real creatives, already here</div>
        <h1 className={styles.title}>Your people are <em>out there.</em></h1>
        <p className={styles.sub}>
          A look at who&apos;s on Collective Loft right now — real disciplines, real skills, real collaborators. Join to see who they are and reach them.
        </p>
      </header>

      {creatives === null ? (
        <div className={styles.loading}>Loading creatives…</div>
      ) : creatives.length === 0 ? (
        <div className={styles.empty}>Creatives are joining now. Be one of the first.</div>
      ) : (
        <div className={styles.grid}>
          {creatives.map(c => {
            const hasSeeking = c.seekingDiscipline || (c.seekingSkills && c.seekingSkills.length > 0)
            return (
              <div key={c.key} className={styles.card}>
                <div className={styles.avatar}>{DISC_ICON[c.discipline] || '✦'}</div>
                <div className={styles.discipline}>{c.discipline}</div>

                {c.skills && c.skills.length > 0 && (
                  <>
                    <div className={styles.skillsLabel}>Skills</div>
                    <div className={styles.skills}>
                      {c.skills.map((s, i) => (
                        <span key={i} className={styles.skill}>{s}</span>
                      ))}
                    </div>
                  </>
                )}

                {hasSeeking && (
                  <div className={styles.seeking}>
                    <div className={styles.seekingLabel}>Looking to collaborate with</div>
                    {c.seekingDiscipline && (
                      <div className={styles.seekingDisc}>{c.seekingDiscipline}</div>
                    )}
                    {c.seekingSkills && c.seekingSkills.length > 0 && (
                      <div className={styles.seekingSkills}>
                        {c.seekingSkills.map((s, i) => (
                          <span key={i} className={styles.seekingSkill}>{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className={styles.spacer} />
                <Link href="/signup" className={styles.joinLink}>Join to connect →</Link>
              </div>
            )
          })}
        </div>
      )}

      <section className={styles.close}>
        <h2 className={styles.closeH}>Find the one who&apos;s <em>looking for you.</em></h2>
        <p className={styles.closeSub}>Build a profile, say what you&apos;re making, and connect with the creatives who need exactly what you do.</p>
        <Link href="/signup" className={styles.btnPrimary}>Join Collective Loft</Link>
      </section>
    </div>
  )
}
