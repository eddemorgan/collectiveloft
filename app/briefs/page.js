'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import styles from './briefs.module.css'

const DISC_CLASS = {
  'Visual Art':'dtV','Music':'dtM','Writing':'dtW','Design & Web':'dtD',
  'Film':'dtF','Photography':'dtV','Performance':'dtW','Creative Tech':'dtD',
}
const AV_COLORS = ['avGold','avTeal','avPurp','avBlue','avRose','avGreen']
const COMP_CLASS = {
  'Creative exchange':'ctEx','Paid':'ctPd','Revenue share':'ctRs',
}
const DISC_OPTS = [
  { icon:'🎨', label:'Visual Art' },{ icon:'🎵', label:'Music' },
  { icon:'✍️', label:'Writing' },{ icon:'🖥', label:'Design & Web' },
  { icon:'🎬', label:'Film' },{ icon:'📷', label:'Photography' },
  { icon:'🎭', label:'Performance' },{ icon:'💻', label:'Creative Tech' },
]

function daysLeft(deadline) {
  if (!deadline) return null
  const diff = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
}

function initials(firstname, lastname) {
  return [(firstname||'?')[0], (lastname||'?')[0]].join('').toUpperCase()
}

function BriefsInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const openBriefId  = searchParams.get('open')  // from notification link or profile
  const fromProfile  = searchParams.get('from')  // profile slug to go back to

  const { loading: authLoading, user } = useAuth()

  const [briefs,          setBriefs]          = useState([])
  const [loading,         setLoading]         = useState(true)
  const [selectedId,      setSelectedId]      = useState(null)
  const [activeFilter,    setActiveFilter]    = useState('all')
  const [postOpen,        setPostOpen]        = useState(false)
  const [applyOpen,       setApplyOpen]       = useState(false)
  const [applyMsg,        setApplyMsg]        = useState('')
  const [appliedBriefIds, setAppliedBriefIds] = useState(new Set())
  const [savedIds,        setSavedIds]        = useState([])
  const [submitting,      setSubmitting]      = useState(false)
  const [deletingId,      setDeletingId]      = useState(null)
  const [applicants,      setApplicants]      = useState([])
  const [acceptingId,     setAcceptingId]     = useState(null)
  // Track which brief IDs already have terms sent -- blocks double-send
  const [termsSentIds,    setTermsSentIds]    = useState(new Set())

  const [postForm, setPostForm] = useState({
    title:'', making:'', needing:'', timeline:'', deadline:'', fee_range:'', location_preference:'',
  })
  const [postDiscs, setPostDiscs] = useState([])
  const [postComp,  setPostComp]  = useState('Creative exchange')

  useEffect(() => {
    if (authLoading) return
    loadBriefs()
  }, [authLoading])

  // Load applied brief IDs from DB
  useEffect(() => {
    if (!user) return
    supabase.from('applications').select('brief_id').eq('applicant_id', user.id)
      .then(({ data }) => { if (data) setAppliedBriefIds(new Set(data.map(a => a.brief_id))) })
  }, [user])

  // Load which briefs already have active collab_terms -- from collab_terms table
  // This is more reliable than checking applications.status because terms
  // persist even if the application row gets updated
  useEffect(() => {
    if (!user) return
    // Get all my posted briefs first, then check which have pending collab_terms
    supabase.from('briefs').select('id').eq('poster_id', user.id).eq('status', 'open')
      .then(({ data: myBriefs }) => {
        if (!myBriefs || myBriefs.length === 0) return
        const myBriefIds = myBriefs.map(b => b.id)
        supabase.from('collab_terms')
          .select('brief_id')
          .in('brief_id', myBriefIds)
          .eq('status', 'pending')
          .then(({ data }) => {
            if (data) setTermsSentIds(new Set(data.map(t => t.brief_id).filter(Boolean)))
          })
      })
  }, [user])

  // Open specific brief from notification link
  useEffect(() => {
    if (openBriefId && briefs.length > 0) {
      setSelectedId(openBriefId)
    }
  }, [openBriefId, briefs])

  // Load applicants when selected brief changes
  useEffect(() => {
    if (!selectedId || !user) return
    const brief = briefs.find(b => b.id === selectedId)
    if (!brief || brief.poster_id !== user.id) { setApplicants([]); return }
    supabase
      .from('applications')
      .select(`id, message, status, created_at, applicant:profiles!applications_applicant_id_fkey(id, firstname, lastname, headline, disciplines)`)
      .eq('brief_id', selectedId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .then(({ data }) => setApplicants(data || []))
  }, [selectedId, user, briefs])

  async function loadBriefs() {
    setLoading(true)
    const { data, error } = await supabase
      .from('briefs')
      .select('*, profiles(firstname, lastname, headline, rating, collabs_count)')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
    if (!error && data) setBriefs(data)
    // If coming from a notification, open that brief; otherwise open first
    if (data && data.length > 0 && !openBriefId) setSelectedId(data[0].id)
    setLoading(false)
  }

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return briefs
    if (activeFilter === 'paid') return briefs.filter(b => b.compensation === 'Paid')
    return briefs.filter(b => b.disciplines?.includes(activeFilter))
  }, [briefs, activeFilter])

  const selected = briefs.find(b => b.id === selectedId) || null

  async function deleteBrief(e, id) {
    e.stopPropagation()
    if (!confirm('Delete this brief? This cannot be undone.')) return
    setDeletingId(id)
    await supabase.from('briefs').update({ status: 'deleted' }).eq('id', id)
    setBriefs(prev => prev.filter(b => b.id !== id))
    if (selectedId === id) setSelectedId(null)
    setDeletingId(null)
  }

  async function submitBrief() {
    if (!postForm.title.trim()) return
    setSubmitting(true)
    try {
      const { data: { user: u } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('briefs')
        .insert({
          poster_id: u?.id || null, title: postForm.title, disciplines: postDiscs,
          what_making: postForm.making, who_needed: postForm.needing,
          timeline: postForm.timeline, deadline: postForm.deadline || null,
          compensation: postComp, fee_range: postForm.fee_range,
          location_preference: postForm.location_preference, status: 'open',
        })
        .select('*, profiles(firstname, lastname, headline, rating, collabs_count)')
        .single()
      if (!error && data) { setBriefs(prev => [data, ...prev]); setSelectedId(data.id) }
      setPostOpen(false)
      setPostForm({ title:'', making:'', needing:'', timeline:'', deadline:'', fee_range:'', location_preference:'' })
      setPostDiscs([])
      setPostComp('Creative exchange')
    } catch (err) { console.error(err) }
    finally { setSubmitting(false) }
  }

  async function submitApplication() {
    if (!applyMsg.trim() || !selectedId || !user) return
    setSubmitting(true)
    try {
      await supabase.from('applications').insert({
        brief_id: selectedId, applicant_id: user.id, message: applyMsg, status: 'pending',
      })
      setAppliedBriefIds(prev => new Set([...prev, selectedId]))
      setApplyOpen(false)
      setApplyMsg('')
    } catch (err) { console.error(err) }
    finally { setSubmitting(false) }
  }

  async function acceptApplicant(application) {
    setAcceptingId(application.id)
    try {
      await supabase.from('applications').update({ status: 'accepted' }).eq('id', application.id)
      // Mark this brief as having terms sent so button locks
      setTermsSentIds(prev => new Set([...prev, selectedId]))
      // Remove accepted applicant from list
      setApplicants(prev => prev.filter(a => a.id !== application.id))
      const brief = briefs.find(b => b.id === selectedId)
      const params = new URLSearchParams({
        with: application.applicant.id,
        brief: selectedId,
        title: brief?.title || '',
      })
      window.location.href = `/terms?${params.toString()}`
    } catch (err) { console.error(err) }
    setAcceptingId(null)
  }

  function toggleDisc(label) {
    setPostDiscs(prev => prev.includes(label) ? prev.filter(d => d !== label) : [...prev, label])
  }

  if (authLoading) return null

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh' }}>
      <Nav />

      <div className={styles.pageHdr}>
        <div className={styles.hdrLeft}>
          <div className={styles.hdrTitle}>Collab Briefs</div>
          <div className={styles.hdrCount}>{filtered.length} open</div>
        </div>
        <button className={styles.btnPost} onClick={() => setPostOpen(true)}>+ Post a Brief</button>
      </div>

      <div className={styles.filterTabs}>
        {[['all','All briefs'],['Visual Art','Visual art'],['Music','Music'],['Writing','Writing'],['Design & Web','Design & web'],['Film','Film'],['paid','Paid only']].map(([key, label]) => (
          <div key={key} className={`${styles.ftab} ${activeFilter === key ? styles.active : ''}`}
            onClick={() => { setActiveFilter(key); setSelectedId(null) }}>{label}</div>
        ))}
      </div>

      <div className={styles.bodySplit} style={{ flex:1 }}>
        <div className={styles.briefListCol}>
          {loading ? <div className={styles.emptyState}>Loading briefs…</div>
          : filtered.length === 0 ? <div className={styles.emptyState}>No briefs match this filter.</div>
          : filtered.map(b => {
            const poster     = b.profiles
            const ini        = poster ? initials(poster.firstname, poster.lastname) : '??'
            const avCls      = AV_COLORS[b.id?.charCodeAt(0) % AV_COLORS.length] || 'avGold'
            const dl         = daysLeft(b.deadline)
            const isPoster   = user && b.poster_id === user.id
            const hasApplied = appliedBriefIds.has(b.id)
            const termsSent  = isPoster && termsSentIds.has(b.id)
            return (
              <div key={b.id} className={`${styles.briefItem} ${selectedId === b.id ? styles.selected : ''}`} onClick={() => setSelectedId(b.id)}>
                <div className={styles.biTags}>
                  {(b.disciplines || []).map(d => <span key={d} className={`${styles.dtag} ${styles[DISC_CLASS[d]||'dtV']}`}>{d}</span>)}
                  {b.compensation && <span className={`${styles.dtag} ${styles[COMP_CLASS[b.compensation]||'ctEx']}`}>{b.compensation}</span>}
                  {hasApplied && !isPoster && <span className={styles.dtag} style={{ background:'rgba(86,179,156,0.15)', color:'var(--teal)', borderColor:'rgba(86,179,156,0.3)' }}>Applied</span>}
                  {termsSent && <span className={styles.dtag} style={{ background:'rgba(201,168,76,0.12)', color:'var(--gold)' }}>Terms sent</span>}
                  {isPoster && <button className={styles.biDelete} onClick={e => deleteBrief(e, b.id)} disabled={deletingId === b.id} title="Delete brief">✕</button>}
                </div>
                <div className={styles.biTitle}>{b.title}</div>
                <div className={styles.biExcerpt}>{b.what_making}</div>
                <div className={styles.biFooter}>
                  <div className={styles.biPoster}>
                    <div className={`${styles.biAv} ${styles[avCls]}`}>{ini}</div>
                    <span>{poster ? `${poster.firstname} ${poster.lastname}` : 'Anonymous'}</span>
                  </div>
                  <span>{b.applicants_count || 0} applicants{dl !== null ? ` · ${dl} days left` : ''}</span>
                </div>
              </div>
            )
          })}
        </div>

        <div className={styles.detailPanel}>
          {!selected ? (
            <div className={styles.detailEmpty}>
              <div className={styles.deIcon}>✦</div>
              <div className={styles.deTitle}>Select a brief to read it.</div>
              <div className={styles.deSub}>Click any brief on the left to see the full details, project specs, and who's already applied.</div>
            </div>
          ) : (() => {
            const poster     = selected.profiles
            const ini        = poster ? initials(poster.firstname, poster.lastname) : '??'
            const avCls      = AV_COLORS[selected.id?.charCodeAt(0) % AV_COLORS.length] || 'avGold'
            const hasApplied = appliedBriefIds.has(selected.id)
            const saved      = savedIds.includes(selected.id)
            const rating     = poster?.rating || 0
            const stars      = '★'.repeat(Math.floor(rating)) + (rating % 1 ? '½' : '')
            const isPoster   = user && selected.poster_id === user.id
            const termsSent  = isPoster && termsSentIds.has(selected.id)
            return (
              <div className={styles.detailInner}>
                <div className={styles.detailHdr}>
                  <div className={styles.detailTags}>
                    {(selected.disciplines || []).map(d => <span key={d} className={`${styles.dtag} ${styles[DISC_CLASS[d]||'dtV']}`}>{d}</span>)}
                    {selected.compensation && <span className={`${styles.dtag} ${styles[COMP_CLASS[selected.compensation]||'ctEx']}`}>{selected.compensation}</span>}
                  </div>
                  <div className={styles.detailTitle}>{selected.title}</div>
                  <div className={styles.detailActionRow}>
                    {!isPoster && (
                      <button className={styles.btnApply}
                        onClick={() => !hasApplied && setApplyOpen(true)}
                        style={hasApplied ? { background:'rgba(86,179,156,0.2)', color:'var(--teal)', border:'0.5px solid rgba(86,179,156,0.3)', cursor:'default' } : {}}>
                        {hasApplied ? 'Application sent ✦' : 'Apply to this brief'}
                      </button>
                    )}
                    {isPoster && (
                      <div style={{display:'flex', gap:'0.65rem', alignItems:'center', flexWrap:'wrap'}}>
                        <button className={styles.btnDeleteBrief} onClick={e => deleteBrief(e, selected.id)} disabled={deletingId === selected.id}>
                          {deletingId === selected.id ? 'Deleting…' : '✕ Delete this brief'}
                        </button>
                        {fromProfile && (
                          <Link href={`/profile/${fromProfile}#briefs`} style={{fontFamily:'var(--sans)',fontSize:'0.65rem',color:'rgba(240,236,227,0.4)',textDecoration:'none',letterSpacing:'0.04em',whiteSpace:'nowrap'}}>
                            ← Back to My Profile
                          </Link>
                        )}
                      </div>
                    )}
                    {!isPoster && (
                      <button className={styles.btnSave}
                        onClick={() => setSavedIds(prev => prev.includes(selected.id) ? prev.filter(i => i !== selected.id) : [...prev, selected.id])}
                        style={saved ? { color:'var(--teal)', borderColor:'rgba(86,179,156,0.3)' } : {}}>
                        {saved ? 'Saved ✦' : 'Save brief'}
                      </button>
                    )}
                  </div>
                </div>

                <div className={styles.posterCard}>
                  <div className={`${styles.posterAv} ${styles[avCls]}`}>{ini}</div>
                  <div>
                    <div className={styles.posterName}>{poster ? `${poster.firstname} ${poster.lastname}` : 'Anonymous'}</div>
                    <div className={styles.posterRole}>{poster?.headline || 'Creative'} · {poster?.collabs_count || 0} collabs</div>
                  </div>
                  {rating > 0 && <div className={styles.posterRating}><div className={styles.stars}>{stars}</div><div>{rating} rating</div></div>}
                </div>

                {selected.what_making && <div className={styles.dsec}><div className={styles.dsecLabel}>What I'm making</div><div className={styles.dsecText}>{selected.what_making}</div></div>}
                {selected.who_needed && <div className={styles.dsec}><div className={styles.dsecLabel}>Who I need</div><div className={styles.dsecText}>{selected.who_needed}</div></div>}

                <div className={styles.dsec}>
                  <div className={styles.dsecLabel}>Project specs</div>
                  <div className={styles.specsGrid}>
                    {selected.timeline && <div className={styles.specRow}><span className={styles.specK}>Timeline</span><span className={styles.specV}>{selected.timeline}</span></div>}
                    {selected.compensation && <div className={styles.specRow}><span className={styles.specK}>Compensation</span><span className={`${styles.specV} ${styles.gold}`}>{selected.compensation}{selected.fee_range ? ` · ${selected.fee_range}` : ''}</span></div>}
                    {selected.location_preference && <div className={styles.specRow}><span className={styles.specK}>Location</span><span className={styles.specV}>{selected.location_preference}</span></div>}
                    {selected.deadline && <div className={styles.specRow}><span className={styles.specK}>Deadline</span><span className={styles.specV}>{new Date(selected.deadline).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}</span></div>}
                    <div className={styles.specRow}><span className={styles.specK}>Applications</span><span className={`${styles.specV} ${styles.teal}`}>{selected.applicants_count || 0} received</span></div>
                  </div>
                </div>

                {/* APPLICANTS -- only visible to poster */}
                {isPoster && (
                  <div className={styles.dsec}>
                    <div className={styles.dsecLabel}>
                      {termsSent ? 'Terms in negotiation' : applicants.length === 0 ? 'No applications yet' : `${applicants.length} application${applicants.length > 1 ? 's' : ''}`}
                    </div>

                    {termsSent ? (
                      <div style={{ fontFamily:'var(--sans)', fontSize:'0.72rem', color:'rgba(201,168,76,0.7)', background:'rgba(201,168,76,0.06)', border:'0.5px solid rgba(201,168,76,0.15)', borderRadius:'4px', padding:'0.75rem 1rem', lineHeight:1.6 }}>
                        Terms have been sent to one applicant and are under negotiation. Other applicants remain available if those terms fall through.
                      </div>
                    ) : applicants.length === 0 ? (
                      <div style={{ fontSize:'0.72rem', color:'rgba(240,236,227,0.3)', fontStyle:'italic' }}>Applications will appear here once creatives apply.</div>
                    ) : (
                      <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem', marginTop:'0.5rem' }}>
                        {applicants.map(app => {
                          const a    = app.applicant
                          const aIni = a ? initials(a.firstname, a.lastname) : '??'
                          const slug = a ? `${a.firstname.trim().toLowerCase()}-${a.lastname.trim().toLowerCase()}` : null
                          return (
                            <div key={app.id} style={{ background:'rgba(240,236,227,0.03)', border:'0.5px solid rgba(240,236,227,0.08)', borderRadius:'4px', padding:'0.85rem 1rem' }}>
                              <div style={{ display:'flex', alignItems:'center', gap:'0.65rem', marginBottom:'0.5rem' }}>
                                <div style={{ width:'32px', height:'32px', borderRadius:'50%', flexShrink:0, background:'rgba(86,179,156,0.2)', color:'var(--teal)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.72rem', fontWeight:600 }}>{aIni}</div>
                                <div style={{ flex:1, minWidth:0 }}>
                                  {slug ? (
                                    <Link href={`/profile/${slug}`} style={{ fontFamily:'var(--sans)', fontSize:'0.78rem', fontWeight:600, color:'var(--cream)', textDecoration:'none' }}
                                      onMouseEnter={e => e.currentTarget.style.color='var(--gold)'}
                                      onMouseLeave={e => e.currentTarget.style.color='var(--cream)'}>
                                      {a.firstname} {a.lastname}
                                    </Link>
                                  ) : <span style={{ fontFamily:'var(--sans)', fontSize:'0.78rem', fontWeight:600, color:'var(--cream)' }}>Anonymous</span>}
                                  {a?.headline && <div style={{ fontFamily:'var(--sans)', fontSize:'0.65rem', color:'rgba(240,236,227,0.4)', marginTop:'1px' }}>{a.headline}</div>}
                                </div>
                                <span style={{ fontFamily:'var(--sans)', fontSize:'0.6rem', color:'rgba(240,236,227,0.25)' }}>{new Date(app.created_at).toLocaleDateString('en-US', { month:'short', day:'numeric' })}</span>
                              </div>
                              {app.message && (
                                <div style={{ fontFamily:'var(--sans)', fontSize:'0.72rem', color:'rgba(240,236,227,0.55)', lineHeight:1.65, marginBottom:'0.65rem', borderLeft:'2px solid rgba(240,236,227,0.08)', paddingLeft:'0.65rem' }}>
                                  {app.message}
                                </div>
                              )}
                              <button onClick={() => acceptApplicant(app)} disabled={acceptingId === app.id || termsSent}
                                style={{ background:'var(--gold)', color:'#0D0D0D', border:'none', borderRadius:'3px', padding:'0.4rem 0.9rem', fontFamily:'var(--sans)', fontSize:'0.65rem', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', cursor: termsSent ? 'not-allowed' : 'pointer', opacity: acceptingId === app.id || termsSent ? 0.4 : 1 }}>
                                {acceptingId === app.id ? 'Opening terms…' : termsSent ? 'Terms in progress' : 'Accept & set terms ↗'}
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      </div>

      <Footer />

      {/* POST BRIEF MODAL */}
      {postOpen && (
        <div className={styles.modalOverlay} onClick={e => { if (e.target === e.currentTarget) setPostOpen(false) }}>
          <div className={styles.modal}>
            <div className={styles.modalHdr}>
              <div>
                <div className={styles.modalEy}>Collective Loft · New brief</div>
                <div className={styles.modalTitle}>Post a Collab Brief</div>
                <div className={styles.modalSub}>Tell the platform what you're making and exactly who you need.</div>
              </div>
              <button className={styles.modalClose} onClick={() => setPostOpen(false)}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.msecLabel}>The project</div>
              <div className={styles.mfield}>
                <label>Brief title</label>
                <input type="text" placeholder="e.g. Looking for a composer for a gallery portfolio site" value={postForm.title} onChange={e => setPostForm(f => ({ ...f, title: e.target.value }))} />
                <div className={styles.hint}>Write it the way you'd say it to another creative.</div>
              </div>
              <div className={styles.mfield}>
                <label>Disciplines needed</label>
                <div className={styles.modalDiscGrid}>
                  {DISC_OPTS.map(d => (
                    <div key={d.label} className={`${styles.mdopt} ${postDiscs.includes(d.label)?styles.on:''}`} onClick={() => toggleDisc(d.label)}>
                      <div className={styles.mdoptIcon}>{d.icon}</div>
                      <div className={styles.mdoptName}>{d.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.mfield}><label>What are you making?</label><textarea placeholder="Describe your project…" rows={3} value={postForm.making} onChange={e => setPostForm(f => ({ ...f, making: e.target.value }))} /></div>
              <div className={styles.mfield}><label>Who do you need?</label><textarea placeholder="Describe the collaborator you want to attract…" rows={3} value={postForm.needing} onChange={e => setPostForm(f => ({ ...f, needing: e.target.value }))} /></div>
              <div className={styles.msecLabel}>Compensation</div>
              <div className={styles.compTypeOpts}>
                {['Creative exchange','Paid','Revenue share'].map(c => (
                  <div key={c} className={`${styles.ctopt} ${postComp===c?styles.on:''}`} onClick={() => setPostComp(c)}>
                    <div className={styles.ctoptTitle}>{c}</div>
                    <div className={styles.ctoptDesc}>{c==='Creative exchange'?'Trade skills. No money moves.':c==='Paid'?'Fee agreed upfront.':'Split the outcome.'}</div>
                  </div>
                ))}
              </div>
              {postComp === 'Paid' && <div className={styles.mfield}><label>Fee range</label><input type="text" placeholder="e.g. $500–1,000" value={postForm.fee_range} onChange={e => setPostForm(f => ({ ...f, fee_range: e.target.value }))} /></div>}
              <div className={styles.mfieldRow}>
                <div className={styles.mfield}><label>Timeline</label><input type="text" placeholder="e.g. 6–8 weeks" value={postForm.timeline} onChange={e => setPostForm(f => ({ ...f, timeline: e.target.value }))} /></div>
                <div className={styles.mfield}><label>Deadline</label><input type="date" value={postForm.deadline} onChange={e => setPostForm(f => ({ ...f, deadline: e.target.value }))} /></div>
              </div>
              <div className={styles.mfield}>
                <label>Location preference</label>
                <select value={postForm.location_preference} onChange={e => setPostForm(f => ({ ...f, location_preference: e.target.value }))}>
                  <option value="">Select…</option><option>Local only</option><option>Remote OK</option><option>Remote only</option><option>No preference</option>
                </select>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnCancelBrief} onClick={() => setPostOpen(false)}>Cancel</button>
              <button className={styles.btnSubmitBrief} onClick={submitBrief} disabled={submitting}>{submitting?'Posting…':'Post brief ↗'}</button>
            </div>
          </div>
        </div>
      )}

      {/* APPLY MODAL */}
      {applyOpen && selected && (
        <div className={styles.applyModal} onClick={e => { if (e.target === e.currentTarget) setApplyOpen(false) }}>
          <div className={styles.applyInner}>
            <div className={styles.applyTitle}>Apply to this brief</div>
            <div className={styles.applySub}>Write directly to the poster. Explain why you're drawn to this project and what you'd bring to it.</div>
            <div className={styles.applyBriefRef}><strong>Brief:</strong> {selected.title}</div>
            <div className={styles.mfield}>
              <label>Your message</label>
              <textarea placeholder="Hi — I came across your brief and I'm really drawn to this project because…" rows={5} value={applyMsg} onChange={e => setApplyMsg(e.target.value)} />
            </div>
            <div className={styles.applyFooter}>
              <button className={styles.btnCancelBrief} onClick={() => setApplyOpen(false)}>Cancel</button>
              <button className={styles.btnSubmitBrief} onClick={submitApplication} disabled={submitting}>{submitting?'Sending…':'Send application ↗'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function BriefsPage() {
  return (
    <Suspense fallback={null}>
      <BriefsInner />
    </Suspense>
  )
}