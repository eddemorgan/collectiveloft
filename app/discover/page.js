'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import styles from './discover.module.css'

const DISCIPLINES = [
  { key: 'all',          icon: '✦',  label: 'All disciplines' },
  { key: 'Visual Art',   icon: '🎨', label: 'Visual Art' },
  { key: 'Music',        icon: '🎵', label: 'Music' },
  { key: 'Writing',      icon: '✍️', label: 'Writing' },
  { key: 'Design & Web', icon: '🖥',  label: 'Design & Web' },
  { key: 'Film',         icon: '🎬', label: 'Film' },
  { key: 'Photography',  icon: '📷', label: 'Photography' },
  { key: 'Performance',  icon: '🎭', label: 'Performance' },
  { key: 'Creative Tech',icon: '💻', label: 'Creative Tech' },
]

const COVER_PATTERNS = {
  visual:  `repeating-linear-gradient(45deg,rgba(201,168,76,0.04) 0,rgba(201,168,76,0.04) 1px,transparent 1px,transparent 20px),repeating-linear-gradient(-45deg,rgba(201,168,76,0.04) 0,rgba(201,168,76,0.04) 1px,transparent 1px,transparent 20px)`,
  music:   `repeating-linear-gradient(90deg,rgba(86,179,156,0.06) 0,rgba(86,179,156,0.06) 1px,transparent 1px,transparent 6px)`,
  writing: `repeating-linear-gradient(0deg,rgba(160,120,208,0.05) 0,rgba(160,120,208,0.05) 1px,transparent 1px,transparent 18px)`,
  design:  `repeating-linear-gradient(60deg,rgba(86,140,195,0.05) 0,rgba(86,140,195,0.05) 1px,transparent 1px,transparent 14px)`,
  film:    `repeating-linear-gradient(30deg,rgba(194,112,128,0.05) 0,rgba(194,112,128,0.05) 1px,transparent 1px,transparent 12px)`,
  photo:   `radial-gradient(circle at 30% 50%,rgba(130,180,120,0.08) 0%,transparent 60%)`,
  perf:    `repeating-linear-gradient(135deg,rgba(200,140,100,0.05) 0,rgba(200,140,100,0.05) 1px,transparent 1px,transparent 16px)`,
  tech:    `repeating-linear-gradient(90deg,rgba(100,180,170,0.04) 0,rgba(100,180,170,0.04) 1px,transparent 1px,transparent 8px),repeating-linear-gradient(0deg,rgba(100,180,170,0.04) 0,rgba(100,180,170,0.04) 1px,transparent 1px,transparent 8px)`,
}

function discKey(discipline) {
  if (!discipline) return 'visual'
  const d = discipline.toLowerCase()
  if (d.includes('music'))   return 'music'
  if (d.includes('writing')) return 'writing'
  if (d.includes('design'))  return 'design'
  if (d.includes('film'))    return 'film'
  if (d.includes('photo'))   return 'photo'
  if (d.includes('perf'))    return 'perf'
  if (d.includes('tech'))    return 'tech'
  return 'visual'
}

function profileSlug(p) {
  return `${(p.firstname || '').trim().toLowerCase()}-${(p.lastname || '').trim().toLowerCase()}`
}

function initials(p) {
  return [(p.firstname || '?')[0], (p.lastname || '?')[0]].join('').toUpperCase()
}

function locationStr(p) {
  return [p.city, p.state].filter(Boolean).join(', ') || 'Remote'
}

// Great-circle distance between two lat/lng points, in miles.
function distanceMiles(lat1, lng1, lat2, lng2) {
  const toRad = d => (d * Math.PI) / 180
  const R = 3958.8 // Earth radius in miles
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function DiscoverPage() {
  const router = useRouter()
  const { loading: authLoading, user } = useAuth()

  const [creatives,     setCreatives]     = useState([])
  const [loading,       setLoading]       = useState(true)
  const [activeDisc,    setActiveDisc]    = useState('all')
  const [availOpen,     setAvailOpen]     = useState(false)
  const [availSoon,     setAvailSoon]     = useState(false)
  const [histCompleted, setHistCompleted] = useState(false)
  const [histActive,    setHistActive]    = useState(false)
  const [payoutReady,   setPayoutReady]   = useState(false)
  const [activeComp,    setActiveComp]    = useState(['Creative exchange', 'Paid', 'Revenue share'])
  const [location,      setLocation]      = useState('')
  // Radius search: a chosen center city (with coords) + radius + unit.
  const [radiusCity,    setRadiusCity]    = useState(null)   // { name, lat, lng }
  const [radiusQuery,   setRadiusQuery]   = useState('')
  const [radiusResults, setRadiusResults] = useState([])
  const [radiusDist,    setRadiusDist]    = useState(50)     // number
  const [radiusUnit,    setRadiusUnit]    = useState('mi')   // 'mi' | 'km'
  const [search,        setSearch]        = useState('')
  const [sortMode,      setSortMode]      = useState('recent')

  useEffect(() => {
    if (authLoading) return
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      setCreatives(data || [])
      setLoading(false)
    }
    load()
  }, [authLoading])

  const cityOptions = useMemo(() => {
    const cities = new Set()
    creatives.forEach(c => {
      if (c.city && c.city.trim()) cities.add(c.city.trim())
      if (c.state && c.state.trim() && !c.city) cities.add(c.state.trim())
    })
    return Array.from(cities).sort()
  }, [creatives])

  // Mapbox search to choose the radius center city.
  async function searchRadiusCity(q) {
    setRadiusQuery(q)
    if (!q || q.trim().length < 2) { setRadiusResults([]); return }
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) { setRadiusResults([]); return }
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?types=place&limit=5&access_token=${token}`
      const res = await fetch(url)
      const data = await res.json()
      setRadiusResults(Array.isArray(data.features) ? data.features : [])
    } catch { setRadiusResults([]) }
  }

  function pickRadiusCity(f) {
    const [lng, lat] = f.center || [null, null]
    setRadiusCity({ name: f.place_name, lat, lng })
    setRadiusQuery(f.place_name)
    setRadiusResults([])
  }

  function clearRadius() {
    setRadiusCity(null); setRadiusQuery(''); setRadiusResults([])
  }

  const discCounts = useMemo(() => {
    const counts = { all: creatives.length }
    DISCIPLINES.slice(1).forEach(d => {
      counts[d.key] = creatives.filter(c => (c.disciplines || []).includes(d.key)).length
    })
    return counts
  }, [creatives])

  const filtered = useMemo(() => {
    let list = creatives.filter(c => {
      // Hide your own profile
      if (user && c.id === user.id) return false
      if (activeDisc !== 'all' && !(c.disciplines || []).includes(activeDisc)) return false
      if (availOpen && c.availability !== 'open') return false
      if (activeComp.length > 0 && (c.compensation || []).length > 0) {
        if (!(c.compensation || []).some(x => activeComp.includes(x))) return false
      }
      if (radiusCity && radiusCity.lat != null) {
        // Only include creatives who have coordinates and fall within the radius.
        if (c.latitude == null || c.longitude == null) return false
        const miles = distanceMiles(radiusCity.lat, radiusCity.lng, c.latitude, c.longitude)
        const limitMiles = radiusUnit === 'km' ? radiusDist * 0.621371 : radiusDist
        if (miles > limitMiles) return false
      } else if (location) {
        const cityMatch  = (c.city || '').toLowerCase().includes(location.toLowerCase())
        const stateMatch = (c.state || '').toLowerCase().includes(location.toLowerCase())
        if (!cityMatch && !stateMatch) return false
      }
      if (histCompleted && (c.collabs_count || 0) === 0) return false
      if (payoutReady && !c.connect_onboarded) return false
      if (search) {
        const hay = `${c.firstname} ${c.lastname} ${c.headline} ${(c.disciplines||[]).join(' ')} ${locationStr(c)} ${c.rightnow || ''}`.toLowerCase()
        if (!hay.includes(search.toLowerCase())) return false
      }
      return true
    })
    if (sortMode === 'collabs') list = [...list].sort((a, b) => (b.collabs_count||0) - (a.collabs_count||0))
    else if (sortMode === 'new') list = [...list].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    return list
  }, [creatives, user, activeDisc, availOpen, availSoon, histCompleted, histActive, payoutReady, activeComp, location, radiusCity, radiusDist, radiusUnit, search, sortMode])

  function toggleComp(label) {
    setActiveComp(prev => prev.includes(label) ? prev.filter(x => x !== label) : [...prev, label])
  }

  function clearFilters() {
    setActiveDisc('all'); setAvailOpen(false); setAvailSoon(false)
    setHistCompleted(false); setHistActive(false)
    setActiveComp(['Creative exchange', 'Paid', 'Revenue share'])
    setLocation(''); setSearch(''); setSortMode('recent'); clearRadius()
  }

  function handleReachOut(e, id) {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/terms?with=${id}`)
  }

  if (authLoading) return null

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh' }}>
      <Nav />

      <div className={styles.pageHdr}>
        <div>
          <div className={styles.eyebrow}>Collective Loft</div>
          <div className={styles.hdrTitle}>Discover Creatives</div>
          <div className={styles.hdrSub}>Browse artists, musicians, writers, designers, filmmakers, and makers — all open to collaboration.</div>
        </div>
        <div className={styles.hdrRight}>
          <div className={styles.resultCount}><span>{filtered.length}</span> creatives</div>
          <div className={styles.searchWrap}>
            <div className={styles.searchIcon}>⌕</div>
            <input className={styles.searchInput} type="text" placeholder="Search by name or keyword…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      <div className={styles.bodyLayout} style={{ flex: 1 }}>
        <aside className={styles.filterSidebar}>
          <div className={styles.filterSection}>
            <div className={styles.filterLabel}>Discipline</div>
            <div className={styles.discBtns}>
              {DISCIPLINES.map(d => (
                <div key={d.key} className={`${styles.discBtn} ${activeDisc === d.key ? styles.active : ''}`} onClick={() => setActiveDisc(d.key)}>
                  <div className={styles.discBtnLeft}>
                    <div className={styles.discIcon}>{d.icon}</div>
                    <div className={styles.discName}>{d.label}</div>
                  </div>
                  <div className={styles.discCountBadge}>{discCounts[d.key] || 0}</div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.filterSection}>
            <div className={styles.filterLabel}>Availability</div>
            <div className={styles.toggleRows}>
              {[['Open to collabs now', availOpen, setAvailOpen], ['Available soon', availSoon, setAvailSoon]].map(([label, val, setter]) => (
                <div key={label} className={styles.toggleRow} onClick={() => setter(v => !v)}>
                  <span className={styles.toggleLbl}>{label}</span>
                  <div className={`${styles.toggle} ${val ? styles.on : styles.off}`}><div className={styles.toggleKnob} /></div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.filterSection}>
            <div className={styles.filterLabel}>Compensation</div>
            <div className={styles.compOpts}>
              {['Creative exchange', 'Paid', 'Revenue share'].map(c => (
                <div key={c} className={`${styles.compOpt} ${activeComp.includes(c) ? styles.checked : ''}`} onClick={() => toggleComp(c)}>
                  <div className={styles.compBox}>{activeComp.includes(c) ? '✓' : ''}</div>
                  <span className={styles.compLbl}>{c}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.filterSection}>
            <div className={styles.filterLabel}>Location</div>
            {radiusCity ? (
              <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'0.5rem', padding:'0.5rem 0.7rem', background:'rgba(184,146,46,0.08)', border:'0.5px solid rgba(184,146,46,0.3)', borderRadius:'4px' }}>
                  <span style={{ fontFamily:'var(--sans)', fontSize:'0.72rem', color:'var(--cream)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>📍 {radiusCity.name}</span>
                  <button onClick={clearRadius} style={{ background:'none', border:'none', color:'var(--muted)', cursor:'pointer', fontSize:'0.7rem', flexShrink:0 }}>✕</button>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
                  <span style={{ fontFamily:'var(--sans)', fontSize:'0.7rem', color:'var(--muted)' }}>Within</span>
                  <input type="number" min="1" value={radiusDist} onChange={e => setRadiusDist(Number(e.target.value) || 0)} style={{ width:'56px', padding:'0.35rem 0.4rem', fontFamily:'var(--sans)', fontSize:'0.75rem', border:'0.5px solid rgba(26,24,20,0.2)', borderRadius:'4px', background:'#fff', color:'#1A1A1A' }} />
                  <div style={{ display:'inline-flex', border:'0.5px solid rgba(26,24,20,0.2)', borderRadius:'4px', overflow:'hidden' }}>
                    {['mi','km'].map(u => (
                      <button key={u} onClick={() => setRadiusUnit(u)} style={{ padding:'0.35rem 0.6rem', fontFamily:'var(--sans)', fontSize:'0.72rem', fontWeight:600, border:'none', cursor:'pointer', background: radiusUnit===u ? 'var(--gold)' : 'transparent', color: radiusUnit===u ? 'var(--ink)' : 'var(--muted)' }}>{u}</button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ position:'relative' }}>
                <input
                  type="text"
                  placeholder="Search a city…"
                  value={radiusQuery}
                  onChange={e => searchRadiusCity(e.target.value)}
                  autoComplete="off"
                  style={{ width:'100%', padding:'0.5rem 0.7rem', fontFamily:'var(--sans)', fontSize:'0.78rem', border:'0.5px solid rgba(26,24,20,0.2)', borderRadius:'4px', background:'#fff', color:'#1A1A1A' }}
                />
                {radiusResults.length > 0 && (
                  <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:20, background:'#fff', border:'0.5px solid rgba(26,24,20,0.15)', borderRadius:'4px', marginTop:'2px', boxShadow:'0 4px 12px rgba(0,0,0,0.1)', overflow:'hidden' }}>
                    {radiusResults.map(f => (
                      <div key={f.id} onClick={() => pickRadiusCity(f)} style={{ padding:'0.5rem 0.7rem', cursor:'pointer', fontFamily:'var(--sans)', fontSize:'0.76rem', color:'#1A1A1A', borderBottom:'0.5px solid rgba(26,24,20,0.06)' }}>
                        {f.place_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={styles.filterSection}>
            <div className={styles.filterLabel}>Collab history</div>
            <div className={styles.toggleRows}>
              {[['Has completed collabs', histCompleted, setHistCompleted], ['Active on platform', histActive, setHistActive], ['Payout ready', payoutReady, setPayoutReady]].map(([label, val, setter]) => (
                <div key={label} className={styles.toggleRow} onClick={() => setter(v => !v)}>
                  <span className={styles.toggleLbl}>{label}</span>
                  <div className={`${styles.toggle} ${val ? styles.on : styles.off}`}><div className={styles.toggleKnob} /></div>
                </div>
              ))}
            </div>
          </div>

          <button className={styles.clearFilters} onClick={clearFilters}>Clear all filters</button>
        </aside>

        <div className={styles.gridArea}>
          <div className={styles.sortBar}>
            <span className={styles.sortLabel}>Sort by</span>
            <div className={styles.sortOpts}>
              {[['recent','Recently active'],['collabs','Most collabs'],['new','Newest members']].map(([mode, label]) => (
                <button key={mode} className={`${styles.sortOpt} ${sortMode === mode ? styles.active : ''}`} onClick={() => setSortMode(mode)}>{label}</button>
              ))}
            </div>
          </div>

          <div className={styles.cardGrid}>
            {loading ? (
              <div className={styles.noResults}>
                <div className={styles.noResultsIcon}>✦</div>
                <div className={styles.noResultsTitle}>Loading creatives…</div>
              </div>
            ) : filtered.length === 0 ? (
              <div className={styles.noResults}>
                <div className={styles.noResultsIcon}>✦</div>
                <div className={styles.noResultsTitle}>{creatives.length === 0 ? 'No creatives yet.' : 'No creatives match these filters.'}</div>
                <div className={styles.noResultsSub}>{creatives.length === 0 ? 'Be the first to build your profile.' : 'Try widening your search.'}</div>
              </div>
            ) : (
              filtered.map((c, i) => {
                const dk   = discKey((c.disciplines || [])[0])
                const slug = profileSlug(c)
                const ini  = initials(c)
                const loc  = locationStr(c)
                const tags = [
                  c.founding_member && { label: '✦ Founding Member', cls: styles.tagPaid, style: { background: 'rgba(184,146,46,0.14)', color: '#B8922E', fontWeight: 700, border: '0.5px solid rgba(184,146,46,0.4)' } },
                  c.availability === 'open' && { label: 'Open to collab', cls: styles.tagOpen },
                  c.connect_onboarded && { label: '✓ Payout ready', cls: styles.tagPaid, style: { background: 'rgba(42,122,104,0.12)', color: '#2A7A68', fontWeight: 700 } },
                  ...(c.compensation || []).slice(0,1).map(comp => ({ label: comp, cls: comp === 'Paid' ? styles.tagPaid : styles.tagDisc }))
                ].filter(Boolean)

                return (
                  <Link key={c.id} href={`/profile/${slug}`} className={styles.profileCard} style={{ animationDelay: `${i * 30}ms` }}>
                    <div className={`${styles.cardCover} ${styles[`cv_${dk}`]}`}>
                      <div className={styles.cardCoverPattern} style={{ backgroundImage: COVER_PATTERNS[dk] }} />
                    </div>
                    <div className={styles.cardBody}>
                      <div className={styles.cardAvWrap}>
                        <div className={`${styles.cardAv} ${styles[`av_${dk}`]}`}>
                          {c.avatar_url ? <img src={c.avatar_url} alt={ini} style={{ width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%' }} /> : ini}
                          <div className={`${styles.cardAvOnline} ${styles.offline}`} />
                        </div>
                      </div>
                      <div className={styles.cardContent}>
                        <div className={styles.cardName}>{`${c.firstname||''} ${c.lastname||''}`.trim()}</div>
                        <div className={`${styles.cardHeadline} ${styles[`hl_${dk}`]}`}>{c.headline || ''}</div>
                        <div className={styles.cardRightnow}>{c.rightnow || 'No current project listed.'}</div>
                        <div className={styles.cardTags}>
                          {tags.map((t, j) => <span key={j} className={`${styles.ctag} ${t.cls}`} style={t.style}>{t.label}</span>)}
                        </div>
                        <div className={styles.cardFooter}>
                          <span className={styles.cardLocation}>📍 {loc}</span>
                          <span className={styles.cardCollabs}>◎ {c.collabs_count || 0} collabs</span>
                          <button className={styles.cardConnect} onClick={e => handleReachOut(e, c.id)}>
                            Reach out
                          </button>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
