'use client'

import Link from 'next/link'
import styles from './about.module.css'

const SOCIALS = [
  ['Instagram','https://www.instagram.com/the.collective.loft/','M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.31-1.46.72-2.12 1.38C1.35 2.67.94 3.34.63 4.14.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.79.72 1.46 1.38 2.12.66.66 1.33 1.07 2.12 1.38.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56.79-.31 1.46-.72 2.12-1.38.66-.66 1.07-1.33 1.38-2.12.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91-.31-.79-.72-1.46-1.38-2.12C21.33 1.35 20.66.94 19.86.63 19.1.33 18.22.13 16.95.07 15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 100 12.32 6.16 6.16 0 000-12.32zM12 16a4 4 0 110-8 4 4 0 010 8zm6.41-11.85a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88z'],
  ['TikTok','https://www.tiktok.com/@the.collective.loft','M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64c.3 0 .59.05.86.13V9.4a6.33 6.33 0 00-.86-.06A6.34 6.34 0 005.15 20.4a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1.19-.4z'],
  ['Bluesky','https://bsky.app/profile/thecollectiveloft.bsky.social','M5.77 3.36C8.23 5.2 10.88 8.95 12 11.24c1.12-2.3 3.77-6.04 6.23-7.88C20 2.03 22 1.02 22 3.34c0 .46-.26 3.9-.42 4.45-.55 1.94-2.52 2.44-4.28 2.14 3.07.52 3.85 2.25 2.16 3.98-3.2 3.28-4.6-.82-4.96-1.87-.07-.2-.1-.28-.1-.2 0-.08-.03 0-.1.2-.36 1.05-1.76 5.15-4.96 1.87-1.69-1.73-.91-3.46 2.16-3.98-1.76.3-3.73-.2-4.28-2.14C2.26 7.24 2 3.8 2 3.34c0-2.32 2-1.31 3.77.02z'],
  ['LinkedIn','https://www.linkedin.com/company/collectiveloft','M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 110-4.13 2.06 2.06 0 010 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z'],
  ['Reddit','https://www.reddit.com/r/CollectiveLoft/','M24 11.78a2.34 2.34 0 00-3.96-1.68 11.5 11.5 0 00-6.24-1.98l1.06-5.02 3.5.74a1.67 1.67 0 103.34-.15 1.67 1.67 0 00-3.16-.74l-3.9-.83a.42.42 0 00-.5.32l-1.18 5.56a11.5 11.5 0 00-6.32 1.98 2.34 2.34 0 10-2.58 3.83 4.6 4.6 0 00-.06.72c0 3.66 4.26 6.63 9.52 6.63s9.52-2.97 9.52-6.63a4.6 4.6 0 00-.06-.72A2.34 2.34 0 0024 11.78zM6.67 13.44a1.67 1.67 0 113.34 0 1.67 1.67 0 01-3.34 0zm9.34 4.42c-1.14 1.14-3.32 1.23-3.96 1.23s-2.82-.09-3.96-1.23a.42.42 0 01.6-.6c.72.72 2.26.98 3.36.98s2.64-.26 3.36-.98a.42.42 0 01.6.6zm-.31-2.75a1.67 1.67 0 110-3.34 1.67 1.67 0 010 3.34z'],
  ['Facebook','https://www.facebook.com/people/Collective-Loft/61591496305697/','M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z'],
]

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.brand}>
            <span className={styles.mark}>&#10022;</span>
            <span>
              <span className={styles.wm}>Collective <em>Loft</em></span>
              <span className={styles.tag}>Where creatives find each other</span>
            </span>
          </Link>
          <Link href="/" className={styles.navBack}>&larr; Back to Collective Loft</Link>
        </div>
      </nav>

      <header className={styles.hero}>
        <div className={styles.eyebrow}>Why we built this</div>
        <h1 className={styles.title}>Someone I <em>love</em> is an artist. That <em>changed everything.</em></h1>
        <p className={styles.lede}>This didn&rsquo;t start with a business plan. It started with a person, and what I noticed watching them try to build a life out of what they make.</p>
      </header>

      <section className={styles.body}>
        <p className={styles.lead}>Making things is hard. Getting paid fairly for it turned out to be harder.</p>
        <p className={styles.para}>I watched someone I love get good at their craft, really good, and then get asked to work for free. For exposure. For a maybe. I saw the contracts written to take instead of share, the projects that never paid, the quiet expectation that a creative should just be grateful to be in the room.</p>
        <p className={styles.para}>And here&rsquo;s the thing that stuck with me: none of it was unusual. This is just how it goes for almost everyone who makes things for a living. Not bad luck. The design. An entire industry arranged so the people doing the actual creating end up with the least of it.</p>
      </section>

      <div className={styles.divider}><span className={styles.dividerMark}>&#10022; &#10022; &#10022;</span></div>

      <section className={styles.body}>
        <p className={styles.para}>The more I looked, the bigger it got. Creatives are one of the largest, fastest-growing groups of workers in the world, and almost none of the infrastructure everyone else takes for granted was ever built for them. No real protections. No agreements that hold. No professional home. Just platforms that harvest their work and marketplaces that race them to the bottom.</p>
        <p className={styles.para}>Building infrastructure is what I do. I&rsquo;ve spent my career building the systems and platforms that businesses run on. And somewhere in all of this, it hit me: I could keep building that for the corporate world, or I could build it for the people who actually need it and never had it.</p>
        <p className={styles.para}>So it stopped being about helping one person. It became about building the thing that should have existed all along, for the people it should have existed for.</p>
      </section>

      <div className={styles.divider}><span className={styles.dividerMark}>&#10022; &#10022; &#10022;</span></div>

      <section className={styles.body}>
        <p className={styles.para}>Collective Loft runs on one stubborn idea: creatives deserve a protected place to find each other and do real work. Not another feed. Not another gig marketplace. A room with a lock on the door.</p>
      </section>

      <section className={styles.pullSection}>
        <p className={styles.pull}>That lock is why there&rsquo;s a membership. It isn&rsquo;t a paywall, <em>it&rsquo;s what keeps the people who exploit creatives out.</em></p>
      </section>

      <section className={styles.body}>
        <p className={styles.para}>Everyone inside has agreed to real terms, has skin in the game, and is here to build something real. The fee is the filter. It&rsquo;s what keeps this a safe place to work.</p>
      </section>

      <section className={styles.close}>
        <p className={styles.closeLead}>This was built out of love, and it&rsquo;s run the same way.</p>
        <p className={styles.closeBody}>If you make things, this is your place. Come find your people, set your terms, and do the work that&rsquo;s yours, protected, and on equal footing, the way it always should have been.</p>
        <Link href="/signup" className={styles.btnPrimary}>Join Collective Loft &rarr;</Link>
        <p className={styles.signature}>Built in Chicago, with care, by Edde and Stephanie Morgan.</p>
      </section>

      <footer className={styles.foot}>
        <div className={styles.footInner}>
          <div className={styles.fine}>
            &copy; 2026 Collective Loft &middot; A Morgan Collective Group company
            {' '}&middot;{' '}
            <Link href="/legal/terms" style={{ color: 'var(--gold)', textDecoration: 'none' }}>Terms</Link>
            {' '}&middot;{' '}
            <Link href="/legal/privacy" style={{ color: 'var(--gold)', textDecoration: 'none' }}>Privacy</Link>
          </div>
          <div className={styles.socials}>
            {SOCIALS.map(([name, href, d]) => (
              <a key={name} href={href} target="_blank" rel="noopener noreferrer" aria-label={name} className={styles.social}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d={d}/></svg>
              </a>
            ))}
          </div>
          <div className={styles.fine}>Chicago &middot; London</div>
        </div>
      </footer>
    </div>
  )
}
