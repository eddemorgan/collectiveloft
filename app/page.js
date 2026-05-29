'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import styles from './landing.module.css'

const LOCATION_DATA = {
  US: { states: { IL: { l: 'Illinois', c: ['Chicago','Aurora','Springfield'] }, NY: { l: 'New York', c: ['New York City','Brooklyn','Buffalo'] }, CA: { l: 'California', c: ['Los Angeles','San Francisco','San Diego'] }, TX: { l: 'Texas', c: ['Houston','Austin','Dallas'] }, GA: { l: 'Georgia', c: ['Atlanta','Savannah'] }, TN: { l: 'Tennessee', c: ['Nashville','Memphis'] }, WA: { l: 'Washington', c: ['Seattle','Spokane'] }, MA: { l: 'Massachusetts', c: ['Boston','Cambridge'] }, FL: { l: 'Florida', c: ['Miami','Orlando','Tampa'] } } },
  CA: { states: { ON: { l: 'Ontario', c: ['Toronto','Ottawa'] }, BC: { l: 'British Columbia', c: ['Vancouver','Victoria'] }, QC: { l: 'Quebec', c: ['Montreal','Quebec City'] } } },
  GB: { r: ['London','Manchester','Birmingham','Bristol','Edinburgh'] },
  AU: { r: ['Sydney','Melbourne','Brisbane','Perth'] },
  DE: { r: ['Berlin','Munich','Hamburg','Cologne'] },
  FR: { r: ['Paris','Lyon','Marseille','Bordeaux'] },
  JP: { r: ['Tokyo','Osaka','Kyoto','Fukuoka'] },
  BR: { r: ['São Paulo','Rio de Janeiro','Brasília'] },
  MX: { r: ['Mexico City','Guadalajara','Monterrey'] },
  NG: { r: ['Lagos','Abuja','Ibadan'] },
  ZA: { r: ['Cape Town','Johannesburg','Durban'] },
  IN: { r: ['Mumbai','Delhi','Bangalore','Chennai'] },
  OTHER: { r: ['Remote / Online only','Other location'] },
}

const DISCIPLINES = [
  { id: 'visual',  icon: '🎨', label: 'Visual Art' },
  { id: 'music',   icon: '🎵', label: 'Music' },
  { id: 'writing', icon: '✍️', label: 'Writing' },
  { id: 'design',  icon: '🖥',  label: 'Design & Web' },
  { id: 'film',    icon: '🎬', label: 'Film' },
  { id: 'photo',   icon: '📷', label: 'Photography' },
  { id: 'perf',    icon: '🎭', label: 'Performance' },
  { id: 'tech',    icon: '💻', label: 'Creative Tech' },
]

const SKILLS = [
  { d: 'visual',  label: 'Oil on canvas' },
  { d: 'visual',  label: 'Watercolour' },
  { d: 'visual',  label: 'Illustration' },
  { d: 'visual',  label: 'Large format' },
  { d: 'visual',  label: 'Art direction' },
  { d: 'visual',  label: 'Sculpture' },
  { d: 'visual',  label: 'Mixed media' },
  { d: 'visual',  label: 'Printmaking' },
  { d: 'music',   label: 'Beat production' },
  { d: 'music',   label: 'Mixing & mastering' },
  { d: 'music',   label: 'Co-writing' },
  { d: 'music',   label: 'Film scoring' },
  { d: 'music',   label: 'Songwriting' },
  { d: 'music',   label: 'Vocals' },
  { d: 'music',   label: 'Sound design' },
  { d: 'music',   label: 'Session musician' },
  { d: 'writing', label: 'Poetry' },
  { d: 'writing', label: 'Copywriting' },
  { d: 'writing', label: 'Editing' },
  { d: 'writing', label: 'Screenwriting' },
  { d: 'writing', label: 'Fiction' },
  { d: 'writing', label: 'Arts writing' },
  { d: 'writing', label: 'Grant writing' },
  { d: 'writing', label: 'Writer' },
  { d: 'writing', label: 'Novel' },
  { d: 'writing', label: 'Short Story' },
  { d: 'design',  label: 'Web design' },
  { d: 'design',  label: 'Branding' },
  { d: 'design',  label: 'UX design' },
  { d: 'design',  label: 'Motion design' },
  { d: 'design',  label: 'Typography' },
  { d: 'design',  label: 'Print design' },
  { d: 'film',    label: 'Cinematography' },
  { d: 'film',    label: 'Directing' },
  { d: 'film',    label: 'Film editing' },
  { d: 'film',    label: 'Documentary' },
  { d: 'film',    label: 'Short film' },
  { d: 'photo',   label: 'Portrait photography' },
  { d: 'photo',   label: 'Fine art photography' },
  { d: 'photo',   label: 'Documentary photography' },
  { d: 'photo',   label: 'Landscape photography' },
  { d: 'perf',    label: 'Choreography' },
  { d: 'perf',    label: 'Spoken word' },
  { d: 'perf',    label: 'Theatre' },
  { d: 'perf',    label: 'Dance' },
  { d: 'perf',    label: 'Singer' },
  { d: 'perf',    label: 'Acting' },
  { d: 'tech',    label: 'Creative coding' },
  { d: 'tech',    label: 'Generative art' },
  { d: 'tech',    label: 'Interactive installation' },
  { d: 'tech',    label: 'Audio-visual' },
]

const DISC_GRID = [
  { icon: '🎨', name: 'Visual Art',       discipline: 'Visual Art' },
  { icon: '🎵', name: 'Music',            discipline: 'Music' },
  { icon: '✍️', name: 'Writing & Poetry', discipline: 'Writing' },
  { icon: '🖥',  name: 'Design & Web',    discipline: 'Design & Web' },
  { icon: '🎬', name: 'Film',             discipline: 'Film' },
  { icon: '📷', name: 'Photography',      discipline: 'Photography' },
  { icon: '🎭', name: 'Performance',      discipline: 'Performance' },
  { icon: '💻', name: 'Creative Tech',    discipline: 'Creative Tech' },
]

const AV_CLASSES = ['avG', 'avT', 'avR']
const REQUIRED_FIELDS = ['firstname', 'lastname', 'email', 'bio', 'rightnow', 'seeking', 'headline']

export default function LandingPage() {
  const router = useRouter()
  const [members,    setMembers]    = useState([])
  const [authUser,   setAuthUser]   = useState(null)
  const [myProfile,  setMyProfile]  = useState(null)
  const [discCounts, setDiscCounts] = useState({})

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, firstname, lastname, headline, disciplines, rightnow, compensation, availability, city, state')
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data }) => setMembers(data || []))

    supabase
      .from('profiles')
      .select('disciplines')
      .then(({ data }) => {
        const counts = {}
        ;(data || []).forEach(p => {
          ;(p.disciplines || []).forEach(d => {
            counts[d] = (counts[d] || 0) + 1
          })
        })
        setDiscCounts(counts)
      })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setAuthUser(session.user)
        supabase
          .from('profiles')
          .select('firstname, lastname')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => setMyProfile(data))
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthUser(session?.user || null)
      if (session?.user) {
        supabase
          .from('profiles')
          .select('firstname, lastname')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => setMyProfile(data))
      } else {
        setMyProfile(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const [modalOpen,  setModalOpen]  = useState(false)
  const [submitted,  setSubmitted]  = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError,  setFormError]  = useState('')
  const [showPw,     setShowPw]     = useState(false)
  const [showConfPw, setShowConfPw] = useState(false)

  // Legal acknowledgement state
  const [showTcDoc,   setShowTcDoc]   = useState(false)  // TC doc reader open
  const [showPpDoc,   setShowPpDoc]   = useState(false)  // PP doc reader open
  const [tcScrolled,  setTcScrolled]  = useState(false)  // user scrolled to bottom of TC
  const [ppScrolled,  setPpScrolled]  = useState(false)  // user scrolled to bottom of PP
  const [tcAccepted,  setTcAccepted]  = useState(false)  // user accepted TC
  const [ppAccepted,  setPpAccepted]  = useState(false)  // user accepted PP
  const [tcChecked,   setTcChecked]   = useState(false)  // checkbox ticked
  const [ppChecked,   setPpChecked]   = useState(false)  // checkbox ticked

  const [form, setForm] = useState({
    firstname: '', lastname: '', email: '', headline: '',
    bio: '', rightnow: '', seeking: '', password: '', confirmPassword: '',
  })
  const [country,        setCountry]        = useState('')
  const [stateVal,       setStateVal]       = useState('')
  const [city,           setCity]           = useState('')
  const [selectedDiscs,  setSelectedDiscs]  = useState([])
  const [selectedSkills, setSelectedSkills] = useState([])
  const [selectedComps,    setSelectedComps]    = useState(['Creative exchange'])
  const [seekingDiscs,     setSeekingDiscs]     = useState([])
  const [seekingSkills,    setSeekingSkills]    = useState([])
  const [seekingOpen,      setSeekingOpen]      = useState(false)
  const [skillRatings,     setSkillRatings]     = useState({}) // { "Film scoring": 4, ... }

  // Required fields for profile creation
  const REQUIRED = [
    form.firstname.trim().length > 0,
    form.lastname.trim().length > 0,
    form.email.trim().length > 0,
    form.password.length >= 8,
    form.confirmPassword === form.password && form.confirmPassword.length > 0,
    selectedDiscs.length > 0,
    selectedSkills.length > 0,
    form.headline.trim().length > 0,
    form.bio.trim().length > 0,
  ]
  const requiredComplete = REQUIRED.every(Boolean)
  const canSubmit = requiredComplete && tcChecked && ppChecked && !submitting

  const progress = Math.round(REQUIRED.filter(Boolean).length / REQUIRED.length * 100)
  const visibleSkills = selectedDiscs.length === 0
    ? SKILLS : SKILLS.filter(s => selectedDiscs.includes(s.d))

  const countryData  = LOCATION_DATA[country]
  const stateOptions = countryData?.states
    ? Object.entries(countryData.states).map(([k, v]) => ({ value: k, label: v.l }))
    : countryData?.r?.map(r => ({ value: r, label: r })) ?? []
  const cityOptions = (country && LOCATION_DATA[country]?.states?.[stateVal]?.c) ?? []

  function toggleDisc(id) {
    setSelectedDiscs(prev => {
      const next = prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
      const validSkillLabels = SKILLS.filter(s => next.includes(s.d)).map(s => s.label)
      setSelectedSkills(sk => sk.filter(s => validSkillLabels.includes(s)))
      return next
    })
  }
  function toggleSkill(label) {
    setSelectedSkills(prev => prev.includes(label) ? prev.filter(s => s !== label) : [...prev, label])
  }
  function toggleComp(label) {
    setSelectedComps(prev => prev.includes(label) ? prev.filter(c => c !== label) : [...prev, label])
  }
  function handleCountryChange(val) {
    setCountry(val); setStateVal(''); setCity('')
  }
  function closeModal() {
    setModalOpen(false); setSubmitted(false); setFormError('')
    setShowTcDoc(false); setShowPpDoc(false)
    setTcScrolled(false); setPpScrolled(false)
    setTcAccepted(false); setPpAccepted(false)
    setTcChecked(false); setPpChecked(false)
  }

  async function handleSubmit() {
    setFormError('')
    if (!form.firstname || !form.lastname || !form.email) {
      setFormError('Please fill in your first name, last name, and email.'); return
    }
    if (!form.password) {
      setFormError('Please choose a password.'); return
    }
    if (form.password.length < 8) {
      setFormError('Password must be at least 8 characters.'); return
    }
    if (form.password !== form.confirmPassword) {
      setFormError('Passwords don\'t match.'); return
    }

    setSubmitting(true)
    try {
      // Step 1: Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { firstname: form.firstname, lastname: form.lastname } }
      })
      if (authError) throw authError
      if (!authData.user) {
        throw new Error('An account with this email already exists. Try signing in instead.')
      }

      // Step 2: Wait for the DB trigger to create the empty profile row
      await new Promise(r => setTimeout(r, 1000))

      // Step 3: Update the profile row with all the form data
      // Use update not upsert -- trigger already created the row
      await supabase.from('profiles').update({
        firstname:   form.firstname,
        lastname:    form.lastname,
        email:       form.email,
        headline:    form.headline,
        bio:         form.bio,
        rightnow:    form.rightnow,
        seeking:     form.seeking,
        country,
        state:       countryData?.states ? stateVal : '',
        city:        countryData?.states ? city : stateVal,
        disciplines: selectedDiscs.map(id => {
          const found = DISCIPLINES.find(d => d.id === id)
          return found ? found.label : id
        }),
        skills:               selectedSkills,
        compensation:         selectedComps,
        seeking_disciplines:  seekingDiscs,
        seeking_skills:       seekingSkills,
        skill_ratings:        Object.keys(skillRatings).length > 0 ? skillRatings : null,
      }).eq('id', authData.user.id)

      // Always show success even if profile update had issues --
      // the auth account is created and they can update profile after confirming email
      setSubmitted(true)

    } catch (err) {
      setFormError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const profileSlug = myProfile
    ? `${myProfile.firstname.toLowerCase()}-${myProfile.lastname.toLowerCase()}`
    : null

  return (
    <>
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>Collective <span>Loft</span></Link>
        <div className={styles.navLinks}>
          {authUser && profileSlug ? (
            <Link href={`/profile/${profileSlug}`}>My Profile</Link>
          ) : (
            <Link href="/login">Sign in</Link>
          )}
          {!authUser && (
            <button className={styles.btnJoin} onClick={() => setModalOpen(true)}>Join</button>
          )}
        </div>
      </nav>

      <div className={styles.hero}>
        <div className={styles.heroLeft}>
          <div className={styles.eyebrow}>Where Creatives Find Each Other</div>
          <div className={styles.headline}>Make<br /><em>something</em><br />together.</div>
          <div className={styles.sub}>
            Collective Loft is a professional network built for artists, musicians,
            writers, poets, designers, and makers. Find collaborators who match your vision.
          </div>
          <div className={styles.heroBtns}>
            {authUser && profileSlug ? (
              <Link href={`/profile/${profileSlug}`} className={styles.btnP}>My Profile</Link>
            ) : (
              <button className={styles.btnP} onClick={() => setModalOpen(true)}>Build Your Profile</button>
            )}
            {!authUser && <Link href="/login" className={styles.btnS}>Sign in</Link>}
          </div>
        </div>

        <div className={styles.heroRight}>
          {members.length === 0 ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', flex:1 }}>
              <div style={{ color:'rgba(240,236,227,0.18)', fontSize:'0.78rem', fontWeight:300, textAlign:'center', lineHeight:1.7 }}>
                Creatives joining now.<br />Be the first to build your profile.
              </div>
            </div>
          ) : (
            members.map((m, i) => {
              const name = `${m.firstname || ''} ${m.lastname || ''}`.trim()
              const ini  = [(m.firstname||'?')[0], (m.lastname||'?')[0]].join('').toUpperCase()
              const disc = (m.disciplines || [])[0] || 'Creative'
              const loc  = m.city || m.state || null
              return (
                <div key={m.id} className={styles.mc}>
                  <div className={`${styles.mcAv} ${styles[AV_CLASSES[i] || 'avG']}`}>
                    {ini}
                    <div className={styles.dot} style={{ background: 'var(--teal)' }} />
                  </div>
                  <div>
                    <div className={styles.mcName}>{name}</div>
                    <div className={styles.mcRole}>{disc}</div>
                    <div className={styles.mcText}>{m.rightnow || 'Building something new on Collective Loft.'}</div>
                    <div className={styles.mcTags}>
                      {m.availability === 'open' && (
                        <span className={`${styles.tag} ${styles.tagG}`}>Open to Collab</span>
                      )}
                      {loc && <span className={styles.tag}>{loc}</span>}
                      {(m.compensation || []).slice(0,1).map(c => (
                        <span key={c} className={`${styles.tag} ${styles.tagG}`}>{c}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <div className={styles.discStrip}>
        <div className={styles.stripLbl}>Disciplines on the platform</div>
        <div className={styles.discGrid}>
          {DISC_GRID.map((d, i) => {
            const count = discCounts[d.discipline] || 0
            return (
              <div className={styles.dc} key={i}>
                <div className={styles.dcIcon}>{d.icon}</div>
                <div className={styles.dcName}>{d.name}</div>
                <div className={styles.dcCount}>{count} {count === 1 ? 'creative' : 'creatives'}</div>
              </div>
            )
          })}
        </div>
      </div>

      <div className={styles.manifesto}>
        <div className={styles.manifestoTxt}>
          Not a marketplace. Not a portfolio dump.{' '}
          A <strong>living network</strong> of people making real things together.
        </div>
      </div>

      <div className={styles.how}>
        {[
          { num: '01', title: 'Build your creative identity',  desc: 'Show your work, your influences, what you\'re making right now, and what kind of collaborators you\'re looking for.' },
          { num: '02', title: 'Post a Collab Brief',           desc: 'Describe your project and who you need. Creatives apply or reach out directly. The brief lives on your profile and in the public feed.' },
          { num: '03', title: 'Create in the Loft Studio',     desc: 'Your shared Studio holds your brief, files, messages, and milestones — a home for the work as it comes to life.' },
        ].map((h, i) => (
          <div className={styles.hi} key={i}>
            <div className={styles.hiNum}>{h.num}</div>
            <div className={styles.hiTitle}>{h.title}</div>
            <div className={styles.hiDesc}>{h.desc}</div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className={styles.mo} onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
          <div className={styles.modal}>

            <div className={styles.mhdr}>
              <div>
                <div className={styles.mey}>Join Collective Loft</div>
                <div className={styles.mt}>Build your creative profile.</div>
                <div className={styles.ms}>One form. Everything a collaborator needs to know about you.</div>
              </div>
              <button className={styles.mcl} onClick={closeModal}>✕</button>
            </div>

            <div className={styles.pbWrap}>
              <div className={styles.pb} style={{ width: `${progress}%` }} />
            </div>

            {submitted ? (
              <div className={styles.scs}>
                <div className={styles.scM}>✦</div>
                <div className={styles.scT}>Check your <span>inbox.</span></div>
                <div className={styles.scS}>
                  We sent a confirmation link to{' '}
                  <strong style={{ color: 'var(--cream)' }}>{form.email}</strong>.
                  Click it to activate your account and access your profile for the first time.
                </div>
                <div className={styles.scS} style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: 'rgba(240,236,227,0.35)' }}>
                  Don't see it? Check your spam folder or contact{' '}
                  <a href="mailto:help@collectiveloft.com" style={{ color: 'var(--gold)', textDecoration: 'none' }}>
                    help@collectiveloft.com
                  </a>
                </div>
                <div className={styles.scA}>
                  <button className={styles.bbh} onClick={closeModal}>Got it</button>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.mbody}>

                  {formError && (
                    <div style={{
                      background: 'rgba(194,112,128,0.1)',
                      border: '0.5px solid rgba(194,112,128,0.35)',
                      borderRadius: '3px',
                      padding: '0.65rem 0.85rem',
                      fontSize: '0.75rem',
                      color: '#c27080',
                      marginBottom: '1rem',
                    }}>
                      {formError}
                    </div>
                  )}

                  <section>
                    <div className={styles.msl}>Your identity</div>
                    <div className={styles.mfRow} style={{ marginBottom: '0.85rem' }}>
                      <div className={styles.mf}>
                        <label>First name</label>
                        <input type="text" value={form.firstname} onChange={e => setForm(f => ({ ...f, firstname: e.target.value }))} />
                      </div>
                      <div className={styles.mf}>
                        <label>Last name</label>
                        <input type="text" value={form.lastname} onChange={e => setForm(f => ({ ...f, lastname: e.target.value }))} />
                      </div>
                    </div>
                    <div className={styles.mf} style={{ marginBottom: '0.85rem' }}>
                      <label>Email</label>
                      <input type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                    </div>
                    <div className={styles.mfRow} style={{ marginBottom: '0.85rem' }}>
                      <div className={styles.mf}>
                        <label>Password</label>
                        <div className={styles.pwWrap}>
                          <input
                            type={showPw ? 'text' : 'password'}
                            placeholder="Min 8 characters"
                            value={form.password}
                            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                          />
                          <button type="button" className={styles.pwEye} onClick={() => setShowPw(v => !v)}>
                            {showPw ? '🙈' : '👁'}
                          </button>
                        </div>
                      </div>
                      <div className={styles.mf}>
                        <label>Confirm password</label>
                        <div className={styles.pwWrap}>
                          <input
                            type={showConfPw ? 'text' : 'password'}
                            placeholder="Repeat password"
                            value={form.confirmPassword}
                            onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                          />
                          <button type="button" className={styles.pwEye} onClick={() => setShowConfPw(v => !v)}>
                            {showConfPw ? '🙈' : '👁'}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className={styles.mf}>
                      <label>Location</label>
                      <div className={styles.locRow}>
                        <select value={country} onChange={e => handleCountryChange(e.target.value)}>
                          <option value="">Country…</option>
                          {Object.keys(LOCATION_DATA).filter(k => k !== 'OTHER').map(k => (
                            <option key={k} value={k}>{k === 'US' ? 'United States' : k === 'CA' ? 'Canada' : k === 'GB' ? 'United Kingdom' : k === 'AU' ? 'Australia' : k === 'DE' ? 'Germany' : k === 'FR' ? 'France' : k === 'JP' ? 'Japan' : k === 'BR' ? 'Brazil' : k === 'MX' ? 'Mexico' : k === 'NG' ? 'Nigeria' : k === 'ZA' ? 'South Africa' : k === 'IN' ? 'India' : k}</option>
                          ))}
                          <option value="OTHER">Other</option>
                        </select>
                        {stateOptions.length > 0 && (
                          <select value={stateVal} onChange={e => { setStateVal(e.target.value); setCity('') }}>
                            <option value="">State…</option>
                            {stateOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        )}
                        {cityOptions.length > 0 && (
                          <select value={city} onChange={e => setCity(e.target.value)}>
                            <option value="">City…</option>
                            {cityOptions.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        )}
                      </div>
                    </div>
                  </section>

                  <section>
                    <div className={styles.msl}>Discipline &amp; skills</div>
                    <div className={styles.mf} style={{ marginBottom: '0.85rem' }}>
                      <label>Primary discipline(s)</label>
                      <div className={styles.mdg}>
                        {DISCIPLINES.map(d => (
                          <div key={d.id} className={`${styles.mdo} ${selectedDiscs.includes(d.id) ? styles.on : ''}`} onClick={() => toggleDisc(d.id)}>
                            <span className={styles.mdoI}>{d.icon}</span>
                            <div className={styles.mdoN}>{d.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className={styles.mf} style={{ marginBottom: '0.85rem' }}>
                      <label>Your headline</label>
                      <input type="text" placeholder="e.g. Oil painter · Large format canvas · Abstract realism" maxLength={100} value={form.headline} onChange={e => setForm(f => ({ ...f, headline: e.target.value }))} />
                    </div>
                    <div className={styles.mf}>
                      <label>Specific skills</label>
                      <div className={styles.stags}>
                        {visibleSkills.map(s => (
                          <button key={s.label} className={`${styles.stag} ${selectedSkills.includes(s.label) ? styles.on : ''}`} onClick={() => toggleSkill(s.label)}>{s.label}</button>
                        ))}
                      </div>
                    </div>

                    {/* ── SKILL RATINGS ──────────────────────────────────── */}
                    {selectedSkills.length > 0 && (
                      <div style={{ marginTop:'1rem' }}>
                        <div style={{ fontSize:'0.58rem', letterSpacing:'0.14em', textTransform:'uppercase', color:'rgba(245,242,237,0.3)', marginBottom:'0.6rem' }}>
                          Rate your proficiency <span style={{ color:'rgba(245,242,237,0.2)', letterSpacing:'0', textTransform:'none', fontSize:'0.6rem' }}>— optional</span>
                        </div>
                        {selectedSkills.map(skill => {
                          const rating = skillRatings[skill] || 0
                          return (
                            <div key={skill} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.5rem', gap:'0.75rem' }}>
                              <span style={{ fontSize:'0.72rem', color:'rgba(245,242,237,0.6)', fontWeight:300, minWidth:'120px', flexShrink:0 }}>{skill}</span>
                              <div style={{ display:'flex', gap:'0.3rem', alignItems:'center' }}>
                                {[1,2,3,4,5].map(n => (
                                  <button
                                    key={n}
                                    type="button"
                                    onClick={() => setSkillRatings(prev => ({
                                      ...prev,
                                      [skill]: prev[skill] === n ? 0 : n
                                    }))}
                                    style={{
                                      width:'28px', height:'6px', borderRadius:'1px',
                                      border:'none', cursor:'pointer', transition:'all 0.15s',
                                      background: n <= rating ? 'var(--gold)' : 'rgba(245,242,237,0.1)',
                                    }}
                                    title={['','Beginner','Developing','Proficient','Advanced','Expert'][n]}
                                  />
                                ))}
                                <span style={{ fontSize:'0.58rem', color:'rgba(245,242,237,0.25)', marginLeft:'0.35rem', minWidth:'54px' }}>
                                  {rating === 0 ? 'not set' : ['','Beginner','Developing','Proficient','Advanced','Expert'][rating]}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </section>

                  <section>
                    <div className={styles.msl}>About you</div>
                    <div className={styles.mf} style={{ marginBottom: '0.85rem' }}>
                      <label>Your bio</label>
                      <textarea placeholder="Tell other creatives who you are, what drives your practice…" rows={3} value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
                    </div>
                    <div className={styles.mf}>
                      <label>Right now — what are you actively making?</label>
                      <textarea placeholder="e.g. Completing a 12-piece oil series. Looking for a web designer for gallery submissions — deadline Sept 2025." rows={3} value={form.rightnow} onChange={e => setForm(f => ({ ...f, rightnow: e.target.value }))} />
                      <div className={styles.hint}>The most important field on your profile.</div>
                    </div>
                  </section>

                  <section>
                    <div className={styles.msl}>Work samples</div>
                    <div className={styles.uz}>
                      <input type="file" multiple accept="image/*,audio/*,video/*,.pdf" />
                      <div className={styles.uzI}>↑</div>
                      <div className={styles.uzT}>Drop files here or click to browse</div>
                      <div className={styles.uzS}>JPG, PNG, MP3, MP4, PDF · Max 20MB · <span>Up to 12 files</span></div>
                    </div>
                    <div className={styles.mf} style={{ marginTop: '0.85rem' }}>
                      <label>Portfolio link <span style={{ color: 'rgba(240,236,227,0.25)', fontSize: '0.65rem' }}>— optional</span></label>
                      <input type="url" placeholder="https://yoursite.com · SoundCloud · Behance" />
                    </div>
                  </section>

                  <section>
                    <div className={styles.msl}>Collaboration</div>
                    <div className={styles.mf} style={{ marginBottom: '0.85rem' }}>
                      <label>Compensation type</label>
                      <div className={styles.co}>
                        {['Creative exchange', 'Paid', 'Revenue share'].map(c => (
                          <div key={c} className={`${styles.coo} ${selectedComps.includes(c) ? styles.on : ''}`} onClick={() => toggleComp(c)}>
                            <div className={styles.cooT}>{c}</div>
                            <div className={styles.cooD}>{c === 'Creative exchange' ? 'Trade skills. No money moves.' : c === 'Paid' ? 'Fee agreed upfront.' : 'Split the outcome.'}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className={styles.mfRow}>
                      <div className={styles.mf}>
                        <label>Location preference</label>
                        <select><option value="">Select…</option><option>Local only</option><option>Remote OK</option><option>Remote preferred</option><option>No preference</option></select>
                      </div>
                      <div className={styles.mf}>
                        <label>Availability</label>
                        <select><option value="">Select…</option><option>Open to collabs now</option><option>Available in 1–2 months</option><option>Not available right now</option></select>
                      </div>
                    </div>

                    {/* ── COLLAPSIBLE SEEKING SECTION ───────────────────── */}
                    <div style={{ marginTop:'1rem', border:'0.5px solid rgba(245,242,237,0.08)', borderRadius:'4px', overflow:'hidden' }}>
                      <button
                        type="button"
                        onClick={() => setSeekingOpen(v => !v)}
                        style={{
                          width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
                          padding:'0.75rem 1rem', background:'rgba(245,242,237,0.03)',
                          border:'none', cursor:'pointer', textAlign:'left',
                        }}
                      >
                        <div>
                          <div style={{ fontFamily:'var(--sans)', fontSize:'0.7rem', fontWeight:500, color:'var(--cream)', marginBottom:'0.1rem' }}>
                            Who are you looking to collaborate with?
                          </div>
                          <div style={{ fontSize:'0.62rem', color:'rgba(245,242,237,0.35)', fontWeight:300 }}>
                            {seekingDiscs.length === 0 && seekingSkills.length === 0
                              ? 'Optional — helps the matching algorithm find the right people for you'
                              : `${seekingDiscs.length} discipline${seekingDiscs.length !== 1 ? 's' : ''} · ${seekingSkills.length} skill${seekingSkills.length !== 1 ? 's' : ''} selected`
                            }
                          </div>
                        </div>
                        <span style={{ color:'var(--gold)', fontSize:'0.75rem', transform: seekingOpen ? 'rotate(180deg)' : 'none', transition:'transform 0.2s', flexShrink:0, marginLeft:'0.5rem' }}>▼</span>
                      </button>

                      {seekingOpen && (
                        <div style={{ padding:'1rem', borderTop:'0.5px solid rgba(245,242,237,0.06)' }}>
                          {/* Discipline grid */}
                          <div style={{ fontSize:'0.58rem', letterSpacing:'0.14em', textTransform:'uppercase', color:'rgba(245,242,237,0.3)', marginBottom:'0.6rem' }}>
                            I'm looking to work with
                          </div>
                          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'0.4rem', marginBottom:'1rem' }}>
                            {DISC_GRID.map(d => (
                              <div
                                key={d.id}
                                onClick={() => {
                                  setSeekingDiscs(prev => {
                                    const next = prev.includes(d.discipline)
                                      ? prev.filter(x => x !== d.discipline)
                                      : [...prev, d.discipline]
                                    // Remove skills that no longer match selected discs
                                    const validSkills = SKILLS.filter(s => {
                                      const disc = DISCIPLINES.find(dd => dd.label === next.find(n => n === dd.label))
                                      return next.some(n => {
                                        const found = DISCIPLINES.find(dd => dd.label === n)
                                        return found && s.d === found.id
                                      })
                                    }).map(s => s.label)
                                    setSeekingSkills(sk => sk.filter(s => validSkills.includes(s)))
                                    return next
                                  })
                                }}
                                style={{
                                  border: seekingDiscs.includes(d.discipline) ? '0.5px solid var(--gold)' : '0.5px solid rgba(245,242,237,0.1)',
                                  background: seekingDiscs.includes(d.discipline) ? 'rgba(201,168,76,0.08)' : 'var(--bg1)',
                                  borderRadius:'3px', padding:'0.5rem 0.35rem', textAlign:'center',
                                  cursor:'pointer', transition:'all 0.15s', userSelect:'none',
                                }}
                              >
                                <div style={{ fontSize:'0.9rem', marginBottom:'0.15rem' }}>{d.icon}</div>
                                <div style={{ fontFamily:'var(--sans)', fontSize:'0.55rem', color: seekingDiscs.includes(d.discipline) ? 'var(--gold)' : 'rgba(245,242,237,0.4)', lineHeight:1.2 }}>{d.name}</div>
                              </div>
                            ))}
                          </div>

                          {/* Skill tags — filtered to selected disciplines */}
                          {seekingDiscs.length > 0 && (() => {
                            const availSkills = SKILLS.filter(s =>
                              seekingDiscs.some(disc => {
                                const found = DISCIPLINES.find(d => d.label === disc)
                                return found && s.d === found.id
                              })
                            ).map(s => s.label)
                            return availSkills.length > 0 ? (
                              <>
                                <div style={{ fontSize:'0.58rem', letterSpacing:'0.14em', textTransform:'uppercase', color:'rgba(245,242,237,0.3)', marginBottom:'0.6rem' }}>
                                  Specific skills I need
                                </div>
                                <div style={{ display:'flex', flexWrap:'wrap', gap:'0.35rem' }}>
                                  {availSkills.map(s => (
                                    <button
                                      key={s}
                                      type="button"
                                      onClick={() => setSeekingSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                                      style={{
                                        fontFamily:'var(--sans)', fontSize:'0.65rem',
                                        padding:'0.2rem 0.6rem', borderRadius:'2px',
                                        border: seekingSkills.includes(s) ? '0.5px solid var(--gold)' : '0.5px solid rgba(245,242,237,0.1)',
                                        background: seekingSkills.includes(s) ? 'rgba(201,168,76,0.1)' : 'transparent',
                                        color: seekingSkills.includes(s) ? 'var(--gold)' : 'rgba(245,242,237,0.4)',
                                        cursor:'pointer', transition:'all 0.15s',
                                      }}
                                    >{s}</button>
                                  ))}
                                </div>
                              </>
                            ) : null
                          })()}
                        </div>
                      )}
                    </div>
                  </section>

                  <section>
                    <div className={styles.msl}>Find me elsewhere</div>
                    <div className={styles.mfRow} style={{ marginBottom: '0.85rem' }}>
                      <div className={styles.mf}><label>Personal website</label><input type="url" placeholder="https://yoursite.com" /></div>
                      <div className={styles.mf}><label>Instagram</label><input type="text" placeholder="@yourhandle" /></div>
                    </div>
                    <div className={styles.mfRow}>
                      <div className={styles.mf}><label>SoundCloud / Spotify</label><input type="url" placeholder="https://soundcloud.com/…" /></div>
                      <div className={styles.mf}><label>Other link</label><input type="url" placeholder="Behance, Vimeo, LinkedIn…" /></div>
                    </div>
                  </section>

                </div>

                <div className={styles.mftr}>
                  {/* Legal acknowledgement section */}
                  <div style={{ width:'100%', marginBottom:'1rem' }}>
                    <div style={{ fontSize:'0.58rem', letterSpacing:'0.14em', textTransform:'uppercase', color:'rgba(245,242,237,0.3)', marginBottom:'0.75rem' }}>
                      Required acknowledgements
                    </div>

                    {/* Terms & Conditions row */}
                    <div style={{ display:'flex', alignItems:'center', gap:'0.65rem', marginBottom:'0.5rem' }}>
                      <div
                        onClick={() => { if (tcAccepted) setTcChecked(v => !v) }}
                        style={{
                          width:'18px', height:'18px', borderRadius:'3px', flexShrink:0,
                          border: tcChecked ? '0.5px solid var(--gold)' : '0.5px solid rgba(245,242,237,0.2)',
                          background: tcChecked ? 'rgba(201,168,76,0.15)' : 'transparent',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          cursor: tcAccepted ? 'pointer' : 'not-allowed',
                          opacity: tcAccepted ? 1 : 0.4,
                          transition:'all 0.15s',
                          color:'var(--gold)', fontSize:'0.65rem',
                        }}
                      >{tcChecked ? '✓' : ''}</div>
                      <span style={{ fontSize:'0.72rem', color:'rgba(245,242,237,0.55)', fontWeight:300 }}>
                        I have read and agree to the{' '}
                        <button
                          type="button"
                          onClick={() => setShowTcDoc(true)}
                          style={{ background:'none', border:'none', color:'var(--gold)', cursor:'pointer', fontSize:'0.72rem', fontFamily:'var(--sans)', textDecoration:'underline', padding:0 }}
                        >Terms & Conditions</button>
                        {!tcAccepted && <span style={{ fontSize:'0.6rem', color:'rgba(245,242,237,0.3)', marginLeft:'0.4rem' }}>(must read to enable)</span>}
                        {tcAccepted && !tcChecked && <span style={{ fontSize:'0.6rem', color:'var(--teal)', marginLeft:'0.4rem' }}>✓ read — check to confirm</span>}
                      </span>
                    </div>

                    {/* Privacy Policy row */}
                    <div style={{ display:'flex', alignItems:'center', gap:'0.65rem' }}>
                      <div
                        onClick={() => { if (ppAccepted) setPpChecked(v => !v) }}
                        style={{
                          width:'18px', height:'18px', borderRadius:'3px', flexShrink:0,
                          border: ppChecked ? '0.5px solid var(--gold)' : '0.5px solid rgba(245,242,237,0.2)',
                          background: ppChecked ? 'rgba(201,168,76,0.15)' : 'transparent',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          cursor: ppAccepted ? 'pointer' : 'not-allowed',
                          opacity: ppAccepted ? 1 : 0.4,
                          transition:'all 0.15s',
                          color:'var(--gold)', fontSize:'0.65rem',
                        }}
                      >{ppChecked ? '✓' : ''}</div>
                      <span style={{ fontSize:'0.72rem', color:'rgba(245,242,237,0.55)', fontWeight:300 }}>
                        I have read and agree to the{' '}
                        <button
                          type="button"
                          onClick={() => setShowPpDoc(true)}
                          style={{ background:'none', border:'none', color:'var(--gold)', cursor:'pointer', fontSize:'0.72rem', fontFamily:'var(--sans)', textDecoration:'underline', padding:0 }}
                        >Privacy Policy</button>
                        {!ppAccepted && <span style={{ fontSize:'0.6rem', color:'rgba(245,242,237,0.3)', marginLeft:'0.4rem' }}>(must read to enable)</span>}
                        {ppAccepted && !ppChecked && <span style={{ fontSize:'0.6rem', color:'var(--teal)', marginLeft:'0.4rem' }}>✓ read — check to confirm</span>}
                      </span>
                    </div>

                    {/* Required fields status */}
                    {!requiredComplete && (
                      <div style={{ marginTop:'0.75rem', fontSize:'0.62rem', color:'rgba(245,242,237,0.28)', fontWeight:300, lineHeight:1.5 }}>
                        Required to create profile: First name, Last name, Email, Password (8+ chars), at least one Discipline, at least one Skill, Headline, and Bio.
                      </div>
                    )}
                  </div>

                  <div className={styles.fbtns}>
                    <button className={styles.bcn} onClick={closeModal}>Cancel</button>
                    <button
                      className={styles.bsp}
                      onClick={handleSubmit}
                      disabled={!canSubmit}
                      title={!requiredComplete ? 'Complete all required fields' : !tcChecked || !ppChecked ? 'Read and accept both legal documents' : ''}
                      style={{ opacity: canSubmit ? 1 : 0.4, cursor: canSubmit ? 'pointer' : 'not-allowed' }}
                    >
                      {submitting ? 'Creating profile…' : 'Create my profile ↗'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {/* ── LEGAL DOC MODAL WRAPPER ─────────────────────────────────────── */}
      {(showTcDoc || showPpDoc) && (() => {
        const isTc = showTcDoc
        const scrolled = isTc ? tcScrolled : ppScrolled
        const setScrolled = isTc ? setTcScrolled : setPpScrolled
        const onAgree = isTc
          ? () => { setTcAccepted(true); setTcChecked(true); setShowTcDoc(false) }
          : () => { setPpAccepted(true); setPpChecked(true); setShowPpDoc(false) }
        const onClose = isTc ? () => setShowTcDoc(false) : () => setShowPpDoc(false)
        const title = isTc ? 'Terms & Conditions' : 'Privacy Policy'
        const agreeLabel = isTc
          ? 'By clicking I Agree, you confirm you have read and agree to Collective Loft\'s Terms & Conditions and that you are 18 years of age or older.'
          : 'By clicking I Agree, you confirm you have read and agree to Collective Loft\'s Privacy Policy.'

        const s = { // inline style helpers
          p: (t) => ({ fontSize:'0.78rem', color:'rgba(245,242,237,0.65)', lineHeight:1.75, fontWeight:300, marginBottom:'0.75rem' }),
          h: () => ({ fontFamily:'var(--serif)', fontSize:'1.05rem', fontWeight:700, color:'var(--cream)', marginBottom:'0.5rem', marginTop:'1.5rem', paddingTop:'1rem', borderTop:'0.5px solid rgba(245,242,237,0.08)' }),
          sub: () => ({ fontSize:'0.72rem', fontWeight:600, color:'var(--gold)', marginBottom:'0.35rem', marginTop:'1rem', letterSpacing:'0.02em' }),
          li: () => ({ fontSize:'0.76rem', color:'rgba(245,242,237,0.6)', lineHeight:1.65, paddingLeft:'1rem', position:'relative', marginBottom:'0.25rem' }),
          caps: () => ({ fontSize:'0.74rem', color:'rgba(245,242,237,0.75)', lineHeight:1.7, fontWeight:500, marginBottom:'0.75rem' }),
        }

        const Sec = ({num, title, children}) => (
          <div style={{marginBottom:'0.5rem'}}>
            <div style={s.h()}><span style={{color:'var(--gold)',marginRight:'0.5rem'}}>{num}.</span>{title}</div>
            {children}
          </div>
        )
        const P = ({children}) => <p style={s.p()}>{children}</p>
        const Sub = ({children}) => <div style={s.sub()}>{children}</div>
        const Ul = ({items}) => (
          <ul style={{listStyle:'none',padding:0,margin:'0 0 0.75rem 0'}}>
            {items.map((item,i) => (
              <li key={i} style={s.li()}>
                <span style={{position:'absolute',left:0,color:'var(--gold)',fontSize:'0.55rem',top:'0.2rem'}}>○</span>
                {item}
              </li>
            ))}
          </ul>
        )
        const Caps = ({children}) => <p style={s.caps()}>{children}</p>

        const TcContent = () => (
          <div style={{fontFamily:'var(--sans)'}}>
            <div style={{background:'rgba(201,168,76,0.06)',border:'0.5px solid rgba(201,168,76,0.15)',borderRadius:'4px',padding:'1rem',marginBottom:'1.5rem'}}>
              <P>Welcome to Collective Loft. These Terms & Conditions govern your access to and use of the Collective Loft platform, website, applications, services, collaboration systems, creator tools, community features, and subscription offerings (collectively, the "Platform"). By accessing or using the Platform, you agree to be bound by these Terms. If you do not agree, you may not use the Platform.</P>
              <div style={{fontSize:'0.68rem',color:'rgba(245,242,237,0.35)',display:'flex',gap:'1rem',flexWrap:'wrap'}}>
                <span>Effective Date: [Insert Date]</span><span>·</span><span>collectiveloft.com</span><span>·</span><span>hello@collectiveloft.com</span><span>·</span><span>Morgan Collective Group LLC · Chicago, Illinois</span>
              </div>
            </div>

            <Sec num="1" title="Platform Overview">
              <P>Collective Loft is not a traditional freelance marketplace, portfolio site, job board, or social media feed. The Platform exists to facilitate creative collaboration through creator identity profiles, collaboration briefs, discipline matching, Loft Studios, and structured collaboration terms.</P>
              <Ul items={['Creative Profiles and Right Now project cards','Collaboration Briefs and application systems','Discipline Matching systems','Loft Studios — shared project workspaces','Shared files, notes, and milestone tracking','Community Voice ratings and reviews','Messaging and communication tools','Collaboration term agreements','Subscription services']}/>
            </Sec>

            <Sec num="2" title="Eligibility">
              <P>You must be at least 18 years old to use the Platform. Collective Loft is designed for working creative professionals. We do not permit use by individuals under 18 under any circumstances, including with parental consent. By creating an account, you represent and warrant that you are 18 years of age or older and have the full legal authority to enter into binding agreements. Your use of the Platform must comply with all applicable local, state, national, and international laws and regulations.</P>
            </Sec>

            <Sec num="3" title="Subscription & Billing">
              <div style={{background:'rgba(201,168,76,0.1)',border:'0.5px solid rgba(201,168,76,0.25)',borderRadius:'3px',padding:'0.6rem 1rem',marginBottom:'0.75rem'}}>
                <span style={{fontFamily:'var(--serif)',fontSize:'1.2rem',color:'var(--gold)',fontWeight:700}}>$15 USD / month</span>
              </div>
              <Sub>3.1 Billing</Sub>
              <P>By subscribing, you authorize Collective Loft and its payment processors (currently Stripe) to automatically charge your selected payment method on a recurring monthly basis at the then-current subscription rate.</P>
              <Sub>3.2 Renewal & Cancellation</Sub>
              <Ul items={['Subscriptions automatically renew each month unless canceled before the next billing cycle','You may cancel at any time through your account settings','Upon cancellation, your access continues through the end of your current paid billing period — not terminated immediately','No partial-month refunds unless required by applicable law']}/>
              <Sub>3.3 Price Changes</Sub>
              <P>We will provide at least 30 days advance notice of any pricing changes via email. Continued use after the effective date constitutes acceptance of new pricing.</P>
              <Sub>3.4 Payment Processor Terms</Sub>
              <P>Payment processing is handled by Stripe and subject to Stripe's own terms of service and privacy policy. Collective Loft is not responsible for payment processing errors, disputes, or issues that arise from Stripe's systems.</P>
            </Sec>

            <Sec num="4" title="Creator Profiles & Identity">
              <P>Collective Loft profiles are designed as creative professional identities rather than traditional résumés. You are solely responsible for all information and content submitted to your profile. You agree not to:</P>
              <Ul items={['Impersonate another individual or entity','Submit false collaboration history or fabricated credentials','Manipulate ratings, reviews, or trust systems','Use automated bots, scripts, or fake engagement systems','Create multiple accounts to circumvent platform rules or suspensions']}/>
            </Sec>

            <Sec num="5" title="Collaboration Briefs & Matching">
              <P>Users may create or respond to Collaboration Briefs describing creative projects, collaborator needs, compensation arrangements, timelines, and project goals. Collective Loft does not guarantee:</P>
              <Ul items={['Project completion or successful collaboration outcomes','Collaboration compatibility between users','Financial outcomes or revenue generation','Match quality or algorithm accuracy']}/>
              <P>Discipline Matching systems are algorithmic recommendation tools only — not endorsements, certifications, or guarantees of any kind.</P>
            </Sec>

            <Sec num="6" title="Loft Studios">
              <P>A Loft Studio is a shared collaboration workspace that opens when users mutually agree to collaborate by accepting Collab Terms. Loft Studios include shared milestones, deliverable tracking, shared files, shared notes, chat history, timestamped activity records, and collaboration terms.</P>
              <P>Users acknowledge that activity history and collaboration records may remain associated with completed projects as part of the Platform's trust and reputation infrastructure, even after a subscription is canceled or an account is closed. Because a collaboration belongs to both parties, the active member retains access to shared work, files, and records tied to projects they participated in. Collective Loft will handle data removal requests on a case-by-case basis and make reasonable efforts to honor such requests while protecting the legitimate interests of all parties, subject to applicable law.</P>
            </Sec>

            <Sec num="7" title="Collab Terms & Creative Agreements">
              <P>Before beginning work, collaborating parties may negotiate and agree upon deliverables, timelines, rights transfer terms, revenue share percentages, milestone structures, compensation arrangements, and creative exchange terms through the Platform's Collab Terms system.</P>
              <P>Collective Loft is not a legal representative, employer, talent agency, escrow service, or contracting party to agreements between users. Users are solely responsible for ensuring their agreements meet their legal and professional needs. Collective Loft strongly encourages users to seek independent legal counsel for high-value or complex collaboration agreements.</P>
            </Sec>

            <Sec num="8" title="Types of Collaboration">
              <Ul items={['Creative Exchange — skills traded between parties, no money changes hands','Paid Collaboration — fee agreed upfront between parties','Revenue Share — parties split revenue generated by the work']}/>
              <P>Collective Loft does not process escrow services, guarantee payment enforcement, or act as intermediary in financial transactions between users. Users assume all risks associated with collaborative arrangements.</P>
            </Sec>

            <Sec num="9" title="Content Ownership & License">
              <P>Creators retain full ownership of content they upload to the Platform. By uploading content, you grant Collective Loft a worldwide, non-exclusive, royalty-free license to host, display, store, and technically process your content solely as necessary to operate the Platform. This license does not permit Collective Loft to sell your content or license it to third parties for commercial purposes unrelated to Platform operation.</P>
              <P>This license terminates when content is removed, except for system backups (purged within 90 days), active dispute resolution, legal compliance, or completed collaboration records tied to another user's profile history.</P>
            </Sec>

            <Sec num="10" title="Community Voice & Reputation">
              <Ul items={['Ratings and reviews must be honest, accurate, and made in good faith based on your direct collaboration experience','Harassment, retaliation, defamation, or coordinated review manipulation is prohibited','Collective Loft may remove reviews that violate these Terms or are fraudulent, abusive, or defamatory','All moderation decisions are made at Collective Loft\'s sole discretion and are final']}/>
            </Sec>

            <Sec num="11" title="Email Communications">
              <P>By creating an account, you consent to receive transactional emails including account confirmations, password resets, collaboration term notifications, studio activity alerts, rating prompts, billing notifications, and platform policy changes. You may opt out of non-essential marketing emails at any time. Transactional emails cannot be opted out of while your account is active.</P>
            </Sec>

            <Sec num="12" title="Acceptable Use">
              <Ul items={['Harass, threaten, intimidate, or abuse other users','Upload illegal, infringing, stolen, or unauthorized content','Share malware, malicious code, or harmful content','Attempt unauthorized access to any system, account, or data','Scrape, crawl, or systematically harvest Platform data','Manipulate matching, rating, or reputation systems','Circumvent subscription fees or access controls','Use the Platform for any unlawful purpose','Impersonate Collective Loft staff or representatives']}/>
            </Sec>

            <Sec num="13" title="Intellectual Property">
              <P>All Platform branding, logos, systems, interfaces, software, workflows, visual design, matching systems, and proprietary technology are owned by Collective Loft and Morgan Collective Group LLC. No user may copy, reverse engineer, reproduce, distribute, modify, or commercially exploit Platform technology without explicit written permission.</P>
            </Sec>

            <Sec num="14" title="Copyright & DMCA">
              <P>Submit DMCA takedown notices to hello@collectiveloft.com including: identification of the copyrighted work, identification of the infringing material and its location, your contact information, a good faith statement, and a statement under penalty of perjury that you are authorized to act on behalf of the copyright owner.</P>
            </Sec>

            <Sec num="15" title="Privacy & Data">
              <P>Your use of the Platform is governed by our Privacy Policy at collectiveloft.com/privacy. Collective Loft uses Google Analytics to understand Platform usage patterns. Beyond session management cookies required by Supabase Auth, we do not deploy additional tracking cookies beyond those used by Google Analytics.</P>
            </Sec>

            <Sec num="16" title="Disclaimers">
              <Caps>THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. Collective Loft makes no warranties regarding platform uptime, collaboration success, revenue outcomes, security, or availability of third-party services. Collective Loft shall not be liable for interruptions from force majeure events including third-party infrastructure failures, natural disasters, or internet disruptions.</Caps>
            </Sec>

            <Sec num="17" title="Limitation of Liability">
              <Caps>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, COLLECTIVE LOFT AND MORGAN COLLECTIVE GROUP LLC SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, PUNITIVE, OR SPECIAL DAMAGES. Collective Loft's total aggregate liability shall not exceed the total subscription fees paid by the user during the twelve (12) months preceding the claim.</Caps>
            </Sec>

            <Sec num="18" title="Termination">
              <P>Collective Loft may suspend or terminate accounts at its sole discretion. Users may terminate at any time — access continues through the end of the current paid billing period. To appeal, contact hello@collectiveloft.com. Surviving provisions include: intellectual property rights, content license for completed records, dispute provisions, limitation of liability, and governing law.</P>
            </Sec>

            <Sec num="19" title="Governing Law">
              <P>These Terms are governed by the laws of the State of Illinois. Disputes not subject to arbitration shall be resolved in courts located in Chicago, Illinois.</P>
            </Sec>

            <Sec num="20" title="User Disputes & Platform Non-Liability">
              <P>Collective Loft and Morgan Collective Group LLC are not parties to agreements between users. All collaborations, payments, rights transfers, and business arrangements are solely between participating users. Collective Loft does not supervise, direct, control, or guarantee any collaboration outcome.</P>
              <Ul items={['Collective Loft acts solely as a technology platform facilitating discovery and collaboration infrastructure','Collective Loft does not guarantee the quality, legality, completion, or outcome of any project','Collective Loft is not responsible for payment disputes, missed deadlines, creative disagreements, or IP ownership conflicts']}/>
              <P>Claims arising from user-to-user collaborations shall be directed against the relevant users, not Collective Loft or Morgan Collective Group LLC.</P>
            </Sec>

            <Sec num="21" title="Mandatory Arbitration & Class Action Waiver">
              <P>By using the Platform, you agree that any dispute arising out of or relating to these Terms shall be resolved through binding individual arbitration in Chicago, Illinois under AAA rules.</P>
              <Caps>YOU WAIVE ANY RIGHT TO PARTICIPATE IN CLASS ACTIONS, CLASS ARBITRATIONS, OR REPRESENTATIVE PROCEEDINGS AGAINST COLLECTIVE LOFT OR MORGAN COLLECTIVE GROUP LLC. Emergency injunctive relief may be sought in court.</Caps>
            </Sec>

            <Sec num="22" title="Creator Verification Disclaimer">
              <P>Profile completion indicators, collaboration history counts, Community Voice ratings, and trust signals are informational only — not endorsements, certifications, or background checks of any kind. Users are solely responsible for their own due diligence before entering into collaborations.</P>
            </Sec>

            <Sec num="23" title="Collaborative Works & Rights Ownership">
              <P>Rights related to collaborative works are determined solely by agreements between participating users. Collective Loft does not determine, arbitrate, or guarantee ownership, licensing, royalties, or IP rights between collaborators. Users are strongly encouraged to define all rights clearly before work begins.</P>
            </Sec>

            <Sec num="24" title="Changes to Terms">
              <P>We will notify registered users by email at least 14 days before material changes take effect. Continued use after the effective date constitutes acceptance. If you do not agree, cancel your subscription before the effective date.</P>
            </Sec>

            <Sec num="25" title="Contact Information">
              <div style={{background:'rgba(245,242,237,0.03)',border:'0.5px solid rgba(245,242,237,0.08)',borderRadius:'3px',padding:'1rem',fontSize:'0.78rem',color:'rgba(245,242,237,0.5)',lineHeight:1.8}}>
                Collective Loft · Morgan Collective Group LLC<br/>
                Chicago, Illinois<br/>
                hello@collectiveloft.com · collectiveloft.com
              </div>
            </Sec>
          </div>
        )

        const PpContent = () => (
          <div style={{fontFamily:'var(--sans)'}}>
            <div style={{background:'rgba(201,168,76,0.06)',border:'0.5px solid rgba(201,168,76,0.15)',borderRadius:'4px',padding:'1rem',marginBottom:'1.5rem'}}>
              <P>Collective Loft is committed to protecting your privacy. This Privacy Policy explains what information we collect, how we use it, who we share it with, and what rights you have regarding your data. By using the Platform, you agree to the collection and use of information in accordance with this Privacy Policy.</P>
              <div style={{fontSize:'0.68rem',color:'rgba(245,242,237,0.35)',display:'flex',gap:'1rem',flexWrap:'wrap'}}>
                <span>Effective Date: [Insert Date]</span><span>·</span><span>collectiveloft.com</span><span>·</span><span>hello@collectiveloft.com</span><span>·</span><span>Morgan Collective Group LLC · Chicago, Illinois</span>
              </div>
            </div>

            <Sec num="1" title="Information We Collect">
              <Sub>1.1 Information You Provide Directly</Sub>
              <Ul items={['Name and email address','Password (stored encrypted — we cannot access your plaintext password)','Location (country, state, city)','Creative profile: disciplines, skills, bio, headline, Right Now card, portfolio links, social links','Collaboration preferences: seeking disciplines and skills','Uploaded content: portfolio files, studio files, profile and cover images','Messages and communications within Loft Studios','Collaboration terms you create or accept','Ratings and reviews you submit','Payment information (processed by Stripe — see Section 4)']}/>
              <Sub>1.2 Information Collected Automatically</Sub>
              <Ul items={['Log data: IP address, browser type, pages visited, time spent, referring URLs','Device information: device type, operating system, browser version','Usage data: features used, actions taken, collaboration activity','Session data: authentication tokens managed by Supabase Auth','Analytics data: page views, navigation patterns, feature engagement (via Google Analytics)']}/>
              <Sub>1.3 Cookies & Tracking Technologies</Sub>
              <Ul items={['Authentication cookies (Supabase): maintain your logged-in session. Required for Platform functionality. Cannot be disabled while using the Platform.','Google Analytics cookies: understand how users navigate the Platform. Do not identify you personally. You may opt out via tools.google.com/dlpage/gaoptout or browser settings.']}/>
              <P>We do not use advertising cookies, third-party tracking pixels, or behavioral targeting technologies beyond those described above.</P>
            </Sec>

            <Sec num="2" title="How We Use Your Information">
              <Ul items={['Create and manage your account','Provide, operate, and improve the Platform','Power the Discipline Matching algorithm','Enable Briefs, Terms, and Loft Studio features','Process subscription payments through Stripe','Send transactional emails related to your account and collaborations','Display your profile to other users','Generate and display Community Voice ratings and reviews','Analyze Platform usage to improve features','Respond to support requests and resolve disputes','Comply with legal obligations','Protect the security and integrity of the Platform']}/>
              <div style={{background:'rgba(86,179,156,0.08)',border:'0.5px solid rgba(86,179,156,0.25)',borderRadius:'3px',padding:'0.75rem 1rem',fontSize:'0.78rem',color:'var(--teal)',marginBottom:'0.75rem'}}>
                We do not sell your personal data. We do not use your data to serve third-party advertising.
              </div>
            </Sec>

            <Sec num="3" title="How We Share Your Information">
              <Sub>3.1 With Other Users (visible by default)</Sub>
              <Ul items={['Name, headline, bio, and Right Now card','Disciplines, skills, and collaboration preferences','Location (city, state, country)','Portfolio links and social links','Collaboration history (count and project titles from completed Loft Studios)','Community Voice rating and reviews']}/>
              <P>Information shared within a Loft Studio (messages, files, notes, milestones) is visible only to the two parties in that Studio.</P>
              <Sub>3.2 With Service Providers</Sub>
              {[['Supabase','Database, auth, storage, realtime'],['Vercel','Platform hosting and deployment'],['Stripe','Subscription payment processing'],['Resend','Transactional email delivery'],['Google Analytics','Platform usage analytics (anonymized)']].map(([p,pu]) => (
                <div key={p} style={{display:'flex',gap:'1rem',padding:'0.3rem 0',borderBottom:'0.5px solid rgba(245,242,237,0.05)',fontSize:'0.75rem'}}>
                  <span style={{color:'var(--gold)',fontWeight:500,minWidth:'120px'}}>{p}</span>
                  <span style={{color:'rgba(245,242,237,0.5)'}}>{pu}</span>
                </div>
              ))}
              <div style={{height:'0.75rem'}}/>
              <Sub>3.3 Legal Disclosures</Sub>
              <P>We may disclose your information when required by law, subpoena, court order, or government request, or when necessary to protect the rights, safety, or property of Collective Loft, our users, or the public.</P>
            </Sec>

            <Sec num="4" title="Payment Data">
              <P>Collective Loft does not store your full payment card information. All payment processing is handled by Stripe. Your payment details are transmitted directly to Stripe and governed by Stripe's Privacy Policy. We retain subscription status, billing history, and last four digits of your card on file as provided by Stripe.</P>
            </Sec>

            <Sec num="5" title="Data Retention">
              {[['Active account data','Life of account'],['Completed Loft Studio records','Indefinitely as part of collaboration history'],['Billing records','7 years (tax and legal compliance)'],['System backups','Purged within 90 days on rolling basis'],['Google Analytics data','~26 months (Google\'s standard policy)']].map(([t,r]) => (
                <div key={t} style={{display:'flex',justifyContent:'space-between',padding:'0.3rem 0',borderBottom:'0.5px solid rgba(245,242,237,0.05)',fontSize:'0.75rem'}}>
                  <span style={{color:'rgba(245,242,237,0.6)'}}>{t}</span>
                  <span style={{color:'rgba(245,242,237,0.35)',textAlign:'right',maxWidth:'55%'}}>{r}</span>
                </div>
              ))}
              <div style={{height:'0.5rem'}}/>
              <P>If you delete your account, we will delete or anonymize your profile data within 30 days, except where retention is required for legal compliance, active disputes, or completed collaboration records tied to another user's history.</P>
            </Sec>

            <Sec num="6" title="Your Rights & Choices">
              <Sub>6.1 Access & Correction</Sub><P>Update your profile information directly through your account settings at any time.</P>
              <Sub>6.2 Account Deletion</Sub><P>Contact hello@collectiveloft.com to request deletion. We process requests within 30 days.</P>
              <Sub>6.3 Google Analytics Opt-Out</Sub><P>Install the Google Analytics opt-out browser add-on at tools.google.com/dlpage/gaoptout or adjust your browser's cookie settings.</P>
              <Sub>6.4 Marketing Email Opt-Out</Sub><P>Opt out of non-essential marketing emails via your account settings or the unsubscribe link in any marketing email. Transactional emails cannot be opted out of while your account is active.</P>
              <Sub>6.5 California Residents (CCPA)</Sub><P>California residents have rights under the CCPA including the right to know what personal information we collect, the right to request deletion, and the right to opt out of the sale of personal information. We do not sell personal information. Contact hello@collectiveloft.com.</P>
              <Sub>6.6 European Users (GDPR)</Sub><P>Users in the EEA, UK, or Switzerland have rights under GDPR including access, rectification, erasure, portability, and objection. Our legal basis for processing is primarily contract performance and legitimate interests. Contact hello@collectiveloft.com.</P>
            </Sec>

            <Sec num="7" title="Data Security">
              <Ul items={['Encrypted data transmission (HTTPS/TLS)','Encrypted password storage (managed by Supabase Auth)','Row Level Security (RLS) enforced at the database level','Access controls limiting staff access to user data']}/>
              <P>No method of electronic storage is 100% secure. In the event of a data breach affecting your rights and freedoms, we will notify affected users as required by applicable law.</P>
            </Sec>

            <Sec num="8" title="Children's Privacy">
              <P>The Platform is exclusively for users 18 years of age or older. We do not knowingly collect personal information from anyone under 18. If we learn a user under 18 has created an account, we will delete that information and terminate the account immediately. Contact hello@collectiveloft.com if you believe a user under 18 has an account.</P>
            </Sec>

            <Sec num="9" title="Third-Party Links">
              <P>The Platform may contain links to third-party websites. This Privacy Policy applies only to Collective Loft. We are not responsible for the privacy practices of third-party sites.</P>
            </Sec>

            <Sec num="10" title="Changes to This Policy">
              <P>We will notify you by email at least 14 days before material changes take effect and update the "Last Updated" date. Continued use after changes take effect constitutes acceptance of the revised policy.</P>
            </Sec>

            <Sec num="11" title="Contact Us">
              <div style={{background:'rgba(245,242,237,0.03)',border:'0.5px solid rgba(245,242,237,0.08)',borderRadius:'3px',padding:'1rem',fontSize:'0.78rem',color:'rgba(245,242,237,0.5)',lineHeight:1.8}}>
                Collective Loft · Morgan Collective Group LLC<br/>
                Chicago, Illinois<br/>
                hello@collectiveloft.com · collectiveloft.com
              </div>
            </Sec>
          </div>
        )

        return (
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.92)',zIndex:10000,display:'flex',alignItems:'center',justifyContent:'center',padding:'1.5rem'}}>
            <div style={{background:'#1A1714',border:'0.5px solid rgba(201,168,76,0.3)',borderRadius:'6px',width:'100%',maxWidth:'760px',height:'88vh',display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:'0 40px 80px rgba(0,0,0,0.6)'}}>

              {/* Header */}
              <div style={{padding:'1.25rem 1.5rem',borderBottom:'0.5px solid rgba(245,242,237,0.08)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
                <div>
                  <div style={{fontSize:'0.55rem',letterSpacing:'0.18em',textTransform:'uppercase',color:'var(--gold)',opacity:0.8,marginBottom:'0.2rem'}}>Legal Document</div>
                  <div style={{fontFamily:'var(--serif)',fontSize:'1.3rem',fontWeight:700,color:'var(--cream)'}}>{title}</div>
                </div>
                <button onClick={onClose} style={{background:'transparent',border:'0.5px solid rgba(245,242,237,0.15)',color:'rgba(245,242,237,0.4)',width:'30px',height:'30px',borderRadius:'50%',cursor:'pointer',fontSize:'0.85rem',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
              </div>

              {/* Scroll hint */}
              {!scrolled && (
                <div style={{background:'rgba(201,168,76,0.08)',borderBottom:'0.5px solid rgba(201,168,76,0.2)',padding:'0.6rem 1.5rem',fontSize:'0.68rem',color:'rgba(201,168,76,0.8)',flexShrink:0}}>
                  ↓ Scroll to the bottom to read the full document and enable acceptance.
                </div>
              )}

              {/* Scrollable content */}
              <div
                style={{flex:1,overflowY:'auto',padding:'1.5rem'}}
                onScroll={e => {
                  const el = e.currentTarget
                  if (!scrolled && el.scrollTop + el.clientHeight >= el.scrollHeight - 60) {
                    setScrolled(true)
                  }
                }}
              >
                {isTc ? <TcContent /> : <PpContent />}
              </div>

              {/* Accept footer */}
              <div style={{padding:'1rem 1.5rem',borderTop:'0.5px solid rgba(245,242,237,0.08)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0,background:'#211E1A'}}>
                <div style={{fontSize:'0.68rem',color:'rgba(245,242,237,0.38)',fontWeight:300,maxWidth:'420px',lineHeight:1.5}}>{agreeLabel}</div>
                <button
                  onClick={onAgree}
                  disabled={!scrolled}
                  style={{background:scrolled?'var(--gold)':'rgba(201,168,76,0.25)',color:scrolled?'#0D0D0D':'rgba(245,242,237,0.3)',border:'none',borderRadius:'2px',padding:'0.6rem 1.5rem',fontFamily:'var(--sans)',fontSize:'0.72rem',fontWeight:500,letterSpacing:'0.08em',textTransform:'uppercase',cursor:scrolled?'pointer':'not-allowed',transition:'all 0.2s',whiteSpace:'nowrap',flexShrink:0,marginLeft:'1rem'}}
                >
                  {scrolled ? 'I Agree ✓' : 'Read to continue ↓'}
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </>
  )
}