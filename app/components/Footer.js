'use client'

import Link from 'next/link'
import { TERMS_URL, PRIVACY_URL } from '../../lib/legal'

const legalLink = {
  fontFamily: 'var(--sans)',
  fontSize: '0.72rem',
  color: 'var(--muted)',
  letterSpacing: '0.04em',
  textDecoration: 'none',
}

export default function Footer() {
  return (
    <footer style={{
      borderTop: '0.5px solid var(--rule)',
      padding: '1.25rem 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      flexWrap: 'wrap',
      marginTop: 'auto',
      background: 'var(--bg)',
    }}>
      <span style={{
        fontFamily: 'var(--sans)',
        fontSize: '0.72rem',
        color: 'var(--muted)',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}>
        Morgan Collective Group Subsidiary
      </span>
      <span style={{
        fontFamily: 'var(--sans)',
        fontSize: '0.72rem',
        color: 'var(--muted)',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        textAlign: 'center',
      }}>
        A Collective Codes Website
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link href="/guide" style={legalLink}>Guide</Link>
        <Link href={TERMS_URL} style={legalLink}>Terms</Link>
        <Link href={PRIVACY_URL} style={legalLink}>Privacy</Link>
        <span style={{
          fontFamily: 'var(--sans)',
          fontSize: '0.72rem',
          color: 'rgba(26,24,20,0.35)',
          letterSpacing: '0.04em',
        }}>
          © {new Date().getFullYear()} Collective Loft
        </span>
      </span>
    </footer>
  )
}
