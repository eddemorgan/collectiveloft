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

// Updated skills with all new additions
const SKILLS = [
  // Visual Art
  { d: 'visual',  label: 'Oil on canvas' },
  { d: 'visual',  label: 'Watercolour' },
  { d: 'visual',  label: 'Illustration' },
  { d: 'visual',  label: 'Large format' },
  { d: 'visual',  label: 'Art direction' },
  { d: 'visual',  label: 'Sculpture' },
  { d: 'visual',  label: 'Mixed media' },
  { d: 'visual',  label: 'Printmaking' },
  // Music
  { d: 'music',   label: 'Beat production' },
  { d: 'music',   label: 'Mixing & mastering' },
  { d: 'music',   label: 'Co-writing' },
  { d: 'music',   label: 'Film scoring' },
  { d: 'music',   label: 'Songwriting' },
  { d: 'music',   label: 'Vocals' },
  { d: 'music',   label: 'Sound design' },
  { d: 'music',   label: 'Session musician' },
  // Writing
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
  // Design & Web
  { d: 'design',  label: 'Web design' },
  { d: 'design',  label: 'Branding' },
  { d: 'design',  label: 'UX design' },
  { d: 'design',  label: 'Motion design' },
  { d: 'design',  label: 'Typography' },
  { d: 'design',  label: 'Print design' },
  // Film
  { d: 'film',    label: 'Cinematography' },
  { d: 'film',    label: 'Directing' },
  { d: 'film',    label: 'Film editing' },
  { d: 'film',    label: 'Documentary' },
  { d: 'film',    label: 'Short film' },
  // Photography
  { d: 'photo',   label: 'Portrait photography' },
  { d: 'photo',   label: 'Fine art photography' },
  { d: 'photo',   label: 'Documentary photography' },
  { d: 'photo',   label: 'Landscape photography' },
  // Performance
  { d: 'perf',    label: 'Choreography' },
  { d: 'perf',    label: 'Spoken word' },
  { d: 'perf',    label: 'Theatre' },
  { d: 'perf',    label: 'Dance' },
  { d: 'perf',    label: 'Singer' },
  { d: 'perf',    label: 'Acting' },
  // Creative Tech
  { d: 'tech',    label: 'Creative coding' },
  { d: 'tech',    label: 'Generative art' },
  { d: 'tech',    label: 'Interactive installation' },
  { d: 'tech',    label: 'Audio-visual' },
]

const DISC_GRID = [
  { icon: '🎨', name: 'Visual Art',       count: '2,840 creatives' },
  { icon: '🎵', name: 'Music',            count: '3,102 creatives' },
  { icon: '✍️', name: 'Writing & Poetry', count: '1,974 creatives' },
  { icon: '🖥',  name: 'Design & Web',    count: '1,688 creatives' },
  { icon: '🎬', name: 'Film',             count: '1,210 creatives' },
  { icon: '📷', name: 'Photography',      count: '980 creatives' },
  { icon: '🎭', name: 'Performance',      count: '642 creatives' },
  { icon: '💻', name: 'Creative Tech',    count: '418 creatives' },
]

const AV_CLASSES = ['avG', 'avT', 'avR']
const REQUIRED_FIELDS = ['firstname', 'lastname', 'email', 'bio', 'rightnow', 'seeking', 'headline']

export default function LandingPage() {
  const router = useRouter()
  const [members,   setMembers]   = useState([])
  const [authUser,  setAuthUser]  = useState(null)
  const [myProfile, setMyProfile] = useState(null)

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, firstname, lastname, headline, disciplines, rightnow, compensation, availability, city, state')
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data }) => setMembers(data || []))

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

  const [form, setForm] = useState({
    firstname: '', lastname: '', email: '', headline: '',
    bio: '', rightnow: '', seeking: '', password: '', confirmPassword: '',
  })
  const [country,        setCountry]        = useState('')
  const [stateVal,       setStateVal]       = useState('')
  const [city,           setCity]           = useState('')
  const [selectedDiscs,  setSelectedDiscs]  = useState([])
  const [selectedSkills, setSelectedSkills] = useState([])
  const [selectedComps,  setSelectedComps]  = useState(['Creative exchange'])

  const progress = Math.round(
    REQUIRED_FIELDS.filter(k => (form[k] || '').trim().length > 1).length /
    REQUIRED_FIELDS.length * 100
  )
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
      // Remove skills no longer belonging to selected disciplines
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
      // Sign up -- with email confirmation on, user.id is still returned
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { firstname: form.firstname, lastname: form.lastname } }
      })
      if (authError) throw authError

      // authData.user can be null if the email already exists and is confirmed
      if (!authData.user) {
        throw new Error('An account with this email already exists. Try signing in instead.')
      }

      // Store the profile -- works even before email is confirmed
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          firstname: form.firstname,
          lastname: form.lastname,
          email: form.email,
          headline: form.headline,
          bio: form.bio,
          rightnow: form.rightnow,
          seeking: form.seeking,
          country,
          state: stateVal,
          city,
          disciplines: selectedDiscs.map(id => {
            const found = DISCIPLINES.find(d => d.id === id)
            return found ? found.label : id
          }),
          skills: selectedSkills,
          compensation: selectedComps,
        })
      if (profileError) throw profileError

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
      {/* Nav */}
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

      {/* Hero */}
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

      {/* Discipline strip */}
      <div className={styles.discStrip}>
        <div className={styles.stripLbl}>Disciplines on the platform</div>
        <div className={styles.discGrid}>
          {DISC_GRID.map((d, i) => (
            <div className={styles.dc} key={i}>
              <div className={styles.dcIcon}>{d.icon}</div>
              <div className={styles.dcName}>{d.name}</div>
              <div className={styles.dcCount}>{d.count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Manifesto */}
      <div className={styles.manifesto}>
        <div className={styles.manifestoTxt}>
          Not a marketplace. Not a portfolio dump.{' '}
          A <strong>living network</strong> of people making real things together.
        </div>
      </div>

      {/* How it works */}
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

      {/* Modal */}
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
                <div className={styles.scT}>Check your <span>email.</span></div>
                <div className={styles.scS}>
                  We sent a confirmation link to <strong style={{ color: 'var(--cream)' }}>{form.email}</strong>. Click it to activate your account and sign in for the first time.
                </div>
                <div className={styles.scS} style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: 'rgba(240,236,227,0.35)' }}>
                  Check your spam folder if it doesn't arrive within a minute.
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

                  {/* Your identity */}
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

                  {/* Discipline & skills */}
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
                  </section>

                  {/* About you */}
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

                  {/* Work samples */}
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

                  {/* Collaboration */}
                  <section>
                    <div className={styles.msl}>Collaboration</div>
                    <div className={styles.mf} style={{ marginBottom: '0.85rem' }}>
                      <label>Who are you looking for right now?</label>
                      <input type="text" placeholder="e.g. Web designer, ambient composer, beat producer…" value={form.seeking} onChange={e => setForm(f => ({ ...f, seeking: e.target.value }))} />
                    </div>
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
                  </section>

                  {/* Find me elsewhere */}
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
                  <div className={styles.fnote}>You can edit everything from your profile at any time.</div>
                  <div className={styles.fbtns}>
                    <button className={styles.bcn} onClick={closeModal}>Cancel</button>
                    <button className={styles.bsp} onClick={handleSubmit} disabled={submitting}>
                      {submitting ? 'Creating profile…' : 'Create my profile ↗'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}