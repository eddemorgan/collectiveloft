'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from './browse.module.css'
import Footer from '../components/Footer'

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
  const [matched,   setMatched]   = useState(null)
  const [total,     setTotal]     = useState(null)

  // Radius search: a chosen center city, a distance, and a unit. The distance
  // itself is measured on the server, so no member coordinates come down here.
  const [city,    setCity]    = useState(null)   // { name, lat, lng }
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState([])
  const [dist,    setDist]    = useState(50)
  const [unit,    setUnit]    = useState('mi')

  useEffect(() => {
    const qs = city
      ? `?lat=${city.lat}&lng=${city.lng}&radius=${dist || 0}&unit=${unit}`
      : ''
    fetch(`/api/browse${qs}`)
      .then(r => r.json())
      .then(d => {
        setCreatives(Array.isArray(d.creatives) ? d.creatives : [])
        setMatched(typeof d.matched === 'number' ? d.matched : null)
        setTotal(typeof d.total === 'number' ? d.total : null)
      })
      .catch(() => setCreatives([]))
  }, [city, dist, unit])

  async function searchCity(q) {
    setQuery(q)
    if (!q || q.trim().length < 2) { setResults([]); return }
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) { setResults([]); return }
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?types=place&limit=5&access_token=${token}`
      const res = await fetch(url)
      const data = await res.json()
      setResults(Array.isArray(data.features) ? data.features : [])
    } catch { setResults([]) }
  }

  function pickCity(f) {
    const [lng, lat] = f.center || [null, null]
    setCity({ name: f.place_name, lat, lng })
    setQuery(f.place_name)
    setResults([])
  }

  function clearCity() {
    setCity(null); setQuery(''); setResults([])
  }

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

      <div className={styles.locBar}>
        <div className={styles.locInner}>
          <div className={styles.locLabel}>Who is near you</div>
          {city ? (
            <div className={styles.locActive}>
              <span className={styles.locPin}>📍 {city.name}</span>
              <div className={styles.locDist}>
                <span>Within</span>
                <input
                  type="number"
                  min="10"
                  value={dist}
                  onChange={e => setDist(Number(e.target.value) || 0)}
                  className={styles.locNum}
                  aria-label="Distance"
                />
                <div className={styles.locUnits}>
                  {['mi', 'km'].map(u => (
                    <button
                      key={u}
                      onClick={() => setUnit(u)}
                      className={`${styles.locUnit} ${unit === u ? styles.locUnitOn : ''}`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={clearCity} className={styles.locClear}>Clear</button>
            </div>
          ) : (
            <div className={styles.locSearchWrap}>
              <input
                type="text"
                value={query}
                onChange={e => searchCity(e.target.value)}
                placeholder="Search a city to see who is nearby"
                className={styles.locInput}
              />
              {results.length > 0 && (
                <div className={styles.locResults}>
                  {results.map(f => (
                    <button key={f.id} onClick={() => pickCity(f)} className={styles.locResult}>
                      {f.place_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {city && matched !== null && (
            <div className={styles.locCount}>
              {matched === 0
                ? `No one within ${dist} ${unit} yet. Be the first.`
                : `${matched} ${matched === 1 ? 'creative' : 'creatives'} within ${dist} ${unit}`}
            </div>
          )}
          {!city && total !== null && total > 0 && (
            <div className={styles.locCount}>
              {total} {total === 1 ? 'creative' : 'creatives'} on the platform
            </div>
          )}
        </div>
      </div>

      {creatives === null ? (
        <div className={styles.loading}>Loading creatives…</div>
      ) : creatives.length === 0 ? (
        <div className={styles.empty}>
          {city
            ? 'No one in range yet. Widen the distance, or be the first one here.'
            : 'Creatives are joining now. Be one of the first.'}
        </div>
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

      <Footer />
    </div>
  )
}
