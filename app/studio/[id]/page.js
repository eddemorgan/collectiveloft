'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import styles from './studio.module.css'

const ENDORSE_OPTS = [
  'Communicative','Met deadlines','Delivered quality work','Creative',
  'Flexible','Professional','Would collab again','Went above and beyond',
]

const RIGHTS_LABELS = {
  transfer: 'Full transfer on payment',
  shared: 'Shared credit',
  license: 'License only',
  negotiate: 'Negotiate separately',
}

function initials(first, last) {
  return `${(first||'?')[0]}${(last||'?')[0]}`.toUpperCase()
}
function timeStr(d) {
  return new Date(d).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })
}
function msgTimeStr(d, alwaysFull = false) {
  if (!d) return ''
  const date = new Date(d)
  const now  = new Date()
  const isToday = date.toDateString() === now.toDateString()
  const time = date.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })
  if (!alwaysFull && isToday) return time
  return date.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) + ' · ' + time
}
function dateStr(d) {
  return new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric' })
}
function fullDateStr(d) {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })
}
function daysLeft(dateStr) {
  if (!dateStr) return null
  const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24))
  return diff
}
function formatBytes(b) {
  if (!b) return ''
  if (b < 1024) return `${b} B`
  if (b < 1048576) return `${(b/1024).toFixed(1)} KB`
  return `${(b/1048576).toFixed(1)} MB`
}
function fileIcon(type) {
  if (!type) return '📄'
  if (type.startsWith('image/')) return '🖼'
  if (type.startsWith('video/')) return '▶'
  if (type.startsWith('audio/')) return '🎵'
  if (type === 'application/pdf') return '📄'
  return '📋'
}

// Sort milestones by due_date ascending; undated milestones float to bottom
function sortByDate(arr) {
  return [...arr].sort((a, b) => {
    if (!a.due_date && !b.due_date) return 0
    if (!a.due_date) return 1
    if (!b.due_date) return -1
    return new Date(a.due_date) - new Date(b.due_date)
  })
}

// Milestone due date status
function msStatus(due_date, done) {
  if (done) return 'done'
  if (!due_date) return 'none'
  const d = daysLeft(due_date)
  if (d < 0) return 'overdue'
  if (d <= 3) return 'urgent'
  if (d <= 7) return 'soon'
  return 'ok'
}

export default function StudioPage() {
  const router = useRouter()
  const params = useParams()
  const studioId = params?.id

  const [myProfile,      setMyProfile]      = useState(null)
  const [studio,         setStudio]         = useState(null)
  const [owner,          setOwner]          = useState(null)   // brief creator = collab owner
  const [contributor,    setContributor]    = useState(null)   // the other party
  const [allStudios,     setAllStudios]     = useState([])
  const [milestones,     setMilestones]     = useState([])
  const [files,          setFiles]          = useState([])
  const [notes,          setNotes]          = useState('')
  const [messages,       setMessages]       = useState([])
  const [chatInput,      setChatInput]      = useState('')
  const [activeTab,      setActiveTab]      = useState('overview')
  const [loading,        setLoading]        = useState(true)
  const [uploading,      setUploading]      = useState(false)
  const [savingNotes,    setSavingNotes]    = useState(false)

  // Milestone management
  const [editingMs,      setEditingMs]      = useState(null)
  const [editMsDraft,    setEditMsDraft]    = useState({})
  const [addingMs,       setAddingMs]       = useState(false)
  const [newMs,          setNewMs]          = useState({ title:'', due_date:'' })

  // Close flow
  const [closeProposed,  setCloseProposed]  = useState(false)
  const [showComplete,   setShowComplete]   = useState(false)

  // Rating modal
  const [showRating,     setShowRating]     = useState(false)
  const [ratingStars,    setRatingStars]    = useState(0)
  const [hoverStar,      setHoverStar]      = useState(0)
  const [endorsed,       setEndorsed]       = useState([])
  const [reviewText,     setReviewText]     = useState('')
  const [ratingDone,     setRatingDone]     = useState(false)

  const chatEndRef   = useRef()
  const fileInputRef = useRef()
  const notesTimer   = useRef()

  useEffect(() => { if (studioId) load() }, [studioId])

  // Realtime chat
  useEffect(() => {
    if (!studioId) return
    const channel = supabase
      .channel(`studio-chat-${studioId}`, { config: { broadcast: { self: true } } })
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'studio_messages', filter:`studio_id=eq.${studioId}` },
        payload => {
          setMessages(prev => {
            if (prev.some(m => m.id === payload.new.id)) return prev
            return [...prev, payload.new]
          })
          setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior:'smooth' }), 100)
        })
      .subscribe(status => console.log('Realtime:', status))
    return () => supabase.removeChannel(channel)
  }, [studioId])

  async function load() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: me } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setMyProfile(me)

    const { data: term } = await supabase
      .from('collab_terms')
      .select(`*, initiator:profiles!collab_terms_initiator_id_fkey(id, firstname, lastname, headline, disciplines), partner:profiles!collab_terms_partner_id_fkey(id, firstname, lastname, headline, disciplines)`)
      .eq('id', studioId).single()

    if (term) {
      setStudio(term)
      setOwner(term.initiator)
      setContributor(term.partner)
      setCloseProposed(term.close_proposed || false)
      setShowComplete(term.status === 'complete')
    }

    const { data: allTerms } = await supabase
      .from('collab_terms')
      .select(`id, project_title, status, initiator:profiles!collab_terms_initiator_id_fkey(id, firstname, lastname), partner:profiles!collab_terms_partner_id_fkey(id, firstname, lastname)`)
      .or(`initiator_id.eq.${user.id},partner_id.eq.${user.id}`)
      .in('status', ['active','paused'])
    setAllStudios(allTerms || [])

    const { data: ms } = await supabase.from('studio_milestones').select('*').eq('studio_id', studioId)
    setMilestones(sortByDate(ms || []))

    // Check if THIS user has already submitted a rating for this studio
    const { data: existingRating } = await supabase
      .from('ratings')
      .select('id')
      .eq('studio_id', studioId)
      .eq('rater_id', user.id)
      .eq('submitted', true)
      .single()
    setRatingDone(!!existingRating)

    const { data: fs } = await supabase.from('studio_files').select('*').eq('studio_id', studioId).order('created_at', { ascending: false })
    setFiles(fs || [])

    const { data: noteData } = await supabase.from('studio_notes').select('content').eq('studio_id', studioId).single()
    if (noteData) setNotes(noteData.content || '')

    const { data: msgs } = await supabase.from('studio_messages').select('*').eq('studio_id', studioId).order('created_at')
    setMessages(msgs || [])

    setLoading(false)
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior:'smooth' }), 300)
  }

  // Central system message sender -- the activity trail
  async function sys(text) {
    await supabase.from('studio_messages').insert({
      studio_id: studioId,
      sender_id: null,
      type: 'sys',
      content: text,
    })
  }

  function myName() {
    if (!myProfile) return 'Someone'
    return `${myProfile.firstname} ${myProfile.lastname}`
  }

  async function toggleMilestone(ms) {
    const done = !ms.done
    await supabase.from('studio_milestones').update({ done }).eq('id', ms.id)
    const updated = milestones.map(m => m.id === ms.id ? { ...m, done } : m)
    setMilestones(sortByDate(updated))

    if (done) {
      sys(`${myName()} marked "${ms.title}" as complete.`)
      if (updated.every(m => m.done) && !closeProposed) {
        sys('All milestones complete. Either party can now propose closing this Loft Studio.')
      }
    } else {
      sys(`${myName()} marked "${ms.title}" as incomplete.`)
    }
  }

  function startEditMs(ms) {
    setEditingMs(ms.id)
    setEditMsDraft({ title: ms.title, due_date: ms.due_date || '' })
  }

  async function saveEditMs(ms) {
    if (!editMsDraft.title.trim()) return
    const newTitle   = editMsDraft.title.trim()
    const newDueDate = editMsDraft.due_date || null

    await supabase.from('studio_milestones').update({
      title: newTitle,
      due_date: newDueDate,
    }).eq('id', ms.id)

    setMilestones(prev => sortByDate(
      prev.map(m => m.id === ms.id ? { ...m, title: newTitle, due_date: newDueDate } : m)
    ))
    setEditingMs(null)
    setEditMsDraft({})

    // Build a meaningful trail message
    const changes = []
    if (newTitle !== ms.title) changes.push(`renamed to "${newTitle}"`)
    if (newDueDate !== ms.due_date) {
      if (newDueDate) changes.push(`due date set to ${fullDateStr(newDueDate)}`)
      else changes.push('due date removed')
    }
    if (changes.length > 0) {
      sys(`${myName()} updated milestone "${ms.title}": ${changes.join(', ')}.`)
    }
  }

  async function deleteMs(id) {
    if (!confirm('Delete this milestone?')) return
    const ms = milestones.find(m => m.id === id)
    await supabase.from('studio_milestones').delete().eq('id', id)
    setMilestones(prev => prev.filter(m => m.id !== id))
    if (ms) sys(`${myName()} deleted milestone "${ms.title}".`)
  }

  async function addMilestone() {
    if (!newMs.title.trim()) return
    const { data } = await supabase.from('studio_milestones').insert({
      studio_id: studioId,
      title: newMs.title.trim(),
      due_date: newMs.due_date || null,
      done: false,
      sort_order: 0,
    }).select().single()
    if (data) {
      setMilestones(prev => sortByDate([...prev, data]))
      const dateNote = newMs.due_date ? ` due ${fullDateStr(newMs.due_date)}` : ''
      sys(`${myName()} added milestone "${newMs.title.trim()}"${dateNote}.`)
    }
    setNewMs({ title:'', due_date:'' })
    setAddingMs(false)
  }

  async function sendChat() {
    if (!chatInput.trim() || !myProfile) return
    const text = chatInput.trim()
    setChatInput('')
    await supabase.from('studio_messages').insert({
      studio_id: studioId,
      sender_id: myProfile.id,
      type: 'message',
      content: text,
    })
  }

  async function proposeClose() {
    if (closeProposed) return
    setCloseProposed(true)
    await supabase.from('collab_terms').update({ close_proposed: true }).eq('id', studioId)
    sys(`${myName()} has proposed closing this Loft Studio. Both parties must agree to close.`)
  }

  async function confirmComplete() {
    await supabase.from('collab_terms').update({
      status: 'complete',
      close_proposed: false,
      completed_at: new Date().toISOString(),
    }).eq('id', studioId)

    // Increment collabs_count on both profiles
    if (owner?.id) {
      const { data: ownerProfile } = await supabase.from('profiles').select('collabs_count').eq('id', owner.id).single()
      await supabase.from('profiles').update({ collabs_count: (ownerProfile?.collabs_count || 0) + 1 }).eq('id', owner.id)
    }
    if (contributor?.id) {
      const { data: contribProfile } = await supabase.from('profiles').select('collabs_count').eq('id', contributor.id).single()
      await supabase.from('profiles').update({ collabs_count: (contribProfile?.collabs_count || 0) + 1 }).eq('id', contributor.id)
    }

    setStudio(prev => ({ ...prev, status: 'complete' }))
    setShowComplete(true)
    sys(`${myName()} confirmed this Loft Studio complete. Great work.`)
    sys(`⭐ Rate your collaboration → /rating?studio=${studioId}`)
  }

  async function withdrawClose() {
    setCloseProposed(false)
    await supabase.from('collab_terms').update({ close_proposed: false }).eq('id', studioId)
    sys(`${myName()} has withdrawn the Studio close proposal.`)
  }

  async function uploadFile(file) {
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${studioId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('studio-files').upload(path, file, { upsert: true })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('studio-files').getPublicUrl(path)
      const { data: f } = await supabase.from('studio_files').insert({
        studio_id: studioId,
        name: file.name,
        url: publicUrl,
        size: file.size,
        type: file.type,
      }).select().single()
      if (f) {
        setFiles(prev => [f, ...prev])
        sys(`${myName()} uploaded "${file.name}" (${formatBytes(file.size)}).`)
      }
    }
    setUploading(false)
  }

  function handleNotesChange(val) {
    setNotes(val)
    clearTimeout(notesTimer.current)
    notesTimer.current = setTimeout(async () => {
      setSavingNotes(true)
      await supabase.from('studio_notes').upsert({ studio_id: studioId, content: val }, { onConflict:'studio_id' })
      setSavingNotes(false)
    }, 1000)
  }

  async function submitRating() {
    if (!ratingStars || reviewText.trim().length < 20) return
    await supabase.from('ratings').insert({
      rater_id:     myProfile.id,
      ratee_id:     contributor?.id === myProfile.id ? owner?.id : contributor?.id,
      studio_id:    studioId,
      stars:        ratingStars,
      endorsements: endorsed,
      review:       reviewText.trim(),
      submitted:    true,
    })
    await supabase.from('collab_terms').update({ rated: true }).eq('id', studioId)
    setRatingDone(true)
    setShowRating(false)
    sys(`${myName()} submitted their collaboration review.`)
  }

  const done  = milestones.filter(m => m.done).length
  const total = milestones.length
  const pct   = total ? Math.round(done / total * 100) : 0

  const myInit         = myProfile    ? initials(myProfile.firstname, myProfile.lastname) : '?'
  const ownerInit      = owner        ? initials(owner.firstname, owner.lastname) : '?'
  const contributorInit = contributor ? initials(contributor.firstname, contributor.lastname) : '?'
  const ownerName      = owner        ? `${owner.firstname} ${owner.lastname}` : 'Collab Owner'
  const contributorName = contributor ? `${contributor.firstname} ${contributor.lastname}` : 'Collab Contributor'
  const partnerFirst   = myProfile?.id === owner?.id
    ? contributor?.firstname || 'collaborator'
    : owner?.firstname || 'collaborator'

  const displayStars   = hoverStar || ratingStars

  // Timeline data
  const studioStart    = studio?.created_at
  const studioDeadline = studio?.deadline
  const msWithDates    = milestones.filter(m => m.due_date)

  if (loading) return <div className={styles.loading}><div className={styles.loadingDot}>✦</div></div>
  if (!studio) return <div className={styles.notFound}><div>Studio not found.</div><Link href="/my-studios">Back to My Studios</Link></div>

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>Collective <span>Loft</span></Link>
        <div className={styles.navLinks}>
          <Link href="/discover">Discover</Link>
          <Link href="/briefs">Collabs</Link>
          <Link href="/matching">Matching</Link>
          <Link href="/my-studios">My Loft Studios</Link>
          {myProfile && (
            <Link href={`/profile/${myProfile.id}`}>My Profile</Link>
          )}
        </div>
      </nav>

      <div className={styles.studioLayout}>

        {/* LEFT SIDEBAR */}
        <aside className={styles.studioSb}>
          <div className={styles.sbLogoRow}>Loft <span>Studio</span></div>
          {myProfile && (
            <div className={styles.sbProfile}>
              <div className={styles.sbAv}>{myInit}</div>
              <div>
                <div className={styles.sbName}>{myProfile.firstname} {myProfile.lastname}</div>
                <div className={styles.sbRole}>{(myProfile.disciplines||[])[0]||'Creative'}</div>
              </div>
            </div>
          )}
          <div className={styles.sbNavSection}>
            <div className={styles.sbNavLabel}>Navigate</div>
            <Link href="/my-studios" className={styles.sbNavItem}><span className={styles.sbNavIcon}>◈</span>My Studios</Link>
            <Link href="/briefs" className={styles.sbNavItem}><span className={styles.sbNavIcon}>◎</span>Collabs</Link>
          </div>
          {allStudios.length > 0 && (
            <div className={styles.sbProjSection}>
              <div className={styles.sbNavLabel}>Active studios</div>
              {allStudios.map(s => {
                const p = s.initiator_id === myProfile?.id ? s.partner : s.initiator
                return (
                  <Link key={s.id} href={`/studio/${s.id}`} className={`${styles.projItem} ${s.id === studioId ? styles.projActive : ''}`}>
                    <div className={styles.projName}>{s.project_title||'Untitled'}</div>
                    <div className={styles.projMeta}>
                      <div className={`${styles.projDot} ${s.status==='paused'?styles.dotPaused:styles.dotActive}`}/>
                      With {p?`${p.firstname} ${p.lastname}`:'collaborator'}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </aside>

        {/* CENTRE WORKSPACE */}
        <div className={styles.studioMain}>
          <div className={styles.mainHdr}>
            <div className={styles.mainHdrLeft}>
              <div className={styles.studioTitle}>{studio.project_title||'Untitled project'}</div>

              {/* Owner + Contributor under title */}
              <div className={styles.collabParties}>
                <Link href={owner?.id ? `/profile/${owner.id}` : '#'} className={styles.partyRow}>
                  <div className={`${styles.collabAv} ${styles.avGold}`}>{ownerInit}</div>
                  <span className={styles.partyName}>{ownerName}</span>
                  <span className={styles.partyLabel}>Collab Owner</span>
                </Link>
                <Link href={contributor?.id ? `/profile/${contributor.id}` : '#'} className={styles.partyRow}>
                  <div className={`${styles.collabAv} ${styles.avTeal}`}>{contributorInit}</div>
                  <span className={styles.partyName}>{contributorName}</span>
                  <span className={styles.partyLabel}>Collab Contributor</span>
                </Link>
              </div>

              <div className={styles.studioMeta}>
                <span className={`${styles.statusPill} ${studio.status==='complete'?styles.pillComplete:styles.pillActive}`}>
                  {studio.status==='complete'?'Complete':'In progress'}
                </span>
                {studio.deadline && (
                  <span style={{color: daysLeft(studio.deadline) < 7 ? '#c27080' : 'inherit'}}>
                    {daysLeft(studio.deadline) >= 0 ? `${daysLeft(studio.deadline)} days left` : 'Past deadline'}
                  </span>
                )}
                <span>{done}/{total} milestones</span>
              </div>
            </div>

            <div className={styles.mainHdrRight}>
              {studio.status === 'complete' ? (
                <span className={styles.completedLabel}>✦ Completed Collab</span>
              ) : pct === 100 && myProfile?.id === owner?.id ? (
                <button className={styles.btnConfirmComplete} onClick={confirmComplete}>Confirm Complete</button>
              ) : null}
            </div>
          </div>

          {/* TABS */}
          <div className={styles.studioTabs}>
            {['overview','milestones','timeline','terms','files','notes'].map(tab => (
              <div key={tab} className={`${styles.stab} ${activeTab===tab?styles.stabActive:''}`} onClick={() => setActiveTab(tab)}>
                {tab.charAt(0).toUpperCase()+tab.slice(1)}
              </div>
            ))}
          </div>

          <div className={styles.tabPanels}>

            {/* OVERVIEW */}
            {activeTab === 'overview' && (
              <div className={styles.tabPanel}>
                {showComplete && !ratingDone && (
                  <div className={styles.completionPrompt}>
                    <div className={styles.cpGoldTitle}>✦ This Loft Studio is complete.</div>
                    <div className={styles.cpGoldText}>Rate your collaboration with {partnerFirst} — it matters to the next person who considers working with them.</div>
                    <button className={styles.btnRate} onClick={() => setShowRating(true)}>Rate this collaboration ↗</button>
                  </div>
                )}

                {/* Progress bar */}
                {total > 0 && (
                  <div className={styles.overviewProgress}>
                    <div className={styles.progressTop}>
                      <span className={styles.progressLabel}>Overall progress</span>
                      <span className={styles.progressPct}>{pct}%</span>
                    </div>
                    <div className={styles.progressBarBg}>
                      <div className={styles.progressBarFill} style={{ width:`${pct}%` }}/>
                    </div>
                    <div className={styles.progressSub}>{done} of {total} milestones complete</div>
                  </div>
                )}

                {/* Upcoming milestones -- reads from live studio_milestones state */}
                {(() => {
                  const upcoming = milestones.filter(m => !m.done && m.due_date)
                  if (upcoming.length === 0) return null
                  return (
                    <>
                      <div className={styles.secLbl}>Upcoming</div>
                      <div className={styles.upcomingList}>
                        {upcoming.map(ms => {
                          const d = daysLeft(ms.due_date)
                          const status = msStatus(ms.due_date, ms.done)
                          return (
                            <div key={ms.id} className={styles.upcomingItem}>
                              <div className={styles.upcomingTitle}>{ms.title}</div>
                              <div className={`${styles.upcomingDays} ${styles[`ms_${status}`]}`}>
                                {d < 0 ? `${Math.abs(d)}d overdue` : d === 0 ? 'Due today' : `${d}d left`}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )
                })()}

                {/* Brief summary */}
                <div className={styles.secLbl}>Project brief</div>
                <div className={styles.briefCard}>
                  <div className={styles.briefCardTitle}>{studio.project_title||'Untitled'}</div>
                  <div className={styles.briefCardText}>
                    {studio.collab_type==='exchange'?'Creative exchange':studio.collab_type==='paid'?`Paid · $${studio.fee_from||''}${studio.fee_to?'–'+studio.fee_to:''}` : 'Revenue share'}
                    {studio.timeline?` · ${studio.timeline}`:''}
                    {studio.deadline?` · Due ${fullDateStr(studio.deadline)}`:''}
                  </div>
                </div>

                {/* Recent files */}
                {files.length > 0 && (
                  <>
                    <div className={styles.secLbl}>Recent files</div>
                    <div className={styles.filesGrid}>
                      {files.slice(0,4).map(f => (
                        <a key={f.id} href={f.url} target="_blank" rel="noopener noreferrer" className={styles.fileCard}>
                          <div className={styles.fileIcon}>{fileIcon(f.type)}</div>
                          <div className={styles.fileName}>{f.name}</div>
                          <div className={styles.fileMeta}>{formatBytes(f.size)}</div>
                        </a>
                      ))}
                    </div>
                  </>
                )}

                <input ref={fileInputRef} type="file" style={{display:'none'}} onChange={e=>{if(e.target.files[0])uploadFile(e.target.files[0]);e.target.value=''}}/>
                <button className={styles.btnUpload} onClick={() => fileInputRef.current?.click()}>{uploading?'Uploading…':'+ Upload a file'}</button>
              </div>
            )}

            {/* MILESTONES */}
            {activeTab === 'milestones' && (
              <div className={styles.tabPanel}>
                <div className={styles.secLblRow}>
                  <div className={styles.secLbl} style={{marginTop:0}}>
                    Milestones
                    {total > 0 && <span style={{marginLeft:'0.5rem',color:'var(--gold)',fontFamily:'var(--sans)',fontSize:'0.65rem',letterSpacing:'normal',textTransform:'none',fontWeight:500}}>{pct}% complete</span>}
                  </div>
                  <button className={styles.btnAddMsTop} onClick={() => setAddingMs(true)}>+ Add milestone</button>
                </div>

                {/* Progress bar */}
                {total > 0 && (
                  <div className={styles.msPogBar}>
                    <div className={styles.msPogFill} style={{width:`${pct}%`}}/>
                  </div>
                )}

                {milestones.length === 0 && !addingMs ? (
                  <div className={styles.emptyState}>No milestones yet. Add one to start tracking progress.</div>
                ) : (
                  <div className={styles.msTable}>
                    <div className={styles.msTableHdr}>
                      <div className={styles.msColNum}>#</div>
                      <div className={styles.msColTitle}>Milestone</div>
                      <div className={styles.msColDate}>Due date</div>
                      <div className={styles.msColStatus}>Status</div>
                      <div className={styles.msColActions}>Actions</div>
                    </div>

                    {milestones.map((ms, index) => {
                      const status = msStatus(ms.due_date, ms.done)
                      const d = ms.due_date ? daysLeft(ms.due_date) : null
                      const isEditing = editingMs === ms.id
                      return (
                        <div key={ms.id} className={`${styles.msTableRow} ${ms.done ? styles.msRowDone : ''}`}>
                          <div className={styles.msColNum}>{index + 1}</div>

                          <div className={styles.msColTitle}>
                            {isEditing ? (
                              <input
                                className={styles.msCellInput}
                                value={editMsDraft.title}
                                onChange={e => setEditMsDraft(d => ({ ...d, title: e.target.value }))}
                                autoFocus
                                onKeyDown={e => e.key === 'Enter' && saveEditMs(ms)}
                              />
                            ) : (
                              <span className={ms.done ? styles.msTitleDone : styles.msTitleText}>{ms.title}</span>
                            )}
                          </div>

                          <div className={styles.msColDate}>
                            {isEditing ? (
                              <input
                                className={styles.msCellDateInput}
                                type="date"
                                value={editMsDraft.due_date}
                                onChange={e => setEditMsDraft(d => ({ ...d, due_date: e.target.value }))}
                              />
                            ) : (
                              <span className={`${styles.msDateText} ${styles[`ms_${status}`]}`}>
                                {ms.due_date
                                  ? ms.done
                                    ? fullDateStr(ms.due_date)
                                    : d === 0 ? 'Today'
                                    : d < 0 ? `${Math.abs(d)}d overdue`
                                    : `${fullDateStr(ms.due_date)}`
                                  : '—'}
                              </span>
                            )}
                          </div>

                          <div className={styles.msColStatus}>
                            <div
                              className={`${styles.msTableChk} ${ms.done ? styles.msTableChkDone : ''}`}
                              onClick={() => !isEditing && toggleMilestone(ms)}
                              title={ms.done ? 'Mark incomplete' : 'Mark complete'}
                            >
                              {ms.done ? '✓' : ''}
                            </div>
                          </div>

                          <div className={styles.msColActions}>
                            {isEditing ? (
                              <>
                                <button className={styles.msActSave} onClick={() => saveEditMs(ms)}>Save</button>
                                <button className={styles.msActCancel} onClick={() => { setEditingMs(null); setEditMsDraft({}) }}>✕</button>
                              </>
                            ) : (
                              <>
                                <button className={styles.msActBtn} onClick={() => startEditMs(ms)} title="Edit">✎</button>
                                <button className={`${styles.msActBtn} ${styles.msActDelete}`} onClick={() => deleteMs(ms.id)} title="Delete">✕</button>
                              </>
                            )}
                          </div>
                        </div>
                      )
                    })}

                    {addingMs && (
                      <div className={styles.msTableRow} style={{background:'rgba(201,168,76,0.04)',borderColor:'rgba(201,168,76,0.2)'}}>
                        <div className={styles.msColNum} style={{color:'var(--gold)',opacity:0.5}}>+</div>
                        <div className={styles.msColTitle}>
                          <input
                            className={styles.msCellInput}
                            value={newMs.title}
                            onChange={e => setNewMs(d => ({ ...d, title: e.target.value }))}
                            placeholder="Milestone title"
                            autoFocus
                            onKeyDown={e => e.key === 'Enter' && addMilestone()}
                          />
                        </div>
                        <div className={styles.msColDate}>
                          <input
                            className={styles.msCellDateInput}
                            type="date"
                            value={newMs.due_date}
                            onChange={e => setNewMs(d => ({ ...d, due_date: e.target.value }))}
                          />
                        </div>
                        <div className={styles.msColStatus}/>
                        <div className={styles.msColActions}>
                          <button className={styles.msActSave} onClick={addMilestone}>Add</button>
                          <button className={styles.msActCancel} onClick={() => { setAddingMs(false); setNewMs({ title:'', due_date:'' }) }}>✕</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TIMELINE */}
            {activeTab === 'timeline' && (
              <div className={styles.tabPanel}>
                <div className={styles.secLbl}>Project timeline</div>

                {!studioStart && !studioDeadline && msWithDates.length === 0 ? (
                  <div className={styles.emptyState}>Add due dates to milestones to see your timeline.</div>
                ) : (
                  <>
                    <div className={styles.timelineHeader}>
                      <div className={styles.tlHeaderItem}>
                        <div className={styles.tlHeaderLabel}>Studio opened</div>
                        <div className={styles.tlHeaderValue}>{fullDateStr(studioStart)}</div>
                      </div>
                      {studio.timeline && (
                        <div className={styles.tlHeaderItem}>
                          <div className={styles.tlHeaderLabel}>Estimated duration</div>
                          <div className={styles.tlHeaderValue}>{studio.timeline}</div>
                        </div>
                      )}
                      {studioDeadline && (
                        <div className={styles.tlHeaderItem}>
                          <div className={styles.tlHeaderLabel}>Final deadline</div>
                          <div className={`${styles.tlHeaderValue} ${daysLeft(studioDeadline) < 7 ? styles.tlDeadlineUrgent : styles.tlDeadlineOk}`}>
                            {fullDateStr(studioDeadline)} · {daysLeft(studioDeadline) >= 0 ? `${daysLeft(studioDeadline)} days left` : 'Past deadline'}
                          </div>
                        </div>
                      )}
                      <div className={styles.tlHeaderItem}>
                        <div className={styles.tlHeaderLabel}>Progress</div>
                        <div className={styles.tlHeaderValue}>{pct}% complete</div>
                      </div>
                    </div>

                    {studioDeadline && studioStart && (
                      <div className={styles.timelineBar}>
                        <div className={styles.tlBarBg}>
                          <div className={styles.tlBarFill} style={{ width:`${pct}%` }}/>
                          {(() => {
                            const start = new Date(studioStart).getTime()
                            const end   = new Date(studioDeadline).getTime()
                            const now   = Date.now()
                            const todayPct = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100))
                            return <div className={styles.tlTodayMarker} style={{ left:`${todayPct}%` }}><div className={styles.tlTodayLabel}>Today</div></div>
                          })()}
                          {msWithDates.map(ms => {
                            const start = new Date(studioStart).getTime()
                            const end   = new Date(studioDeadline).getTime()
                            const pos   = Math.min(100, Math.max(0, ((new Date(ms.due_date).getTime() - start) / (end - start)) * 100))
                            const status = msStatus(ms.due_date, ms.done)
                            return (
                              <div key={ms.id} className={`${styles.tlMsMarker} ${styles[`tlMs_${status}`]}`} style={{ left:`${pos}%` }} title={`${ms.title} — ${fullDateStr(ms.due_date)}`}>
                                <div className={styles.tlMsDot}/>
                                <div className={styles.tlMsLabel}>{ms.title}</div>
                              </div>
                            )
                          })}
                        </div>
                        <div className={styles.tlBarLabels}>
                          <span>{fullDateStr(studioStart)}</span>
                          <span>{fullDateStr(studioDeadline)}</span>
                        </div>
                      </div>
                    )}

                    <div className={styles.secLbl}>Milestone schedule</div>
                    {milestones.length === 0 ? (
                      <div className={styles.emptyState}>No milestones added yet.</div>
                    ) : (
                      <div className={styles.tlMilestoneList}>
                        {milestones.map((ms, i) => {
                          const d = ms.due_date ? daysLeft(ms.due_date) : null
                          const status = msStatus(ms.due_date, ms.done)
                          return (
                            <div key={ms.id} className={styles.tlMsRow}>
                              <div className={styles.tlMsRowLeft}>
                                <div className={`${styles.tlMsRowDot} ${styles[`tlMs_${status}`]}`}>{ms.done ? '✓' : i+1}</div>
                                <div className={styles.tlMsRowConnector}/>
                              </div>
                              <div className={styles.tlMsRowBody}>
                                <div className={`${styles.tlMsRowTitle} ${ms.done ? styles.tlMsRowDone : ''}`}>{ms.title}</div>
                                {ms.due_date ? (
                                  <div className={`${styles.tlMsRowDate} ${styles[`ms_${status}`]}`}>
                                    {ms.done ? `Done · ${fullDateStr(ms.due_date)}`
                                      : d < 0 ? `${Math.abs(d)} days overdue`
                                      : d === 0 ? 'Due today'
                                      : `${d} days left · ${fullDateStr(ms.due_date)}`}
                                  </div>
                                ) : (
                                  <div className={styles.tlMsRowDate} style={{color:'rgba(255,255,255,0.2)'}}>No due date set</div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* TERMS */}
            {activeTab === 'terms' && (
              <div className={styles.tabPanel}>
                <div className={styles.secLbl}>Agreed terms</div>
                <div className={styles.termsCard}>
                  <div className={styles.termsGrid}>
                    <div className={styles.termsRow}>
                      <span className={styles.termsKey}>Project</span>
                      <span className={styles.termsVal}>{studio.project_title||'—'}</span>
                    </div>
                    <div className={styles.termsRow}>
                      <span className={styles.termsKey}>Type</span>
                      <span className={styles.termsVal}>{studio.collab_type==='exchange'?'Creative exchange':studio.collab_type==='paid'?'Paid':'Revenue share'}</span>
                    </div>
                    {studio.collab_type === 'paid' && studio.fee_from && (
                      <div className={styles.termsRow}>
                        <span className={styles.termsKey}>Fee</span>
                        <span className={`${styles.termsVal} ${styles.termsGold}`}>${studio.fee_from}{studio.fee_to?`–${studio.fee_to}`:''}</span>
                      </div>
                    )}
                    {studio.collab_type === 'paid' && studio.pay_schedule && (
                      <div className={styles.termsRow}>
                        <span className={styles.termsKey}>Payment</span>
                        <span className={styles.termsVal}>{studio.pay_schedule}</span>
                      </div>
                    )}
                    {studio.collab_type === 'revenue' && studio.my_share && (
                      <div className={styles.termsRow}>
                        <span className={styles.termsKey}>Split</span>
                        <span className={`${styles.termsVal} ${styles.termsGold}`}>{studio.my_share} / {studio.their_share}</span>
                      </div>
                    )}
                    {studio.rights && (
                      <div className={styles.termsRow}>
                        <span className={styles.termsKey}>Rights</span>
                        <span className={styles.termsVal}>{RIGHTS_LABELS[studio.rights]||studio.rights}</span>
                      </div>
                    )}
                    {studio.timeline && (
                      <div className={styles.termsRow}>
                        <span className={styles.termsKey}>Timeline</span>
                        <span className={styles.termsVal}>{studio.timeline}</span>
                      </div>
                    )}
                    {studio.deadline && (
                      <div className={styles.termsRow}>
                        <span className={styles.termsKey}>Deadline</span>
                        <span className={styles.termsVal}>{fullDateStr(studio.deadline)}</span>
                      </div>
                    )}
                    {studio.location && (
                      <div className={styles.termsRow}>
                        <span className={styles.termsKey}>Location</span>
                        <span className={styles.termsVal}>{studio.location}</span>
                      </div>
                    )}
                    {studio.cadence && (
                      <div className={styles.termsRow}>
                        <span className={styles.termsKey}>Cadence</span>
                        <span className={styles.termsVal}>{studio.cadence}</span>
                      </div>
                    )}
                  </div>
                </div>

                {(studio.deliverables||[]).length > 0 && (
                  <>
                    <div className={styles.secLbl}>Deliverables</div>
                    <div className={styles.termsCard}>
                      {studio.deliverables.map((d,i) => (
                        <div key={i} className={styles.deliverableRow}>
                          <span className={styles.deliverableChk}>✓</span>
                          <span className={styles.deliverableText}>{d}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {(studio.milestones||[]).length > 0 && studio.collab_type === 'paid' && (
                  <>
                    <div className={styles.secLbl}>Original payment milestones</div>
                    <div className={styles.termsCard}>
                      {studio.milestones.map((m,i) => (
                        <div key={i} className={styles.deliverableRow}>
                          <span className={styles.deliverableChk} style={{color:'var(--gold)'}}>{m.pct}%</span>
                          <span className={styles.deliverableText}>{m.desc||m.title||`Milestone ${i+1}`}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <div className={styles.termsNote}>
                  These terms were agreed upon by both parties when this Loft Studio was opened. They are locked and cannot be modified unilaterally.
                </div>
              </div>
            )}

            {/* FILES */}
            {activeTab === 'files' && (
              <div className={styles.tabPanel}>
                <div className={styles.secLbl}>Project files</div>
                {files.length === 0 ? (
                  <div className={styles.emptyState}>No files uploaded yet.</div>
                ) : (
                  <div className={styles.filesGrid} style={{marginBottom:'0.85rem'}}>
                    {files.map(f => (
                      <a key={f.id} href={f.url} target="_blank" rel="noopener noreferrer" className={styles.fileCard}>
                        <div className={styles.fileIcon}>{fileIcon(f.type)}</div>
                        <div className={styles.fileName}>{f.name}</div>
                        <div className={styles.fileMeta}>{formatBytes(f.size)} · {dateStr(f.created_at)}</div>
                      </a>
                    ))}
                  </div>
                )}
                <input ref={fileInputRef} type="file" style={{display:'none'}} onChange={e=>{if(e.target.files[0])uploadFile(e.target.files[0]);e.target.value=''}}/>
                <button className={styles.btnUpload} onClick={() => fileInputRef.current?.click()}>{uploading?'Uploading…':'+ Upload a file'}</button>
              </div>
            )}

            {/* NOTES */}
            {activeTab === 'notes' && (
              <div className={styles.tabPanel}>
                <div className={styles.secLblRow}>
                  <div className={styles.secLbl}>Shared notes</div>
                  {savingNotes && <span className={styles.savingNote}>Saving…</span>}
                </div>
                <textarea className={styles.notesArea} value={notes} onChange={e => handleNotesChange(e.target.value)} placeholder="Add shared notes, references, or ideas for this project…"/>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT CHAT */}
        <div className={styles.studioChat}>
          <div className={styles.chatHdr}>
            <span>Studio chat</span>
            <div className={styles.chatOnline}><div className={styles.onlineDot}/><span>{partnerFirst}</span></div>
          </div>
          <div className={styles.chatMsgs}>
            {messages.map((msg, i) => {
              const isMe    = msg.sender_id === myProfile?.id
              const isSys   = msg.type === 'sys'
              const isRating = isSys && msg.content?.includes('/rating?studio=')
              return (
                <div key={msg.id||i} className={`${styles.msg} ${isSys?styles.msgSys:isMe?styles.msgMine:styles.msgTheirs}`}>
                  {!isMe && !isSys && <div className={styles.msgSender}>{partnerFirst}</div>}
                  <div className={styles.msgBubble}>
                    {isRating ? (
                      <Link href={`/rating?studio=${studioId}`} className={styles.ratingLink}>
                        ⭐ Rate your collaboration →
                      </Link>
                    ) : msg.content}
                  </div>
                  {msg.created_at && (
                    <div className={styles.msgTime}>
                      {isSys
                        ? msgTimeStr(msg.created_at, true)
                        : msgTimeStr(msg.created_at, false)
                      }
                    </div>
                  )}
                </div>
              )
            })}
            <div ref={chatEndRef}/>
          </div>
          <div className={styles.chatInputArea}>
            <div className={styles.chatInputWrap}>
              <input className={styles.chatInp} type="text" placeholder={`Message ${partnerFirst}…`} value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key==='Enter' && sendChat()}/>
              <button className={styles.chatSend} onClick={sendChat}>↑</button>
            </div>
          </div>
        </div>
      </div>

      {/* RATING MODAL */}
      {showRating && (
        <div className={styles.ratingOverlay}>
          <div className={styles.ratingModal}>
            <div className={styles.rmHdr}>
              <div className={styles.rmEy}>Loft Studio · Collab complete</div>
              <div className={styles.rmTitle}>Rate your collaboration</div>
              <div className={styles.rmSub}>How was working with <strong>{owner?.id === myProfile?.id ? contributorName : ownerName}</strong>?</div>
            </div>
            <div className={styles.rmBody}>
              <div>
                <div className={styles.starLbl}>Overall rating</div>
                <div className={styles.starsInput}>
                  {[1,2,3,4,5].map(n => (
                    <button key={n} className={`${styles.starBtn} ${displayStars>=n?styles.lit:''}`} onClick={() => setRatingStars(n)} onMouseEnter={() => setHoverStar(n)} onMouseLeave={() => setHoverStar(0)}>★</button>
                  ))}
                </div>
              </div>
              <div>
                <div className={styles.starLbl}>Endorsements <span className={styles.opt}>— select all that apply</span></div>
                <div className={styles.endorseTags}>
                  {ENDORSE_OPTS.map(tag => (
                    <button key={tag} className={`${styles.endorseTag} ${endorsed.includes(tag)?styles.on:''}`} onClick={() => setEndorsed(prev => prev.includes(tag)?prev.filter(t=>t!==tag):[...prev,tag])}>{tag}</button>
                  ))}
                </div>
              </div>
              <div className={styles.rmField}>
                <label>Written review <span className={styles.opt}>— minimum 20 characters</span></label>
                <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder={`Tell other creatives what it was actually like working with ${partnerFirst}.`} rows={4}/>
                <div className={styles.hint}>This appears on {partnerFirst}'s profile under Community Voice.</div>
              </div>
            </div>
            <div className={styles.rmFooter}>
              <button className={styles.btnSkipRating} onClick={() => setShowRating(false)}>Skip for now</button>
              <button className={styles.btnSubmitRating} onClick={submitRating}>Submit review ↗</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}