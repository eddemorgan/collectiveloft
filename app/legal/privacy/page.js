'use client'

import Link from 'next/link'
import { PrivacyDoc } from '../../components/LegalDocs'
import { EFFECTIVE_DATE, TERMS_URL } from '../../../lib/legal'
import styles from '../legal.module.css'
import Footer from '../../components/Footer'

export default function PrivacyPage() {
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
        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.sub}>
          Effective {EFFECTIVE_DATE}. What we collect, what we do with it, and what you can ask us to do about it.
          Read alongside our <Link href={TERMS_URL}>Terms &amp; Conditions</Link>.
        </p>

        <div className={styles.doc}>
          <PrivacyDoc />
        </div>

        <Footer />
      </div>
    </div>
  )
}
