'use client'

export default function Footer() {
  return (
    <footer style={{
      borderTop: '0.5px solid var(--rule)',
      padding: '1.25rem 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 'auto',
    }}>
      <span style={{
        fontFamily: 'var(--sans)',
        fontSize: '0.62rem',
        color: 'rgba(240,236,227,0.2)',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}>
        Morgan Collective Group Subsidiary
      </span>
      <span style={{
        fontFamily: 'var(--sans)',
        fontSize: '0.62rem',
        color: 'rgba(240,236,227,0.12)',
        letterSpacing: '0.04em',
      }}>
        © {new Date().getFullYear()} Collective Loft
      </span>
    </footer>
  )
}