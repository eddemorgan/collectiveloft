'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import styles from './profile.module.css'

const SKILL_WIDTHS = [95, 88, 78, 65, 55, 48, 42, 38]
const GALLERY_BG   = ['#1c1228','#0f1e1b','#1e1510','#0e1520','#1a0f15','#141a0e']

const DISC_OPTS = [
  { id:'visual',  icon:'🎨', label:'Visual Art' },
  { id:'music',   icon:'🎵', label:'Music' },
  { id:'writing', icon:'✍️', label:'Writing' },
  { id:'design',  icon:'🖥',  label:'Design & Web' },
  { id:'film',    icon:'🎬', label:'Film' },
  { id:'photo',   icon:'📷', label:'Photography' },
  { id:'perf',    icon:'🎭', label:'Performance' },
  { id:'tech',    icon:'💻', label:'Creative Tech' },
]

const SKILL_OPTS = [
  'Oil on canvas','Watercolour','Illustration','Large format','Art direction','Sculpture','Mixed media','Printmaking',
  'Beat production','Mixing & mastering','Co-writing','Film scoring','Songwriting','Vocals','Sound design','Session musician',
  'Poetry','Copywriting','Editing','Screenwriting','Fiction','Arts writing','Grant writing',
  'Web design','Branding','UX design','Motion design','Typography','Print design',
  'Cinematography','Directing','Film editing','Documentary','Short film',
  'Portrait photography','Fine art photography','Documentary photography',
  'Choreography','Spoken word','Theatre','Dance',
  'Creative coding','Generative art','Interactive installation','Audio-visual',
]

function profileSlug(p) {
  return `${(p.firstname||'').toLowerCase()}-${(p.lastname||'').toLowerCase()}`
}
function initials(p) {
  return [(p.firstname||'?')[0],(p.lastname||'?')[0]].join('').toUpperCase()
}
function locationStr(p) {
  return [p.city,p.state,p.country].filter(Boolean).join(', ')
}

// ── Inline editable field ─────────────────────────────────────────────────────
function Editable({ value, onSave, placeholder, multiline, isOwner, className }) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(value || '')
  const ref = useRef()

  useEffect(() => { if (editing && ref.current) ref.current.focus() }, [editing])
  useEffect(() => { setDraft(value || '') }, [value])

  if (!isOwner) return <span className={className}>{value || placeholder}</span>

  if (editing) {
    const props = {
      ref,
      value: draft,
      onChange: e => setDraft(e.target.value),
      onBlur: () => { setEditing(false); if (draft !== value) onSave(draft) },
      onKeyDown: e => {
        if (e.key === 'Enter' && !multiline) { setEditing(false); onSave(draft) }
        if (e.key === 'Escape') { setEditing(false); setDraft(value || '') }
      },
      className: `${styles.editInput} ${multiline ? styles.editTextarea : ''}`,
      placeholder,
    }
    return multiline ? <textarea {...props} rows={4} /> : <input type="text" {...props} />
  }

  return (
    <span
      className={`${className} ${styles.editableField}`}
      onClick={() => setEditing(true)}
      title="Click to edit"
    >
      {value || <span className={styles.editPlaceholder}>{placeholder}</span>}
      <span className={styles.editPencil}>✎</span>
    </span>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const params   = useParams()
  const username = params?.username

  const [profile,   setProfile]   = useState(null)
  const [studios,   setStudios]   = useState([])
  const [ratings,   setRatings]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [notFound,  setNotFound]  = useState(false)
  const [activeTab, setActiveTab] = useState('work')
  const [connected, setConnected] = useState(false)
  const [isOwner,   setIsOwner]   = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [saveMsg,   setSaveMsg]   = useState('')

  // Edit state for disciplines and skills
  const [editingDiscs,  setEditingDiscs]  = useState(false)
  const [editingSkills, setEditingSkills] = useState(false)
  const [draftDiscs,    setDraftDiscs]    = useState([])
  const [draftSkills,   setDraftSkills]   = useState([])

  const avatarInputRef = useRef()
  const coverInputRef  = useRef()

  useEffect(() => { if (username) loadProfile() }, [username])

  async function loadProfile() {
    setLoading(true)
    const isUuid = /^[0-9a-f-]{36}$/.test(username)
    let query = supabase.from('profiles').select('*')
    if (isUuid) {
      query = query.eq('id', username)
    } else {
      const parts = username.split('-')
      if (parts.length >= 2) {
        query = query.ilike('firstname', parts[0]).ilike('lastname', parts.slice(1).join(' '))
      } else {
        query = query.ilike('firstname', username)
      }
    }
    const { data, error } = await query.single()
    if (error || !data) { setNotFound(true); setLoading(false); return }

    setProfile(data)
    setDraftDiscs(data.disciplines || [])
    setDraftSkills(data.skills || [])

    // Check if current user owns this profile
    const { data: { user } } = await supabase.auth.getUser()
    if (user && user.id === data.id) setIsOwner(true)

    // Load studios
    const { data: studioData } = await supabase
      .from('studios')
      .select('*, profiles!studios_collaborator_id_fkey(firstname,lastname,headline)')
      .or(`poster_id.eq.${data.id},collaborator_id.eq.${data.id}`)
      .eq('status', 'complete')
      .order('created_at', { ascending: false })
    setStudios(studioData || [])

    // Load ratings
    const { data: ratingData } = await supabase
      .from('ratings')
      .select('*, profiles!ratings_rater_id_fkey(firstname,lastname,headline)')
      .eq('ratee_id', data.id)
      .eq('submitted', true)
    setRatings(ratingData || [])
    setLoading(false)
  }

  // ── Save a single field ───────────────────────────────────────────────────
  async function saveField(field, value) {
    if (!profile) return
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq('id', profile.id)
    if (!error) {
      setProfile(p => ({ ...p, [field]: value }))
      flashSave()
    }
    setSaving(false)
  }

  async function saveDiscs() {
    await saveField('disciplines', draftDiscs)
    setEditingDiscs(false)
  }

  async function saveSkills() {
    await saveField('skills', draftSkills)
    setEditingSkills(false)
  }

  function flashSave() {
    setSaveMsg('Saved ✦')
    setTimeout(() => setSaveMsg(''), 2000)
  }

  // ── Image upload ──────────────────────────────────────────────────────────
  async function uploadImage(file, bucket, field) {
    if (!file || !profile) return
    setSaving(true)
    const ext  = file.name.split('.').pop()
    const path = `${profile.id}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true })

    if (uploadError) { console.error(uploadError); setSaving(false); return }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)

    await saveField(field, publicUrl)
    setSaving(false)
  }

  // ── Loading / not found ───────────────────────────────────────────────────
  if (loading) return (
    <div className={styles.loading}><div className={styles.loadingDot}>✦</div></div>
  )
  if (notFound) return (
    <div className={styles.notFound}>
      <div className={styles.nfIcon}>✦</div>
      <div className={styles.nfTitle}>Profile not found</div>
      <div className={styles.nfSub}>This creative may have moved or doesn't exist yet.</div>
      <Link href="/discover" className={styles.nfBtn}>Browse Creatives</Link>
    </div>
  )

  const fullName   = `${profile.firstname||''} ${profile.lastname||''}`.trim()
  const ini        = initials(profile)
  const location   = locationStr(profile)
  const disciplines = profile.disciplines || []
  const skills      = profile.skills || []
  const avgRating   = ratings.length
    ? (ratings.reduce((s,r) => s + r.stars, 0) / ratings.length).toFixed(1) : null
  const availText = [
    profile.seeking          && `Seeking ${profile.seeking}.`,
    profile.location_preference && `${profile.location_preference}.`,
    profile.compensation?.length && `${profile.compensation.join(' or ')}.`,
  ].filter(Boolean).join(' ')
  const links = [
    profile.website      && { icon:'🔗', label: profile.website.replace(/^https?:\/\//,''),      href: profile.website },
    profile.instagram    && { icon:'📷', label:`@${profile.instagram.replace('@','')}`,           href:`https://instagram.com/${profile.instagram.replace('@','')}` },
    profile.soundcloud   && { icon:'🎵', label: profile.soundcloud.replace(/^https?:\/\//,''),    href: profile.soundcloud },
    profile.other_link   && { icon:'🔗', label: profile.other_link.replace(/^https?:\/\//,''),    href: profile.other_link },
    profile.portfolio_link && { icon:'💼', label: profile.portfolio_link.replace(/^https?:\/\//,''), href: profile.portfolio_link },
  ].filter(Boolean)

  return (
    <>
      {/* Nav */}
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>Collective <span>Loft</span></Link>
        <div className={styles.navLinks}>
          <Link href="/discover">Discover</Link>
          <Link href="/briefs">Collabs</Link>
          <Link href="/studio">Studio</Link>
          {isOwner && (
            <span className={styles.saveIndicator}>{saving ? 'Saving…' : saveMsg}</span>
          )}
          {isOwner
            ? <span className={styles.btnEdit}>Editing profile</span>
            : <Link href="/join" className={styles.btnEdit}>Edit profile</Link>
          }
        </div>
      </nav>

      {/* Cover banner */}
      <div className={styles.coverBanner}>
        {profile.cover_url
          ? <img src={profile.cover_url} alt="Cover" className={styles.coverImg} />
          : <div className={styles.coverPattern} />
        }
        {isOwner && (
          <>
            <button className={styles.coverUploadBtn} onClick={() => coverInputRef.current?.click()}>
              {profile.cover_url ? '↑ Change cover' : '+ Add cover image'}
            </button>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              style={{ display:'none' }}
              onChange={e => uploadImage(e.target.files[0], 'covers', 'cover_url')}
            />
          </>
        )}
      </div>

      {/* Identity strip */}
      <div className={styles.identityStrip}>
        <div className={styles.avWrap}>
          <div className={styles.avCircle} onClick={() => isOwner && avatarInputRef.current?.click()} style={isOwner ? { cursor:'pointer' } : {}}>
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt={fullName} />
              : <span>{ini}</span>
            }
            {isOwner && <div className={styles.avOverlay}>↑</div>}
            <div className={styles.onlineDot} />
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            style={{ display:'none' }}
            onChange={e => uploadImage(e.target.files[0], 'avatars', 'avatar_url')}
          />
        </div>

        <div className={styles.identityContent}>
          <div className={styles.identityTop}>
            <div>
              {/* Editable name */}
              <div className={styles.profileName}>
                <Editable
                  value={profile.firstname}
                  onSave={v => saveField('firstname', v)}
                  placeholder="First name"
                  isOwner={isOwner}
                  className={styles.nameFirst}
                />
                {' '}
                <Editable
                  value={profile.lastname}
                  onSave={v => saveField('lastname', v)}
                  placeholder="Last name"
                  isOwner={isOwner}
                  className={styles.nameLast}
                />
              </div>
              {/* Editable headline */}
              <div className={styles.profileHeadline}>
                <Editable
                  value={profile.headline}
                  onSave={v => saveField('headline', v)}
                  placeholder="Your discipline · Your style · Your medium"
                  isOwner={isOwner}
                  className={styles.headlineText}
                />
              </div>
            </div>
            {!isOwner && (
              <div className={styles.actionBtns}>
                <button className={styles.btnMessage}>Message</button>
                <button className={styles.btnConnect} onClick={() => setConnected(true)} style={connected ? { background:'var(--teal)' } : {}}>
                  {connected ? '✦ Sent' : '+ Connect'}
                </button>
              </div>
            )}
          </div>

          <div className={styles.metaRow}>
            {location && <div className={styles.metaItem}><span>📍</span><span>{location}</span></div>}
            <div className={styles.metaItem}><span>⊞</span><span>{profile.connections_count||0} connections</span></div>
            <div className={styles.metaItem}><span>◎</span><span>{profile.collabs_count||0} collabs completed</span></div>
          </div>

          <div className={styles.profileTags}>
            {profile.availability === 'open' && <span className={`${styles.ptag} ${styles.ptagOpen}`}>Open to collabs</span>}
            {disciplines.slice(0,2).map(d => <span key={d} className={`${styles.ptag} ${styles.ptagDisc}`}>{d}</span>)}
            {skills.slice(0,2).map(s => <span key={s} className={styles.ptag}>{s}</span>)}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabsBar}>
        {['work','about','collabs','briefs'].map(tab => (
          <div key={tab} className={`${styles.tab} ${activeTab===tab ? styles.active : ''}`} onClick={() => setActiveTab(tab)}>
            {tab.charAt(0).toUpperCase()+tab.slice(1)}
          </div>
        ))}
      </div>

      {/* Profile body */}
      <div className={styles.profileBody}>
        <div className={styles.profileMain}>

          {/* WORK */}
          {activeTab === 'work' && (
            <>
              <div className={styles.contentSection}>
                <div className={styles.secLabel}>About</div>
                <div className={styles.bioText}>
                  <Editable
                    value={profile.bio}
                    onSave={v => saveField('bio', v)}
                    placeholder={isOwner ? 'Click to add your bio…' : 'No bio added yet.'}
                    multiline
                    isOwner={isOwner}
                    className={styles.bioInner}
                  />
                </div>
                <div className={styles.rightnowCard}>
                  <div className={styles.rnLabel}>Right now</div>
                  <div className={styles.rnText}>
                    <Editable
                      value={profile.rightnow}
                      onSave={v => saveField('rightnow', v)}
                      placeholder={isOwner ? 'Click to describe what you\'re actively making…' : 'Nothing listed right now.'}
                      multiline
                      isOwner={isOwner}
                      className={styles.rnInner}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.contentSection}>
                <div className={styles.secLabel}>Portfolio · selected works</div>
                <div className={styles.galleryGrid}>
                  {GALLERY_BG.map((bg,i) => (
                    <div key={i} className={styles.galleryItem} style={{ background:bg }}>
                      <div className={styles.giPlaceholder}>✦</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.contentSection}>
                <div className={styles.secLabel}>Past collaborations</div>
                {studios.length === 0 ? (
                  <div className={styles.emptyState}>No completed collaborations yet. Post a brief or apply to one to start building your track record.</div>
                ) : studios.map(s => {
                  const collab = s.profiles
                  const collabName = collab ? `${collab.firstname} ${collab.lastname}` : 'Collaborator'
                  const collabInitials = collab ? `${collab.firstname[0]}${collab.lastname[0]}` : '??'
                  return (
                    <div key={s.id} className={styles.collabItem}>
                      <div className={`${styles.collabAv} ${styles.avTeal}`}>{collabInitials}</div>
                      <div className={styles.collabInfo}>
                        <div className={styles.collabName}>{collabName} · {collab?.headline}</div>
                        <div className={styles.collabRole}>{s.title}</div>
                      </div>
                      <span className={styles.collabStatus}>Completed</span>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* ABOUT */}
          {activeTab === 'about' && (
            <>
              <div className={styles.contentSection}>
                <div className={styles.secLabel}>Bio</div>
                <div className={styles.bioText}>
                  <Editable value={profile.bio} onSave={v => saveField('bio',v)} placeholder={isOwner ? 'Click to add your bio…' : 'No bio.'} multiline isOwner={isOwner} className={styles.bioInner} />
                </div>
              </div>

              <div className={styles.contentSection}>
                <div className={styles.secLabel}>Disciplines &amp; skills</div>

                {/* Editable disciplines */}
                {editingDiscs ? (
                  <div>
                    <div className={styles.discEditGrid}>
                      {DISC_OPTS.map(d => (
                        <div key={d.id} className={`${styles.discEditOpt} ${draftDiscs.includes(d.label) ? styles.on : ''}`}
                          onClick={() => setDraftDiscs(prev => prev.includes(d.label) ? prev.filter(x => x!==d.label) : [...prev, d.label])}>
                          <span>{d.icon}</span> {d.label}
                        </div>
                      ))}
                    </div>
                    <div className={styles.editActions}>
                      <button className={styles.saveBtn} onClick={saveDiscs}>Save</button>
                      <button className={styles.cancelBtn} onClick={() => { setEditingDiscs(false); setDraftDiscs(disciplines) }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.discTags} style={{ marginBottom:'1rem' }}>
                    {disciplines.map(d => <span key={d} className={styles.discTag}>{d}</span>)}
                    {isOwner && <button className={styles.editTagsBtn} onClick={() => setEditingDiscs(true)}>✎ Edit</button>}
                  </div>
                )}

                {/* Editable skills */}
                {editingSkills ? (
                  <div>
                    <div className={styles.skillEditGrid}>
                      {SKILL_OPTS.map(s => (
                        <div key={s} className={`${styles.skillEditOpt} ${draftSkills.includes(s) ? styles.on : ''}`}
                          onClick={() => setDraftSkills(prev => prev.includes(s) ? prev.filter(x => x!==s) : [...prev,s])}>
                          {s}
                        </div>
                      ))}
                    </div>
                    <div className={styles.editActions}>
                      <button className={styles.saveBtn} onClick={saveSkills}>Save</button>
                      <button className={styles.cancelBtn} onClick={() => { setEditingSkills(false); setDraftSkills(skills) }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.skillList}>
                    {skills.slice(0,8).map((s,i) => (
                      <div key={s} className={styles.skillRow}>
                        <span className={styles.skillName}>{s}</span>
                        <div className={styles.skillBarBg}><div className={styles.skillBarFill} style={{ width:`${SKILL_WIDTHS[i]||40}%` }} /></div>
                      </div>
                    ))}
                    {isOwner && <button className={styles.editTagsBtn} onClick={() => setEditingSkills(true)}>✎ Edit skills</button>}
                  </div>
                )}
              </div>

              <div className={styles.contentSection}>
                <div className={styles.secLabel}>Collaboration preferences</div>
                <div className={styles.prefText}>
                  <Editable value={profile.seeking} onSave={v => saveField('seeking',v)} placeholder={isOwner ? 'Click to describe who you\'re looking for…' : 'Not specified.'} multiline isOwner={isOwner} className={styles.prefInner} />
                </div>
              </div>

              {isOwner && (
                <div className={styles.contentSection}>
                  <div className={styles.secLabel}>Links &amp; social</div>
                  <div className={styles.linksEditGrid}>
                    {[
                      ['website',       'Personal website', 'https://yoursite.com'],
                      ['instagram',     'Instagram',        '@yourhandle'],
                      ['soundcloud',    'SoundCloud / Spotify', 'https://soundcloud.com/…'],
                      ['portfolio_link','Portfolio link',   'https://behance.net/…'],
                      ['other_link',    'Other link',       'https://…'],
                    ].map(([field, label, ph]) => (
                      <div key={field} className={styles.linkEditRow}>
                        <span className={styles.linkLabel}>{label}</span>
                        <Editable value={profile[field]} onSave={v => saveField(field,v)} placeholder={ph} isOwner={isOwner} className={styles.linkValue} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* COLLABS */}
          {activeTab === 'collabs' && (
            <div className={styles.contentSection}>
              <div className={styles.secLabel}>Collaboration history</div>
              {studios.length === 0 ? (
                <div className={styles.emptyState}>Once you complete a collab through Collective Loft, it will appear here as part of your track record.</div>
              ) : studios.map(s => {
                const collab = s.profiles
                const collabName = collab ? `${collab.firstname} ${collab.lastname}` : 'Collaborator'
                const collabInitials = collab ? `${collab.firstname[0]}${collab.lastname[0]}` : '??'
                return (
                  <div key={s.id} className={styles.collabItem}>
                    <div className={`${styles.collabAv} ${styles.avTeal}`}>{collabInitials}</div>
                    <div className={styles.collabInfo}>
                      <div className={styles.collabName}>{collabName} · {collab?.headline}</div>
                      <div className={styles.collabRole}>{s.title}</div>
                    </div>
                    <span className={styles.collabStatus}>Completed</span>
                  </div>
                )
              })}
            </div>
          )}

          {/* BRIEFS */}
          {activeTab === 'briefs' && (
            <div className={styles.contentSection}>
              <div className={styles.secLabel}>Active briefs</div>
              {profile.rightnow ? (
                <div className={styles.briefCard}>
                  <div className={styles.briefTitle}>{fullName} — {profile.headline}</div>
                  <div className={styles.briefTags}>
                    {disciplines.slice(0,3).map(d => <span key={d} className={`${styles.ptag} ${styles.ptagDisc}`}>{d}</span>)}
                    {profile.compensation?.map(c => <span key={c} className={`${styles.ptag} ${styles.ptagOpen}`}>{c}</span>)}
                  </div>
                  <div className={styles.briefDesc}>{profile.rightnow}</div>
                </div>
              ) : (
                <div className={styles.emptyState}>No active briefs posted yet.</div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className={styles.profileSidebar}>
          <div>
            <div className={styles.sbLabel}>Activity</div>
            <div className={styles.statGrid}>
              <div className={styles.statCard}><div className={styles.statNum}>{studios.length}</div><div className={styles.statLbl}>Collabs</div></div>
              <div className={styles.statCard}><div className={styles.statNum}>{profile.connections_count||0}</div><div className={styles.statLbl}>Connections</div></div>
              <div className={styles.statCard}><div className={styles.statNum}>{avgRating||'—'}</div><div className={styles.statLbl}>Rating</div></div>
              <div className={styles.statCard}><div className={styles.statNum}>{ratings.length}</div><div className={styles.statLbl}>Reviews</div></div>
            </div>
          </div>

          {(profile.seeking || profile.compensation?.length) && (
            <div className={styles.availCard}>
              <div className={styles.availTitle}>Open to collaborate</div>
              <div className={styles.availText}>{availText}</div>
            </div>
          )}

          {disciplines.length > 0 && (
            <div>
              <div className={styles.sbLabel}>Disciplines</div>
              <div className={styles.discTags}>
                {disciplines.map(d => <span key={d} className={styles.discTag}>{d}</span>)}
              </div>
            </div>
          )}

          {skills.length > 0 && (
            <div>
              <div className={styles.sbLabel}>Skills</div>
              <div className={styles.skillList}>
                {skills.slice(0,6).map((s,i) => (
                  <div key={s} className={styles.skillRow}>
                    <span className={styles.skillName}>{s}</span>
                    <div className={styles.skillBarBg}><div className={styles.skillBarFill} style={{ width:`${SKILL_WIDTHS[i]||40}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {ratings.length > 0 && (
            <div>
              <div className={styles.sbLabel}>Community voice</div>
              <div className={styles.endorsements}>
                {ratings.slice(0,3).map(r => {
                  const rater = r.profiles
                  const raterName = rater ? `${rater.firstname} ${rater.lastname}` : 'Collaborator'
                  return r.review ? (
                    <div key={r.id} className={styles.endorse}>
                      <div className={styles.endorseText}>"{r.review}"</div>
                      <div className={styles.endorseBy}>— {raterName}{rater?.headline ? `, ${rater.headline}` : ''}</div>
                    </div>
                  ) : null
                }).filter(Boolean)}
              </div>
            </div>
          )}

          {links.length > 0 && (
            <div>
              <div className={styles.sbLabel}>Links</div>
              <div className={styles.profileLinks}>
                {links.map((l,i) => (
                  <a key={i} href={l.href} target="_blank" rel="noopener noreferrer" className={styles.profileLink}>
                    <span className={styles.linkIcon}>{l.icon}</span><span>{l.label}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </>
  )
}