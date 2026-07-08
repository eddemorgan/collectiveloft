'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
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

// Discipline affinity map -- which disciplines naturally collaborate
const DISC_AFFINITY = {
  'Visual Art':    { strong: ['Music','Film','Writing','Design & Web','Photography'], moderate: ['Creative Tech','Performance'] },
  'Music':         { strong: ['Film','Visual Art','Performance','Writing'],           moderate: ['Design & Web','Creative Tech'] },
  'Writing':       { strong: ['Visual Art','Performance','Film','Design & Web'],      moderate: ['Music','Photography'] },
  'Design & Web':  { strong: ['Visual Art','Writing','Music','Creative Tech'],        moderate: ['Photography','Film'] },
  'Film':          { strong: ['Music','Writing','Visual Art','Photography'],           moderate: ['Performance','Design & Web'] },
  'Photography':   { strong: ['Visual Art','Film','Design & Web'],                    moderate: ['Music','Writing'] },
  'Performance':   { strong: ['Music','Writing','Film'],                              moderate: ['Visual Art','Photography'] },
  'Creative Tech': { strong: ['Music','Visual Art','Design & Web','Film'],            moderate: ['Writing','Photography'] },
}

// ── RIGHT NOW parser (seeking-cue gated) ─────────────────────────────────────
// "Right Now" is free-text current intent. We ONLY treat it as a matching
// signal when the text expresses SEEKING (not describing one's own work).
// "Writing a debut novel" -> no seeking cue -> ignored.
// "Looking for a fine art photographer" / "need an expert in fiction" -> parsed.
// We match the seeking phrase against BOTH discipline names and skill names.

const SEEKING_CUES = /\b(looking for|look for|seeking|in search of|searching for|need(?:ing)?|want(?:ing)?|after|hoping to find|would love|would like|keen to find|on the hunt for|trying to find|find (?:a|an|some)|collaborat\w* with|partner(?: up)? with|work with|team up with|open to)\b/i

// Discipline text patterns (what a collaborator in that discipline is called)
const DISC_TEXT_MATCHERS = {
  'Visual Art':    [/\bvisual artists?\b/, /\bpainters?\b/, /\billustrators?\b/, /\bfine artists?\b/, /\bcover artists?\b/, /\bartists?\b/, /\bprintmak/, /\bmuralist/],
  'Music':         [/\bmusicians?\b/, /\bcomposers?\b/, /\bproducers?\b/, /\bsongwriters?\b/, /\bbeat ?makers?\b/, /\bvocalists?\b/, /\binstrumentalist/, /\bsound designers?\b/],
  'Writing':       [/\bwriters?\b/, /\beditors?\b/, /\bauthors?\b/, /\bpoets?\b/, /\bcopywriters?\b/, /\bghostwriters?\b/, /\bnovelists?\b/, /\bscreenwriters?\b/],
  'Design & Web':  [/\bdesigners?\b/, /\bweb ?devs?\b/, /\bweb developers?\b/, /\bux\b/, /\bui\b/, /\bbrand(?:ing)? (?:designer|expert|specialist)/, /\btypographer/],
  'Film':          [/\bfilm ?makers?\b/, /\bdirectors?\b/, /\bcinematographers?\b/, /\bvideographers?\b/, /\bfilm editors?\b/, /\bd(?:irector of photography|\.?o\.?p\.?)\b/],
  'Photography':   [/\bphotographers?\b/, /\bportrait (?:photographer|shooter)/, /\blandscape photographer/, /\bphoto(?:grapher)? for\b/],
  'Performance':   [/\bperformers?\b/, /\bdancers?\b/, /\bactors?\b/, /\bactress(?:es)?\b/, /\bchoreographers?\b/, /\btheatre? (?:artist|performer)/, /\bvoice actors?\b/],
  'Creative Tech': [/\bcreative technologist/, /\bdevelopers?\b/, /\bcreative coders?\b/, /\bprogrammers?\b/, /\bengineers?\b/, /\bgenerative artist/],
}

// The real skill vocabulary (from the platform). Matched as whole phrases.
const SKILL_VOCAB = ['Acting','Art direction','Audio-visual','Beat production','Branding','Choreography','Cinematography','Co-writing','Copywriting','Creative coding','Dance','Directing','Documentary','Documentary photography','Editing','Fiction','Film editing','Film scoring','Fine art photography','Generative art','Illustration','Interactive installation','Landscape photography','Large format','Mixed media','Mixing & mastering','Motion design','Novel','Oil on canvas','Poetry','Portrait photography','Printmaking','Screenwriting','Session musician','Short film','Short Story','Songwriting','Sound design','Spoken word','Theatre','Typography','UX design','Watercolour','Web design','Writer']

// Parse a Right Now string -> { disciplines:[], skills:[] } but ONLY from the
// portion that follows a seeking cue.
// Fallback skill vocabulary — used only if no profiles have loaded yet. The
// live vocabulary is derived from the database (see buildSkillVocab) so any
// skill added to the platform is caught automatically, no code change needed.
const SKILL_VOCAB_FALLBACK = ['Acting','Art direction','Audio-visual','Beat production','Branding','Choreography','Cinematography','Co-writing','Copywriting','Creative coding','Dance','Directing','Documentary','Documentary photography','Editing','Fiction','Film editing','Film scoring','Fine art photography','Generative art','Illustration','Interactive installation','Landscape photography','Large format','Mixed media','Mixing & mastering','Motion design','Novel','Oil on canvas','Poetry','Portrait photography','Printmaking','Screenwriting','Session musician','Short film','Short Story','Songwriting','Sound design','Spoken word','Theatre','Typography','UX design','Watercolour','Web design','Writer']

// HYBRID VOCAB: skills come live from the DB (whatever exists on real profiles);
// disciplines get a rich hardcoded synonym map (below) because natural-language
// asks ("photographer" -> Photography) can't be derived from a DB label alone.
// Build the skill list from the profiles currently loaded — zero extra queries.
function buildSkillVocab(profiles) {
  const set = new Set()
  ;(profiles || []).forEach(p => (p.skills || []).forEach(s => { if (s) set.add(s) }))
  const list = [...set]
  return list.length ? list : SKILL_VOCAB_FALLBACK
}

// Light auto-variants: for any DB term, also match its obvious morphological
// cousins so a brand-new skill flexes a little without hand-authoring.
// "podcast production" also matches "podcast productions"; "mixing" -> "mix".
function termToRegexes(term) {
  const t = term.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const res = [new RegExp(`\\b${t}\\b`)]
  // plural / possessive tolerance on the final word
  res.push(new RegExp(`\\b${t}s\\b`))
  return res
}

// Parse a Right Now string -> { disciplines:[], skills:[] } but ONLY from the
// portion that follows a seeking cue. skillVocab (DB-derived) is passed in.
function parseRightNow(text, skillVocab) {
  const empty = { disciplines: [], skills: [] }
  if (!text || typeof text !== 'string') return empty
  const lower = text.toLowerCase()

  // Require a seeking cue. If none, this is someone describing their own work.
  const cueMatch = lower.search(SEEKING_CUES)
  if (cueMatch === -1) return empty

  // Only look at text FROM the seeking cue onward (that's the ask).
  const seekingText = lower.slice(cueMatch)

  // Disciplines: rich hardcoded synonym map (photographer -> Photography).
  const discSet = new Set()
  for (const [disc, patterns] of Object.entries(DISC_TEXT_MATCHERS)) {
    if (patterns.some(re => re.test(seekingText))) discSet.add(disc)
  }

  // Skills: DB-derived vocab + light auto-variants (plural tolerance).
  const vocab = (skillVocab && skillVocab.length) ? skillVocab : SKILL_VOCAB_FALLBACK
  const skillSet = new Set()
  for (const skill of vocab) {
    if (termToRegexes(skill).some(re => re.test(seekingText))) skillSet.add(skill)
  }

  return { disciplines: [...discSet], skills: [...skillSet] }
}

function computeScore(profile, myProfile, skillVocab) {
  if (!myProfile) return { score: Math.floor(Math.random() * 30) + 50, reasons: [] }

  const myDiscs    = myProfile.disciplines || []
  const mySkills   = (myProfile.skills || []).map(s => s.toLowerCase())
  const mySeeking  = myProfile.seeking_disciplines || []
  const mySeekSkills = (myProfile.seeking_skills || []).map(s => s.toLowerCase())

  const theirDiscs  = profile.disciplines || []
  const theirSkills = (profile.skills || []).map(s => s.toLowerCase())
  const theirSeeking = profile.seeking_disciplines || []
  const theirSeekSkills = (profile.seeking_skills || []).map(s => s.toLowerCase())

  let score = 40
  const reasons = []

  // helper: intersection of two arrays (case-insensitive already applied to skills)
  const overlap = (a, b) => (a || []).filter(x => (b || []).includes(x))

  // ── INTENT MATCHING (highest weight) ────────────────────────────────────────
  // I'm looking for their discipline
  const discIWant = overlap(theirDiscs, mySeeking)
  const iWantThem = discIWant.length > 0
  if (iWantThem) { score += 20; reasons.push({ pts: 20, text: `You're looking for ${discIWant.join(', ')} — that's their discipline` }) }

  // I'm looking for their specific skills
  const skillsIWant = theirSkills.filter(s => mySeekSkills.includes(s))
  const iWantTheirSkills = skillsIWant.length > 0
  if (iWantTheirSkills) { score += 15; reasons.push({ pts: 15, text: `They have skills you're seeking: ${skillsIWant.join(', ')}` }) }

  // They're looking for my discipline (bidirectional)
  const discTheyWant = overlap(myDiscs, theirSeeking)
  const theyWantMe = discTheyWant.length > 0
  if (theyWantMe) { score += 20; reasons.push({ pts: 20, text: `They're looking for ${discTheyWant.join(', ')} — that's your discipline` }) }

  // They're looking for my specific skills (bidirectional)
  const skillsTheyWant = mySkills.filter(s => theirSeekSkills.includes(s))
  const theyWantMySkills = skillsTheyWant.length > 0
  if (theyWantMySkills) { score += 10; reasons.push({ pts: 10, text: `They're seeking skills you have: ${skillsTheyWant.join(', ')}` }) }

  // ── RIGHT NOW INTENT (freshest, most deliberate signal) ─────────────────────
  // Only counts text that expresses SEEKING. Matches their disciplines AND skills.
  const myRN = parseRightNow(myProfile.rightnow, skillVocab)
  const rnDiscHit = overlap(theirDiscs, myRN.disciplines)
  const rnSkillHit = theirSkills.filter(s => myRN.skills.map(x => x.toLowerCase()).includes(s))
  const rightNowHit = rnDiscHit.length > 0 || rnSkillHit.length > 0
  if (rnDiscHit.length > 0) { score += 30; reasons.push({ pts: 30, text: `Your "what I'm working on right now" is seeking ${rnDiscHit.join(', ')} — their discipline` }) }
  if (rnSkillHit.length > 0) { score += 20; reasons.push({ pts: 20, text: `Your "what I'm working on right now" is seeking ${rnSkillHit.join(', ')} — a skill they have` }) }

  // Bidirectional: their Right Now seeking points at my discipline/skills.
  const theirRN = parseRightNow(profile.rightnow, skillVocab)
  const theirRnDiscHit = overlap(myDiscs, theirRN.disciplines)
  const theirRnSkillHit = mySkills.filter(s => theirRN.skills.map(x => x.toLowerCase()).includes(s))
  const theyWantMeRightNow = theirRnDiscHit.length > 0 || theirRnSkillHit.length > 0
  if (theirRnDiscHit.length > 0) { score += 15; reasons.push({ pts: 15, text: `Their current focus is seeking ${theirRnDiscHit.join(', ')} — your discipline` }) }
  if (theirRnSkillHit.length > 0) { score += 10; reasons.push({ pts: 10, text: `Their current focus is seeking ${theirRnSkillHit.join(', ')} — a skill you have` }) }

  // ── DISCIPLINE AFFINITY (only when no direct intent match) ───────────────────
  if (!iWantThem && !theyWantMe && !rightNowHit) {
    let affinityBonus = 0
    let affinityPair = null
    myDiscs.forEach(myDisc => {
      const affinity = DISC_AFFINITY[myDisc]
      if (!affinity) return
      theirDiscs.forEach(theirDisc => {
        if (myDisc === theirDisc) return
        if (affinity.strong.includes(theirDisc) && affinityBonus < 12)   { affinityBonus = 12; affinityPair = `${myDisc} + ${theirDisc}` }
        else if (affinity.moderate.includes(theirDisc) && affinityBonus < 6) { affinityBonus = 6; affinityPair = `${myDisc} + ${theirDisc}` }
      })
    })
    if (affinityBonus > 0) { score += affinityBonus; reasons.push({ pts: affinityBonus, text: `${affinityPair} are disciplines that naturally collaborate` }) }
  }

  // ── ACTIVITY SIGNALS ─────────────────────────────────────────────────────────
  if (profile.availability === 'open') { score += 5; reasons.push({ pts: 5, text: `Open to collaborate right now` }) }
  if ((profile.collabs_count || 0) > 0) { score += 5; reasons.push({ pts: 5, text: `Has completed collaborations on Collective Loft` }) }

  // ── PENALTY: same discipline only, no seeking overlap ────────────────────────
  const allSame = theirDiscs.every(d => myDiscs.includes(d)) && theirDiscs.length > 0
  if (allSame && !iWantThem && !theyWantMe) { score -= 10; reasons.push({ pts: -10, text: `Same discipline with no stated cross-interest` }) }

  const final = Math.min(Math.max(score, 20), 99)
  return { score: final, reasons }
}

function scoreClass(s) {
  if (s >= 85) return styles.scoreHigh
  if (s >= 65) return styles.scoreGood
  return styles.scoreFair
}

function avatarInitials(first, last) {
  return `${(first || '?')[0]}${(last || '?')[0]}`.toUpperCase()
}

function slugify(first, last) {
  if (!first || !last) return 'unknown'
  return `${first.toLowerCase()}-${last.toLowerCase()}`
}

export default function MatchingPage() {
  const router = useRouter()
  const { loading: authLoading } = useAuth()

  const [myProfile,  setMyProfile]  = useState(null)
  const [profiles,   setProfiles]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [activeDisc, setActiveDisc] = useState('all')
  const [sortMode,   setSortMode]   = useState('score')
  const [whyMatch,   setWhyMatch]   = useState(null)  // profile whose match breakdown is open

  const [toggles, setToggles] = useState({
    open: false, collabs: false, remote: false,
    exchange: true, paid: true, revshare: false,
  })

  useEffect(() => {
    if (authLoading) return
    async function load() {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('profiles').select('*, seeking_disciplines, seeking_skills').eq('id', user.id).single()
        setMyProfile(data)
      }
      let query = supabase
        .from('profiles')
        .select('id, firstname, lastname, headline, disciplines, skills, city, state, country, avatar_url, availability, collabs_count, compensation, seeking, seeking_disciplines, seeking_skills, bio, rightnow')
        .order('created_at', { ascending: false })
      if (user) query = query.neq('id', user.id)
      const { data: all } = await query
      setProfiles(all || [])
      setLoading(false)
    }
    load()
  }, [authLoading])

  const scored = useMemo(() => {
    const skillVocab = buildSkillVocab(profiles)
    return profiles.map(p => {
      const { score, reasons } = computeScore(p, myProfile, skillVocab)
      return { ...p, score, matchReasons: reasons }
    })
  }, [profiles, myProfile])

  const filtered = useMemo(() => {
    let list = scored.filter(p => {
      if (activeDisc !== 'all') {
        if (!(p.disciplines || []).includes(activeDisc)) return false
      }
      if (toggles.open && p.availability !== 'open') return false
      if (toggles.collabs && !(p.collabs_count > 0)) return false
      const comp = p.compensation || []
      if (toggles.exchange && !toggles.paid) {
        if (!comp.includes('Creative exchange')) return false
      }
      if (toggles.paid && !toggles.exchange) {
        if (!comp.includes('Paid')) return false
      }
      return true
    })
    if (sortMode === 'collabs') list.sort((a, b) => (b.collabs_count || 0) - (a.collabs_count || 0))
    else if (sortMode === 'recent') list.sort(() => 0)
    else list.sort((a, b) => b.score - a.score)
    return list
  }, [scored, activeDisc, toggles, sortMode])

  const discCounts = useMemo(() => {
    const counts = {}
    scored.forEach(p => {
      (p.disciplines || []).forEach(d => { counts[d] = (counts[d] || 0) + 1 })
    })
    return counts
  }, [scored])

  function toggleSwitch(key) {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function handleReachOut(e, id) {
    e.preventDefault()
    e.stopPropagation()
    if (!myProfile) { router.push('/login'); return }
    router.push(`/terms?with=${id}`)
  }

  const myDiscs = myProfile?.disciplines || []

  if (authLoading) return null

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh' }}>
      <Nav />

      <div className={styles.pageHdr}>
        <div>
          <div className={styles.eyebrow}>Collective Loft</div>
          <div className={styles.hdrTitle}>Discipline Matching</div>
          <div className={styles.hdrSub}>Creatives ranked by how well they fit what you're making right now — not by popularity.</div>
        </div>
        {myDiscs.length > 0 && (
          <div className={styles.youAre}>
            <span className={styles.yaLabel}>You are</span>
            {myDiscs.map(d => <span key={d} className={styles.yaTag}>{d}</span>)}
          </div>
        )}
      </div>

      <div className={styles.bodyLayout} style={{ flex: 1 }}>
        <aside className={styles.sidebar}>
          <div className={styles.filterSection}>
            <div className={styles.filterLabel}>I'm looking for</div>
            <div className={styles.discBtns}>
              {DISCIPLINES.map(d => (
                <button key={d.key}
                  className={`${styles.discBtn} ${activeDisc === d.key ? styles.discBtnActive : ''}`}
                  onClick={() => setActiveDisc(d.key)}>
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
            setToggles({ open: false, collabs: false, remote: false, exchange: true, paid: true, revshare: false })
          }}>
            Clear all filters
          </button>
        </aside>

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
                <button key={s.mode}
                  className={`${styles.sortOpt} ${sortMode === s.mode ? styles.sortOptActive : ''}`}
                  onClick={() => setSortMode(s.mode)}>
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
              {filtered.filter(p => p.firstname && p.lastname).map((p, i) => {
                const discKey = (p.disciplines || [])[0]
                const dk      = DISC_KEY_MAP[discKey] || 'visual'
                const slug    = slugify(p.firstname, p.lastname)
                const inits   = avatarInitials(p.firstname, p.lastname)
                return (
                  <Link key={p.id} href={`/profile/${slug}`}
                    className={`${styles.matchCard} ${p.score >= 85 ? styles.topMatch : ''}`}
                    style={{ animationDelay: `${i * 30}ms` }}>
                    <div className={`${styles.mcCover} ${styles[`cv_${dk}`]}`}>
                      <div className={`${styles.mcCoverInner} ${styles[`pat_${dk}`]}`} />
                      <button type="button" className={`${styles.scoreBadge} ${scoreClass(p.score)}`}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setWhyMatch(p) }}
                        title="Why this match?">{p.score}% match <span className={styles.scoreBadgeInfo}>ⓘ</span></button>
                    </div>
                    <div className={styles.mcBody}>
                      <div className={styles.mcAvWrap}>
                        {p.avatar_url ? (
                          <img src={p.avatar_url} alt={p.firstname} className={styles.mcAv} />
                        ) : (
                          <div className={`${styles.mcAv} ${styles.mcAvInitials}`}>
                            {inits}
                            <div className={`${styles.mcOnline} ${p.availability === 'open' ? styles.dotOn : styles.dotOff}`} />
                          </div>
                        )}
                      </div>
                      <div className={styles.mcContent}>
                        <div className={styles.mcName}>{p.firstname} {p.lastname}</div>
                        <div className={`${styles.mcRole} ${styles[`hl_${dk}`]}`}>
                          {p.headline || (p.disciplines || []).join(' · ')}
                        </div>
                        {p.bio && (
                          <div className={styles.mcWhy}>{p.bio.slice(0, 100)}{p.bio.length > 100 ? '…' : ''}</div>
                        )}
                        {(p.disciplines || []).length > 0 && (
                          <div className={styles.mcReasons}>
                            {p.disciplines.map(d => (
                              <div key={d} className={styles.mcReason}>Discipline: {d}</div>
                            ))}
                            {p.availability === 'open' && <div className={styles.mcReason}>Open to collaborate now</div>}
                          </div>
                        )}
                        {(p.skills || []).length > 0 && (
                          <div className={styles.mcTags}>
                            {p.skills.slice(0, 3).map(s => <span key={s} className={styles.mctag}>{s}</span>)}
                          </div>
                        )}
                        <div className={styles.mcFooter}>
                          <div className={styles.mcMeta}>
                            {(p.city || p.country) && <span>📍 {[p.city, p.country].filter(Boolean).join(', ')}</span>}
                            <span>◎ {p.collabs_count || 0} collabs</span>
                          </div>
                          <button className={styles.btnReachOut} onClick={e => handleReachOut(e, p.id)}>
                            Reach out
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

      {whyMatch && (
        <div className={styles.whyOverlay} onClick={() => setWhyMatch(null)}>
          <div className={styles.whyModal} onClick={e => e.stopPropagation()}>
            <button className={styles.whyClose} onClick={() => setWhyMatch(null)}>✕</button>
            <div className={styles.whyScore}>{whyMatch.score}%</div>
            <div className={styles.whyTitle}>Why you match with {whyMatch.firstname} {whyMatch.lastname}</div>
            <div className={styles.whySub}>
              Your match score is built from the overlap between what you each do and what you're each looking for. Here's what added up:
            </div>
            <div className={styles.whyList}>
              {(whyMatch.matchReasons || []).filter(r => r.pts > 0).length === 0 ? (
                <div className={styles.whyEmpty}>This match is based on general discipline compatibility. Add more detail to your profile — especially "what I'm working on right now" and your collaboration preferences — to get sharper matches.</div>
              ) : (
                (whyMatch.matchReasons || []).filter(r => r.pts > 0).map((r, idx) => (
                  <div key={idx} className={styles.whyRow}>
                    <span className={styles.whyPts}>+{r.pts}</span>
                    <span className={styles.whyReason}>{r.text}</span>
                  </div>
                ))
              )}
              {(whyMatch.matchReasons || []).filter(r => r.pts < 0).map((r, idx) => (
                <div key={`n${idx}`} className={`${styles.whyRow} ${styles.whyRowNeg}`}>
                  <span className={styles.whyPts}>{r.pts}</span>
                  <span className={styles.whyReason}>{r.text}</span>
                </div>
              ))}
            </div>
            <div className={styles.whyFoot}>
              Matches get stronger when both people fill out their disciplines, skills, collaboration preferences, and what they're working on right now.
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
