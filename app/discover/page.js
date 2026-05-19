'use client'
 
import { useState, useMemo } from 'react'
import Link from 'next/link'
import styles from './discover.module.css'
 
// ── Data ─────────────────────────────────────────────────────────────────────
 
const DISCIPLINES = [
  { key: 'all',         icon: '✦',  label: 'All disciplines', count: 24 },
  { key: 'Visual Art',  icon: '🎨', label: 'Visual Art',      count: 6  },
  { key: 'Music',       icon: '🎵', label: 'Music',           count: 5  },
  { key: 'Writing',     icon: '✍️', label: 'Writing',         count: 4  },
  { key: 'Design & Web',icon: '🖥',  label: 'Design & Web',   count: 3  },
  { key: 'Film',        icon: '🎬', label: 'Film',            count: 2  },
  { key: 'Photography', icon: '📷', label: 'Photography',     count: 2  },
  { key: 'Performance', icon: '🎭', label: 'Performance',     count: 1  },
  { key: 'Creative Tech',icon:'💻', label: 'Creative Tech',   count: 1  },
]
 
const DISC_KEY = {
  'Visual Art':   'visual',
  'Music':        'music',
  'Writing':      'writing',
  'Design & Web': 'design',
  'Film':         'film',
  'Photography':  'photo',
  'Performance':  'perf',
  'Creative Tech':'tech',
}
 
const CREATIVES = [
  { id:1,  name:'Marisol Vega',       initials:'MV', headline:'Visual Artist · Canvas & Oil',          discipline:'Visual Art',   discKey:'visual',  location:'Chicago, IL',     locationKey:'Chicago',    rightnow:'Completing a 12-piece series called Residue. Looking for a web designer and composer to help build a portfolio site for gallery submissions.',            tags:['Open to collab','Creative exchange'], compensation:['Creative exchange'],        availability:'open', collabs:8,  rating:4.9, online:true,  hasCollabs:true,  profileUrl:'/profile/marisol-vega' },
  { id:2,  name:'Tariq Osman',        initials:'TO', headline:'Music Producer · Beat Maker · Co-Writer',discipline:'Music',        discKey:'music',   location:'Atlanta, GA',     locationKey:'Atlanta',    rightnow:'Looking to co-produce 1–2 full EPs this year with vocalists who have strong creative direction. 30+ unplaced beats available.',                          tags:['Open to collab','Paid'],             compensation:['Paid','Revenue share'],     availability:'open', collabs:14, rating:5.0, online:true,  hasCollabs:true,  profileUrl:'/profile/tariq-osman' },
  { id:3,  name:'James Delacroix',    initials:'JD', headline:'Poet · Spoken Word · Essayist',          discipline:'Writing',      discKey:'writing', location:'Remote',          locationKey:'Remote',     rightnow:'Finishing a debut poetry collection — 52 poems. Need a developmental editor and a visual artist for the cover.',                                          tags:['Open to collab','Creative exchange'],compensation:['Creative exchange'],        availability:'open', collabs:3,  rating:4.6, online:false, hasCollabs:true,  profileUrl:'#' },
  { id:4,  name:'Naomi Kwan',         initials:'NK', headline:'Web Designer · Artist Portfolio Sites',  discipline:'Design & Web', discKey:'design',  location:'Chicago, IL',     locationKey:'Chicago',    rightnow:'Open for new artist portfolio projects. Specialising in dark editorial aesthetics for gallery submissions.',                                             tags:['Open to collab','Exchange or Paid'], compensation:['Creative exchange','Paid'], availability:'open', collabs:14, rating:4.9, online:true,  hasCollabs:true,  profileUrl:'#' },
  { id:5,  name:'Simone Adeyemi',     initials:'SA', headline:'Singer-Songwriter · R&B / Soul',         discipline:'Music',        discKey:'music',   location:'New York, NY',    locationKey:'New York',   rightnow:'Writing a neo-soul and pop hybrid EP. Searching for a beat producer who understands space and atmosphere.',                                              tags:['Open to collab','Paid'],             compensation:['Paid'],                    availability:'open', collabs:6,  rating:4.8, online:true,  hasCollabs:true,  profileUrl:'#' },
  { id:6,  name:'Leila Mora',         initials:'LM', headline:'Filmmaker · Director · Cinematographer', discipline:'Film',         discKey:'film',    location:'Brooklyn, NY',    locationKey:'Brooklyn',   rightnow:'In pre-production on a 12-minute experimental narrative. Seeking a cinematographer. Tribeca submission target.',                                         tags:['Open to collab','Paid Deferred'],    compensation:['Paid','Revenue share'],     availability:'open', collabs:5,  rating:4.7, online:true,  hasCollabs:true,  profileUrl:'#' },
  { id:7,  name:'René Pellegrini',    initials:'RP', headline:'Composer · Ambient & Electronic',        discipline:'Music',        discKey:'music',   location:'Remote',          locationKey:'Remote',     rightnow:'Scoring art installations and portfolio sites with textural ambient music. 8 visual artist collabs completed.',                                          tags:['Open to collab','Creative exchange'],compensation:['Creative exchange','Paid'], availability:'open', collabs:11, rating:5.0, online:false, hasCollabs:true,  profileUrl:'#' },
  { id:8,  name:'Priya Walcott',      initials:'PW', headline:'Writer · Artist Statements',             discipline:'Writing',      discKey:'writing', location:'Remote',          locationKey:'Remote',     rightnow:'Arts writer specialising in exhibition texts and grant writing for visual artists.',                                                                     tags:['Open to collab','Creative exchange'],compensation:['Creative exchange','Paid'], availability:'open', collabs:9,  rating:5.0, online:true,  hasCollabs:true,  profileUrl:'#' },
  { id:9,  name:'Yuki Cho',           initials:'YC', headline:'Photographer · Fine Art & Portrait',     discipline:'Photography',  discKey:'photo',   location:'Chicago, IL',     locationKey:'Chicago',    rightnow:'Photographs painting studios and artist process. Can document work and behind-the-scenes for press kits.',                                              tags:['Open to collab','Creative exchange'],compensation:['Creative exchange','Paid'], availability:'open', collabs:7,  rating:4.8, online:false, hasCollabs:true,  profileUrl:'#' },
  { id:10, name:'Aiko Tanaka',        initials:'AT', headline:'Illustrator · Book Cover & Editorial',   discipline:'Writing',      discKey:'writing', location:'Remote',          locationKey:'Remote',     rightnow:'Illustrator working at the intersection of literary and visual art. Strong collab history with writers and visual artists.',                             tags:['Open to collab','Paid'],             compensation:['Paid'],                    availability:'open', collabs:12, rating:4.9, online:true,  hasCollabs:true,  profileUrl:'#' },
  { id:11, name:'Marco Diallo',       initials:'MD', headline:'Portrait Photographer',                  discipline:'Photography',  discKey:'photo',   location:'Brooklyn, NY',    locationKey:'Brooklyn',   rightnow:'Specialises in artist portrait sessions. Can document creative process and produce press imagery for galleries.',                                        tags:['Open to collab','Paid'],             compensation:['Paid'],                    availability:'open', collabs:5,  rating:4.6, online:false, hasCollabs:true,  profileUrl:'#' },
  { id:12, name:'Clara Mvuemba',      initials:'CM', headline:'Choreographer · Contemporary Dance',     discipline:'Performance',  discKey:'perf',    location:'New York, NY',    locationKey:'New York',   rightnow:'Developing a 20-minute contemporary dance piece exploring diaspora and memory. Seeking a composer and visual artist.',                                    tags:['Open to collab','Creative exchange'],compensation:['Creative exchange'],        availability:'open', collabs:4,  rating:4.7, online:true,  hasCollabs:true,  profileUrl:'#' },
  { id:13, name:'Thea Blackwell',     initials:'TB', headline:'Fiction Writer · Literary Short Stories', discipline:'Writing',      discKey:'writing', location:'Brooklyn, NY',    locationKey:'Brooklyn',   rightnow:'Short story collection needs a cover and three interior illustrations. Literary, surrealist, quiet.',                                                    tags:['Open to collab','Paid'],             compensation:['Paid'],                    availability:'open', collabs:2,  rating:4.5, online:false, hasCollabs:true,  profileUrl:'#' },
  { id:14, name:'Julian Reyes',       initials:'JR', headline:'Creative Technologist · Interactive Art', discipline:'Creative Tech',discKey:'tech',    location:'Los Angeles, CA', locationKey:'Los Angeles',rightnow:'Building interactive installations for gallery spaces. Looking for visual artists and composers to collaborate on a three-part piece.',              tags:['Open to collab','Revenue share'],    compensation:['Creative exchange','Revenue share'], availability:'open', collabs:6, rating:4.8, online:true, hasCollabs:true, profileUrl:'#' },
  { id:15, name:'Fatima Al-Rashid',   initials:'FA', headline:'Visual Artist · Textile & Fibre',        discipline:'Visual Art',   discKey:'visual',  location:'Remote',          locationKey:'Remote',     rightnow:'Working on a large textile installation for an international craft biennial. Looking for a writer for the catalogue essay.',                             tags:['Open to collab','Creative exchange'],compensation:['Creative exchange'],        availability:'open', collabs:3,  rating:4.6, online:false, hasCollabs:true,  profileUrl:'#' },
  { id:16, name:'Marcus Chen',        initials:'MC', headline:'Film Editor · Documentary',              discipline:'Film',         discKey:'film',    location:'Los Angeles, CA', locationKey:'Los Angeles',rightnow:'Available to edit documentary projects. Specialises in observational and interview-heavy material.',                                                tags:['Open to collab','Paid'],             compensation:['Paid'],                    availability:'open', collabs:9,  rating:4.9, online:true,  hasCollabs:true,  profileUrl:'#' },
  { id:17, name:'Ingrid Svensson',    initials:'IS', headline:'Graphic Designer · Brand Identity',      discipline:'Design & Web', discKey:'design',  location:'Remote',          locationKey:'Remote',     rightnow:'Taking on brand identity projects for independent artists and small creative studios. Minimal, editorial aesthetic.',                                    tags:['Open to collab','Paid'],             compensation:['Paid'],                    availability:'open', collabs:11, rating:4.8, online:false, hasCollabs:true,  profileUrl:'#' },
  { id:18, name:'Kwame Asante',       initials:'KA', headline:'Music Producer · Afrobeats & Soul',      discipline:'Music',        discKey:'music',   location:'New York, NY',    locationKey:'New York',   rightnow:'Producing for artists in the Afrobeats and neo-soul space. Looking for vocalists and songwriters for an EP series.',                                    tags:['Open to collab','Paid'],             compensation:['Paid','Revenue share'],     availability:'open', collabs:7,  rating:4.7, online:true,  hasCollabs:true,  profileUrl:'#' },
  { id:19, name:'Elif Demir',         initials:'ED', headline:'Poet · Performance Poet',                discipline:'Writing',      discKey:'writing', location:'Chicago, IL',     locationKey:'Chicago',    rightnow:'Preparing a solo spoken word show. Looking for a sound designer and a visual artist for projections.',                                                  tags:['Open to collab','Creative exchange'],compensation:['Creative exchange'],        availability:'open', collabs:2,  rating:4.5, online:false, hasCollabs:false, profileUrl:'#' },
  { id:20, name:'Noah Fischer',       initials:'NF', headline:'Sculptor · Installation Art',            discipline:'Visual Art',   discKey:'visual',  location:'Brooklyn, NY',    locationKey:'Brooklyn',   rightnow:'Building a large-scale steel and glass installation for a group show. Need fabrication help and a writer for the artist statement.',                    tags:['Open to collab','Creative exchange'],compensation:['Creative exchange'],        availability:'open', collabs:5,  rating:4.7, online:true,  hasCollabs:true,  profileUrl:'#' },
  { id:21, name:'Amara Diallo',       initials:'AD', headline:'Motion Designer · Visual Effects',       discipline:'Design & Web', discKey:'design',  location:'Atlanta, GA',     locationKey:'Atlanta',    rightnow:'Creating motion graphics and visual effects for music videos and short films. Looking for directors and musicians.',                                     tags:['Open to collab','Paid'],             compensation:['Paid','Revenue share'],     availability:'open', collabs:8,  rating:4.8, online:true,  hasCollabs:true,  profileUrl:'#' },
  { id:22, name:'Sasha Petrov',       initials:'SP', headline:'Musician · Multi-Instrumentalist',       discipline:'Music',        discKey:'music',   location:'Remote',          locationKey:'Remote',     rightnow:'Plays piano, guitar, and violin. Available for session work, co-writing, and film scoring. Strong reader and arranger.',                                 tags:['Open to collab','Creative exchange'],compensation:['Creative exchange','Paid'], availability:'open', collabs:6,  rating:4.6, online:false, hasCollabs:true,  profileUrl:'#' },
  { id:23, name:'Zara Ahmed',         initials:'ZA', headline:'Abstract Painter · Mixed Media',         discipline:'Visual Art',   discKey:'visual',  location:'Los Angeles, CA', locationKey:'Los Angeles',rightnow:'Working on a large-scale abstract series. Looking for a curator to help with LA gallery placement.',                                               tags:['Open to collab','Creative exchange'],compensation:['Creative exchange'],        availability:'open', collabs:4,  rating:4.7, online:false, hasCollabs:true,  profileUrl:'#' },
  { id:24, name:'Dev Anand',          initials:'DA', headline:'Motion Designer · Title Sequences',      discipline:'Design & Web', discKey:'design',  location:'Remote',          locationKey:'Remote',     rightnow:'Looking for filmmakers who need title sequences and motion graphics. Open to deferred payment on strong projects.',                                      tags:['Open to collab','Revenue share'],    compensation:['Paid','Revenue share'],     availability:'open', collabs:7,  rating:4.8, online:true,  hasCollabs:true,  profileUrl:'#' },
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
 
// ── Component ─────────────────────────────────────────────────────────────────
 
export default function DiscoverPage() {
  const [activeDisc,    setActiveDisc]    = useState('all')
  const [availOpen,     setAvailOpen]     = useState(true)
  const [availSoon,     setAvailSoon]     = useState(false)
  const [histCompleted, setHistCompleted] = useState(false)
  const [histActive,    setHistActive]    = useState(false)
  const [activeComp,    setActiveComp]    = useState(['Creative exchange', 'Paid', 'Revenue share'])
  const [location,      setLocation]      = useState('')
  const [search,        setSearch]        = useState('')
  const [sortMode,      setSortMode]      = useState('recent')
  const [sentIds,       setSentIds]       = useState([])
 
  // ── Filtered + sorted list ───────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = CREATIVES.filter(c => {
      if (activeDisc !== 'all' && c.discipline !== activeDisc) return false
      if (availOpen && c.availability !== 'open') return false
      if (activeComp.length > 0 && !c.compensation.some(x => activeComp.includes(x))) return false
      if (location && !c.location.toLowerCase().includes(location.toLowerCase()) && !(location === 'Remote' && c.locationKey === 'Remote')) return false
      if (histCompleted && !c.hasCollabs) return false
      if (search) {
        const hay = `${c.name} ${c.headline} ${c.discipline} ${c.location} ${c.rightnow}`.toLowerCase()
        if (!hay.includes(search.toLowerCase())) return false
      }
      return true
    })
    if (sortMode === 'collabs') list = [...list].sort((a, b) => b.collabs - a.collabs)
    else if (sortMode === 'new') list = [...list].sort((a, b) => b.id - a.id)
    return list
  }, [activeDisc, availOpen, availSoon, histCompleted, histActive, activeComp, location, search, sortMode])
 
  function toggleComp(label) {
    setActiveComp(prev =>
      prev.includes(label) ? prev.filter(x => x !== label) : [...prev, label]
    )
  }
 
  function clearFilters() {
    setActiveDisc('all')
    setAvailOpen(true)
    setAvailSoon(false)
    setHistCompleted(false)
    setHistActive(false)
    setActiveComp(['Creative exchange', 'Paid', 'Revenue share'])
    setLocation('')
    setSearch('')
    setSortMode('recent')
  }
 
  function handleConnect(id) {
    setSentIds(prev => [...prev, id])
  }
 
  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* Nav */}
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>Collective <span>Loft</span></Link>
        <div className={styles.navLinks}>
          <Link href="/discover" className={styles.active}>Discover</Link>
          <Link href="/briefs">Collabs</Link>
          <Link href="/studio">Studio</Link>
          <Link href="/join"><button className={styles.btnJoin}>Join</button></Link>
        </div>
      </nav>
 
      {/* Page header */}
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
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search by name or keyword…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>
 
      {/* Body */}
      <div className={styles.bodyLayout}>
 
        {/* Filter sidebar */}
        <aside className={styles.filterSidebar}>
 
          {/* Discipline */}
          <div className={styles.filterSection}>
            <div className={styles.filterLabel}>Discipline</div>
            <div className={styles.discBtns}>
              {DISCIPLINES.map(d => (
                <div
                  key={d.key}
                  className={`${styles.discBtn} ${activeDisc === d.key ? styles.active : ''}`}
                  onClick={() => setActiveDisc(d.key)}
                >
                  <div className={styles.discBtnLeft}>
                    <div className={styles.discIcon}>{d.icon}</div>
                    <div className={styles.discName}>{d.label}</div>
                  </div>
                  <div className={styles.discCountBadge}>{d.count}</div>
                </div>
              ))}
            </div>
          </div>
 
          {/* Availability */}
          <div className={styles.filterSection}>
            <div className={styles.filterLabel}>Availability</div>
            <div className={styles.toggleRows}>
              <div className={styles.toggleRow} onClick={() => setAvailOpen(v => !v)}>
                <span className={styles.toggleLbl}>Open to collabs now</span>
                <div className={`${styles.toggle} ${availOpen ? styles.on : styles.off}`}>
                  <div className={styles.toggleKnob} />
                </div>
              </div>
              <div className={styles.toggleRow} onClick={() => setAvailSoon(v => !v)}>
                <span className={styles.toggleLbl}>Available soon</span>
                <div className={`${styles.toggle} ${availSoon ? styles.on : styles.off}`}>
                  <div className={styles.toggleKnob} />
                </div>
              </div>
            </div>
          </div>
 
          {/* Compensation */}
          <div className={styles.filterSection}>
            <div className={styles.filterLabel}>Compensation</div>
            <div className={styles.compOpts}>
              {['Creative exchange', 'Paid', 'Revenue share'].map(c => (
                <div
                  key={c}
                  className={`${styles.compOpt} ${activeComp.includes(c) ? styles.checked : ''}`}
                  onClick={() => toggleComp(c)}
                >
                  <div className={styles.compBox}>{activeComp.includes(c) ? '✓' : ''}</div>
                  <span className={styles.compLbl}>{c}</span>
                </div>
              ))}
            </div>
          </div>
 
          {/* Location */}
          <div className={styles.filterSection}>
            <div className={styles.filterLabel}>Location</div>
            <select
              className={styles.filterSelect}
              value={location}
              onChange={e => setLocation(e.target.value)}
            >
              <option value="">Anywhere</option>
              <option value="Chicago">Chicago, IL</option>
              <option value="New York">New York, NY</option>
              <option value="Los Angeles">Los Angeles, CA</option>
              <option value="Atlanta">Atlanta, GA</option>
              <option value="Brooklyn">Brooklyn, NY</option>
              <option value="Remote">Remote only</option>
            </select>
          </div>
 
          {/* Collab history */}
          <div className={styles.filterSection}>
            <div className={styles.filterLabel}>Collab history</div>
            <div className={styles.toggleRows}>
              <div className={styles.toggleRow} onClick={() => setHistCompleted(v => !v)}>
                <span className={styles.toggleLbl}>Has completed collabs</span>
                <div className={`${styles.toggle} ${histCompleted ? styles.on : styles.off}`}>
                  <div className={styles.toggleKnob} />
                </div>
              </div>
              <div className={styles.toggleRow} onClick={() => setHistActive(v => !v)}>
                <span className={styles.toggleLbl}>Active on platform</span>
                <div className={`${styles.toggle} ${histActive ? styles.on : styles.off}`}>
                  <div className={styles.toggleKnob} />
                </div>
              </div>
            </div>
          </div>
 
          <button className={styles.clearFilters} onClick={clearFilters}>Clear all filters</button>
        </aside>
 
        {/* Grid area */}
        <div className={styles.gridArea}>
          {/* Sort bar */}
          <div className={styles.sortBar}>
            <span className={styles.sortLabel}>Sort by</span>
            <div className={styles.sortOpts}>
              {[['recent','Recently active'],['collabs','Most collabs'],['new','Newest members']].map(([mode, label]) => (
                <button
                  key={mode}
                  className={`${styles.sortOpt} ${sortMode === mode ? styles.active : ''}`}
                  onClick={() => setSortMode(mode)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
 
          {/* Cards */}
          <div className={styles.cardGrid}>
            {filtered.length === 0 ? (
              <div className={styles.noResults}>
                <div className={styles.noResultsIcon}>✦</div>
                <div className={styles.noResultsTitle}>No creatives match these filters.</div>
                <div className={styles.noResultsSub}>Try widening your search — remove a filter or two and see who's out there.</div>
              </div>
            ) : (
              filtered.map((c, i) => (
                <Link
                  key={c.id}
                  href={c.profileUrl}
                  className={styles.profileCard}
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  {/* Cover */}
                  <div className={`${styles.cardCover} ${styles[`cv_${c.discKey}`]}`}>
                    <div className={styles.cardCoverPattern} style={{ backgroundImage: COVER_PATTERNS[c.discKey] }} />
                  </div>
 
                  {/* Body */}
                  <div className={styles.cardBody}>
                    <div className={styles.cardAvWrap}>
                      <div className={`${styles.cardAv} ${styles[`av_${c.discKey}`]}`}>
                        {c.initials}
                        <div className={`${styles.cardAvOnline} ${c.online ? styles.online : styles.offline}`} />
                      </div>
                    </div>
                    <div className={styles.cardContent}>
                      <div className={styles.cardName}>{c.name}</div>
                      <div className={`${styles.cardHeadline} ${styles[`hl_${c.discKey}`]}`}>{c.headline}</div>
                      <div className={styles.cardRightnow}>{c.rightnow}</div>
                      <div className={styles.cardTags}>
                        {c.tags.map((t, j) => {
                          const cls = t.toLowerCase().includes('open') ? styles.tagOpen : t.toLowerCase().includes('paid') ? styles.tagPaid : styles.tagDisc
                          return <span key={j} className={`${styles.ctag} ${cls}`}>{t}</span>
                        })}
                      </div>
                      <div className={styles.cardFooter}>
                        <span className={styles.cardLocation}>📍 {c.location}</span>
                        <span className={styles.cardCollabs}>◎ {c.collabs} collabs</span>
                        <button
                          className={styles.cardConnect}
                          onClick={e => { e.preventDefault(); e.stopPropagation(); handleConnect(c.id) }}
                          style={sentIds.includes(c.id) ? { color: 'var(--teal)', borderColor: 'rgba(86,179,156,0.3)' } : {}}
                        >
                          {sentIds.includes(c.id) ? 'Sent ✦' : 'Connect'}
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  )
}
 