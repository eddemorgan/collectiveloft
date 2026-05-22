'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import styles from './briefs.module.css'

const DISC_CLASS = {
  'Visual Art':   'dtV',
  'Music':        'dtM',
  'Writing':      'dtW',
  'Design & Web': 'dtD',
  'Film':         'dtF',
  'Photography':  'dtV',
  'Performance':  'dtW',
  'Creative Tech':'dtD',
}
const AV_COLORS = ['avGold','avTeal','avPurp','avBlue','avRose','avGreen']
const COMP_CLASS = {
  'Creative exchange': 'ctEx',
  'Paid':              'ctPd',
  'Revenue share':     'ctRs',
}
const DISC_OPTS = [
  { icon:'🎨', label:'Visual Art' },
  { icon:'🎵', label:'Music' },
  { icon:'✍️', label:'Writing' },
  { icon:'🖥',  label:'Design & Web' },
  { icon:'🎬', label:'Film' },
  { icon:'📷', label:'Photography' },
  { icon:'🎭', label:'Performance' },
  { icon:'💻', label:'Creative Tech' },
]

function daysLeft(deadline) {
  if (!deadline) return null
  const d = new Date(deadline)
  const today = new Date()
  const diff = Math.ceil((d - today) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
}

function initials(firstname, lastname) {
  return [(firstname||'?')[0], (lastname||'?')[0]].join('').toUpperCase()
}

export default function BriefsPage() {
  const { loading: authLoading, user } = useAuth()

  const [briefs,        setBriefs]        = useState([])
  const [loading,       setLoading]       = useState(true)
  const [selectedId,    setSelectedId]    = useState(null)
  const [activeFilter,  setActiveFilter]  = useState('all')
  const [postOpen,      setPostOpen]      = useState(false)
  const [applyOpen,     setApplyOpen]     = useState(false)
  const [applyMsg,      setApplyMsg]      = useState('')
  const [appliedIds,    setAppliedIds]    = useState([])
  const [savedIds,      setSavedIds]      = useState([])
  const [submitting,    setSubmitting]    = useState(false)
  const [deletingId,    setDeletingId]    = useState(null)

  const [postForm, setPostForm] = useState({
    title: '', making: '', needing: '', timeline: '',
    deadline: '', fee_range: '', location_preference: '',
  })
  const [postDiscs, setPostDiscs] = useState([])
  const [postComp,  setPostComp]  = useState('Creative exchange')

  useEffect(() => {
    if (authLoading) return
    loadBriefs()
  }, [authLoading])

  async function loadBriefs() {
    setLoading(true)
    const { data, error } = await supabase
      .from('briefs')
      .select('*, profiles(firstname, lastname, headline, rating, collabs_count)')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
    if (!error && data) setBriefs(data)
    if (data && data.length > 0) setSelectedId(data[0].id)
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
          poster_id: u?.id || null,
          title: postForm.title,
          disciplines: postDiscs,
          what_making: postForm.making,
          who_needed: postForm.needing,
          timeline: postForm.timeline,
          deadline: postForm.deadline || null,
          compensation: postComp,
          fee_range: postForm.fee_range,
          location_preference: postForm.location_preference,
          status: 'open',
        })
        .select('*, profiles(firstname, lastname, headline, rating, collabs_count)')
        .single()
      if (!error && data) {
        setBriefs(prev => [data, ...prev])
        setSelectedId(data.id)
      }
      setPostOpen(false)
      setPostForm({ title:'', making:'', needing:'', timeline:'', deadline:'', fee_range:'', location_preference:'' })
      setPostDiscs([])
      setPostComp('Creative exchange')
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  async function submitApplication() {
    if (!applyMsg.trim() || !selectedId) return
    setSubmitting(true)
    try {
      const { data: { user: u } } = await supabase.auth.getUser()
      await supabase.from('applications').insert({
        brief_id: selectedId,
        applicant_id: u?.id || null,
        message: applyMsg,
      })
      setAppliedIds(prev => [...prev, selectedId])
      setApplyOpen(false)
      setApplyMsg('')
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
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
        {[
          ['all','All briefs'],['Visual Art','Visual art'],['Music','Music'],
          ['Writing','Writing'],['Design & Web','Design & web'],['Film','Film'],['paid','Paid only'],
        ].map(([key, label]) => (
          <div key={key} className={`${styles.ftab} ${activeFilter === key ? styles.active : ''}`}
            onClick={() => { setActiveFilter(key); setSelectedId(null) }}>
            {label}
          </div>
        ))}
      </div>

      <div className={styles.bodySplit} style={{ flex: 1 }}>
        <div className={styles.briefListCol}>
          {loading ? (
            <div className={styles.emptyState}>Loading briefs…</div>
          ) : filtered.length === 0 ? (
            <div className={styles.emptyState}>No briefs match this filter.</div>
          ) : (
            filtered.map(b => {
              const poster   = b.profiles
              const ini      = poster ? initials(poster.firstname, poster.lastname) : '??'
              const avCls    = AV_COLORS[b.id?.charCodeAt(0) % AV_COLORS.length] || 'avGold'
              const dl       = daysLeft(b.deadline)
              const isPoster = user && b.poster_id === user.id
              return (
                <div key={b.id} className={`${styles.briefItem} ${selectedId === b.id ? styles.selected : ''}`}
                  onClick={() => setSelectedId(b.id)}>
                  <div className={styles.biTags}>
                    {(b.disciplines || []).map(d => (
                      <span key={d} className={`${styles.dtag} ${styles[DISC_CLASS[d] || 'dtV']}`}>{d}</span>
                    ))}
                    {b.compensation && (
                      <span className={`${styles.dtag} ${styles[COMP_CLASS[b.compensation] || 'ctEx']}`}>{b.compensation}</span>
                    )}
                    {isPoster && (
                      <button className={styles.biDelete} onClick={e => deleteBrief(e, b.id)}
                        disabled={deletingId === b.id} title="Delete brief">✕</button>
                    )}
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
            })
          )}
        </div>

        <div className={styles.detailPanel}>
          {!selected ? (
            <div className={styles.detailEmpty}>
              <div className={styles.deIcon}>✦</div>
              <div className={styles.deTitle}>Select a brief to read it.</div>
              <div className={styles.deSub}>Click any brief on the left to see the full details, project specs, and who's already applied.</div>
            </div>
          ) : (() => {
            const poster   = selected.profiles
            const ini      = poster ? initials(poster.firstname, poster.lastname) : '??'
            const avCls    = AV_COLORS[selected.id?.charCodeAt(0) % AV_COLORS.length] || 'avGold'
            const applied  = appliedIds.includes(selected.id)
            const saved    = savedIds.includes(selected.id)
            const rating   = poster?.rating || 0
            const stars    = '★'.repeat(Math.floor(rating)) + (rating % 1 ? '½' : '')
            const isPoster = user && selected.poster_id === user.id
            return (
              <div className={styles.detailInner}>
                <div className={styles.detailHdr}>
                  <div className={styles.detailTags}>
                    {(selected.disciplines || []).map(d => (
                      <span key={d} className={`${styles.dtag} ${styles[DISC_CLASS[d] || 'dtV']}`}>{d}</span>
                    ))}
                    {selected.compensation && (
                      <span className={`${styles.dtag} ${styles[COMP_CLASS[selected.compensation] || 'ctEx']}`}>{selected.compensation}</span>
                    )}
                  </div>
                  <div className={styles.detailTitle}>{selected.title}</div>
                  <div className={styles.detailActionRow}>
                    {!isPoster && (
                      <button className={styles.btnApply} onClick={() => !applied && setApplyOpen(true)}
                        style={applied ? { background:'rgba(86,179,156,0.2)', color:'var(--teal)', border:'0.5px solid rgba(86,179,156,0.3)' } : {}}>
                        {applied ? 'Application sent ✦' : 'Apply to this brief'}
                      </button>
                    )}
                    {isPoster ? (
                      <button className={styles.btnDeleteBrief} onClick={e => deleteBrief(e, selected.id)}
                        disabled={deletingId === selected.id}>
                        {deletingId === selected.id ? 'Deleting…' : '✕ Delete this brief'}
                      </button>
                    ) : (
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
                  {rating > 0 && (
                    <div className={styles.posterRating}>
                      <div className={styles.stars}>{stars}</div>
                      <div>{rating} rating</div>
                    </div>
                  )}
                </div>

                {selected.what_making && (
                  <div className={styles.dsec}>
                    <div className={styles.dsecLabel}>What I'm making</div>
                    <div className={styles.dsecText}>{selected.what_making}</div>
                  </div>
                )}
                {selected.who_needed && (
                  <div className={styles.dsec}>
                    <div className={styles.dsecLabel}>Who I need</div>
                    <div className={styles.dsecText}>{selected.who_needed}</div>
                  </div>
                )}
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
                    <div key={d.label} className={`${styles.mdopt} ${postDiscs.includes(d.label) ? styles.on : ''}`} onClick={() => toggleDisc(d.label)}>
                      <div className={styles.mdoptIcon}>{d.icon}</div>
                      <div className={styles.mdoptName}>{d.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.mfield}>
                <label>What are you making?</label>
                <textarea placeholder="Describe your project…" rows={3} value={postForm.making} onChange={e => setPostForm(f => ({ ...f, making: e.target.value }))} />
              </div>
              <div className={styles.mfield}>
                <label>Who do you need?</label>
                <textarea placeholder="Describe the collaborator you want to attract…" rows={3} value={postForm.needing} onChange={e => setPostForm(f => ({ ...f, needing: e.target.value }))} />
              </div>
              <div className={styles.msecLabel}>Compensation</div>
              <div className={styles.compTypeOpts}>
                {['Creative exchange','Paid','Revenue share'].map(c => (
                  <div key={c} className={`${styles.ctopt} ${postComp === c ? styles.on : ''}`} onClick={() => setPostComp(c)}>
                    <div className={styles.ctoptTitle}>{c}</div>
                    <div className={styles.ctoptDesc}>{c === 'Creative exchange' ? 'Trade skills. No money moves.' : c === 'Paid' ? 'Fee agreed upfront.' : 'Split the outcome.'}</div>
                  </div>
                ))}
              </div>
              {postComp === 'Paid' && (
                <div className={styles.mfield}>
                  <label>Fee range</label>
                  <input type="text" placeholder="e.g. $500–1,000" value={postForm.fee_range} onChange={e => setPostForm(f => ({ ...f, fee_range: e.target.value }))} />
                </div>
              )}
              <div className={styles.mfieldRow}>
                <div className={styles.mfield}>
                  <label>Timeline</label>
                  <input type="text" placeholder="e.g. 6–8 weeks" value={postForm.timeline} onChange={e => setPostForm(f => ({ ...f, timeline: e.target.value }))} />
                </div>
                <div className={styles.mfield}>
                  <label>Deadline</label>
                  <input type="date" value={postForm.deadline} onChange={e => setPostForm(f => ({ ...f, deadline: e.target.value }))} />
                </div>
              </div>
              <div className={styles.mfield}>
                <label>Location preference</label>
                <select value={postForm.location_preference} onChange={e => setPostForm(f => ({ ...f, location_preference: e.target.value }))}>
                  <option value="">Select…</option>
                  <option>Local only</option>
                  <option>Remote OK</option>
                  <option>Remote only</option>
                  <option>No preference</option>
                </select>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnCancelBrief} onClick={() => setPostOpen(false)}>Cancel</button>
              <button className={styles.btnSubmitBrief} onClick={submitBrief} disabled={submitting}>
                {submitting ? 'Posting…' : 'Post brief ↗'}
              </button>
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
              <textarea placeholder="Hi — I came across your brief and I'm really drawn to this project because…"
                rows={5} value={applyMsg} onChange={e => setApplyMsg(e.target.value)} />
            </div>
            <div className={styles.applyFooter}>
              <button className={styles.btnCancelBrief} onClick={() => setApplyOpen(false)}>Cancel</button>
              <button className={styles.btnSubmitBrief} onClick={submitApplication} disabled={submitting}>
                {submitting ? 'Sending…' : 'Send application ↗'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}