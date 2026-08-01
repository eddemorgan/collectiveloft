'use client'

import Link from 'next/link'
import { TermsDoc } from '../../components/LegalDocs'
import { EFFECTIVE_DATE, PRIVACY_URL } from '../../../lib/legal'
import styles from '../legal.module.css'
import Footer from '../../components/Footer'

export default function TermsPage() {
  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoRow}>
            <span className={styles.mark}>&#10022;</span>
            <span>Collective <em>Loft</em></span>
          </span>
          <span className={styles.tag}>Where creatives find each other</span>
        </Link>
      </nav>

      <div className={styles.wrap}>
        <div className={styles.eyebrow}>Legal</div>
        <h1 className={styles.title}>Terms &amp; Conditions</h1>
        <p className={styles.sub}>
          Effective {EFFECTIVE_DATE}. These are the terms every member agrees to before creating a profile.
          Our <Link href={PRIVACY_URL}>Privacy Policy</Link> explains what we do with your data.
        </p>

        <div className={styles.doc}>
          <TermsDoc />
        </div>

        <Footer />
      </div>
    </div>
  )
}
