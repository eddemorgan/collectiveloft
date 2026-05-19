'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import styles from './matching.module.css'

const DISCIPLINES = [
  { key: 'all',           label: 'All disciplines',  icon: '✦' },
  { key: 'Visual Art',    label: 'Visual Art',        icon: '🎨' },
  { key: 'Music',         label: 'Music',             icon: '🎵' },
  { key: 'Writing',       label: 'Writing',           icon: '✍️' },
  { key: 'Design & Web',  label: 'Design & Web',      icon: '🖥' },
  { key: 'Film',          label: 'Film',              icon: '🎬' },
  { key: 'Photography',   label: 'Photography',       icon: '📷' },
  { key: 'Performance',   label: 'Performance',       icon: '🎭' },
  { key: 'Creative Tech', label: 'Creative Tech',     icon: '💻' },
]

const DISC_KEY_MAP = {
  'Visual Art':    'visual',
  'Music':         'music',
  'Writing':       'writing',
  'Design & Web':  'design',
  'Film':          'film',
  'Photography':   'photo',
  'Performance':   'perf',
  'Creative Tech': 'tech',
}

// Simple match score: shared skills + cross-discipline bonus
function computeScore(profile, myProfile) {
  if (!myProfile) return Math.floor(Math.random() * 40) + 50
  const myDiscs = myProfile.disciplines || []
  const mySkills = (myProfile.skills || []).map(s => s.toLowerCase())
  const theirDiscs = profile.disciplines || []
  const theirSkills = (profile.skills || []).map(s => s.toLowerCase())

  let score = 50

  // Cross-discipline bonus — they have something you don't
  const crossDisc = theirDiscs.some(d => !myDiscs.includes(d))
  if (crossDisc) score += 20

  // Shared skills overlap
  const overlap = mySkills.filter(s => theirSkills.includes(s)).length
  score += Math.min(overlap * 5, 20)

  // Both open to collab
  if (profile.open_to_collab) score += 5

  // Has collab history
  if ((profile.collab_count || 0) > 0) score += 5

  return Math.min(score, 99)
}

function scoreClass(s) {
  if (s >= 85) return styles.scoreHigh
  if (s >= 65) return styles.scoreGood
  return styles.scoreFair
}

function avatarInitials(first, last) {
  return `${(first || '')[0] || ''}${(last || '')[0] || ''}`.toUpperCase()
}

function slugify(first, last) {
  return `${(first || '').toLowerCase()}-${(last || '').toLowerCase()}`
}

export default function MatchingPage() {
  const router = useRouter()
  const [myProfile, setMyProfile]     = useState(null)
  const [profiles, setProfiles]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [activeDisc, setActiveDisc]   = useState('all')
  const [sortMode, setSortMode]       = useState('score')
  const [reachedOut, setReachedOut]   = useState({})

  const [toggles, setToggles] = useState({
    open: true, collabs: false, remote: false,
    exchange: true, paid: true, revshare: false,
  })

  useEffect(() => {
    async function load() {
      setLoading(true)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()

      let myP = null
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        myP = data
        setMyProfile(data)
      }

      // Get all other profiles
      const query = supabase
        .from('profiles')
        .select('id, firstname, lastname, headline, disciplines, skills, location, avatar_url, open_to_collab, collab_count, compensation, seeking, bio')
        .order('created_at', { ascending: false })

      if (user) query.neq('id', user.id)

      const { data: all } = await query
      setProfiles(all || [])
      setLoading(false)
    }
    load()
  }, [])

  const scored = useMemo(() => {
    return profiles.map(p => ({
      ...p,
      score: computeScore(p, myProfile),
    }))
  }, [profiles, myProfile])

  const filtered = useMemo(() => {
    let list = scored.filter(p => {
      // Discipline filter
      if (activeDisc !== 'all') {
        const discs = p.disciplines || []
        if (!discs.includes(activeDisc)) return false
      }
      // Open to collab
      if (toggles.open && !p.open_to_collab) return false
      // Has collabs
      if (toggles.collabs && !(p.collab_count > 0)) return false
      // Compensation
      const comp = p.compensation || []
      if (toggles.exchange && !toggles.paid) {
        if (!comp.includes('Creative exchange')) return false
      }
      if (toggles.paid && !toggles.exchange) {
        if (!comp.includes('Paid')) return false
      }
      return true
    })

    if (sortMode === 'collabs') list.sort((a, b) => (b.collab_count || 0) - (a.collab_count || 0))
    else if (sortMode === 'recent') list.sort((a, b) => 0) // already ordered by created_at
    else list.sort((a, b) => b.score - a.score)

    return list
  }, [scored, activeDisc, toggles, sortMode])

  // Disc counts from filtered (without disc filter applied)
  const discCounts = useMemo(() => {
    const counts = {}
    scored.forEach(p => {
      const discs = p.disciplines || []
      discs.forEach(d => { counts[d] = (counts[d] || 0) + 1 })
    })
    return counts
  }, [scored])

  function toggleSwitch(key) {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function handleReachOut(id, name) {
    setReachedOut(prev => ({ ...prev, [id]: true }))
  }

  const myDiscs = myProfile?.disciplines || []

  return (
    <div className={styles.page}>
      {/* NAV */}
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>Collective <span>Loft</span></Link>
        <div className={styles.navLinks}>
<Link href="/discover">Discover</Link>
<Link href="/briefs">Collabs</Link>
<Link href="/matching" className={styles.active}>Matching</Link>
<Link href="/my-studios">Loft Studio</Link>
        </div>
      </nav>

      {/* PAGE HEADER */}
      <div className={styles.pageHdr}>
        <div>
          <div className={styles.eyebrow}>Collective Loft</div>
          <div className={styles.hdrTitle}>Discipline Matching</div>
          <div className={styles.hdrSub}>Creatives ranked by how well they fit what you're making right now — not by popularity.</div>
        </div>
        {myDiscs.length > 0 && (
          <div className={styles.youAre}>
            <span className={styles.yaLabel}>You are</span>
            {myDiscs.map(d => (
              <span key={d} className={styles.yaTag}>{d}</span>
            ))}
          </div>
        )}
      </div>

      {/* BODY */}
      <div className={styles.bodyLayout}>

        {/* SIDEBAR */}
        <aside className={styles.sidebar}>
          <div className={styles.filterSection}>
            <div className={styles.filterLabel}>I'm looking for</div>
            <div className={styles.discBtns}>
              {DISCIPLINES.map(d => (
                <button
                  key={d.key}
                  className={`${styles.discBtn} ${activeDisc === d.key ? styles.discBtnActive : ''}`}
                  onClick={() => setActiveDisc(d.key)}
                >
                  <div className={styles.discBtnLeft}>
                    <span className={styles.discIcon}>{d.icon}</span>
                    <span className={styles.discName}>{d.label}</span>
                  </div>
                  <span className={styles.discCount}>
                    {d.key === 'all' ? scored.length : (discCounts[d.key] || 0)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.filterSection}>
            <div className={styles.filterLabel}>Availability</div>
            <div className={styles.toggleRows}>
              {[
                { key: 'open',    label: 'Open to collab now' },
                { key: 'collabs', label: 'Has completed collabs' },
                { key: 'remote',  label: 'Remote available' },
              ].map(t => (
                <div key={t.key} className={styles.toggleRow} onClick={() => toggleSwitch(t.key)}>
                  <span className={styles.toggleLbl}>{t.label}</span>
                  <div className={`${styles.toggle} ${toggles[t.key] ? styles.toggleOn : styles.toggleOff}`}>
                    <div className={styles.toggleKnob} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.filterSection}>
            <div className={styles.filterLabel}>Compensation</div>
            <div className={styles.toggleRows}>
              {[
                { key: 'exchange', label: 'Creative exchange' },
                { key: 'paid',     label: 'Paid' },
                { key: 'revshare', label: 'Revenue share' },
              ].map(t => (
                <div key={t.key} className={styles.toggleRow} onClick={() => toggleSwitch(t.key)}>
                  <span className={styles.toggleLbl}>{t.label}</span>
                  <div className={`${styles.toggle} ${toggles[t.key] ? styles.toggleOn : styles.toggleOff}`}>
                    <div className={styles.toggleKnob} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button className={styles.clearBtn} onClick={() => {
            setActiveDisc('all')
            setToggles({ open: true, collabs: false, remote: false, exchange: true, paid: true, revshare: false })
          }}>
            Clear all filters
          </button>
        </aside>

        {/* RESULTS */}
        <div className={styles.resultsArea}>

          <div className={styles.howBanner}>
            <span className={styles.howIcon}>✦</span>
            <div className={styles.howText}>
              <strong>How matching works:</strong> We look at your disciplines, skills, collab history, and who's actively making. Matches improve as your profile fills out — the more real work you do on the platform, the better your matches get.
              <br /><span className={styles.howNote}>Connections on Collective Loft only form from completed collabs — not follows or requests. Matching is how you find who to work with next.</span>
            </div>
          </div>

          <div className={styles.resultsHdr}>
            <div className={styles.resultsCount}>Your matches: <span>{filtered.length}</span> creatives</div>
            <div className={styles.sortOpts}>
              {[
                { mode: 'score',   label: 'Best match' },
                { mode: 'collabs', label: 'Most collabs' },
                { mode: 'recent',  label: 'Recently active' },
              ].map(s => (
                <button
                  key={s.mode}
                  className={`${styles.sortOpt} ${sortMode === s.mode ? styles.sortOptActive : ''}`}
                  onClick={() => setSortMode(s.mode)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className={styles.loading}>Finding your matches...</div>
          ) : filtered.length === 0 ? (
            <div className={styles.noResults}>
              <div className={styles.nrIcon}>✦</div>
              <div className={styles.nrTitle}>No matches for these filters.</div>
              <div className={styles.nrSub}>Try widening your filters — even unexpected disciplines can spark the right collab.</div>
            </div>
          ) : (
            <div className={styles.matchGrid}>
              {filtered.map((p, i) => {
                const discKey = (p.disciplines || [])[0]
                const dk = DISC_KEY_MAP[discKey] || 'visual'
                const slug = slugify(p.firstname, p.lastname)
                const initials = avatarInitials(p.firstname, p.lastname)
                const sent = reachedOut[p.id]

                return (
                  <Link
                    key={p.id}
                    href={`/profile/${slug}`}
                    className={`${styles.matchCard} ${p.score >= 85 ? styles.topMatch : ''}`}
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <div className={`${styles.mcCover} ${styles[`cv_${dk}`]}`}>
                      <div className={`${styles.mcCoverInner} ${styles[`pat_${dk}`]}`} />
                      <div className={`${styles.scoreBadge} ${scoreClass(p.score)}`}>
                        {p.score}% match
                      </div>
                    </div>

                    <div className={styles.mcBody}>
                      <div className={styles.mcAvWrap}>
                        {p.avatar_url ? (
                          <img src={p.avatar_url} alt={p.firstname} className={styles.mcAv} />
                        ) : (
                          <div className={`${styles.mcAv} ${styles.mcAvInitials}`}>
                            {initials}
                            <div className={`${styles.mcOnline} ${p.open_to_collab ? styles.dotOn : styles.dotOff}`} />
                          </div>
                        )}
                      </div>

                      <div className={styles.mcContent}>
                        <div className={styles.mcName}>{p.firstname} {p.lastname}</div>
                        <div className={`${styles.mcRole} ${styles[`hl_${dk}`]}`}>
                          {p.headline || (p.disciplines || []).join(' · ')}
                        </div>

                        {p.bio && (
                          <div className={styles.mcWhy}>
                            {p.bio.slice(0, 100)}{p.bio.length > 100 ? '…' : ''}
                          </div>
                        )}

                        {(p.disciplines || []).length > 0 && (
                          <div className={styles.mcReasons}>
                            {p.disciplines.map(d => (
                              <div key={d} className={styles.mcReason}>Discipline: {d}</div>
                            ))}
                            {p.open_to_collab && (
                              <div className={styles.mcReason}>Open to collaborate now</div>
                            )}
                          </div>
                        )}

                        {(p.skills || []).length > 0 && (
                          <div className={styles.mcTags}>
                            {p.skills.slice(0, 3).map(s => (
                              <span key={s} className={styles.mctag}>{s}</span>
                            ))}
                          </div>
                        )}

                        <div className={styles.mcFooter}>
                          <div className={styles.mcMeta}>
                            {p.location && <span>📍 {p.location}</span>}
                            <span>◎ {p.collab_count || 0} collabs</span>
                          </div>
                          <button
                            className={`${styles.btnReachOut} ${sent ? styles.sent : ''}`}
                            onClick={e => { e.preventDefault(); e.stopPropagation(); handleReachOut(p.id, p.firstname) }}
                          >
                            {sent ? 'Sent ✦' : 'Reach out'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}