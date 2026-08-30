'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import Footer from '../../components/Footer'
import { locationLabel } from '../../../lib/labels'
import { eduDomain } from '../../../lib/students'
import MemberMenu from '../../components/MemberMenu'
import styles from './profile.module.css'

const SKILL_LEVEL_LABELS = ['', 'Beginner', 'Developing', 'Proficient', 'Advanced', 'Expert']

const DISC_OPTS = [
  { id:'visual',  icon:'🎨', label:'Visual Art' },
  { id:'music',   icon:'🎵', label:'Music' },
  { id:'writing', icon:'✍️', label:'Writing' },
  { id:'design',  icon:'🖥',  label:'Design & Web' },
  { id:'film',    icon:'🎬', label:'Film & Video' },
  { id:'photo',   icon:'📷', label:'Photography' },
  { id:'perf',    icon:'🎭', label:'Performance' },
  { id:'tech',    icon:'💻', label:'Creative Tech' },
]

const SKILLS_BY_DISC = {
  visual:  ['Illustration','Digital art','Character design','Concept art','Comic & manga','Painting','Animation','Cover art'],
  music:   ['Beat production','Producing','DJ','Songwriting','Vocals','Rap & MC','Instrumentalist','Mixing & mastering','Sound design','Film & game scoring'],
  writing: ['Lyrics','Poetry','Fiction','Nonfiction','Screenwriting','Copywriting','Content writing','Editing','Ghostwriting'],
  design:  ['Graphic design','Branding','Web design','UI/UX','Motion graphics','Album & cover art','Typography'],
  film:    ['Directing','Cinematography','Video editing','Motion & VFX','Music video','Producing'],
  photo:   ['Portrait','Fashion & editorial','Product & commercial','Music & band','Event','Photo retouching'],
  perf:    ['Acting','Voice acting','Dance','Choreography','Spoken word','Comedy'],
  tech:    ['Game design','3D modeling','Web development','AR/VR','Creative coding','AI & generative'],
}

function skillsForDiscs(discLabels) {
  // Deduped: Music and Film & Video both list Producing, and a duplicate here
  // becomes two identical chips fighting over one selection.
  return [...new Set(discLabels.flatMap(label => {
    const disc = DISC_OPTS.find(d => d.label === label)
    return disc ? (SKILLS_BY_DISC[disc.id] || []) : []
  }))]
}
function detectType(file) {
  const mime = file.type
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('audio/')) return 'audio'
  if (mime === 'application/pdf') return 'document'
  return 'document'
}
function bucketForType(type) {
  if (type === 'image') return 'portfolio-images'
  if (type === 'video') return 'portfolio-video'
  if (type === 'audio') return 'portfolio-audio'
  return 'portfolio-docs'
}
function typeIcon(type) {
  if (type === 'image') return '🖼'
  if (type === 'video') return '▶'
  if (type === 'audio') return '🎵'
  if (type === 'document') return '📄'
  return '✦'
}
function initials(p) {
  return [(p.firstname||'?')[0],(p.lastname||'?')[0]].join('').toUpperCase()
}
function locationStr(p) {
  return [p.city,p.state,p.country].filter(Boolean).join(', ')
}

function CompletedCollabCard({ studio, profileId }) {
  const collab = studio.initiator_id === profileId ? studio.partner : studio.initiator
  const collabName = collab ? `${collab.firstname} ${collab.lastname}` : 'Collaborator'
  const collabInit = collab ? `${(collab.firstname||'?')[0]}${(collab.lastname||'?')[0]}`.toUpperCase() : '??'
  const typeLabel = studio.collab_type === 'exchange' ? 'Creative exchange'
    : studio.collab_type === 'paid' ? 'Paid'
    : 'Revenue share'

  return (
    <Link href={`/studio/${studio.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        style={{
          background: 'rgba(26,24,20,0.03)',
          border: '0.5px solid var(--rule)',
          borderRadius: '4px',
          padding: '1rem 1.1rem',
          marginBottom: '0.65rem',
          cursor: 'pointer',
          transition: 'border-color 0.15s, background 0.15s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(26,24,20,0.04)'; e.currentTarget.style.borderColor = 'rgba(201,168,76,0.25)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(26,24,20,0.03)'; e.currentTarget.style.borderColor = 'var(--rule)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
            background: 'rgba(86,179,156,0.15)', color: 'var(--teal)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--serif)', fontSize: '0.7rem', fontWeight: 700,
          }}>{collabInit}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--sans)', fontSize: '0.82rem', fontWeight: 600, color: 'var(--cream)', marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {studio.project_title || 'Untitled project'}
            </div>
            <div style={{ fontFamily: 'var(--sans)', fontSize: '0.68rem', color: 'var(--muted)' }}>
              With {collabName} · {typeLabel}
            </div>
          </div>
        </div>
        <span style={{
          fontFamily: 'var(--sans)', fontSize: '0.58rem', fontWeight: 600,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          color: 'var(--gold)', flexShrink: 0,
        }}>✦ Completed</span>
      </div>
    </Link>
  )
}

function Editable({ value, onSave, placeholder, multiline, isOwner, editMode, className }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value || '')
  const ref = useRef()
  useEffect(() => { if (editing && ref.current) ref.current.focus() }, [editing])
  useEffect(() => { setDraft(value || '') }, [value])
  if (!isOwner || !editMode) return <span className={className}>{value || placeholder}</span>
  if (editing) {
    const props = {
      ref, value: draft, onChange: e => setDraft(e.target.value),
      onBlur: () => { setEditing(false); if (draft !== value) onSave(draft) },
      onKeyDown: e => {
        if (e.key==='Enter'&&!multiline){setEditing(false);onSave(draft)}
        if (e.key==='Escape'){setEditing(false);setDraft(value||'')}
      },
      className: `${styles.editInput} ${multiline?styles.editTextarea:''}`, placeholder,
    }
    return multiline ? <textarea {...props} rows={4}/> : <input type="text" {...props}/>
  }
  return (
    <span className={`${className} ${styles.editableField}`} onClick={() => setEditing(true)} title="Click to edit">
      {value || <span className={styles.editPlaceholder}>{placeholder}</span>}
      <span className={styles.editPencil}>✎</span>
    </span>
  )
}

// The one edit form. Every text field the profile owns, in one place, with
// one Save and one Cancel. It replaced the pencil-per-section editing because
// scattered pencils made updating feel like a scavenger hunt, and because the
// email needed a home that inline editing could never give it: changing the
// sign-in address goes through Supabase auth, which mails confirmation links
// to BOTH the old and the new inbox, and only a confirmed click completes it.
// So everything else saves immediately, and the email change is kicked off
// with an explanation of what happens next.
function EditProfileModal({ profile, userEmail, onClose, onSaved }) {
  const [firstname, setFirstname] = useState(profile.firstname || '')
  const [lastname,  setLastname]  = useState(profile.lastname || '')
  const [email,     setEmail]     = useState(userEmail || profile.email || '')
  const [headline,  setHeadline]  = useState(profile.headline || '')
  const [rightnow,  setRightnow]  = useState(profile.rightnow || '')
  const [bio,       setBio]       = useState(profile.bio || '')
  const [discs,     setDiscs]     = useState(profile.disciplines || [])
  const [skills,    setSkills]    = useState(profile.skills || [])
  const [seekDiscs, setSeekDiscs] = useState(profile.seeking_disciplines || [])
  const [seekSkills,setSeekSkills]= useState(profile.seeking_skills || [])
  const [loc,       setLoc]       = useState(null) // set only when changed
  const [locQuery,  setLocQuery]  = useState('')
  const [locResults,setLocResults]= useState([])
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')

  function toggleDisc(label) {
    setDiscs(prev => {
      const next = prev.includes(label) ? prev.filter(x => x !== label) : [...prev, label]
      setSkills(sk => sk.filter(x => skillsForDiscs(next).includes(x)))
      return next
    })
  }
  function toggleSkill(label) {
    setSkills(prev => prev.includes(label) ? prev.filter(x => x !== label) : [...prev, label])
  }
  function toggleSeekDisc(label) {
    setSeekDiscs(prev => {
      const next = prev.includes(label) ? prev.filter(x => x !== label) : [...prev, label]
      setSeekSkills(sk => sk.filter(x => skillsForDiscs(next).includes(x)))
      return next
    })
  }
  function toggleSeekSkill(label) {
    setSeekSkills(prev => prev.includes(label) ? prev.filter(x => x !== label) : [...prev, label])
  }

  async function searchCity(q) {
    setLocQuery(q)
    if (!q || q.trim().length < 2) { setLocResults([]); return }
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) { setLocResults([]); return }
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?types=place&limit=5&access_token=${token}`
      const res = await fetch(url)
      const data = await res.json()
      setLocResults(Array.isArray(data.features) ? data.features : [])
    } catch { setLocResults([]) }
  }
  function pickCity(f) {
    let region = '', country = ''
    ;(f.context || []).forEach(c => {
      if (c.id?.startsWith('region')) region = c.text
      if (c.id?.startsWith('country')) country = c.text
    })
    const [lng, lat] = f.center || [null, null]
    setLoc({ city: f.text || '', state: region, country, latitude: lat, longitude: lng })
    setLocQuery(''); setLocResults([])
  }

  const currentLoc = loc
    ? [loc.city, loc.state, loc.country].filter(Boolean).join(', ')
    : [profile.city, profile.state, profile.country].filter(Boolean).join(', ')

  const emailChanged = email.trim().toLowerCase() !== (userEmail || '').trim().toLowerCase()
  const newIsAcademic = emailChanged && !!eduDomain(email.trim())

  async function save() {
    setError('')
    if (!firstname.trim()) { setError('Your first name is the one thing the profile cannot do without.'); return }
    if (discs.length === 0) { setError('Pick at least one discipline. It is how anyone finds you.'); return }
    if (emailChanged && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) { setError('That email address does not look complete.'); return }
    setSaving(true)

    const patch = {}
    const set = (k, v, cur) => { if ((v ?? '') !== (cur ?? '')) patch[k] = v }
    set('firstname', firstname.trim(), profile.firstname)
    set('lastname',  lastname.trim(),  profile.lastname)
    set('headline',  headline.trim(),  profile.headline)
    set('rightnow',  rightnow.trim(),  profile.rightnow)
    set('bio',       bio.trim(),       profile.bio)
    if (JSON.stringify(discs)      !== JSON.stringify(profile.disciplines || []))         patch.disciplines = discs
    if (JSON.stringify(skills)     !== JSON.stringify(profile.skills || []))              patch.skills = skills
    if (JSON.stringify(seekDiscs)  !== JSON.stringify(profile.seeking_disciplines || [])) patch.seeking_disciplines = seekDiscs
    if (JSON.stringify(seekSkills) !== JSON.stringify(profile.seeking_skills || []))      patch.seeking_skills = seekSkills
    if (loc) Object.assign(patch, loc)

    if (Object.keys(patch).length > 0) {
      patch.updated_at = new Date().toISOString()
      const { error: dbErr } = await supabase.from('profiles').update(patch).eq('id', profile.id)
      if (dbErr) { setError('Could not save. Try again.'); setSaving(false); return }
    }

    // The email is different plumbing entirely. This starts Supabase's
    // change-of-address flow; profiles.email is deliberately NOT written here,
    // because the change is not real until the links are clicked. The page
    // syncs it on a later visit, once auth and profile disagree.
    let emailPending = false
    if (emailChanged) {
      const { error: authErr } = await supabase.auth.updateUser({ email: email.trim() })
      if (authErr) {
        setError(authErr.message || 'Could not start the email change.')
        setSaving(false)
        return
      }
      emailPending = true
    }

    onSaved(patch, emailPending ? { newEmail: email.trim(), academic: newIsAcademic } : null)
  }

  return createPortal(
    <div className={styles.epOverlay}>
      <div className={styles.epBox}>
        <div className={styles.epHead}>
          <div className={styles.epTitle}>Edit profile</div>
          <button className={styles.epClose} onClick={onClose}>✕</button>
        </div>

        <div className={styles.epBody}>
          <div className={styles.epRow2}>
            <div className={styles.epField}>
              <label className={styles.epLabel}>First name</label>
              <input className={styles.editInput} value={firstname} onChange={e=>setFirstname(e.target.value)} />
            </div>
            <div className={styles.epField}>
              <label className={styles.epLabel}>Last name</label>
              <input className={styles.editInput} value={lastname} onChange={e=>setLastname(e.target.value)} />
            </div>
          </div>

          <div className={styles.epField}>
            <label className={styles.epLabel}>Email</label>
            <input className={styles.editInput} type="email" value={email} onChange={e=>setEmail(e.target.value)} />
            {emailChanged ? (
              <div className={styles.epNote}>
                Changing your email sends confirmation links to both your current and your new address, and the change completes when they are confirmed.
                {newIsAcademic && ' Your new address is a school email: once it is confirmed, verify it here and your membership is free while you are enrolled.'}
              </div>
            ) : (
              <div className={styles.epNote}>This is your sign-in address, and where Collective Loft reaches you.</div>
            )}
          </div>

          <div className={styles.epField}>
            <label className={styles.epLabel}>Headline</label>
            <input className={styles.editInput} value={headline} onChange={e=>setHeadline(e.target.value)} placeholder="Your discipline · Your style · Your medium" />
          </div>

          <div className={styles.epField}>
            <label className={styles.epLabel}>Location</label>
            {currentLoc && <div className={styles.epCurrent}>📍 {currentLoc}</div>}
            <input className={styles.editInput} value={locQuery} onChange={e=>searchCity(e.target.value)} placeholder="Search a city to change it" />
            {locResults.length > 0 && (
              <div className={styles.epLocResults}>
                {locResults.map(f => (
                  <button key={f.id} type="button" className={styles.epLocResult} onClick={()=>pickCity(f)}>{f.place_name}</button>
                ))}
              </div>
            )}
          </div>

          <div className={styles.epField}>
            <label className={styles.epLabel}>What you are making right now</label>
            <textarea className={`${styles.editInput} ${styles.editTextarea}`} rows={2} value={rightnow} onChange={e=>setRightnow(e.target.value)} />
          </div>

          <div className={styles.epField}>
            <label className={styles.epLabel}>Bio</label>
            <textarea className={`${styles.editInput} ${styles.editTextarea}`} rows={4} value={bio} onChange={e=>setBio(e.target.value)} />
          </div>

          <div className={styles.epField}>
            <label className={styles.epLabel}>Disciplines</label>
            <div className={styles.epChips}>
              {DISC_OPTS.map(d => (
                <button key={d.id} type="button" className={`${styles.epChip} ${discs.includes(d.label)?styles.epChipOn:''}`} onClick={()=>toggleDisc(d.label)}>{d.icon} {d.label}</button>
              ))}
            </div>
          </div>

          {discs.length > 0 && (
            <div className={styles.epField}>
              <label className={styles.epLabel}>Skills</label>
              <div className={styles.epChips}>
                {skillsForDiscs(discs).map(sk => (
                  <button key={sk} type="button" className={`${styles.epChip} ${skills.includes(sk)?styles.epChipOn:''}`} onClick={()=>toggleSkill(sk)}>{sk}</button>
                ))}
              </div>
            </div>
          )}

          <div className={styles.epField}>
            <label className={styles.epLabel}>Looking to collaborate with</label>
            <div className={styles.epChips}>
              {DISC_OPTS.map(d => (
                <button key={d.id} type="button" className={`${styles.epChip} ${seekDiscs.includes(d.label)?styles.epChipOn:''}`} onClick={()=>toggleSeekDisc(d.label)}>{d.icon} {d.label}</button>
              ))}
            </div>
            {seekDiscs.length > 0 && (
              <div className={styles.epChips} style={{ marginTop: '0.5rem' }}>
                {skillsForDiscs(seekDiscs).map(sk => (
                  <button key={sk} type="button" className={`${styles.epChip} ${seekSkills.includes(sk)?styles.epChipOn:''}`} onClick={()=>toggleSeekSkill(sk)}>{sk}</button>
                ))}
              </div>
            )}
          </div>

          {error && <div className={styles.epError}>{error}</div>}
        </div>

        <div className={styles.epActions}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={saving}>Cancel</button>
          <button className={styles.saveBtn} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</button>
        </div>
      </div>
    </div>,
    document.body
  )
}

function Lightbox({ items, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex)
  const item = items[idx]
  useEffect(() => {
    function onKey(e) {
      if (e.key==='Escape') onClose()
      if (e.key==='ArrowRight') setIdx(i => Math.min(i+1,items.length-1))
      if (e.key==='ArrowLeft')  setIdx(i => Math.max(i-1,0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [items, onClose])
  return (
    <div className={styles.lightbox} onClick={onClose}>
      <button className={styles.lbClose} onClick={onClose}>✕</button>
      {idx > 0 && <button className={styles.lbPrev} onClick={e=>{e.stopPropagation();setIdx(i=>i-1)}}>‹</button>}
      {idx < items.length-1 && <button className={styles.lbNext} onClick={e=>{e.stopPropagation();setIdx(i=>i+1)}}>›</button>}
      <div className={styles.lbContent} onClick={e=>e.stopPropagation()}>
        {item.type==='image'&&<img src={item.file_url} alt={item.title||''} className={styles.lbImage}/>}
        {item.type==='video'&&<video src={item.file_url} controls autoPlay className={styles.lbVideo}/>}
        {item.type==='audio'&&<div className={styles.lbAudio}><div className={styles.lbAudioIcon}>🎵</div><div className={styles.lbAudioTitle}>{item.title||'Audio track'}</div><audio src={item.file_url} controls autoPlay className={styles.audioPlayer}/></div>}
        {item.type==='document'&&<div className={styles.lbDoc}><div className={styles.lbDocIcon}>📄</div><div className={styles.lbDocTitle}>{item.title||'Document'}</div><a href={item.file_url} target="_blank" rel="noopener noreferrer" className={styles.lbDocBtn}>Open document ↗</a><iframe src={item.file_url} className={styles.lbDocFrame} title={item.title||'Document'}/></div>}
        {item.title&&<div className={styles.lbCaption}>{item.title}</div>}
      </div>
    </div>
  )
}

function BriefModal({ brief, isOwner, onClose, onDelete }) {
  if (!brief) return null
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:'1.5rem'}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div style={{background:'var(--bg1)',border:'0.5px solid var(--rule)',borderRadius:'6px',width:'100%',maxWidth:'560px',maxHeight:'85vh',overflowY:'auto',padding:'2rem',position:'relative'}}>
        <button onClick={onClose} style={{position:'absolute',top:'1rem',right:'1rem',background:'none',border:'none',color:'var(--muted)',fontSize:'1rem',cursor:'pointer',lineHeight:1}}>✕</button>
        <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap',marginBottom:'0.75rem'}}>
          {(brief.disciplines||[]).map(d=><span key={d} style={{fontFamily:'var(--sans)',fontSize:'0.58rem',fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',padding:'2px 8px',borderRadius:'2px',background:'rgba(201,168,76,0.12)',color:'var(--gold)'}}>{d}</span>)}
          {brief.compensation&&<span style={{fontFamily:'var(--sans)',fontSize:'0.58rem',fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',padding:'2px 8px',borderRadius:'2px',background:'rgba(86,179,156,0.12)',color:'var(--teal)'}}>{brief.compensation}</span>}
          <span style={{fontFamily:'var(--sans)',fontSize:'0.58rem',fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',padding:'2px 8px',borderRadius:'2px',background:brief._isApplied?'rgba(160,120,208,0.15)':'rgba(201,168,76,0.08)',color:brief._isApplied?'#a078d0':'var(--muted)'}}>{brief._isApplied?'Applied':'Active'}</span>
        </div>
        <div style={{fontFamily:'var(--serif)',fontSize:'1.4rem',color:'var(--cream)',marginBottom:'1.25rem',lineHeight:1.3}}>{brief.title}</div>
        {brief.what_making&&<div style={{marginBottom:'1rem'}}><div style={{fontFamily:'var(--sans)',fontSize:'0.6rem',letterSpacing:'0.14em',textTransform:'uppercase',color:'var(--muted)',marginBottom:'0.35rem'}}>What I'm making</div><div style={{fontFamily:'var(--sans)',fontSize:'0.78rem',color:'var(--cream)',lineHeight:1.7}}>{brief.what_making}</div></div>}
        {brief.who_needed&&<div style={{marginBottom:'1rem'}}><div style={{fontFamily:'var(--sans)',fontSize:'0.6rem',letterSpacing:'0.14em',textTransform:'uppercase',color:'var(--muted)',marginBottom:'0.35rem'}}>Who I need</div><div style={{fontFamily:'var(--sans)',fontSize:'0.78rem',color:'var(--cream)',lineHeight:1.7}}>{brief.who_needed}</div></div>}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.5rem',marginBottom:'1.5rem'}}>
          {brief.timeline&&<div style={{background:'rgba(26,24,20,0.03)',border:'0.5px solid rgba(26,24,20,0.08)',borderRadius:'3px',padding:'0.6rem 0.75rem'}}><div style={{fontFamily:'var(--sans)',fontSize:'0.58rem',letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--muted)',marginBottom:'0.2rem'}}>Timeline</div><div style={{fontFamily:'var(--sans)',fontSize:'0.75rem',color:'var(--cream)'}}>{brief.timeline}</div></div>}
          {brief.location_preference&&<div style={{background:'rgba(26,24,20,0.03)',border:'0.5px solid rgba(26,24,20,0.08)',borderRadius:'3px',padding:'0.6rem 0.75rem'}}><div style={{fontFamily:'var(--sans)',fontSize:'0.58rem',letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--muted)',marginBottom:'0.2rem'}}>Location</div><div style={{fontFamily:'var(--sans)',fontSize:'0.75rem',color:'var(--cream)'}}>{brief.location_preference}</div></div>}
          {brief.fee_range&&<div style={{background:'rgba(26,24,20,0.03)',border:'0.5px solid rgba(26,24,20,0.08)',borderRadius:'3px',padding:'0.6rem 0.75rem'}}><div style={{fontFamily:'var(--sans)',fontSize:'0.58rem',letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--muted)',marginBottom:'0.2rem'}}>Fee</div><div style={{fontFamily:'var(--sans)',fontSize:'0.75rem',color:'var(--gold)'}}>{String(brief.fee_range).trim().startsWith('$') ? '' : '$'}{brief.fee_range}</div></div>}
          {brief.deadline&&<div style={{background:'rgba(26,24,20,0.03)',border:'0.5px solid rgba(26,24,20,0.08)',borderRadius:'3px',padding:'0.6rem 0.75rem'}}><div style={{fontFamily:'var(--sans)',fontSize:'0.58rem',letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--muted)',marginBottom:'0.2rem'}}>Deadline</div><div style={{fontFamily:'var(--sans)',fontSize:'0.75rem',color:'var(--cream)'}}>{new Date(brief.deadline).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div></div>}
        </div>
        {isOwner&&!brief._isApplied&&<button onClick={()=>{onDelete(brief.id);onClose()}} style={{background:'none',border:'0.5px solid rgba(194,112,128,0.3)',color:'#c27080',borderRadius:'3px',padding:'0.45rem 1rem',fontFamily:'var(--sans)',fontSize:'0.65rem',letterSpacing:'0.06em',textTransform:'uppercase',cursor:'pointer'}}>✕ Delete this brief</button>}
        {brief._isApplied&&<div style={{background:'rgba(160,120,208,0.08)',border:'0.5px solid rgba(160,120,208,0.2)',borderRadius:'4px',padding:'0.75rem 1rem',fontFamily:'var(--sans)',fontSize:'0.72rem',color:'rgba(160,120,208,0.8)'}}>You applied to this brief. The poster will reach out if they want to move forward.</div>}
      </div>
    </div>
  )
}

function ActiveBriefCard({ brief, onDelete, profileSlug }) {
  return (
    <Link href={`/briefs?open=${brief.id}&from=${profileSlug}`} style={{textDecoration:'none',display:'block'}}>
    <div style={{position:'relative',cursor:'pointer',background:'rgba(26,24,20,0.03)',border:'0.5px solid var(--rule)',borderRadius:'4px',padding:'1rem 1.1rem',marginBottom:'0.65rem',transition:'border-color 0.15s, background 0.15s'}}
      onMouseEnter={e=>{e.currentTarget.style.background='rgba(26,24,20,0.04)';e.currentTarget.style.borderColor='rgba(201,168,76,0.25)'}}
      onMouseLeave={e=>{e.currentTarget.style.background='rgba(26,24,20,0.03)';e.currentTarget.style.borderColor='var(--rule)'}}>
      <button onClick={e=>{e.stopPropagation();if(!confirm('Delete this brief? This cannot be undone.'))return;onDelete(brief.id)}}
        style={{position:'absolute',top:'0.6rem',right:'0.6rem',background:'none',border:'none',color:'rgba(194,112,128,0.5)',cursor:'pointer',fontSize:'0.72rem',lineHeight:1,padding:'2px 4px',borderRadius:'2px',transition:'color 0.15s'}}
        onMouseEnter={e=>e.currentTarget.style.color='#c27080'}
        onMouseLeave={e=>e.currentTarget.style.color='rgba(194,112,128,0.5)'}>✕</button>
      <div style={{display:'flex',gap:'0.4rem',flexWrap:'wrap',marginBottom:'0.5rem'}}>
        {(brief.disciplines||[]).slice(0,2).map(d=><span key={d} style={{fontFamily:'var(--sans)',fontSize:'0.55rem',fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',padding:'1px 6px',borderRadius:'2px',background:'rgba(201,168,76,0.1)',color:'var(--gold)'}}>{d}</span>)}
        {brief.compensation&&<span style={{fontFamily:'var(--sans)',fontSize:'0.55rem',fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',padding:'1px 6px',borderRadius:'2px',background:'rgba(86,179,156,0.1)',color:'var(--teal)'}}>{brief.compensation}</span>}
        <span style={{fontFamily:'var(--sans)',fontSize:'0.55rem',fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',padding:'1px 6px',borderRadius:'2px',background:'rgba(201,168,76,0.06)',color:'var(--muted)'}}>Active</span>
      </div>
      <div style={{fontFamily:'var(--sans)',fontSize:'0.82rem',fontWeight:600,color:'var(--cream)',marginBottom:'0.3rem',paddingRight:'1.5rem'}}>{brief.title}</div>
      {brief.what_making&&<div style={{fontFamily:'var(--sans)',fontSize:'0.7rem',color:'var(--muted)',lineHeight:1.6,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{brief.what_making}</div>}
    </div>
    </Link>
  )
}

function NegotiationCard({ term, currentUserId }) {
  let myTurn = false
  if (currentUserId) {
    if (term.current_editor === 'initiator') myTurn = term.initiator_id === currentUserId
    if (term.current_editor === 'partner')   myTurn = term.partner_id   === currentUserId
  }
  const partner = currentUserId
    ? (term.initiator_id === currentUserId ? term.partner : term.initiator)
    : null

  return (
    <Link href={`/terms-review/${term.id}`} style={{textDecoration:'none',display:'block'}}>
      <div style={{cursor:'pointer',background:'rgba(26,24,20,0.03)',border:`0.5px solid ${myTurn?'rgba(201,168,76,0.3)':'var(--rule)'}`,borderRadius:'4px',padding:'1rem 1.1rem',marginBottom:'0.65rem',transition:'border-color 0.15s, background 0.15s',boxShadow:myTurn?'0 0 0 1px rgba(201,168,76,0.06)':'none'}}
        onMouseEnter={e=>{e.currentTarget.style.background='rgba(26,24,20,0.04)';e.currentTarget.style.borderColor=myTurn?'rgba(201,168,76,0.5)':'rgba(201,168,76,0.2)'}}
        onMouseLeave={e=>{e.currentTarget.style.background='rgba(26,24,20,0.03)';e.currentTarget.style.borderColor=myTurn?'rgba(201,168,76,0.3)':'var(--rule)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'0.5rem'}}>
          <span style={{fontFamily:'var(--sans)',fontSize:'0.55rem',fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',padding:'1px 6px',borderRadius:'2px',background:myTurn?'rgba(201,168,76,0.15)':'rgba(26,24,20,0.06)',color:myTurn?'var(--gold)':'var(--muted)'}}>
            {myTurn ? 'Your turn to review' : 'Awaiting their review'}
          </span>
          <span style={{fontFamily:'var(--sans)',fontSize:'0.62rem',color:'var(--muted)'}}>Review terms ↗</span>
        </div>
        <div style={{fontFamily:'var(--sans)',fontSize:'0.82rem',fontWeight:600,color:'var(--cream)',marginBottom:'0.25rem'}}>{term.project_title||'Untitled project'}</div>
        <div style={{fontFamily:'var(--sans)',fontSize:'0.7rem',color:'var(--muted)'}}>
          With {partner ? `${partner.firstname} ${partner.lastname}` : 'collaborator'}
          {' · '}{term.collab_type==='exchange'?'Creative exchange':term.collab_type==='paid'?'Paid':'Revenue share'}
        </div>
      </div>
    </Link>
  )
}

function AppliedBriefCard({ brief, onSelect }) {
  return (
    <div onClick={() => onSelect(brief)} style={{cursor:'pointer',background:'rgba(26,24,20,0.03)',border:'0.5px solid rgba(160,120,208,0.15)',borderRadius:'4px',padding:'1rem 1.1rem',marginBottom:'0.65rem',transition:'border-color 0.15s, background 0.15s'}}
      onMouseEnter={e=>{e.currentTarget.style.background='rgba(26,24,20,0.04)';e.currentTarget.style.borderColor='rgba(160,120,208,0.35)'}}
      onMouseLeave={e=>{e.currentTarget.style.background='rgba(26,24,20,0.03)';e.currentTarget.style.borderColor='rgba(160,120,208,0.15)'}}>
      <div style={{display:'flex',gap:'0.4rem',flexWrap:'wrap',marginBottom:'0.5rem'}}>
        {(brief.disciplines||[]).slice(0,2).map(d=><span key={d} style={{fontFamily:'var(--sans)',fontSize:'0.55rem',fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',padding:'1px 6px',borderRadius:'2px',background:'rgba(201,168,76,0.1)',color:'var(--gold)'}}>{d}</span>)}
        {brief.compensation&&<span style={{fontFamily:'var(--sans)',fontSize:'0.55rem',fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',padding:'1px 6px',borderRadius:'2px',background:'rgba(86,179,156,0.1)',color:'var(--teal)'}}>{brief.compensation}</span>}
        <span style={{fontFamily:'var(--sans)',fontSize:'0.55rem',fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',padding:'1px 6px',borderRadius:'2px',background:'rgba(160,120,208,0.12)',color:'#a078d0'}}>Applied</span>
      </div>
      <div style={{fontFamily:'var(--sans)',fontSize:'0.82rem',fontWeight:600,color:'var(--cream)',marginBottom:'0.3rem'}}>{brief.title}</div>
      {brief.what_making&&<div style={{fontFamily:'var(--sans)',fontSize:'0.7rem',color:'var(--muted)',lineHeight:1.6,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{brief.what_making}</div>}
    </div>
  )
}

function SeekingEditor({ seekingDiscs, seekingSkills, onSave }) {
  const [discs,  setDiscs]  = useState(seekingDiscs || [])
  const [skills, setSkills] = useState(seekingSkills || [])
  const [saving, setSaving] = useState(false)

  const availableSkills = discs.length === 0
    ? Object.values(SKILLS_BY_DISC).flat()
    : discs.flatMap(d => {
        const opt = DISC_OPTS.find(o => o.label === d)
        return opt ? (SKILLS_BY_DISC[opt.id] || []) : []
      })

  function toggleDisc(label) {
    setDiscs(prev => {
      const next = prev.includes(label) ? prev.filter(d => d !== label) : [...prev, label]
      const validSkills = next.flatMap(d => {
        const opt = DISC_OPTS.find(o => o.label === d)
        return opt ? (SKILLS_BY_DISC[opt.id] || []) : []
      })
      setSkills(sk => sk.filter(s => validSkills.includes(s)))
      return next
    })
  }

  function toggleSkill(label) {
    setSkills(prev => prev.includes(label) ? prev.filter(s => s !== label) : [...prev, label])
  }

  async function handleSave() {
    setSaving(true)
    await onSave(discs, skills)
    setSaving(false)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
      <div>
        <div style={{ fontFamily:'var(--sans)', fontSize:'0.62rem', color:'var(--muted)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'0.6rem' }}>I'm looking to collaborate with</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'0.4rem' }}>
          {DISC_OPTS.map(d => (
            <div key={d.id}
              onClick={() => toggleDisc(d.label)}
              style={{
                border: discs.includes(d.label) ? '0.5px solid var(--gold)' : '0.5px solid var(--rule)',
                background: discs.includes(d.label) ? 'rgba(201,168,76,0.08)' : 'var(--bg1)',
                borderRadius:'3px', padding:'0.55rem 0.5rem', textAlign:'center',
                cursor:'pointer', transition:'all 0.15s', userSelect:'none',
              }}>
              <div style={{ fontSize:'1rem', marginBottom:'0.2rem' }}>{d.icon}</div>
              <div style={{ fontFamily:'var(--sans)', fontSize:'0.6rem', color: discs.includes(d.label) ? 'var(--gold)' : 'var(--muted)' }}>{d.label}</div>
            </div>
          ))}
        </div>
      </div>

      {availableSkills.length > 0 && (
        <div>
          <div style={{ fontFamily:'var(--sans)', fontSize:'0.62rem', color:'var(--muted)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'0.6rem' }}>Specific skills I need</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'0.4rem' }}>
            {availableSkills.map(s => (
              <button key={s}
                onClick={() => toggleSkill(s)}
                style={{
                  fontFamily:'var(--sans)', fontSize:'0.68rem',
                  padding:'0.22rem 0.68rem', borderRadius:'2px',
                  border: skills.includes(s) ? '0.5px solid var(--gold)' : '0.5px solid var(--rule)',
                  background: skills.includes(s) ? 'rgba(201,168,76,0.1)' : 'transparent',
                  color: skills.includes(s) ? 'var(--gold)' : 'var(--muted)',
                  cursor:'pointer', transition:'all 0.15s',
                }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <button onClick={handleSave} disabled={saving} style={{
        alignSelf:'flex-start', background:'var(--gold)', color:'var(--ink)',
        border:'none', borderRadius:'2px', padding:'0.45rem 1.1rem',
        fontFamily:'var(--sans)', fontSize:'0.65rem', fontWeight:500,
        letterSpacing:'0.07em', textTransform:'uppercase', cursor:'pointer',
        opacity: saving ? 0.6 : 1,
      }}>
        {saving ? 'Saving…' : 'Save preferences'}
      </button>
    </div>
  )
}

export default function ProfilePage() {
  const params   = useParams()
  const router   = useRouter()
  const username = params?.username

  const [profile,          setProfile]          = useState(null)
  const [profileId,        setProfileId]        = useState(null)
  const [currentUserId,    setCurrentUserId]    = useState(null)
  const [studios,          setStudios]          = useState([])
  const [ratings,          setRatings]          = useState([])
  const [starFilter,       setStarFilter]       = useState([])  // empty = show all; multi-select star values
  const [portfolio,        setPortfolio]        = useState([])
  const [loading,          setLoading]          = useState(true)
  const [notFound,         setNotFound]         = useState(false)
  const [activeTab,        setActiveTab]        = useState('about')
  const [connected,        setConnected]        = useState(false)
  const [isOwner,          setIsOwner]          = useState(false)
  // Inline pencil editing is retired: text edits live in the one modal form.
  // editMode stays only so the old Editable spans render as plain text.
  const editMode = false
  const [showEdit,         setShowEdit]         = useState(false)
  const [emailNotice,      setEmailNotice]      = useState('')
  const [studentOffer,     setStudentOffer]     = useState(false)
  const [studentSending,   setStudentSending]   = useState(false)
  const [sessionEmail,     setSessionEmail]     = useState('')
  const [editingLoc,       setEditingLoc]       = useState(false)
  const [locQuery,         setLocQuery]         = useState('')
  const [locResults,       setLocResults]       = useState([])
  const [saving,           setSaving]           = useState(false)
  const [saveMsg,          setSaveMsg]          = useState('')
  const [lightboxIdx,      setLightboxIdx]      = useState(null)
  const [uploading,        setUploading]        = useState(false)
  const [editingDiscs,     setEditingDiscs]     = useState(false)
  const [editingSkills,    setEditingSkills]    = useState(false)
  const [draftDiscs,       setDraftDiscs]       = useState([])
  const [draftSkills,      setDraftSkills]      = useState([])
  const [notifCount,       setNotifCount]       = useState(0)
  const [portalLoading,    setPortalLoading]    = useState(false)

  // Stripe Connect state
  const [connectLoading,   setConnectLoading]   = useState(false)
  const [connectToast,     setConnectToast]     = useState(null) // 'success' | 'incomplete' | null

  const [activeBriefs,     setActiveBriefs]     = useState([])
  const [negotiations,     setNegotiations]     = useState([])
  const [appliedBriefs,    setAppliedBriefs]    = useState([])
  const [briefsLoading,    setBriefsLoading]    = useState(false)
  const [selectedBrief,    setSelectedBrief]    = useState(null)

  const avatarInputRef    = useRef()
  const coverInputRef     = useRef()
  const portfolioInputRef = useRef()

  useEffect(() => { if (username) loadProfile() }, [username])

  // Handle connect_success / connect_incomplete query params from Stripe return
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('connect_success') === 'true') {
      setConnectToast('success')
      // Update local profile state so the button reflects the change immediately
      setProfile(p => p ? { ...p, connect_onboarded: true } : p)
      // Clean the URL
      window.history.replaceState({}, '', window.location.pathname)
      setTimeout(() => setConnectToast(null), 5000)
    } else if (params.get('connect_incomplete') === 'true') {
      setConnectToast('incomplete')
      window.history.replaceState({}, '', window.location.pathname)
      setTimeout(() => setConnectToast(null), 6000)
    }
  }, [])

  useEffect(() => {
    if (!profileId) return
    const channel = supabase
      .channel(`portfolio-${profileId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'portfolio_items',
        filter: `profile_id=eq.${profileId}`,
      }, payload => {
        setPortfolio(prev => {
          if (prev.find(p => p.id === payload.new.id)) return prev
          return [...prev, payload.new].sort((a,b) => a.sort_order - b.sort_order)
        })
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'portfolio_items',
        filter: `profile_id=eq.${profileId}`,
      }, payload => {
        setPortfolio(prev => prev.filter(p => p.id !== payload.old.id))
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [profileId])

  async function loadProfile() {
    setLoading(true)
    const isUuid = /^[0-9a-f-]{36}$/.test(username)
    let query = supabase.from('profiles').select('*')
    if (isUuid) { query = query.eq('id', username) }
    else {
      const parts = username.split('-').map(p => p.trim()).filter(Boolean)
      parts.length >= 2
        ? query = query.ilike('firstname', parts[0].trim()).ilike('lastname', parts.slice(1).join(' ').trim())
        : query = query.ilike('firstname', username.trim())
    }
    const { data, error } = await query.single()
    if (error || !data) { setNotFound(true); setLoading(false); return }
    setProfile(data)
    setProfileId(data.id)
    setDraftDiscs(data.disciplines || [])
    setDraftSkills(data.skills || [])

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setCurrentUserId(user.id)
      if (user.id === data.id) {
        setIsOwner(true)
        setSessionEmail(user.email || '')
        loadNotifCount(user.id)
        loadBriefs(user.id)

        // A confirmed email change lives in auth first and nowhere else. When
        // auth and the profile disagree, auth has the truth: sync it so the
        // legal-notice sender, the owner notifications, and this page all
        // speak to the address the member actually uses now.
        if (user.email && data.email && user.email.toLowerCase() !== data.email.toLowerCase()) {
          await supabase.from('profiles').update({ email: user.email, updated_at: new Date().toISOString() }).eq('id', user.id)
          data.email = user.email
          setProfile(p => ({ ...p, email: user.email }))
        }

        // A school address that has never been verified is a free year waiting
        // to be claimed, whether it arrived at signup or by a change just now.
        // Brandon moving to his Ravensbourne address lands exactly here.
        const studentNow = data.student_until && new Date(data.student_until) > new Date()
        if (eduDomain(user.email) && !studentNow) setStudentOffer(true)
      }
    }

    const { data: studioData } = await supabase
      .from('collab_terms')
      .select(`*, initiator:profiles!collab_terms_initiator_id_fkey(id, firstname, lastname, headline), partner:profiles!collab_terms_partner_id_fkey(id, firstname, lastname, headline)`)
      .or(`initiator_id.eq.${data.id},partner_id.eq.${data.id}`)
      .eq('status', 'complete')
      .order('completed_at', { ascending: false })
    setStudios(studioData || [])

    const { data: ratingData } = await supabase
      .from('ratings')
      .select('*, rater:profiles!ratings_rater_id_fkey(firstname, lastname, headline)')
      .eq('ratee_id', data.id)
      .eq('submitted', true)
      .order('created_at', { ascending: false })
    setRatings(ratingData || [])

    const { data: portfolioData } = await supabase
      .from('portfolio_items')
      .select('*')
      .eq('profile_id', data.id)
      .order('sort_order', { ascending: true })
    setPortfolio(portfolioData || [])
    setLoading(false)
  }

  async function loadBriefs(userId) {
    setBriefsLoading(true)
    const { data: posted } = await supabase
      .from('briefs')
      .select('*')
      .eq('poster_id', userId)
      .eq('status', 'open')
      .order('created_at', { ascending: false })

    const { data: terms } = await supabase
      .from('collab_terms')
      .select(`*, initiator:profiles!collab_terms_initiator_id_fkey(id, firstname, lastname, disciplines, headline), partner:profiles!collab_terms_partner_id_fkey(id, firstname, lastname, disciplines, headline)`)
      .or(`initiator_id.eq.${userId},partner_id.eq.${userId}`)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    setNegotiations(terms || [])

    const negotiatingBriefIds = new Set((terms || []).map(t => t.brief_id).filter(Boolean))
    setActiveBriefs((posted || []).filter(b => !negotiatingBriefIds.has(b.id)))

    const { data: apps } = await supabase
      .from('applications')
      .select('brief_id, status, briefs(*)')
      .eq('applicant_id', userId)
      .eq('status', 'pending')
    setAppliedBriefs((apps || []).map(a => ({ ...a.briefs, _isApplied: true })).filter(Boolean))

    setBriefsLoading(false)
  }

  async function deleteBrief(id) {
    await supabase.from('briefs').update({ status: 'deleted' }).eq('id', id)
    setActiveBriefs(prev => prev.filter(b => b.id !== id))
  }

  async function loadNotifCount(userId) {
    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false)
    setNotifCount(count || 0)
  }

  async function handleSignOut() { await supabase.auth.signOut(); router.push('/') }


  async function handleManageSubscription() {
    setPortalLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        alert('Please sign in again to manage your subscription.')
        return
      }
      const res = await fetch('/api/paddle/portal', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Could not open billing portal. Please try again.')
      }
    } catch (err) {
      console.error(err)
      alert('Something went wrong. Please try again.')
    } finally {
      setPortalLoading(false)
    }
  }

  // Stripe Connect: start onboarding
  async function handleConnectPayout() {
    setConnectLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        alert('Please sign in again to set up payouts.')
        return
      }
      const res = await fetch('/api/stripe/connect-account', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Could not start payout setup. Please try again.')
      }
    } catch (err) {
      console.error(err)
      alert('Something went wrong. Please try again.')
    } finally {
      setConnectLoading(false)
    }
  }

  async function saveField(field, value) {
    if (!profile) return
    setSaving(true)
    const { error } = await supabase.from('profiles').update({ [field]: value, updated_at: new Date().toISOString() }).eq('id', profile.id)
    if (!error) { setProfile(p => ({ ...p, [field]: value })); flashSave() }
    setSaving(false)
  }
  function flashSave() { setSaveMsg('Saved ✦'); setTimeout(() => setSaveMsg(''), 2000) }

  // Same flow signup uses: request a code to the session's own address, then
  // hand over to /student/verify to enter it. The server rechecks everything.
  async function startStudentVerify() {
    setStudentSending(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) { setStudentSending(false); return }
      const res = await fetch('/api/student/request', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (res.ok) { router.push('/student/verify'); return }
    } catch { /* fall through to reset */ }
    setStudentSending(false)
  }

  // --- Location editing (Mapbox autocomplete) ---
  async function searchProfileCity(q) {
    setLocQuery(q)
    if (!q || q.trim().length < 2) { setLocResults([]); return }
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) { setLocResults([]); return }
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?types=place&limit=5&access_token=${token}`
      const res = await fetch(url)
      const data = await res.json()
      setLocResults(Array.isArray(data.features) ? data.features : [])
    } catch { setLocResults([]) }
  }

  async function pickProfileCity(f) {
    if (!profile) return
    const cityName = f.text || ''
    let regionName = '', countryName = ''
    ;(f.context || []).forEach(c => {
      if (c.id?.startsWith('region')) regionName = c.text
      if (c.id?.startsWith('country')) countryName = c.text
    })
    const [lng, lat] = f.center || [null, null]
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      city: cityName, state: regionName, country: countryName,
      latitude: lat, longitude: lng, updated_at: new Date().toISOString(),
    }).eq('id', profile.id)
    if (!error) {
      setProfile(p => ({ ...p, city: cityName, state: regionName, country: countryName, latitude: lat, longitude: lng }))
      flashSave()
    }
    setSaving(false)
    setEditingLoc(false)
    setLocQuery(''); setLocResults([])
  }


  function toggleDraftDisc(label) {
    setDraftDiscs(prev => {
      const next = prev.includes(label) ? prev.filter(x => x!==label) : [...prev, label]
      setDraftSkills(s => s.filter(sk => skillsForDiscs(next).includes(sk)))
      return next
    })
  }
  async function saveDiscs() { await saveField('disciplines', draftDiscs); await saveField('skills', draftSkills); setEditingDiscs(false) }
  async function saveSkills() { await saveField('skills', draftSkills); setEditingSkills(false) }

  async function uploadImage(file, bucket, field) {
    if (!file || !profile) return
    setSaving(true)
    const ext = file.name.split('.').pop()
    const path = `${profile.id}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
    if (uploadError) { console.error(uploadError); setSaving(false); return }
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)
    await saveField(field, publicUrl)
    setSaving(false)
  }

  async function uploadPortfolioItem(file) {
    if (!file || !profile) return
    setUploading(true)
    const type = detectType(file)
    const ext = file.name.split('.').pop()
    const path = `${profile.id}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage.from(bucketForType(type)).upload(path, file, { upsert: true })
    if (uploadError) { console.error(uploadError); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from(bucketForType(type)).getPublicUrl(path)
    const title = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
    const { data: item, error: insertError } = await supabase.from('portfolio_items').insert({ profile_id: profile.id, type, title, file_url: publicUrl, sort_order: portfolio.length }).select().single()
    if (!insertError && item) setPortfolio(prev => [...prev, item])
    setUploading(false)
    flashSave()
  }

  async function deletePortfolioItem(id) {
    await supabase.from('portfolio_items').delete().eq('id', id)
    setPortfolio(prev => prev.filter(p => p.id !== id))
  }

  if (loading) return <div className={styles.loading}><div className={styles.loadingDot}>✦</div></div>
  if (notFound) return (
    <div className={styles.notFound}>
      <div className={styles.nfIcon}>✦</div>
      <div className={styles.nfTitle}>Profile not found</div>
      <div className={styles.nfSub}>This creative may have moved or doesn't exist yet.</div>
      <Link href="/discover" className={styles.nfBtn}>Browse Creatives</Link>
    </div>
  )

  const fullName    = `${profile.firstname||''} ${profile.lastname||''}`.trim()
  const ini         = initials(profile)
  const location    = locationStr(profile)
  const disciplines = profile.disciplines || []
  const skills      = profile.skills || []
  const avgRating   = ratings.length ? (ratings.reduce((s,r) => s+r.stars,0)/ratings.length).toFixed(1) : null
  const links = [
    profile.website        && { icon:'🔗', label:profile.website.replace(/^https?:\/\//,''),       href:profile.website },
    profile.instagram      && { icon:'📷', label:`@${profile.instagram.replace('@','')}`,           href:`https://instagram.com/${profile.instagram.replace('@','')}` },
    profile.soundcloud     && { icon:'🎵', label:profile.soundcloud.replace(/^https?:\/\//,''),     href:profile.soundcloud },
    profile.other_link     && { icon:'🔗', label:profile.other_link.replace(/^https?:\/\//,''),     href:profile.other_link },
    profile.portfolio_link && { icon:'💼', label:profile.portfolio_link.replace(/^https?:\/\//,''), href:profile.portfolio_link },
  ].filter(Boolean)

  const GRID_SIZE       = 12
  const emptySlots      = isOwner ? Math.max(0, GRID_SIZE - portfolio.length) : 0
  const gridItems       = [...portfolio.map(p => ({ ...p, isEmpty:false })), ...Array(emptySlots).fill(null).map((_,i) => ({ id:`empty-${i}`, isEmpty:true }))]
  const availableSkills = skillsForDiscs(draftDiscs)

  // Stripe Connect button state
  const isConnected  = profile.connect_onboarded === true
  const hasAccountId = !!profile.stripe_connect_id

  return (
    <div style={{display:'flex',flexDirection:'column',minHeight:'100vh'}}>

      {/* Stripe Connect toast notification */}
      {connectToast && (
        <div style={{
          position: 'fixed', top: '1.25rem', left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, padding: '0.7rem 1.25rem',
          background: connectToast === 'success' ? 'rgba(86,179,156,0.12)' : 'rgba(201,168,76,0.1)',
          border: `0.5px solid ${connectToast === 'success' ? 'rgba(86,179,156,0.4)' : 'rgba(201,168,76,0.3)'}`,
          borderRadius: '4px', backdropFilter: 'blur(8px)',
          fontFamily: 'var(--sans)', fontSize: '0.75rem',
          color: connectToast === 'success' ? 'var(--teal)' : 'var(--gold)',
          display: 'flex', alignItems: 'center', gap: '0.6rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          whiteSpace: 'nowrap',
        }}>
          <span>{connectToast === 'success' ? '✦' : '⚠'}</span>
          {connectToast === 'success'
            ? 'Payout account connected. You can now receive payments through Collective Loft.'
            : 'Onboarding not complete. You can finish setting up your payout account anytime.'}
          <button onClick={() => setConnectToast(null)} style={{background:'none',border:'none',color:'inherit',cursor:'pointer',opacity:0.5,fontSize:'0.8rem',padding:'0 0 0 0.25rem',lineHeight:1}}>✕</button>
        </div>
      )}

      <nav className={styles.nav}>
        <Link href="/" className={styles.logo} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', textDecoration: 'none', lineHeight: 1 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--serif)', fontSize: '1.6rem', fontWeight: 400, lineHeight: 1, letterSpacing: '0.02em' }}>
            <span style={{ color: '#B8922E' }}>✦</span>
            <span style={{ color: '#1A1A1A' }}>Collective <em style={{ fontStyle: 'italic', color: '#B8922E' }}>Loft</em></span>
          </span>
          <span style={{ alignSelf: 'stretch', height: '0.5px', background: 'rgba(184,146,46,0.35)', margin: '5px 0' }} />
          <span style={{ fontFamily: 'var(--sans)', fontSize: '0.5312rem', letterSpacing: '0.18em', textTransform: 'uppercase', lineHeight: 1, color: '#7A7060' }}>Where creatives find each other</span>
        </Link>
        <div className={styles.navLinks}>
          <Link href="/discover">Discover</Link>
          <Link href="/briefs">Collabs</Link>
          <Link href="/matching">Matching</Link>
          <Link href="/my-studios">My Loft Studios</Link>
          {isOwner && saving && <span className={styles.saveIndicator}>Saving…</span>}
          {isOwner && saveMsg && !saving && <span className={styles.saveIndicator}>{saveMsg}</span>}
          {isOwner && <button className={styles.btnEdit} onClick={()=>setShowEdit(true)}>Edit profile</button>}

          {/* Stripe Connect payout button — owner only */}
          {isOwner && (
            isConnected ? (
              <span style={{
                fontFamily: 'var(--sans)', fontSize: '0.65rem', fontWeight: 500,
                letterSpacing: '0.05em', color: 'var(--teal)',
                display: 'flex', alignItems: 'center', gap: '0.3rem',
              }}>
                ✦ Payouts connected
              </span>
            ) : (
              <button
                onClick={handleConnectPayout}
                disabled={connectLoading}
                className={styles.btnSignOut}
                style={{ opacity: connectLoading ? 0.6 : 1 }}
              >
                {connectLoading ? 'Redirecting…' : hasAccountId ? 'Finish payout setup' : 'Connect payout account'}
              </button>
            )
          )}

          {isOwner && (
            <button
              onClick={handleManageSubscription}
              disabled={portalLoading}
              className={styles.btnSignOut}
              style={{ opacity: portalLoading ? 0.6 : 1 }}
            >
              {portalLoading ? 'Loading…' : 'Manage subscription'}
            </button>
          )}
          {isOwner && <button className={styles.btnSignOut} onClick={handleSignOut}>Sign out</button>}
          <MemberMenu />
        </div>
      </nav>

      <div className={styles.coverBanner}>
        {profile.cover_url?<img src={profile.cover_url} alt="Cover" className={styles.coverImg}/>:<div className={styles.coverPattern}/>}
        {isOwner&&(<><button className={styles.coverUploadBtn} onClick={()=>coverInputRef.current?.click()}>{profile.cover_url?'↑ Change cover':'+ Add cover image'}</button><input ref={coverInputRef} type="file" accept="image/*" style={{display:'none'}} onChange={e=>uploadImage(e.target.files[0],'covers','cover_url')}/></>)}
      </div>

      {isOwner && emailNotice && (
        <div className={styles.epBanner}>
          <span>{emailNotice}</span>
          <button className={styles.epBannerX} onClick={()=>setEmailNotice('')}>✕</button>
        </div>
      )}
      {isOwner && studentOffer && !emailNotice && (
        <div className={styles.epBanner}>
          <span><strong>Your email is a school address.</strong> Students are free on Collective Loft: verify it and your membership costs nothing while you are enrolled.</span>
          <span className={styles.epBannerActions}>
            <button className={styles.epBannerBtn} onClick={startStudentVerify} disabled={studentSending}>{studentSending ? 'Sending your code…' : 'Verify my student email →'}</button>
            <button className={styles.epBannerX} onClick={()=>setStudentOffer(false)}>✕</button>
          </span>
        </div>
      )}

      <div className={styles.identityStrip}>
        <div className={styles.avWrap}>
          <div className={styles.avCircle} onClick={()=>isOwner&&avatarInputRef.current?.click()} style={isOwner?{cursor:'pointer'}:{}}>
            {profile.avatar_url?<img src={profile.avatar_url} alt={fullName}/>:<span>{ini}</span>}
            {isOwner&&<div className={styles.avOverlay}>↑</div>}
            <div className={styles.onlineDot}/>
          </div>
          <input ref={avatarInputRef} type="file" accept="image/*" style={{display:'none'}} onChange={e=>uploadImage(e.target.files[0],'avatars','avatar_url')}/>
        </div>
        <div className={styles.identityContent}>
          <div className={styles.identityTop}>
            <div>
              <div className={styles.profileName} style={{display:'flex',alignItems:'center',gap:'0.6rem',flexWrap:'wrap'}}>
                <Editable value={profile.firstname} onSave={v=>saveField('firstname',v)} placeholder="First name" isOwner={isOwner} editMode={editMode} className={styles.nameFirst}/>
                {' '}
                <Editable value={profile.lastname} onSave={v=>saveField('lastname',v)} placeholder="Last name" isOwner={isOwner} editMode={editMode} className={styles.nameLast}/>
                {profile.founding_member && (
                  <span title="Founding Member" style={{display:'inline-flex',alignItems:'center',gap:'0.3rem',padding:'3px 10px',borderRadius:'12px',background:'rgba(184,146,46,0.12)',border:'0.5px solid rgba(184,146,46,0.4)',fontFamily:'var(--sans)',fontSize:'0.6rem',fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--gold)',whiteSpace:'nowrap'}}>
                    <span style={{fontSize:'0.7rem'}}>✦</span>Founding Member
                  </span>
                )}
                {isOwner&&(
                  <Link href="/notifications" style={{position:'relative',display:'inline-flex',alignItems:'center',textDecoration:'none',marginLeft:'0.25rem'}}>
                    <span style={{fontSize:'1rem',color:notifCount>0?'var(--gold)':'var(--muted)',lineHeight:1}}>✉</span>
                    {notifCount>0&&<span style={{position:'absolute',top:'-6px',right:'-8px',background:'var(--gold)',color:'#0D0D0D',fontSize:'0.48rem',fontWeight:700,fontFamily:'var(--sans)',borderRadius:'10px',padding:'1px 4px',minWidth:'14px',textAlign:'center',lineHeight:'14px'}}>{notifCount>9?'9+':notifCount}</span>}
                  </Link>
                )}
              </div>
              <div className={styles.profileHeadline}>
                <Editable value={profile.headline} onSave={v=>saveField('headline',v)} placeholder="Your discipline · Your style · Your medium" isOwner={isOwner} editMode={editMode} className={styles.headlineText}/>
              </div>
            </div>
            {!isOwner&&(
              <div className={styles.actionBtns}>
                <button className={styles.btnMessage}>Message</button>
                <button className={styles.btnConnect} onClick={()=>setConnected(true)} style={connected?{background:'var(--teal)'}:{}}>{connected?'✦ Sent':'+ Connect'}</button>
              </div>
            )}
          </div>
          <div className={styles.metaRow}>
            {isOwner && editMode ? (
              <div className={styles.metaItem} style={{ position:'relative', alignItems:'flex-start' }}>
                <span>📍</span>
                {editingLoc ? (
                  <div style={{ position:'relative', minWidth:'220px' }}>
                    <input
                      type="text"
                      autoFocus
                      placeholder="Search your city…"
                      value={locQuery}
                      onChange={e => searchProfileCity(e.target.value)}
                      autoComplete="off"
                      style={{ width:'100%', padding:'0.35rem 0.5rem', fontFamily:'var(--sans)', fontSize:'0.8rem', border:'0.5px solid rgba(26,24,20,0.25)', borderRadius:'4px', background:'#fff', color:'#1A1A1A' }}
                    />
                    {locResults.length > 0 && (
                      <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:30, background:'#fff', border:'0.5px solid rgba(26,24,20,0.15)', borderRadius:'4px', marginTop:'2px', boxShadow:'0 4px 12px rgba(0,0,0,0.12)', overflow:'hidden' }}>
                        {locResults.map(f => (
                          <div key={f.id} onClick={() => pickProfileCity(f)} style={{ padding:'0.5rem 0.7rem', cursor:'pointer', fontFamily:'var(--sans)', fontSize:'0.78rem', color:'#1A1A1A', borderBottom:'0.5px solid rgba(26,24,20,0.06)' }}>
                            {f.place_name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <span onClick={() => { setEditingLoc(true); setLocQuery('') }} style={{ cursor:'pointer', borderBottom:'1px dashed rgba(184,146,46,0.5)' }}>
                    {location || 'Add location'} <span style={{ color:'var(--gold)', fontSize:'0.7rem' }}>✎</span>
                  </span>
                )}
              </div>
            ) : (
              location && <div className={styles.metaItem}><span>📍</span><span>{location}</span></div>
            )}
            <div className={styles.metaItem}><span>⊞</span><span>{profile.connections_count||0} collaborators</span></div>
            <div className={styles.metaItem}><span>◎</span><span>{studios.length} collabs completed</span></div>
            {profile.connect_onboarded && <div className={styles.metaItem} style={{ color: '#2A7A68', fontWeight: 700 }}><span>✓</span><span>Payout ready</span></div>}
          </div>
          <div className={styles.profileTags}>
            {profile.availability==='open'&&<span className={`${styles.ptag} ${styles.ptagOpen}`}>Open to collabs</span>}
            {disciplines.length > 0 && (
              <div className={styles.tagRow}>
                <span className={styles.tagRowLabel} style={{color:'var(--gold)'}}>Disciplines</span>
                {disciplines.slice(0,3).map(d=><span key={d} className={`${styles.ptag} ${styles.ptagDisc}`}>{d}</span>)}
              </div>
            )}
            {skills.length > 0 && (
              <div className={styles.tagRow}>
                <span className={styles.tagRowLabel}>Skills</span>
                {skills.slice(0,3).map(s=><span key={s} className={styles.ptag}>{s}</span>)}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.tabsBar}>
        {['about','work','briefs','collabs','community'].map(tab=>(
          <div key={tab} className={`${styles.tab} ${activeTab===tab?styles.active:''}`} onClick={()=>setActiveTab(tab)}>
            {tab === 'community' ? 'Community Voice' : tab.charAt(0).toUpperCase()+tab.slice(1)}
          </div>
        ))}
        <Link href="/my-studios" className={styles.tab}>My Loft Studios</Link>
      </div>

      <div className={styles.profileBody} style={{flex:1}}>
        <div className={styles.profileMain}>

          {activeTab==='work'&&(
            <>
              <div className={styles.contentSection}>
                <div className={styles.rightnowCard}>
                  <div className={styles.rnLabel}>What I'm working on right now</div>
                  <div className={styles.rnText}><Editable value={profile.rightnow} onSave={v=>saveField('rightnow',v)} placeholder={isOwner?'Click to describe what you\'re actively making or looking for…':'Nothing listed right now.'} multiline isOwner={isOwner} editMode={editMode} className={styles.rnInner}/></div>
                </div>
              </div>
              <div className={styles.contentSection}>
                <div className={styles.secLabel}>Collaboration preferences</div>
                {isOwner && editMode ? (
                  <SeekingEditor
                    seekingDiscs={profile.seeking_disciplines || []}
                    seekingSkills={profile.seeking_skills || []}
                    onSave={async (discs, skills) => {
                      await saveField('seeking_disciplines', discs)
                      await saveField('seeking_skills', skills)
                    }}
                  />
                ) : (
                  <div className={styles.seekingView}>
                    {(profile.seeking_disciplines||[]).length === 0 && (profile.seeking_skills||[]).length === 0 ? (
                      <span className={styles.prefInner}>{isOwner ? 'Enter edit mode to set your collaboration preferences.' : 'Not specified.'}</span>
                    ) : (
                      <>
                        {(profile.seeking_disciplines||[]).length > 0 && (
                          <div className={styles.seekingRow}>
                            <span className={styles.seekingRowLabel}>Disciplines</span>
                            <div className={styles.seekingTags}>
                              {(profile.seeking_disciplines||[]).map(d => <span key={d} className={styles.seekingTag}>{d}</span>)}
                            </div>
                          </div>
                        )}
                        {(profile.seeking_skills||[]).length > 0 && (
                          <div className={styles.seekingRow}>
                            <span className={styles.seekingRowLabel}>Skills</span>
                            <div className={styles.seekingTags}>
                              {(profile.seeking_skills||[]).map(s => <span key={s} className={`${styles.seekingTag} ${styles.seekingTagSkill}`}>{s}</span>)}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className={styles.contentSection}>
                <div className={styles.secLabelRow}>
                  <div className={styles.secLabel}>Portfolio</div>
                  {isOwner&&<div className={styles.portfolioHint}>{uploading?'Uploading…':'Click any slot to upload: images, video, audio, or PDF'}</div>}
                </div>
                <input ref={portfolioInputRef} type="file" accept="image/*,video/*,audio/*,.pdf" style={{display:'none'}} onChange={e=>{if(e.target.files[0])uploadPortfolioItem(e.target.files[0]);e.target.value=''}}/>
                {portfolio.length===0&&!isOwner?<div className={styles.emptyState}>No portfolio items yet.</div>:(
                  <div className={styles.portfolioGrid}>
                    {gridItems.map(item=>{
                      if(item.isEmpty)return<div key={item.id} className={`${styles.portfolioSlot} ${styles.emptySlot}`} onClick={()=>!uploading&&portfolioInputRef.current?.click()}><div className={styles.slotPlus}>+</div></div>
                      return(
                        <div key={item.id} className={styles.portfolioSlot} onClick={()=>setLightboxIdx(portfolio.findIndex(p=>p.id===item.id))}>
                          {item.type==='image'&&<img src={item.file_url} alt={item.title||''} className={styles.slotImage}/>}
                          {item.type==='video'&&<div className={styles.slotVideo}><video src={item.file_url} className={styles.slotVideoEl} muted/><div className={styles.slotPlayBtn}>▶</div></div>}
                          {item.type==='audio'&&<div className={styles.slotAudio}><div className={styles.slotAudioIcon}>🎵</div><div className={styles.slotAudioWave}>{Array(12).fill(0).map((_,j)=><div key={j} className={styles.waveBar} style={{height:`${20+Math.random()*60}%`}}/>)}</div></div>}
                          {item.type==='document'&&<div className={styles.slotDoc}><div className={styles.slotDocIcon}>📄</div><div className={styles.slotDocTitle}>{item.title||'Document'}</div></div>}
                          <div className={styles.slotOverlay}>
                            <div className={styles.slotTypeIcon}>{typeIcon(item.type)}</div>
                            <div className={styles.slotTitle}>{item.title||item.type}</div>
                            {isOwner&&<button className={styles.slotDelete} onClick={e=>{e.stopPropagation();deletePortfolioItem(item.id)}}>✕</button>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
              <div className={styles.contentSection}>
                <div className={styles.secLabel}>Past collaborations</div>
                {studios.length===0
                  ? <div className={styles.emptyState}>No completed collaborations yet.</div>
                  : studios.map(s => <CompletedCollabCard key={s.id} studio={s} profileId={profileId}/>)
                }
              </div>
            </>
          )}

          {activeTab==='about'&&(
            <>
              <div className={styles.contentSection}>
                <div className={styles.secLabel}>Bio</div>
                <div className={styles.bioText}><Editable value={profile.bio} onSave={v=>saveField('bio',v)} placeholder={isOwner?'Click to add your bio…':'No bio.'} multiline isOwner={isOwner} editMode={editMode} className={styles.bioInner}/></div>
              </div>
              <div className={styles.contentSection}>
                <div className={styles.secLabel}>Disciplines &amp; skills</div>
                {editingDiscs?(
                  <div>
                    <div className={styles.discEditGrid}>{DISC_OPTS.map(d=><div key={d.id} className={`${styles.discEditOpt} ${draftDiscs.includes(d.label)?styles.on:''}`} onClick={()=>toggleDraftDisc(d.label)}><span>{d.icon}</span> {d.label}</div>)}</div>
                    <div className={styles.editActions}><button className={styles.saveBtn} onClick={saveDiscs}>Save disciplines</button><button className={styles.cancelBtn} onClick={()=>{setEditingDiscs(false);setDraftDiscs(disciplines);setDraftSkills(skills)}}>Cancel</button></div>
                  </div>
                ):(
                  <div className={styles.discTags} style={{marginBottom:'1rem'}}>
                    {disciplines.map(d=><span key={d} className={styles.discTag}>{d}</span>)}
                    {isOwner&&editMode&&<button className={styles.editTagsBtn} onClick={()=>{setDraftDiscs(disciplines);setDraftSkills(skills);setEditingDiscs(true)}}>✎ Edit</button>}
                  </div>
                )}
                {editingSkills?(
                  <div>
                    {availableSkills.length===0?<div className={styles.emptyState}>Select at least one discipline above.</div>:<div className={styles.skillEditGrid}>{availableSkills.map(s=><div key={s} className={`${styles.skillEditOpt} ${draftSkills.includes(s)?styles.on:''}`} onClick={()=>setDraftSkills(prev=>prev.includes(s)?prev.filter(x=>x!==s):[...prev,s])}>{s}</div>)}</div>}
                    <div className={styles.editActions}><button className={styles.saveBtn} onClick={saveSkills}>Save skills</button><button className={styles.cancelBtn} onClick={()=>{setEditingSkills(false);setDraftSkills(skills)}}>Cancel</button></div>
                  </div>
                ):(
                  <div className={styles.skillList}>
                    {skills.slice(0,8).map((s) => {
                      const rating = (profile.skill_ratings || {})[s] || 0
                      return (
                        <div key={s} className={styles.skillRow}>
                          <span className={styles.skillName}>{s}</span>
                          {isOwner && editMode ? (
                            <div style={{ display:'flex', gap:'0.2rem', alignItems:'center' }}>
                              {[1,2,3,4,5].map(n => (
                                <button key={n} type="button"
                                  onClick={async () => {
                                    const newR = { ...(profile.skill_ratings || {}), [s]: profile.skill_ratings?.[s] === n ? 0 : n }
                                    await saveField('skill_ratings', newR)
                                  }}
                                  style={{ width:'22px', height:'5px', borderRadius:'1px', border:'none', cursor:'pointer', transition:'all 0.15s', background: n <= rating ? 'var(--gold)' : 'rgba(26,24,20,0.18)' }}
                                  title={SKILL_LEVEL_LABELS[n]}
                                />
                              ))}
                              {rating > 0 && <span style={{ fontSize:'0.52rem', color:'var(--muted)', marginLeft:'0.25rem' }}>{SKILL_LEVEL_LABELS[rating]}</span>}
                            </div>
                          ) : (
                            <div className={styles.skillBarBg}>
                              <div className={styles.skillBarFill} style={{ width: rating > 0 ? `${(rating/5)*100}%` : '22%', opacity: rating > 0 ? 1 : 0.3 }}/>
                            </div>
                          )}
                        </div>
                      )
                    })}
                    {isOwner&&editMode&&<button className={styles.editTagsBtn} onClick={()=>{setDraftSkills(skills);setEditingSkills(true)}}>✎ Edit skills</button>}
                  </div>
                )}
              </div>
              {isOwner&&editMode&&(
                <div className={styles.contentSection}>
                  <div className={styles.secLabel}>Links &amp; social</div>
                  <div className={styles.linksEditGrid}>
                    {[['website','Personal website','https://yoursite.com'],['instagram','Instagram','@yourhandle'],['soundcloud','SoundCloud / Spotify','https://soundcloud.com/…'],['portfolio_link','Portfolio link','https://behance.net/…'],['other_link','Other link','https://…']].map(([field,label,ph])=>(
                      <div key={field} className={styles.linkEditRow}><span className={styles.linkLabel}>{label}</span><Editable value={profile[field]} onSave={v=>saveField(field,v)} placeholder={ph} isOwner={isOwner} editMode={editMode} className={styles.linkValue}/></div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab==='collabs'&&(
            <div className={styles.contentSection}>
              <div className={styles.secLabel}>Collaboration history</div>
              {studios.length === 0
                ? <div className={styles.emptyState}>Once you complete a collab through Collective Loft, it will appear here.</div>
                : studios.map(s => <CompletedCollabCard key={s.id} studio={s} profileId={profileId}/>)
              }
            </div>
          )}

          {activeTab==='community'&&(
            <div className={styles.contentSection}>
              <div className={styles.secLabel}>
                Community Voice
                {ratings.length > 0 && <span style={{marginLeft:'0.5rem',fontFamily:'var(--sans)',fontSize:'0.6rem',color:'var(--muted)',letterSpacing:'normal',textTransform:'none'}}>({ratings.length} {ratings.length === 1 ? 'review' : 'reviews'})</span>}
              </div>
              {ratings.length === 0 ? (
                <div className={styles.emptyState}>No reviews yet. Completed collabs will appear here.</div>
              ) : (() => {
                const filtered = starFilter.length === 0 ? ratings : ratings.filter(r => starFilter.includes(r.stars))
                const toggleStar = (n) => setStarFilter(prev => prev.includes(n) ? prev.filter(s => s !== n) : [...prev, n])
                const countFor = (n) => ratings.filter(r => r.stars === n).length
                return (
                <>
                  <div style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:'0.4rem', marginBottom:'1.25rem' }}>
                    <span style={{ fontFamily:'var(--sans)', fontSize:'0.6rem', letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--muted)', marginRight:'0.35rem' }}>Filter</span>
                    <button onClick={() => setStarFilter([])} style={{
                      fontFamily:'var(--sans)', fontSize:'0.66rem', fontWeight:600, cursor:'pointer',
                      padding:'4px 10px', borderRadius:'3px', transition:'all 0.15s',
                      border: starFilter.length === 0 ? '1px solid var(--gold)' : '0.5px solid rgba(26,24,20,0.18)',
                      background: starFilter.length === 0 ? 'rgba(184,146,46,0.12)' : 'transparent',
                      color: starFilter.length === 0 ? 'var(--gold)' : 'var(--muted)',
                    }}>All</button>
                    {[5,4,3,2,1].map(n => {
                      const c = countFor(n)
                      const active = starFilter.includes(n)
                      return (
                        <button key={n} onClick={() => toggleStar(n)} disabled={c === 0} style={{
                          fontFamily:'var(--sans)', fontSize:'0.66rem', fontWeight:600,
                          cursor: c === 0 ? 'default' : 'pointer', padding:'4px 10px', borderRadius:'3px', transition:'all 0.15s',
                          display:'inline-flex', alignItems:'center', gap:'3px',
                          border: active ? '1px solid var(--gold)' : '0.5px solid rgba(26,24,20,0.18)',
                          background: active ? 'rgba(184,146,46,0.12)' : 'transparent',
                          color: c === 0 ? 'rgba(26,24,20,0.25)' : active ? 'var(--gold)' : 'var(--cream)',
                          opacity: c === 0 ? 0.5 : 1,
                        }}>
                          {n}<span style={{ color: active ? 'var(--gold)' : c === 0 ? 'rgba(26,24,20,0.25)' : 'var(--muted)' }}>★</span>
                          <span style={{ fontSize:'0.56rem', color:'var(--muted)', fontWeight:400 }}>({c})</span>
                        </button>
                      )
                    })}
                  </div>
                  {filtered.length === 0 ? (
                    <div className={styles.emptyState}>No {starFilter.length === 1 ? `${starFilter[0]}-star` : 'matching'} reviews.</div>
                  ) : (
                  <div className={styles.cvList}>
                  {filtered.map(r => {
                    const rater = r.rater
                    const raterName = rater ? `${rater.firstname} ${rater.lastname}` : 'Collaborator'
                    const raterInit = rater ? `${(rater.firstname||'?')[0]}${(rater.lastname||'?')[0]}`.toUpperCase() : '??'
                    return (
                      <div key={r.id} className={styles.cvCard}>
                        <div className={styles.cvCardTop}>
                          <div className={styles.cvRaterRow}>
                            <div className={styles.cvAv}>{raterInit}</div>
                            <div className={styles.cvRaterInfo}>
                              <div className={styles.cvRaterName}>{raterName}</div>
                              {rater?.headline && <div className={styles.cvRaterHeadline}>{rater.headline}</div>}
                            </div>
                            <div className={styles.cvStars}>
                              {[1,2,3,4,5].map(n => (
                                <span key={n} className={r.stars >= n ? styles.cvStarLit : styles.cvStarDim}>★</span>
                              ))}
                            </div>
                          </div>
                        </div>
                        {r.review && <div className={styles.cvReview}>"{r.review}"</div>}
                        {(r.endorsements||[]).length > 0 && (
                          <div className={styles.cvTags}>
                            {r.endorsements.map(tag => <span key={tag} className={styles.cvTag}>{tag}</span>)}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                  )}
                </>
                )
              })()}
            </div>
          )}

          {activeTab==='briefs'&&(
            <div className={styles.contentSection}>
              {briefsLoading?<div className={styles.emptyState}>Loading…</div>:(
                <>
                  <div style={{marginBottom:'2rem'}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'0.75rem'}}>
                      <div className={styles.secLabel} style={{margin:0}}>
                        Active briefs
                        {activeBriefs.length>0&&<span style={{marginLeft:'0.5rem',fontFamily:'var(--sans)',fontSize:'0.6rem',color:'var(--muted)'}}>({activeBriefs.length})</span>}
                      </div>
                      <Link href="/briefs?post=true" style={{fontFamily:'var(--sans)',fontSize:'0.62rem',color:'var(--gold)',textDecoration:'none',letterSpacing:'0.04em'}}>+ Post a brief</Link>
                    </div>
                    {activeBriefs.length===0
                      ?<div className={styles.emptyState}>No active briefs. Post one to find collaborators.</div>
                      :activeBriefs.map(b=><ActiveBriefCard key={b.id} brief={b} onDelete={deleteBrief} profileSlug={username}/>)
                    }
                  </div>
                  {isOwner&&(
                    <div style={{marginBottom:'2rem'}}>
                      <div className={styles.secLabel} style={{marginBottom:'0.75rem'}}>
                        In negotiation
                        {negotiations.length>0&&<span style={{marginLeft:'0.5rem',fontFamily:'var(--sans)',fontSize:'0.6rem',color:'var(--muted)'}}>({negotiations.length})</span>}
                      </div>
                      {negotiations.length===0
                        ?<div className={styles.emptyState}>No active negotiations.</div>
                        :negotiations.map(t=><NegotiationCard key={t.id} term={t} currentUserId={currentUserId}/>)
                      }
                    </div>
                  )}
                  {isOwner&&(
                    <div>
                      <div className={styles.secLabel} style={{marginBottom:'0.75rem'}}>
                        Applied briefs
                        {appliedBriefs.length>0&&<span style={{marginLeft:'0.5rem',fontFamily:'var(--sans)',fontSize:'0.6rem',color:'var(--muted)'}}>({appliedBriefs.length})</span>}
                      </div>
                      {appliedBriefs.length===0
                        ?<div className={styles.emptyState}>No applications sent yet.</div>
                        :appliedBriefs.map(b=><AppliedBriefCard key={b.id} brief={b} onSelect={setSelectedBrief}/>)
                      }
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <aside className={styles.profileSidebar}>
          <div>
            <div className={styles.sbLabel}>Activity</div>
            <div className={styles.statGrid}>
              <div className={styles.statCard}><div className={styles.statNum}>{studios.length}</div><div className={styles.statLbl}>Collabs</div></div>
              <div className={styles.statCard}><div className={styles.statNum}>{profile.connections_count||0}</div><div className={styles.statLbl}>Collaborators</div></div>
              <div className={styles.statCard}><div className={styles.statNum}>{avgRating||'—'}</div><div className={styles.statLbl}>Rating</div></div>
              <div className={styles.statCard}><div className={styles.statNum}>{ratings.length}</div><div className={styles.statLbl}>Reviews</div></div>
            </div>
          </div>
          {(profile.seeking||profile.compensation?.length)&&(
            <div className={styles.availCard}>
              <div className={styles.availTitle}>Open to collaborate</div>
              <div className={styles.availText}>{[profile.seeking&&`Seeking ${profile.seeking}.`,locationLabel(profile.location_preference)&&`${locationLabel(profile.location_preference)}.`,profile.compensation?.length&&`${profile.compensation.join(' or ')}.`].filter(Boolean).join(' ')}</div>
            </div>
          )}
          {disciplines.length>0&&<div><div className={styles.sbLabel}>Disciplines</div><div className={styles.discTags}>{disciplines.map(d=><span key={d} className={styles.discTag}>{d}</span>)}</div></div>}
          {skills.length>0&&(
            <div>
              <div className={styles.sbLabel}>Skills</div>
              <div className={styles.skillList}>{skills.slice(0,6).map((s)=>{
                const rating = (profile.skill_ratings || {})[s] || 0
                return (
                  <div key={s} className={styles.skillRow}>
                    <span className={styles.skillName}>{s}</span>
                    <div className={styles.skillBarBg}>
                      <div className={styles.skillBarFill} style={{ width: rating > 0 ? `${(rating/5)*100}%` : '22%', opacity: rating > 0 ? 1 : 0.3 }}/>
                    </div>
                  </div>
                )
              })}</div>
            </div>
          )}
          {ratings.length>0&&(
            <div>
              <div className={styles.sbLabel}>Community voice</div>
              <div className={styles.endorsements}>
                {ratings.slice(0,3).map(r=>{
                  const rater=r.rater;const raterName=rater?`${rater.firstname} ${rater.lastname}`:'Collaborator'
                  return r.review?<div key={r.id} className={styles.endorse}><div className={styles.endorseText}>"{r.review}"</div><div className={styles.endorseBy}>— {raterName}{rater?.headline?`, ${rater.headline}`:''}</div></div>:null
                }).filter(Boolean)}
              </div>
            </div>
          )}
          {links.length>0&&(
            <div>
              <div className={styles.sbLabel}>Links</div>
              <div className={styles.profileLinks}>{links.map((l,i)=><a key={i} href={l.href} target="_blank" rel="noopener noreferrer" className={styles.profileLink}><span className={styles.linkIcon}>{l.icon}</span><span>{l.label}</span></a>)}</div>
            </div>
          )}
        </aside>
      </div>

      <Footer/>

      {selectedBrief&&<BriefModal brief={selectedBrief} isOwner={isOwner} onClose={()=>setSelectedBrief(null)} onDelete={id=>{deleteBrief(id);setSelectedBrief(null)}}/>}
      {showEdit && (
        <EditProfileModal
          profile={profile}
          userEmail={sessionEmail}
          onClose={()=>setShowEdit(false)}
          onSaved={(patch, emailChange) => {
            if (Object.keys(patch).length > 0) setProfile(p => ({ ...p, ...patch }))
            if (emailChange) {
              setEmailNotice(`Confirmation links are on their way to ${sessionEmail} and ${emailChange.newEmail}. The email change completes once both are confirmed${emailChange.academic ? ', and your new school address can then be verified for free student membership' : ''}.`)
            }
            setShowEdit(false)
            flashSave()
          }}
        />
      )}
      {lightboxIdx!==null&&<Lightbox items={portfolio} startIndex={lightboxIdx} onClose={()=>setLightboxIdx(null)}/>}
    </div>
  )
}
