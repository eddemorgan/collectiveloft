'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import Footer from '../../components/Footer'
import styles from './profile.module.css'

const SKILL_WIDTHS = [95, 88, 78, 65, 55, 48, 42, 38]

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

const SKILLS_BY_DISC = {
  visual:  ['Oil on canvas','Watercolour','Illustration','Large format','Art direction','Sculpture','Mixed media','Printmaking'],
  music:   ['Beat production','Mixing & mastering','Co-writing','Film scoring','Songwriting','Vocals','Sound design','Session musician'],
  writing: ['Poetry','Copywriting','Editing','Screenwriting','Fiction','Arts writing','Grant writing','Writer','Novel','Short Story'],
  design:  ['Web design','Branding','UX design','Motion design','Typography','Print design'],
  film:    ['Cinematography','Directing','Film editing','Documentary','Short film'],
  photo:   ['Portrait photography','Fine art photography','Documentary photography','Landscape photography'],
  perf:    ['Choreography','Spoken word','Theatre','Dance','Singer','Acting'],
  tech:    ['Creative coding','Generative art','Interactive installation','Audio-visual'],
}

const RIGHTS_LABELS = {
  transfer: 'Full transfer on payment', shared: 'Shared credit',
  license: 'License only', negotiate: 'Negotiate separately',
}

function skillsForDiscs(discLabels) {
  return discLabels.flatMap(label => {
    const disc = DISC_OPTS.find(d => d.label === label)
    return disc ? (SKILLS_BY_DISC[disc.id] || []) : []
  })
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

// ─── ALL TOP-LEVEL COMPONENTS ────────────────────────────────────────────────
// These must be outside ProfilePage to prevent remount on every render

function TermsField({ label, value, original, onChange, type, children, locked }) {
  const changed = original !== undefined && value !== original && value !== ''
  return (
    <div style={{ marginBottom:'0.85rem' }}>
      <label style={{ display:'block', fontFamily:'var(--sans)', fontSize:'0.65rem', letterSpacing:'0.06em', textTransform:'uppercase', color:changed?'var(--gold)':'rgba(240,236,227,0.4)', marginBottom:'0.3rem' }}>
        {label} {changed && <span style={{ fontSize:'0.55rem', opacity:0.7 }}>· modified</span>}
      </label>
      {locked ? (
        <div style={{ fontFamily:'var(--sans)', fontSize:'0.8rem', color:'rgba(240,236,227,0.5)', padding:'0.5rem 0.75rem', background:'rgba(240,236,227,0.03)', border:'0.5px solid rgba(240,236,227,0.08)', borderRadius:'3px' }}>{value || '—'}</div>
      ) : children ? children : (
        <input type={type||'text'} value={value||''} onChange={e => onChange(e.target.value)} style={{ width:'100%', boxSizing:'border-box', background:'var(--bg1)', border:`0.5px solid ${changed?'var(--gold)':'rgba(240,236,227,0.12)'}`, borderRadius:'3px', padding:'0.5rem 0.75rem', fontFamily:'var(--sans)', fontSize:'0.8rem', color:'var(--cream)', outline:'none', boxShadow:changed?'0 0 0 2px rgba(201,168,76,0.1)':'none' }} />
      )}
    </div>
  )
}

// TermsReviewCard -- fully outside ProfilePage, receives everything as props
// This is critical: defining it inside ProfilePage causes React to remount it
// on every state change, destroying input focus
function TermsReviewCard({
  term, currentUserId,
  actingTerms, modifyingId, modifyDraft, originals,
  onAccept, onDecline, onStartModify, onSubmitModify, onCancelModify,
  onModifyDraftChange,
}) {
  const isActing    = actingTerms[term.id]
  const isModifying = modifyingId === term.id

  // Determine whose turn it is using the passed currentUserId directly
  // This avoids stale closure over component state
  let myTurn = false
  if (currentUserId) {
    if (term.current_editor === 'initiator') myTurn = term.initiator_id === currentUserId
    if (term.current_editor === 'partner')   myTurn = term.partner_id   === currentUserId
  }

  // Determine partner
  const partner = currentUserId
    ? (term.initiator_id === currentUserId ? term.partner : term.initiator)
    : null
  const partnerSlug = partner
    ? `${partner.firstname.toLowerCase()}-${partner.lastname.toLowerCase()}`
    : null

  const compType = term.collab_type === 'exchange' ? 'Creative exchange'
    : term.collab_type === 'paid' ? `Paid${term.fee_from?` · $${term.fee_from}${term.fee_to?'–'+term.fee_to:''}`:''}`
    : 'Revenue share'

  const draft = isModifying ? modifyDraft : {}
  const orig  = isModifying ? originals   : {}

  return (
    <div style={{ background:'rgba(240,236,227,0.02)', border:`0.5px solid ${myTurn?'rgba(201,168,76,0.3)':'rgba(240,236,227,0.08)'}`, borderRadius:'4px', padding:'1.1rem', marginBottom:'0.65rem', boxShadow:myTurn?'0 0 0 1px rgba(201,168,76,0.08)':'none' }}>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.5rem' }}>
        <span style={{ fontFamily:'var(--sans)', fontSize:'0.55rem', fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', padding:'2px 8px', borderRadius:'2px', background:myTurn?'rgba(201,168,76,0.15)':'rgba(240,236,227,0.06)', color:myTurn?'var(--gold)':'rgba(240,236,227,0.35)' }}>
          {myTurn ? 'Your turn to review' : 'Awaiting their review'}
        </span>
        <span style={{ fontFamily:'var(--sans)', fontSize:'0.62rem', color:'rgba(240,236,227,0.3)' }}>{compType}</span>
      </div>

      <div style={{ fontFamily:'var(--sans)', fontSize:'0.82rem', fontWeight:600, color:'var(--cream)', marginBottom:'0.25rem' }}>{term.project_title || 'Untitled project'}</div>

      <div style={{ fontFamily:'var(--sans)', fontSize:'0.7rem', color:'rgba(240,236,227,0.4)', marginBottom:'0.85rem' }}>
        With{' '}
        {partnerSlug
          ? <Link href={`/profile/${partnerSlug}`} style={{ color:'var(--teal)', textDecoration:'none' }}>{partner?.firstname} {partner?.lastname}</Link>
          : `${partner?.firstname || '?'} ${partner?.lastname || ''}`}
        {myTurn ? ' · sent you terms to review' : ' · reviewing your terms'}
      </div>

      {/* Terms summary when not modifying */}
      {!isModifying && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.35rem', marginBottom:'0.85rem' }}>
          {[
            ['Type', compType],
            term.rights   && ['Rights',    RIGHTS_LABELS[term.rights] || term.rights],
            term.timeline  && ['Timeline',  term.timeline],
            term.location  && ['Location',  term.location],
            term.fee_from  && ['Fee',       `$${term.fee_from}${term.fee_to?'–'+term.fee_to:''}`],
            term.deadline  && ['Deadline',  new Date(term.deadline).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })],
          ].filter(Boolean).map(([k, v]) => (
            <div key={k} style={{ background:'rgba(240,236,227,0.03)', border:'0.5px solid rgba(240,236,227,0.06)', borderRadius:'2px', padding:'0.4rem 0.6rem' }}>
              <div style={{ fontFamily:'var(--sans)', fontSize:'0.55rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(240,236,227,0.25)', marginBottom:'0.15rem' }}>{k}</div>
              <div style={{ fontFamily:'var(--sans)', fontSize:'0.72rem', color:'var(--cream)' }}>{v}</div>
            </div>
          ))}
        </div>
      )}

      {/* Modify form */}
      {isModifying && (
        <div style={{ marginTop:'0.5rem', marginBottom:'0.75rem' }}>
          <div style={{ fontFamily:'var(--sans)', fontSize:'0.58rem', letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--gold)', marginBottom:'0.85rem', opacity:0.8 }}>
            Modifying terms — project title is locked
          </div>
          <TermsField label="Project title" value={term.project_title} locked />
          <TermsField label="Timeline" value={draft.timeline} original={orig.timeline}
            onChange={v => onModifyDraftChange({ ...draft, timeline: v })} />
          <TermsField label="Deadline" value={draft.deadline} original={orig.deadline} type="date"
            onChange={v => onModifyDraftChange({ ...draft, deadline: v })} />
          <TermsField label="Location" value={draft.location} original={orig.location}
            onChange={v => onModifyDraftChange({ ...draft, location: v })}>
            <select value={draft.location||''} onChange={e => onModifyDraftChange({ ...draft, location: e.target.value })}
              style={{ width:'100%', background:'var(--bg1)', border:`0.5px solid ${draft.location!==orig.location?'var(--gold)':'rgba(240,236,227,0.12)'}`, borderRadius:'3px', padding:'0.5rem 0.75rem', fontFamily:'var(--sans)', fontSize:'0.8rem', color:'var(--cream)', outline:'none' }}>
              <option value="">Select…</option><option>Local only</option><option>Remote OK</option><option>Remote only</option><option>No preference</option>
            </select>
          </TermsField>
          {term.collab_type === 'paid' && (
            <>
              <TermsField label="Fee from" value={draft.fee_from} original={orig.fee_from}
                onChange={v => onModifyDraftChange({ ...draft, fee_from: v })} />
              <TermsField label="Fee to" value={draft.fee_to} original={orig.fee_to}
                onChange={v => onModifyDraftChange({ ...draft, fee_to: v })} />
              <TermsField label="Payment schedule" value={draft.pay_schedule} original={orig.pay_schedule}
                onChange={v => onModifyDraftChange({ ...draft, pay_schedule: v })}>
                <select value={draft.pay_schedule||''} onChange={e => onModifyDraftChange({ ...draft, pay_schedule: e.target.value })}
                  style={{ width:'100%', background:'var(--bg1)', border:`0.5px solid ${draft.pay_schedule!==orig.pay_schedule?'var(--gold)':'rgba(240,236,227,0.12)'}`, borderRadius:'3px', padding:'0.5rem 0.75rem', fontFamily:'var(--sans)', fontSize:'0.8rem', color:'var(--cream)', outline:'none' }}>
                  <option value="">Select…</option><option>50% upfront, 50% on delivery</option><option>Milestone-based</option><option>On delivery</option><option>Monthly retainer</option>
                </select>
              </TermsField>
            </>
          )}
          {term.collab_type === 'revenue' && (
            <>
              <TermsField label="My share" value={draft.my_share} original={orig.my_share}
                onChange={v => onModifyDraftChange({ ...draft, my_share: v })} />
              <TermsField label="Their share" value={draft.their_share} original={orig.their_share}
                onChange={v => onModifyDraftChange({ ...draft, their_share: v })} />
              <TermsField label="Revenue sources" value={draft.rev_sources} original={orig.rev_sources}
                onChange={v => onModifyDraftChange({ ...draft, rev_sources: v })} />
            </>
          )}
        </div>
      )}

      {/* Actions */}
      {myTurn && !isModifying && (
        <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
          <button onClick={() => onAccept(term)} disabled={!!isActing}
            style={{ background:'var(--gold)', color:'#0D0D0D', border:'none', borderRadius:'3px', padding:'0.4rem 0.9rem', fontFamily:'var(--sans)', fontSize:'0.62rem', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer', opacity:isActing?0.5:1 }}>
            {isActing === 'accepting' ? 'Opening…' : 'Accept ↗'}
          </button>
          <button onClick={() => onStartModify(term)} disabled={!!isActing}
            style={{ background:'none', border:'0.5px solid rgba(201,168,76,0.3)', borderRadius:'3px', padding:'0.4rem 0.9rem', fontFamily:'var(--sans)', fontSize:'0.62rem', color:'var(--gold)', letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer' }}>
            Modify
          </button>
          <button onClick={() => onDecline(term)} disabled={!!isActing}
            style={{ background:'none', border:'0.5px solid rgba(194,112,128,0.25)', borderRadius:'3px', padding:'0.4rem 0.9rem', fontFamily:'var(--sans)', fontSize:'0.62rem', color:'#c27080', letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer', opacity:isActing?0.5:1 }}>
            {isActing === 'declining' ? 'Declining…' : 'Decline'}
          </button>
        </div>
      )}

      {myTurn && isModifying && (
        <div style={{ display:'flex', gap:'0.5rem' }}>
          <button onClick={() => onSubmitModify(term)} disabled={!!isActing}
            style={{ background:'var(--gold)', color:'#0D0D0D', border:'none', borderRadius:'3px', padding:'0.4rem 0.9rem', fontFamily:'var(--sans)', fontSize:'0.62rem', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer', opacity:isActing?0.5:1 }}>
            {isActing === 'modifying' ? 'Sending…' : 'Send modified terms ↗'}
          </button>
          <button onClick={onCancelModify}
            style={{ background:'none', border:'0.5px solid rgba(240,236,227,0.15)', borderRadius:'3px', padding:'0.4rem 0.9rem', fontFamily:'var(--sans)', fontSize:'0.62rem', color:'rgba(240,236,227,0.5)', letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer' }}>
            Cancel
          </button>
        </div>
      )}

      {!myTurn && (
        <div style={{ fontFamily:'var(--sans)', fontSize:'0.68rem', color:'rgba(240,236,227,0.3)', fontStyle:'italic' }}>
          Waiting for {partner?.firstname} to review…
        </div>
      )}
    </div>
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
    const props = { ref, value: draft, onChange: e => setDraft(e.target.value),
      onBlur: () => { setEditing(false); if (draft !== value) onSave(draft) },
      onKeyDown: e => { if (e.key==='Enter'&&!multiline){setEditing(false);onSave(draft)} if(e.key==='Escape'){setEditing(false);setDraft(value||'')} },
      className: `${styles.editInput} ${multiline?styles.editTextarea:''}`, placeholder }
    return multiline ? <textarea {...props} rows={4} /> : <input type="text" {...props} />
  }
  return (
    <span className={`${className} ${styles.editableField}`} onClick={() => setEditing(true)} title="Click to edit">
      {value || <span className={styles.editPlaceholder}>{placeholder}</span>}
      <span className={styles.editPencil}>✎</span>
    </span>
  )
}

function Lightbox({ items, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex)
  const item = items[idx]
  useEffect(() => {
    function onKey(e) {
      if (e.key==='Escape') onClose()
      if (e.key==='ArrowRight') setIdx(i => Math.min(i+1, items.length-1))
      if (e.key==='ArrowLeft')  setIdx(i => Math.max(i-1, 0))
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
      <div style={{background:'var(--bg1)',border:'0.5px solid rgba(240,236,227,0.1)',borderRadius:'6px',width:'100%',maxWidth:'560px',maxHeight:'85vh',overflowY:'auto',padding:'2rem',position:'relative'}}>
        <button onClick={onClose} style={{position:'absolute',top:'1rem',right:'1rem',background:'none',border:'none',color:'rgba(240,236,227,0.35)',fontSize:'1rem',cursor:'pointer',lineHeight:1}}>✕</button>
        <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap',marginBottom:'0.75rem'}}>
          {(brief.disciplines||[]).map(d=><span key={d} style={{fontFamily:'var(--sans)',fontSize:'0.58rem',fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',padding:'2px 8px',borderRadius:'2px',background:'rgba(201,168,76,0.12)',color:'var(--gold)'}}>{d}</span>)}
          {brief.compensation&&<span style={{fontFamily:'var(--sans)',fontSize:'0.58rem',fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',padding:'2px 8px',borderRadius:'2px',background:'rgba(86,179,156,0.12)',color:'var(--teal)'}}>{brief.compensation}</span>}
          <span style={{fontFamily:'var(--sans)',fontSize:'0.58rem',fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',padding:'2px 8px',borderRadius:'2px',background:brief._isApplied?'rgba(160,120,208,0.15)':'rgba(201,168,76,0.08)',color:brief._isApplied?'#a078d0':'rgba(240,236,227,0.4)'}}>{brief._isApplied?'Applied':'Active'}</span>
        </div>
        <div style={{fontFamily:'var(--serif)',fontSize:'1.4rem',color:'var(--cream)',marginBottom:'1.25rem',lineHeight:1.3}}>{brief.title}</div>
        {brief.what_making&&<div style={{marginBottom:'1rem'}}><div style={{fontFamily:'var(--sans)',fontSize:'0.6rem',letterSpacing:'0.14em',textTransform:'uppercase',color:'rgba(240,236,227,0.3)',marginBottom:'0.35rem'}}>What I'm making</div><div style={{fontFamily:'var(--sans)',fontSize:'0.78rem',color:'rgba(240,236,227,0.7)',lineHeight:1.7}}>{brief.what_making}</div></div>}
        {brief.who_needed&&<div style={{marginBottom:'1rem'}}><div style={{fontFamily:'var(--sans)',fontSize:'0.6rem',letterSpacing:'0.14em',textTransform:'uppercase',color:'rgba(240,236,227,0.3)',marginBottom:'0.35rem'}}>Who I need</div><div style={{fontFamily:'var(--sans)',fontSize:'0.78rem',color:'rgba(240,236,227,0.7)',lineHeight:1.7}}>{brief.who_needed}</div></div>}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.5rem',marginBottom:'1.5rem'}}>
          {brief.timeline&&<div style={{background:'rgba(240,236,227,0.03)',border:'0.5px solid rgba(240,236,227,0.07)',borderRadius:'3px',padding:'0.6rem 0.75rem'}}><div style={{fontFamily:'var(--sans)',fontSize:'0.58rem',letterSpacing:'0.1em',textTransform:'uppercase',color:'rgba(240,236,227,0.25)',marginBottom:'0.2rem'}}>Timeline</div><div style={{fontFamily:'var(--sans)',fontSize:'0.75rem',color:'var(--cream)'}}>{brief.timeline}</div></div>}
          {brief.location_preference&&<div style={{background:'rgba(240,236,227,0.03)',border:'0.5px solid rgba(240,236,227,0.07)',borderRadius:'3px',padding:'0.6rem 0.75rem'}}><div style={{fontFamily:'var(--sans)',fontSize:'0.58rem',letterSpacing:'0.1em',textTransform:'uppercase',color:'rgba(240,236,227,0.25)',marginBottom:'0.2rem'}}>Location</div><div style={{fontFamily:'var(--sans)',fontSize:'0.75rem',color:'var(--cream)'}}>{brief.location_preference}</div></div>}
          {brief.fee_range&&<div style={{background:'rgba(240,236,227,0.03)',border:'0.5px solid rgba(240,236,227,0.07)',borderRadius:'3px',padding:'0.6rem 0.75rem'}}><div style={{fontFamily:'var(--sans)',fontSize:'0.58rem',letterSpacing:'0.1em',textTransform:'uppercase',color:'rgba(240,236,227,0.25)',marginBottom:'0.2rem'}}>Fee range</div><div style={{fontFamily:'var(--sans)',fontSize:'0.75rem',color:'var(--gold)'}}>{brief.fee_range}</div></div>}
          {brief.deadline&&<div style={{background:'rgba(240,236,227,0.03)',border:'0.5px solid rgba(240,236,227,0.07)',borderRadius:'3px',padding:'0.6rem 0.75rem'}}><div style={{fontFamily:'var(--sans)',fontSize:'0.58rem',letterSpacing:'0.1em',textTransform:'uppercase',color:'rgba(240,236,227,0.25)',marginBottom:'0.2rem'}}>Deadline</div><div style={{fontFamily:'var(--sans)',fontSize:'0.75rem',color:'var(--cream)'}}>{new Date(brief.deadline).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div></div>}
        </div>
        {isOwner&&!brief._isApplied&&<button onClick={()=>{onDelete(brief.id);onClose()}} style={{background:'none',border:'0.5px solid rgba(194,112,128,0.3)',color:'#c27080',borderRadius:'3px',padding:'0.45rem 1rem',fontFamily:'var(--sans)',fontSize:'0.65rem',letterSpacing:'0.06em',textTransform:'uppercase',cursor:'pointer'}}>✕ Delete this brief</button>}
        {brief._isApplied&&<div style={{background:'rgba(160,120,208,0.08)',border:'0.5px solid rgba(160,120,208,0.2)',borderRadius:'4px',padding:'0.75rem 1rem',fontFamily:'var(--sans)',fontSize:'0.72rem',color:'rgba(160,120,208,0.8)'}}>You applied to this brief. The poster will reach out if they want to move forward.</div>}
      </div>
    </div>
  )
}

function BriefCard({ brief, showDelete, onSelect, onDelete }) {
  const isApplied = brief._isApplied
  return (
    <div onClick={() => onSelect(brief)} style={{ position:'relative', cursor:'pointer', background:'rgba(240,236,227,0.02)', border:`0.5px solid ${isApplied?'rgba(160,120,208,0.2)':'rgba(240,236,227,0.08)'}`, borderRadius:'4px', padding:'1rem 1.1rem', transition:'border-color 0.15s, background 0.15s', marginBottom:'0.65rem' }}
      onMouseEnter={e=>{e.currentTarget.style.background='rgba(240,236,227,0.04)';e.currentTarget.style.borderColor=isApplied?'rgba(160,120,208,0.35)':'rgba(201,168,76,0.25)'}}
      onMouseLeave={e=>{e.currentTarget.style.background='rgba(240,236,227,0.02)';e.currentTarget.style.borderColor=isApplied?'rgba(160,120,208,0.2)':'rgba(240,236,227,0.08)'}}>
      {showDelete&&<button onClick={e=>{e.stopPropagation();if(!confirm('Delete this brief? This cannot be undone.'))return;onDelete(brief.id)}} style={{position:'absolute',top:'0.6rem',right:'0.6rem',background:'none',border:'none',color:'rgba(194,112,128,0.5)',cursor:'pointer',fontSize:'0.72rem',lineHeight:1,padding:'2px 4px',borderRadius:'2px',transition:'color 0.15s'}} onMouseEnter={e=>e.currentTarget.style.color='#c27080'} onMouseLeave={e=>e.currentTarget.style.color='rgba(194,112,128,0.5)'}>✕</button>}
      <div style={{display:'flex',gap:'0.4rem',flexWrap:'wrap',marginBottom:'0.5rem'}}>
        {(brief.disciplines||[]).slice(0,2).map(d=><span key={d} style={{fontFamily:'var(--sans)',fontSize:'0.55rem',fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',padding:'1px 6px',borderRadius:'2px',background:'rgba(201,168,76,0.1)',color:'var(--gold)'}}>{d}</span>)}
        {brief.compensation&&<span style={{fontFamily:'var(--sans)',fontSize:'0.55rem',fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',padding:'1px 6px',borderRadius:'2px',background:'rgba(86,179,156,0.1)',color:'var(--teal)'}}>{brief.compensation}</span>}
        <span style={{fontFamily:'var(--sans)',fontSize:'0.55rem',fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',padding:'1px 6px',borderRadius:'2px',background:isApplied?'rgba(160,120,208,0.12)':'rgba(201,168,76,0.06)',color:isApplied?'#a078d0':'rgba(240,236,227,0.35)'}}>{isApplied?'Applied':'Active'}</span>
      </div>
      <div style={{fontFamily:'var(--sans)',fontSize:'0.82rem',fontWeight:600,color:'var(--cream)',marginBottom:'0.3rem',paddingRight:showDelete?'1.5rem':0}}>{brief.title}</div>
      {brief.what_making&&<div style={{fontFamily:'var(--sans)',fontSize:'0.7rem',color:'rgba(240,236,227,0.45)',lineHeight:1.6,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{brief.what_making}</div>}
    </div>
  )
}

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const params   = useParams()
  const router   = useRouter()
  const username = params?.username

  const [profile,          setProfile]          = useState(null)
  const [profileId,        setProfileId]        = useState(null)
  const [currentUserId,    setCurrentUserId]    = useState(null) // store ID only, not object
  const [studios,          setStudios]          = useState([])
  const [ratings,          setRatings]          = useState([])
  const [portfolio,        setPortfolio]        = useState([])
  const [loading,          setLoading]          = useState(true)
  const [notFound,         setNotFound]         = useState(false)
  const [activeTab,        setActiveTab]        = useState('work')
  const [connected,        setConnected]        = useState(false)
  const [isOwner,          setIsOwner]          = useState(false)
  const [editMode,         setEditMode]         = useState(false)
  const [saving,           setSaving]           = useState(false)
  const [saveMsg,          setSaveMsg]          = useState('')
  const [lightboxIdx,      setLightboxIdx]      = useState(null)
  const [uploading,        setUploading]        = useState(false)
  const [editingDiscs,     setEditingDiscs]     = useState(false)
  const [editingSkills,    setEditingSkills]    = useState(false)
  const [draftDiscs,       setDraftDiscs]       = useState([])
  const [draftSkills,      setDraftSkills]      = useState([])
  const [notifCount,       setNotifCount]       = useState(0)

  const [myBriefs,         setMyBriefs]         = useState([])
  const [appliedBriefs,    setAppliedBriefs]    = useState([])
  const [termsUnderReview, setTermsUnderReview] = useState([])
  const [briefsLoading,    setBriefsLoading]    = useState(false)
  const [selectedBrief,    setSelectedBrief]    = useState(null)
  const [deletingId,       setDeletingId]       = useState(null)

  const [actingTerms,  setActingTerms]  = useState({})
  const [modifyingId,  setModifyingId]  = useState(null)
  const [modifyDraft,  setModifyDraft]  = useState({})
  const [originals,    setOriginals]    = useState({})

  const avatarInputRef    = useRef()
  const coverInputRef     = useRef()
  const portfolioInputRef = useRef()

  useEffect(() => { if (username) loadProfile() }, [username])

  async function loadProfile() {
    setLoading(true)
    const isUuid = /^[0-9a-f-]{36}$/.test(username)
    let query = supabase.from('profiles').select('*')
    if (isUuid) { query = query.eq('id', username) }
    else {
      const parts = username.split('-')
      parts.length >= 2
        ? query = query.ilike('firstname', parts[0]).ilike('lastname', parts.slice(1).join(' '))
        : query = query.ilike('firstname', username)
    }
    const { data, error } = await query.single()
    if (error || !data) { setNotFound(true); setLoading(false); return }
    setProfile(data)
    setProfileId(data.id)
    setDraftDiscs(data.disciplines || [])
    setDraftSkills(data.skills || [])

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setCurrentUserId(user.id) // store ID only
      if (user.id === data.id) {
        setIsOwner(true)
        loadNotifCount(user.id)
        loadBriefs(user.id)
      }
    }

    const { data: studioData } = await supabase
      .from('collab_terms')
      .select(`*, initiator:profiles!collab_terms_initiator_id_fkey(id, firstname, lastname, headline), partner:profiles!collab_terms_partner_id_fkey(id, firstname, lastname, headline)`)
      .or(`initiator_id.eq.${data.id},partner_id.eq.${data.id}`)
      .eq('status', 'complete')
      .order('created_at', { ascending: false })
    setStudios(studioData || [])

    const { data: ratingData } = await supabase
      .from('ratings')
      .select('*, rater:profiles!ratings_rater_id_fkey(firstname, lastname, headline)')
      .eq('ratee_id', data.id)
      .eq('submitted', true)
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
    const { data: posted } = await supabase.from('briefs').select('*').eq('poster_id', userId).eq('status', 'open').order('created_at', { ascending: false })
    setMyBriefs(posted || [])

    const { data: apps } = await supabase.from('applications').select('brief_id, status, briefs(*)').eq('applicant_id', userId).eq('status', 'pending')
    setAppliedBriefs((apps || []).map(a => ({ ...a.briefs, _isApplied: true })).filter(Boolean))

    const { data: terms } = await supabase
      .from('collab_terms')
      .select(`*, initiator:profiles!collab_terms_initiator_id_fkey(id, firstname, lastname, disciplines, headline), partner:profiles!collab_terms_partner_id_fkey(id, firstname, lastname, disciplines, headline)`)
      .or(`initiator_id.eq.${userId},partner_id.eq.${userId}`)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    setTermsUnderReview(terms || [])
    setBriefsLoading(false)
  }

  async function deleteBrief(id) {
    setDeletingId(id)
    await supabase.from('briefs').update({ status: 'deleted' }).eq('id', id)
    setMyBriefs(prev => prev.filter(b => b.id !== id))
    setDeletingId(null)
  }

  async function acceptTerms(term) {
    setActingTerms(prev => ({ ...prev, [term.id]: 'accepting' }))
    try {
      await supabase.from('collab_terms').update({ status: 'active', terms_status: 'agreed' }).eq('id', term.id)
      const ms = term.milestones || []
      if (ms.length > 0) {
        await supabase.from('studio_milestones').insert(ms.map((m, i) => ({ studio_id: term.id, title: m.desc || m.title || `Milestone ${i+1}`, due_date: null, done: false, sort_order: i })))
      }
      await supabase.from('studio_notes').upsert({ studio_id: term.id, content: '' }, { onConflict: 'studio_id' })
      await supabase.from('studio_messages').insert({ studio_id: term.id, sender_id: null, type: 'sys', content: `Studio created · ${new Date().toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}` })
      setTermsUnderReview(prev => prev.filter(t => t.id !== term.id))
      router.push(`/studio/${term.id}`)
    } catch (e) { console.error(e) }
    setActingTerms(prev => ({ ...prev, [term.id]: null }))
  }

  async function declineTerms(term) {
    setActingTerms(prev => ({ ...prev, [term.id]: 'declining' }))
    try {
      const amInitiator = currentUserId && term.initiator_id === currentUserId
      await supabase.from('collab_terms').update({ status: 'declined' }).eq('id', term.id)
      if (term.brief_id) {
        if (amInitiator) {
          await supabase.from('briefs').update({ status: 'deleted' }).eq('id', term.brief_id)
        } else {
          await supabase.from('briefs').update({ status: 'open' }).eq('id', term.brief_id)
          await supabase.from('applications').update({ status: 'pending' }).eq('brief_id', term.brief_id).eq('applicant_id', currentUserId)
        }
      }
      setTermsUnderReview(prev => prev.filter(t => t.id !== term.id))
    } catch (e) { console.error(e) }
    setActingTerms(prev => ({ ...prev, [term.id]: null }))
  }

  function startModify(term) {
    const draft = {
      collab_type: term.collab_type||'exchange', timeline: term.timeline||'',
      deadline: term.deadline||'', location: term.location||'',
      cadence: term.cadence||'', rights: term.rights||'transfer',
      fee_from: term.fee_from||'', fee_to: term.fee_to||'',
      pay_schedule: term.pay_schedule||'', my_share: term.my_share||'',
      their_share: term.their_share||'', rev_sources: term.rev_sources||'',
    }
    setOriginals(draft)
    setModifyDraft(draft)
    setModifyingId(term.id)
  }

  async function submitModify(term) {
    setActingTerms(prev => ({ ...prev, [term.id]: 'modifying' }))
    try {
      const amInitiator = term.initiator_id === currentUserId
      const nextEditor  = amInitiator ? 'partner' : 'initiator'
      await supabase.from('collab_terms').update({ ...modifyDraft, current_editor: nextEditor, terms_status: 'negotiating' }).eq('id', term.id)
      setTermsUnderReview(prev => prev.map(t => t.id === term.id ? { ...t, ...modifyDraft, current_editor: nextEditor } : t))
      setModifyingId(null)
      setModifyDraft({})
    } catch (e) { console.error(e) }
    setActingTerms(prev => ({ ...prev, [term.id]: null }))
  }

  async function loadNotifCount(userId) {
    let count = 0
    const { count: c1 } = await supabase.from('collab_terms').select('id', { count:'exact', head:true }).eq('partner_id', userId).eq('status', 'pending')
    count += c1 || 0
    const { count: c2 } = await supabase.from('collab_terms').select('id', { count:'exact', head:true }).or(`initiator_id.eq.${userId},partner_id.eq.${userId}`).eq('status', 'complete').eq('rated', false)
    count += c2 || 0
    const { data: mb } = await supabase.from('briefs').select('id').eq('poster_id', userId).eq('status', 'open')
    if (mb && mb.length > 0) {
      const { count: c3 } = await supabase.from('applications').select('id', { count:'exact', head:true }).in('brief_id', mb.map(b => b.id)).eq('seen', false)
      count += c3 || 0
    }
    setNotifCount(count)
  }

  async function handleSignOut() { await supabase.auth.signOut(); router.push('/') }

  async function saveField(field, value) {
    if (!profile) return
    setSaving(true)
    const { error } = await supabase.from('profiles').update({ [field]: value, updated_at: new Date().toISOString() }).eq('id', profile.id)
    if (!error) { setProfile(p => ({ ...p, [field]: value })); flashSave() }
    setSaving(false)
  }
  function flashSave() { setSaveMsg('Saved ✦'); setTimeout(() => setSaveMsg(''), 2000) }

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

  function collabPartner(s) {
    if (!profileId) return null
    return s.initiator_id === profileId ? s.partner : s.initiator
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
  const avgRating   = ratings.length ? (ratings.reduce((s,r) => s+r.stars, 0) / ratings.length).toFixed(1) : null
  const links = [
    profile.website        && { icon:'🔗', label:profile.website.replace(/^https?:\/\//,''),       href:profile.website },
    profile.instagram      && { icon:'📷', label:`@${profile.instagram.replace('@','')}`,           href:`https://instagram.com/${profile.instagram.replace('@','')}` },
    profile.soundcloud     && { icon:'🎵', label:profile.soundcloud.replace(/^https?:\/\//,''),     href:profile.soundcloud },
    profile.other_link     && { icon:'🔗', label:profile.other_link.replace(/^https?:\/\//,''),     href:profile.other_link },
    profile.portfolio_link && { icon:'💼', label:profile.portfolio_link.replace(/^https?:\/\//,''), href:profile.portfolio_link },
  ].filter(Boolean)

  const GRID_SIZE       = 12
  const emptySlots      = isOwner && editMode ? Math.max(0, GRID_SIZE - portfolio.length) : 0
  const gridItems       = [...portfolio.map(p => ({ ...p, isEmpty:false })), ...Array(emptySlots).fill(null).map((_,i) => ({ id:`empty-${i}`, isEmpty:true }))]
  const availableSkills = skillsForDiscs(draftDiscs)

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh' }}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>Collective <span>Loft</span></Link>
        <div className={styles.navLinks}>
          <Link href="/discover">Discover</Link>
          <Link href="/briefs">Collabs</Link>
          <Link href="/matching">Matching</Link>
          <Link href="/my-studios">My Loft Studios</Link>
          {isOwner && saving && <span className={styles.saveIndicator}>Saving…</span>}
          {isOwner && saveMsg && !saving && <span className={styles.saveIndicator}>{saveMsg}</span>}
          {isOwner && <button className={`${styles.btnEdit} ${editMode?styles.btnEditActive:''}`} onClick={() => setEditMode(v => !v)}>{editMode?'Done editing':'Edit profile'}</button>}
          {isOwner && <button className={styles.btnSignOut} onClick={handleSignOut}>Sign out</button>}
        </div>
      </nav>

      <div className={styles.coverBanner}>
        {profile.cover_url ? <img src={profile.cover_url} alt="Cover" className={styles.coverImg}/> : <div className={styles.coverPattern}/>}
        {isOwner && editMode && (<><button className={styles.coverUploadBtn} onClick={() => coverInputRef.current?.click()}>{profile.cover_url?'↑ Change cover':'+ Add cover image'}</button><input ref={coverInputRef} type="file" accept="image/*" style={{display:'none'}} onChange={e=>uploadImage(e.target.files[0],'covers','cover_url')}/></>)}
      </div>

      <div className={styles.identityStrip}>
        <div className={styles.avWrap}>
          <div className={styles.avCircle} onClick={() => isOwner&&editMode&&avatarInputRef.current?.click()} style={isOwner&&editMode?{cursor:'pointer'}:{}}>
            {profile.avatar_url ? <img src={profile.avatar_url} alt={fullName}/> : <span>{ini}</span>}
            {isOwner && editMode && <div className={styles.avOverlay}>↑</div>}
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
                {isOwner && (
                  <Link href="/notifications" style={{position:'relative',display:'inline-flex',alignItems:'center',textDecoration:'none',marginLeft:'0.25rem'}}>
                    <span style={{fontSize:'1rem',color:notifCount>0?'var(--gold)':'rgba(240,236,227,0.25)',lineHeight:1}}>✉</span>
                    {notifCount > 0 && <span style={{position:'absolute',top:'-6px',right:'-8px',background:'var(--gold)',color:'#0D0D0D',fontSize:'0.48rem',fontWeight:700,fontFamily:'var(--sans)',borderRadius:'10px',padding:'1px 4px',minWidth:'14px',textAlign:'center',lineHeight:'14px'}}>{notifCount>9?'9+':notifCount}</span>}
                  </Link>
                )}
              </div>
              <div className={styles.profileHeadline}>
                <Editable value={profile.headline} onSave={v=>saveField('headline',v)} placeholder="Your discipline · Your style · Your medium" isOwner={isOwner} editMode={editMode} className={styles.headlineText}/>
              </div>
            </div>
            {!isOwner && (
              <div className={styles.actionBtns}>
                <button className={styles.btnMessage}>Message</button>
                <button className={styles.btnConnect} onClick={()=>setConnected(true)} style={connected?{background:'var(--teal)'}:{}}>{connected?'✦ Sent':'+ Connect'}</button>
              </div>
            )}
          </div>
          <div className={styles.metaRow}>
            {location && <div className={styles.metaItem}><span>📍</span><span>{location}</span></div>}
            <div className={styles.metaItem}><span>⊞</span><span>{profile.connections_count||0} connections</span></div>
            <div className={styles.metaItem}><span>◎</span><span>{profile.collabs_count||0} collabs completed</span></div>
          </div>
          <div className={styles.profileTags}>
            {profile.availability==='open' && <span className={`${styles.ptag} ${styles.ptagOpen}`}>Open to collabs</span>}
            {disciplines.slice(0,2).map(d=><span key={d} className={`${styles.ptag} ${styles.ptagDisc}`}>{d}</span>)}
            {skills.slice(0,2).map(s=><span key={s} className={styles.ptag}>{s}</span>)}
          </div>
        </div>
      </div>

      <div className={styles.tabsBar}>
        {['work','about','collabs','briefs'].map(tab=>(
          <div key={tab} className={`${styles.tab} ${activeTab===tab?styles.active:''}`} onClick={()=>setActiveTab(tab)}>
            {tab.charAt(0).toUpperCase()+tab.slice(1)}
          </div>
        ))}
        <Link href="/my-studios" className={styles.tab}>My Loft Studios</Link>
      </div>

      <div className={styles.profileBody} style={{flex:1}}>
        <div className={styles.profileMain}>

          {activeTab === 'work' && (
            <>
              <div className={styles.contentSection}>
                <div className={styles.secLabel}>About</div>
                <div className={styles.bioText}><Editable value={profile.bio} onSave={v=>saveField('bio',v)} placeholder={isOwner?'Click to add your bio…':'No bio added yet.'} multiline isOwner={isOwner} editMode={editMode} className={styles.bioInner}/></div>
                <div className={styles.rightnowCard}>
                  <div className={styles.rnLabel}>Right now</div>
                  <div className={styles.rnText}><Editable value={profile.rightnow} onSave={v=>saveField('rightnow',v)} placeholder={isOwner?'Click to describe what you\'re actively making…':'Nothing listed right now.'} multiline isOwner={isOwner} editMode={editMode} className={styles.rnInner}/></div>
                </div>
              </div>

              <div className={styles.contentSection}>
                <div className={styles.secLabelRow}>
                  <div className={styles.secLabel}>Portfolio</div>
                  {isOwner&&editMode&&<div className={styles.portfolioHint}>{uploading?'Uploading…':'Click any slot to upload — images, video, audio, or PDF'}</div>}
                </div>
                <input ref={portfolioInputRef} type="file" accept="image/*,video/*,audio/*,.pdf" style={{display:'none'}} onChange={e=>{if(e.target.files[0])uploadPortfolioItem(e.target.files[0]);e.target.value=''}}/>
                {portfolio.length===0&&!isOwner ? <div className={styles.emptyState}>No portfolio items yet.</div> : (
                  <div className={styles.portfolioGrid}>
                    {gridItems.map(item => {
                      if (item.isEmpty) return <div key={item.id} className={`${styles.portfolioSlot} ${styles.emptySlot}`} onClick={()=>!uploading&&portfolioInputRef.current?.click()}><div className={styles.slotPlus}>+</div></div>
                      return (
                        <div key={item.id} className={styles.portfolioSlot} onClick={()=>setLightboxIdx(portfolio.findIndex(p=>p.id===item.id))}>
                          {item.type==='image'&&<img src={item.file_url} alt={item.title||''} className={styles.slotImage}/>}
                          {item.type==='video'&&<div className={styles.slotVideo}><video src={item.file_url} className={styles.slotVideoEl} muted/><div className={styles.slotPlayBtn}>▶</div></div>}
                          {item.type==='audio'&&<div className={styles.slotAudio}><div className={styles.slotAudioIcon}>🎵</div><div className={styles.slotAudioWave}>{Array(12).fill(0).map((_,j)=><div key={j} className={styles.waveBar} style={{height:`${20+Math.random()*60}%`}}/>)}</div></div>}
                          {item.type==='document'&&<div className={styles.slotDoc}><div className={styles.slotDocIcon}>📄</div><div className={styles.slotDocTitle}>{item.title||'Document'}</div></div>}
                          <div className={styles.slotOverlay}>
                            <div className={styles.slotTypeIcon}>{typeIcon(item.type)}</div>
                            <div className={styles.slotTitle}>{item.title||item.type}</div>
                            {isOwner&&editMode&&<button className={styles.slotDelete} onClick={e=>{e.stopPropagation();deletePortfolioItem(item.id)}}>✕</button>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className={styles.contentSection}>
                <div className={styles.secLabel}>Past collaborations</div>
                {studios.length===0 ? <div className={styles.emptyState}>No completed collaborations yet.</div> : studios.map(s => {
                  const collab = s.initiator_id===profileId ? s.partner : s.initiator
                  const cn = collab ? `${collab.firstname} ${collab.lastname}` : 'Collaborator'
                  const ci = collab ? `${collab.firstname[0]}${collab.lastname[0]}` : '??'
                  return (
                    <div key={s.id} className={styles.collabItem}>
                      <div className={`${styles.collabAv} ${styles.avTeal}`}>{ci}</div>
                      <div className={styles.collabInfo}>
                        <div className={styles.collabName}>{cn} · {collab?.headline}</div>
                        <div className={styles.collabRole}>{s.project_title||'Collaboration'}</div>
                      </div>
                      <span className={styles.collabStatus}>Completed</span>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {activeTab === 'about' && (
            <>
              <div className={styles.contentSection}>
                <div className={styles.secLabel}>Bio</div>
                <div className={styles.bioText}><Editable value={profile.bio} onSave={v=>saveField('bio',v)} placeholder={isOwner?'Click to add your bio…':'No bio.'} multiline isOwner={isOwner} editMode={editMode} className={styles.bioInner}/></div>
              </div>
              <div className={styles.contentSection}>
                <div className={styles.secLabel}>Disciplines &amp; skills</div>
                {editingDiscs ? (
                  <div>
                    <div className={styles.discEditGrid}>{DISC_OPTS.map(d=><div key={d.id} className={`${styles.discEditOpt} ${draftDiscs.includes(d.label)?styles.on:''}`} onClick={()=>toggleDraftDisc(d.label)}><span>{d.icon}</span> {d.label}</div>)}</div>
                    <div className={styles.editActions}><button className={styles.saveBtn} onClick={saveDiscs}>Save disciplines</button><button className={styles.cancelBtn} onClick={()=>{setEditingDiscs(false);setDraftDiscs(disciplines);setDraftSkills(skills)}}>Cancel</button></div>
                  </div>
                ) : (
                  <div className={styles.discTags} style={{marginBottom:'1rem'}}>
                    {disciplines.map(d=><span key={d} className={styles.discTag}>{d}</span>)}
                    {isOwner&&editMode&&<button className={styles.editTagsBtn} onClick={()=>{setDraftDiscs(disciplines);setDraftSkills(skills);setEditingDiscs(true)}}>✎ Edit</button>}
                  </div>
                )}
                {editingSkills ? (
                  <div>
                    {availableSkills.length===0 ? <div className={styles.emptyState}>Select at least one discipline above to see available skills.</div> : <div className={styles.skillEditGrid}>{availableSkills.map(s=><div key={s} className={`${styles.skillEditOpt} ${draftSkills.includes(s)?styles.on:''}`} onClick={()=>setDraftSkills(prev=>prev.includes(s)?prev.filter(x=>x!==s):[...prev,s])}>{s}</div>)}</div>}
                    <div className={styles.editActions}><button className={styles.saveBtn} onClick={saveSkills}>Save skills</button><button className={styles.cancelBtn} onClick={()=>{setEditingSkills(false);setDraftSkills(skills)}}>Cancel</button></div>
                  </div>
                ) : (
                  <div className={styles.skillList}>
                    {skills.slice(0,8).map((s,i)=><div key={s} className={styles.skillRow}><span className={styles.skillName}>{s}</span><div className={styles.skillBarBg}><div className={styles.skillBarFill} style={{width:`${SKILL_WIDTHS[i]||40}%`}}/></div></div>)}
                    {isOwner&&editMode&&<button className={styles.editTagsBtn} onClick={()=>{setDraftSkills(skills);setEditingSkills(true)}}>✎ Edit skills</button>}
                  </div>
                )}
              </div>
              <div className={styles.contentSection}>
                <div className={styles.secLabel}>Collaboration preferences</div>
                <div className={styles.prefText}><Editable value={profile.seeking} onSave={v=>saveField('seeking',v)} placeholder={isOwner?'Click to describe who you\'re looking for…':'Not specified.'} multiline isOwner={isOwner} editMode={editMode} className={styles.prefInner}/></div>
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

          {activeTab === 'collabs' && (
            <div className={styles.contentSection}>
              <div className={styles.secLabel}>Collaboration history</div>
              {studios.length===0 ? <div className={styles.emptyState}>Once you complete a collab through Collective Loft, it will appear here.</div> : studios.map(s => {
                const collab = s.initiator_id===profileId ? s.partner : s.initiator
                const cn = collab ? `${collab.firstname} ${collab.lastname}` : 'Collaborator'
                const ci = collab ? `${collab.firstname[0]}${collab.lastname[0]}` : '??'
                return (
                  <div key={s.id} className={styles.collabItem}>
                    <div className={`${styles.collabAv} ${styles.avTeal}`}>{ci}</div>
                    <div className={styles.collabInfo}><div className={styles.collabName}>{cn} · {collab?.headline}</div><div className={styles.collabRole}>{s.project_title||'Collaboration'}</div></div>
                    <span className={styles.collabStatus}>Completed</span>
                  </div>
                )
              })}
            </div>
          )}

          {activeTab === 'briefs' && (
            <div className={styles.contentSection}>
              {briefsLoading ? <div className={styles.emptyState}>Loading briefs…</div> : (
                <>
                  <div style={{marginBottom:'1.75rem'}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'0.75rem'}}>
                      <div className={styles.secLabel} style={{margin:0}}>Active briefs</div>
                      <Link href="/briefs" style={{fontFamily:'var(--sans)',fontSize:'0.62rem',color:'var(--gold)',textDecoration:'none',letterSpacing:'0.04em'}}>+ Post a brief</Link>
                    </div>
                    {myBriefs.length===0
                      ? <div className={styles.emptyState}>No active briefs. Post one to find collaborators.</div>
                      : myBriefs.map(b=><BriefCard key={b.id} brief={b} showDelete={isOwner} onSelect={setSelectedBrief} onDelete={deleteBrief}/>)
                    }
                  </div>

                  {isOwner && (
                    <div style={{marginBottom:'1.75rem'}}>
                      <div className={styles.secLabel} style={{marginBottom:'0.75rem'}}>Terms under review</div>
                      {termsUnderReview.length===0
                        ? <div className={styles.emptyState}>No terms in negotiation right now.</div>
                        : termsUnderReview.map(t => (
                            <TermsReviewCard
                              key={t.id}
                              term={t}
                              currentUserId={currentUserId}
                              actingTerms={actingTerms}
                              modifyingId={modifyingId}
                              modifyDraft={modifyDraft}
                              originals={originals}
                              onAccept={acceptTerms}
                              onDecline={declineTerms}
                              onStartModify={startModify}
                              onSubmitModify={submitModify}
                              onCancelModify={() => { setModifyingId(null); setModifyDraft({}) }}
                              onModifyDraftChange={setModifyDraft}
                            />
                          ))
                      }
                    </div>
                  )}

                  {isOwner && (
                    <div>
                      <div className={styles.secLabel} style={{marginBottom:'0.75rem'}}>Applied briefs</div>
                      {appliedBriefs.length===0
                        ? <div className={styles.emptyState}>No applications sent yet.</div>
                        : appliedBriefs.map(b=><BriefCard key={b.id} brief={b} showDelete={false} onSelect={setSelectedBrief} onDelete={deleteBrief}/>)
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
              <div className={styles.statCard}><div className={styles.statNum}>{profile.connections_count||0}</div><div className={styles.statLbl}>Connections</div></div>
              <div className={styles.statCard}><div className={styles.statNum}>{avgRating||'—'}</div><div className={styles.statLbl}>Rating</div></div>
              <div className={styles.statCard}><div className={styles.statNum}>{ratings.length}</div><div className={styles.statLbl}>Reviews</div></div>
            </div>
          </div>
          {(profile.seeking||profile.compensation?.length)&&(
            <div className={styles.availCard}>
              <div className={styles.availTitle}>Open to collaborate</div>
              <div className={styles.availText}>{[profile.seeking&&`Seeking ${profile.seeking}.`,profile.location_preference,profile.compensation?.length&&`${profile.compensation.join(' or ')}.`].filter(Boolean).join(' ')}</div>
            </div>
          )}
          {disciplines.length>0&&<div><div className={styles.sbLabel}>Disciplines</div><div className={styles.discTags}>{disciplines.map(d=><span key={d} className={styles.discTag}>{d}</span>)}</div></div>}
          {skills.length>0&&(
            <div>
              <div className={styles.sbLabel}>Skills</div>
              <div className={styles.skillList}>{skills.slice(0,6).map((s,i)=><div key={s} className={styles.skillRow}><span className={styles.skillName}>{s}</span><div className={styles.skillBarBg}><div className={styles.skillBarFill} style={{width:`${SKILL_WIDTHS[i]||40}%`}}/></div></div>)}</div>
            </div>
          )}
          {ratings.length>0&&(
            <div>
              <div className={styles.sbLabel}>Community voice</div>
              <div className={styles.endorsements}>
                {ratings.slice(0,3).map(r=>{
                  const rater=r.rater; const raterName=rater?`${rater.firstname} ${rater.lastname}`:'Collaborator'
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
      {lightboxIdx!==null&&<Lightbox items={portfolio} startIndex={lightboxIdx} onClose={()=>setLightboxIdx(null)}/>}
    </div>
  )
}