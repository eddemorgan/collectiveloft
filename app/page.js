'use client'

import { useState } from 'react'
import Link from 'next/link'
import styles from './landing.module.css'

// ── Data ─────────────────────────────────────────────────────────────────────

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
  { d: 'music',   label: 'Beat production' },
  { d: 'music',   label: 'Mixing & mastering' },
  { d: 'music',   label: 'Co-writing' },
  { d: 'music',   label: 'Film scoring' },
  { d: 'music',   label: 'Songwriting' },
  { d: 'writing', label: 'Poetry' },
  { d: 'writing', label: 'Copywriting' },
  { d: 'writing', label: 'Editing' },
  { d: 'design',  label: 'Web design' },
  { d: 'design',  label: 'Branding' },
  { d: 'design',  label: 'UX design' },
  { d: 'film',    label: 'Cinematography' },
  { d: 'film',    label: 'Directing' },
  { d: 'photo',   label: 'Fine art photography' },
  { d: 'photo',   label: 'Portrait photography' },
  { d: 'perf',    label: 'Choreography' },
  { d: 'perf',    label: 'Spoken word' },
  { d: 'tech',    label: 'Generative art' },
  { d: 'tech',    label: 'Creative coding' },
]

const DISC_GRID = [
  { icon: '🎨', name: 'Visual Art',      count: '2,840 creatives' },
  { icon: '🎵', name: 'Music',           count: '3,102 creatives' },
  { icon: '✍️', name: 'Writing & Poetry', count: '1,974 creatives' },
  { icon: '🖥',  name: 'Design & Web',   count: '1,688 creatives' },
  { icon: '🎬', name: 'Film',            count: '1,210 creatives' },
  { icon: '📷', name: 'Photography',     count: '980 creatives' },
  { icon: '🎭', name: 'Performance',     count: '642 creatives' },
  { icon: '💻', name: 'Creative Tech',   count: '418 creatives' },
]

const MEMBERS = [
  { initials: 'MV', avClass: 'avG', dotColor: 'var(--teal)', name: 'Marisol Vega', role: 'Visual Artist · Canvas & Oil', text: 'Looking for a web designer and composer to build a portfolio site for gallery submissions.', tags: [{ label: 'Open to Collab', cls: 'tagG' }, { label: 'Chicago', cls: '' }] },
  { initials: 'JD', avClass: 'avT', dotColor: 'rgba(240,236,227,0.15)', name: 'James Delacroix', role: 'Poet · Spoken Word', text: 'Finishing a debut collection. Need a developmental editor and a visual artist for the cover.', tags: [{ label: 'Open to Collab', cls: 'tagG' }, { label: 'Remote', cls: '' }] },
  { initials: 'SA', avClass: 'avR', dotColor: 'var(--gold)', name: 'Simone Adeyemi', role: 'Singer-Songwriter · R&B / Soul', text: 'Searching for a beat producer for a neo-soul and pop hybrid EP.', tags: [{ label: 'Paid Collab', cls: 'tagG' }, { label: 'NYC', cls: '' }] },
]

// ── Required fields for progress bar ────────────────────────────────────────
const REQUIRED_FIELDS = ['firstname', 'lastname', 'email', 'bio', 'rightnow', 'seeking', 'headline']

// ── Component ────────────────────────────────────────────────────────────────

export default function LandingPage() {
  // Modal open/closed
  const [modalOpen, setModalOpen]   = useState(false)
  const [submitted, setSubmitted]   = useState(false)

  // Form fields
  const [form, setForm] = useState({
    firstname: '', lastname: '', email: '', headline: '',
    bio: '', rightnow: '', seeking: '',
  })

  // Location
  const [country, setCountry]   = useState('')
  const [stateVal, setStateVal] = useState('')
  const [city, setCity]         = useState('')

  // Discipline & skill toggles
  const [selectedDiscs,   setSelectedDiscs]   = useState([])
  const [selectedSkills,  setSelectedSkills]  = useState([])
  const [selectedComps,   setSelectedComps]   = useState(['Creative exchange'])

  // ── Derived state ──────────────────────────────────────────────────────────
  const progress = Math.round(
    REQUIRED_FIELDS.filter(k => (form[k] || '').trim().length > 1).length /
    REQUIRED_FIELDS.length * 100
  )

  // Visible skills depend on selected disciplines
  const visibleSkills = selectedDiscs.length === 0
    ? SKILLS
    : SKILLS.filter(s => selectedDiscs.includes(s.d))

  // Location derived options
  const countryData  = LOCATION_DATA[country]
  const stateOptions = countryData?.states
    ? Object.entries(countryData.states).map(([k, v]) => ({ value: k, label: v.l }))
    : countryData?.r?.map(r => ({ value: r, label: r })) ?? []
  const cityOptions  = (country && LOCATION_DATA[country]?.states?.[stateVal]?.c) ?? []

  // ── Handlers ───────────────────────────────────────────────────────────────
  function toggleDisc(id) {
    setSelectedDiscs(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    )
  }

  function toggleSkill(label) {
    setSelectedSkills(prev =>
      prev.includes(label) ? prev.filter(s => s !== label) : [...prev, label]
    )
  }

  function toggleComp(label) {
    setSelectedComps(prev =>
      prev.includes(label) ? prev.filter(c => c !== label) : [...prev, label]
    )
  }

  function handleCountryChange(val) {
    setCountry(val)
    setStateVal('')
    setCity('')
  }

  async function handleSubmit() {
  setSubmitting(true)
  try {
    // 1. Sign up the user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: Math.random().toString(36).slice(-10) + 'Aa1!',
      options: {
        data: {
          firstname: form.firstname,
          lastname: form.lastname,
        }
      }
    })

    if (authError) throw authError

    // 2. Save their profile to the profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
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
        disciplines: selectedDiscs,
        skills: selectedSkills,
        compensation: selectedComps,
      })

    if (profileError) throw profileError

    setSubmitted(true)
  } catch (err) {
    console.error('Signup error:', err)
    alert('Something went wrong. Please try again.')
  } finally {
    setSubmitting(false)
  }
}

  function closeModal() {
    setModalOpen(false)
    setSubmitted(false)
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>
          Collective <span>Loft</span>
        </Link>
        <div className={styles.navLinks}>
          <Link href="/discover">Discover</Link>
          <Link href="/briefs">Collabs</Link>
          <Link href="/studio">Loft Studio</Link>
          <button className={styles.btnJoin} onClick={() => setModalOpen(true)}>
            Join
          </button>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className={styles.hero}>
        <div className={styles.heroLeft}>
          <div className={styles.eyebrow}>Where Creatives Find Each Other</div>
          <div className={styles.headline}>
            Make<br /><em>something</em><br />together.
          </div>
          <div className={styles.sub}>
            Collective Loft is a professional network built for artists, musicians,
            writers, poets, designers, and makers. Find collaborators who match your vision.
          </div>
          <div className={styles.heroBtns}>
            <button className={styles.btnP} onClick={() => setModalOpen(true)}>
              Build Your Profile
            </button>
            <Link href="/discover" className={styles.btnS}>
              Browse Creatives
            </Link>
          </div>
        </div>

        <div className={styles.heroRight}>
          {MEMBERS.map((m, i) => (
            <div className={styles.mc} key={i}>
              <div className={`${styles.mcAv} ${styles[m.avClass]}`}>
                {m.initials}
                <div className={styles.dot} style={{ background: m.dotColor }} />
              </div>
              <div>
                <div className={styles.mcName}>{m.name}</div>
                <div className={styles.mcRole}>{m.role}</div>
                <div className={styles.mcText}>{m.text}</div>
                <div className={styles.mcTags}>
                  {m.tags.map((t, j) => (
                    <span key={j} className={`${styles.tag} ${t.cls ? styles[t.cls] : ''}`}>
                      {t.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Discipline strip ─────────────────────────────────────────────── */}
      <div className={styles.discStrip}>
        <div className={styles.stripLbl}>Disciplines on the platform</div>
        <div className={styles.discGrid}>
          {DISC_GRID.map((d, i) => (
            <Link href="/discover" className={styles.dc} key={i}>
              <div className={styles.dcIcon}>{d.icon}</div>
              <div className={styles.dcName}>{d.name}</div>
              <div className={styles.dcCount}>{d.count}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Manifesto ────────────────────────────────────────────────────── */}
      <div className={styles.manifesto}>
        <div className={styles.manifestoTxt}>
          Not a marketplace. Not a portfolio dump.{' '}
          A <strong>living network</strong> of people making real things together.
        </div>
      </div>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <div className={styles.how}>
        {[
          { num: '01', title: 'Build your creative identity', desc: 'Show your work, your influences, what you\'re making right now, and what kind of collaborators you\'re looking for.' },
          { num: '02', title: 'Post a Collab Brief',         desc: 'Describe your project and who you need. Creatives apply or reach out directly. The brief lives on your profile and in the public feed.' },
          { num: '03', title: 'Create in the Loft Studio',   desc: 'Your shared Studio holds your brief, files, messages, and milestones — a home for the work as it comes to life.' },
        ].map((h, i) => (
          <div className={styles.hi} key={i}>
            <div className={styles.hiNum}>{h.num}</div>
            <div className={styles.hiTitle}>{h.title}</div>
            <div className={styles.hiDesc}>{h.desc}</div>
          </div>
        ))}
      </div>

      {/* ── Modal overlay ────────────────────────────────────────────────── */}
      {modalOpen && (
        <div className={styles.mo} onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}>
          <div className={styles.modal}>

            {/* Header */}
            <div className={styles.mhdr}>
              <div>
                <div className={styles.mey}>Join Collective Loft</div>
                <div className={styles.mt}>Build your creative profile.</div>
                <div className={styles.ms}>One form. Everything a collaborator needs to know about you.</div>
              </div>
              <button className={styles.mcl} onClick={closeModal}>✕</button>
            </div>

            {/* Progress bar */}
            <div className={styles.pbWrap}>
              <div className={styles.pb} style={{ width: `${progress}%` }} />
            </div>

            {submitted ? (
              /* Success screen */
              <div className={styles.scs}>
                <div className={styles.scM}>✦</div>
                <div className={styles.scT}>Welcome to <span>Collective Loft</span>.</div>
                <div className={styles.scS}>
                  Your profile is live. Keep your "Right Now" field current — that's what makes people reach out.
                </div>
                <div className={styles.scA}>
                  <Link href="/profile" className={styles.bvp}>View my profile</Link>
                  <button className={styles.bbh} onClick={closeModal}>Done</button>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.mbody}>

                  {/* ── Your identity ─────────────────────────────────── */}
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

                  {/* ── Discipline & skills ───────────────────────────── */}
                  <section>
                    <div className={styles.msl}>Discipline &amp; skills</div>
                    <div className={styles.mf} style={{ marginBottom: '0.85rem' }}>
                      <label>Primary discipline(s)</label>
                      <div className={styles.mdg}>
                        {DISCIPLINES.map(d => (
                          <div
                            key={d.id}
                            className={`${styles.mdo} ${selectedDiscs.includes(d.id) ? styles.on : ''}`}
                            onClick={() => toggleDisc(d.id)}
                          >
                            <span className={styles.mdoI}>{d.icon}</span>
                            <div className={styles.mdoN}>{d.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className={styles.mf} style={{ marginBottom: '0.85rem' }}>
                      <label>Your headline</label>
                      <input
                        type="text"
                        placeholder="e.g. Oil painter · Large format canvas · Abstract realism"
                        maxLength={100}
                        value={form.headline}
                        onChange={e => setForm(f => ({ ...f, headline: e.target.value }))}
                      />
                    </div>
                    <div className={styles.mf}>
                      <label>Specific skills</label>
                      <div className={styles.stags}>
                        {visibleSkills.map(s => (
                          <button
                            key={s.label}
                            className={`${styles.stag} ${selectedSkills.includes(s.label) ? styles.on : ''}`}
                            onClick={() => toggleSkill(s.label)}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </section>

                  {/* ── About you ─────────────────────────────────────── */}
                  <section>
                    <div className={styles.msl}>About you</div>
                    <div className={styles.mf} style={{ marginBottom: '0.85rem' }}>
                      <label>Your bio</label>
                      <textarea
                        placeholder="Tell other creatives who you are, what drives your practice…"
                        rows={3}
                        value={form.bio}
                        onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                      />
                    </div>
                    <div className={styles.mf}>
                      <label>Right now — what are you actively making?</label>
                      <textarea
                        placeholder="e.g. Completing a 12-piece oil series. Looking for a web designer for gallery submissions — deadline Sept 2025."
                        rows={3}
                        value={form.rightnow}
                        onChange={e => setForm(f => ({ ...f, rightnow: e.target.value }))}
                      />
                      <div className={styles.hint}>The most important field on your profile.</div>
                    </div>
                  </section>

                  {/* ── Work samples ──────────────────────────────────── */}
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

                  {/* ── Collaboration ─────────────────────────────────── */}
                  <section>
                    <div className={styles.msl}>Collaboration</div>
                    <div className={styles.mf} style={{ marginBottom: '0.85rem' }}>
                      <label>Who are you looking for right now?</label>
                      <input
                        type="text"
                        placeholder="e.g. Web designer, ambient composer, beat producer…"
                        value={form.seeking}
                        onChange={e => setForm(f => ({ ...f, seeking: e.target.value }))}
                      />
                    </div>
                    <div className={styles.mf} style={{ marginBottom: '0.85rem' }}>
                      <label>Compensation type</label>
                      <div className={styles.co}>
                        {['Creative exchange', 'Paid', 'Revenue share'].map(c => (
                          <div
                            key={c}
                            className={`${styles.coo} ${selectedComps.includes(c) ? styles.on : ''}`}
                            onClick={() => toggleComp(c)}
                          >
                            <div className={styles.cooT}>{c}</div>
                            <div className={styles.cooD}>
                              {c === 'Creative exchange' ? 'Trade skills. No money moves.' : c === 'Paid' ? 'Fee agreed upfront.' : 'Split the outcome.'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className={styles.mfRow}>
                      <div className={styles.mf}>
                        <label>Location preference</label>
                        <select>
                          <option value="">Select…</option>
                          <option>Local only</option>
                          <option>Remote OK</option>
                          <option>Remote preferred</option>
                          <option>No preference</option>
                        </select>
                      </div>
                      <div className={styles.mf}>
                        <label>Availability</label>
                        <select>
                          <option value="">Select…</option>
                          <option>Open to collabs now</option>
                          <option>Available in 1–2 months</option>
                          <option>Not available right now</option>
                        </select>
                      </div>
                    </div>
                  </section>

                  {/* ── Find me elsewhere ─────────────────────────────── */}
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

                {/* Footer */}
                <div className={styles.mftr}>
                  <div className={styles.fnote}>You can edit everything from your profile at any time.</div>
                  <div className={styles.fbtns}>
                    <button className={styles.bcn} onClick={closeModal}>Cancel</button>
                    <button className={styles.bsp} onClick={handleSubmit}>Create my profile ↗</button>
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