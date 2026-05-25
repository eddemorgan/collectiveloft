'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import styles from './studio.module.css'

const ENDORSE_OPTS = [
  'Communicative','Met deadlines','Delivered quality work','Creative',
  'Flexible','Professional','Would collab again','Went above and beyond',
]

function initials(first, last) {
  return `${(first||'?')[0]}${(last||'?')[0]}`.toUpperCase()
}

function timeStr(d) {
  return new Date(d).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })
}

function dateStr(d) {
  return new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric' })
}

export default function StudioPage() {
  const router = useRouter()
  const params = useParams()
  const studioId = params?.id

  const [myProfile,      setMyProfile]      = useState(null)
  const [studio,         setStudio]         = useState(null)
  const [partner,        setPartner]        = useState(null)
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

  const chatEndRef    = useRef()
  const fileInputRef  = useRef()
  const notesTimerRef = useRef()

  useEffect(() => {
    if (studioId) load()
  }, [studioId])

  // Realtime chat subscription
  useEffect(() => {
    if (!studioId) return

    const channel = supabase
      .channel(`studio-chat-${studioId}`, {
        config: { broadcast: { self: true } }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'studio_messages',
          filter: `studio_id=eq.${studioId}`,
        },
        payload => {
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m.id === payload.new.id)) return prev
            return [...prev, payload.new]
          })
          setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
        }
      )
      .subscribe(status => {
        console.log('Realtime status:', status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [studioId])

  function scrollChat() {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior:'smooth' }), 100)
  }

  async function load() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: me } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setMyProfile(me)

    // Load this studio
    const { data: term } = await supabase
      .from('collab_terms')
      .select(`
        *,
        initiator:profiles!collab_terms_initiator_id_fkey(id, firstname, lastname, headline, disciplines),
        partner:profiles!collab_terms_partner_id_fkey(id, firstname, lastname, headline, disciplines)
      `)
      .eq('id', studioId)
      .single()

    if (term) {
      setStudio(term)
      const p = term.initiator_id === user.id ? term.partner : term.initiator
      setPartner(p)
      setCloseProposed(term.close_proposed || false)
      setShowComplete(term.status === 'complete')
      setRatingDone(term.rated || false)
    }

    // Load all user's studios for sidebar
    const { data: allTerms } = await supabase
      .from('collab_terms')
      .select(`
        id, project_title, status,
        initiator:profiles!collab_terms_initiator_id_fkey(id, firstname, lastname),
        partner:profiles!collab_terms_partner_id_fkey(id, firstname, lastname)
      `)
      .or(`initiator_id.eq.${user.id},partner_id.eq.${user.id}`)
      .in('status', ['active','pending','paused'])
    setAllStudios(allTerms || [])

    // Load milestones
    const { data: ms } = await supabase
      .from('studio_milestones')
      .select('*')
      .eq('studio_id', studioId)
      .order('sort_order')
    setMilestones(ms || [])

    // Load files
    const { data: fs } = await supabase
      .from('studio_files')
      .select('*')
      .eq('studio_id', studioId)
      .order('created_at', { ascending: false })
    setFiles(fs || [])

    // Load notes
    const { data: noteData } = await supabase
      .from('studio_notes')
      .select('content')
      .eq('studio_id', studioId)
      .single()
    if (noteData) setNotes(noteData.content || '')

    // Load messages
    const { data: msgs } = await supabase
      .from('studio_messages')
      .select('*')
      .eq('studio_id', studioId)
      .order('created_at')
    setMessages(msgs || [])

    setLoading(false)
    setTimeout(scrollChat, 300)
  }

  async function toggleMilestone(ms) {
    const done = !ms.done
    await supabase.from('studio_milestones').update({ done }).eq('id', ms.id)
    setMilestones(prev => prev.map(m => m.id === ms.id ? { ...m, done } : m))
    if (done) {
      sendSystemMessage(`Milestone complete: ${ms.title}`)
    }
    // check if all done
    const updated = milestones.map(m => m.id === ms.id ? { ...m, done } : m)
    if (updated.every(m => m.done) && !closeProposed) {
      sendSystemMessage('All milestones complete. Either party can now propose closing this Loft Studio.')
    }
  }

  async function sendSystemMessage(text) {
    await supabase.from('studio_messages').insert({
      studio_id: studioId,
      sender_id: null,
      type: 'sys',
      content: text,
    })
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
    sendSystemMessage(`${myProfile.firstname} has proposed closing this Loft Studio. Both parties must agree to close.`)
  }

  async function confirmClose() {
    await supabase.from('collab_terms').update({ status: 'complete', close_proposed: false, completed_at: new Date().toISOString() }).eq('id', studioId)
    setStudio(prev => ({ ...prev, status: 'complete' }))
    setCloseProposed(false)
    setShowComplete(true)
    sendSystemMessage('Both parties have agreed. This Loft Studio is now complete. Rating requests sent.')
  }

  async function withdrawClose() {
    setCloseProposed(false)
    await supabase.from('collab_terms').update({ close_proposed: false }).eq('id', studioId)
    sendSystemMessage(`${myProfile.firstname} has withdrawn the Studio close proposal.`)
  }

  async function uploadFile(file) {
    if (!file) return
    setUploading(true)
    const ext  = file.name.split('.').pop()
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
      if (f) setFiles(prev => [f, ...prev])
      sendSystemMessage(`${myProfile.firstname} uploaded ${file.name}`)
    }
    setUploading(false)
  }

  function handleNotesChange(val) {
    setNotes(val)
    clearTimeout(notesTimerRef.current)
    notesTimerRef.current = setTimeout(async () => {
      setSavingNotes(true)
      await supabase.from('studio_notes').upsert({ studio_id: studioId, content: val }, { onConflict: 'studio_id' })
      setSavingNotes(false)
    }, 1000)
  }

  async function submitRating() {
    if (!ratingStars) return
    if (reviewText.trim().length < 20) return
    await supabase.from('ratings').insert({
      rater_id: myProfile.id,
      ratee_id: partner?.id,
      studio_id: studioId,
      stars: ratingStars,
      endorsed,
      review: reviewText.trim(),
      submitted: true,
    })
    await supabase.from('collab_terms').update({ rated: true }).eq('id', studioId)
    setRatingDone(true)
    setShowRating(false)
    sendSystemMessage(`${myProfile.firstname} has submitted their review.`)
  }

  function fileIcon(type) {
    if (!type) return '📄'
    if (type.startsWith('image/')) return '🖼'
    if (type.startsWith('video/')) return '▶'
    if (type.startsWith('audio/')) return '🎵'
    if (type === 'application/pdf') return '📄'
    return '📋'
  }

  function formatBytes(b) {
    if (!b) return ''
    if (b < 1024) return `${b} B`
    if (b < 1048576) return `${(b/1024).toFixed(1)} KB`
    return `${(b/1048576).toFixed(1)} MB`
  }

  const done  = milestones.filter(m => m.done).length
  const total = milestones.length
  const pct   = total ? Math.round(done / total * 100) : 0

  const myInit      = myProfile ? initials(myProfile.firstname, myProfile.lastname) : '?'
  const partnerInit = partner   ? initials(partner.firstname, partner.lastname) : '?'
  const partnerFirst = partner?.firstname || 'collaborator'

  const displayStars = hoverStar || ratingStars

  if (loading) return (
    <div className={styles.loading}>
      <div className={styles.loadingDot}>✦</div>
    </div>
  )

  if (!studio) return (
    <div className={styles.notFound}>
      <div>Studio not found.</div>
      <Link href="/my-studios">Back to My Studios</Link>
    </div>
  )

  function MilestoneList() {
    return (
      <div className={styles.milestoneList}>
        {milestones.map(ms => (
          <div
            key={ms.id}
            className={`${styles.msItem} ${ms.done ? styles.msDone : ''} ${ms.active ? styles.msActive : ''}`}
            onClick={() => toggleMilestone(ms)}
          >
            <div className={`${styles.msChk} ${ms.done ? styles.msChkDone : ''}`}>
              {ms.done ? '✓' : ''}
            </div>
            <div className={styles.msBody}>
              <div className={styles.msTitle}>{ms.title}</div>
              {ms.desc && <div className={styles.msDesc}>{ms.desc}</div>}
            </div>
            {ms.due_date && <div className={styles.msDate}>{ms.due_date}</div>}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={styles.page}>
      {/* NAV */}
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>Collective <span>Loft</span></Link>
        <div className={styles.navLinks}>
          <Link href="/discover">Discover</Link>
          <Link href="/briefs">Collabs</Link>
          <Link href="/matching">Matching</Link>
          <Link href="/my-studios" className={styles.active}>My Loft Studios</Link>
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
                <div className={styles.sbRole}>{(myProfile.disciplines||[])[0] || 'Creative'}</div>
              </div>
            </div>
          )}

          <div className={styles.sbNavSection}>
            <div className={styles.sbNavLabel}>Navigate</div>
            <Link href="/profile" className={styles.sbNavItem}>
              <span className={styles.sbNavIcon}>◎</span>Profile
            </Link>
            <Link href="/my-studios" className={styles.sbNavItem}>
              <span className={styles.sbNavIcon}>◈</span>My Studios
            </Link>
          </div>

          {allStudios.length > 0 && (
            <div className={styles.sbProjSection}>
              <div className={styles.sbNavLabel}>Active studios</div>
              {allStudios.map(s => {
                const p = s.initiator_id === myProfile?.id ? s.partner : s.initiator
                return (
                  <Link key={s.id} href={`/studio/${s.id}`} className={`${styles.projItem} ${s.id === studioId ? styles.projActive : ''}`}>
                    <div className={styles.projName}>{s.project_title || 'Untitled'}</div>
                    <div className={styles.projMeta}>
                      <div className={`${styles.projDot} ${s.status === 'paused' ? styles.dotPaused : styles.dotActive}`} />
                      With {p ? `${p.firstname} ${p.lastname}` : 'collaborator'}
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
              <div className={styles.studioTitle}>{studio.project_title || 'Untitled project'}</div>
              <div className={styles.studioMeta}>
                <span className={`${styles.statusPill} ${studio.status === 'complete' ? styles.pillComplete : styles.pillActive}`}>
                  {studio.status === 'complete' ? 'Complete' : 'In progress'}
                </span>
                {studio.deadline && <span>Due {new Date(studio.deadline).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span>}
              </div>
            </div>
            <div className={styles.mainHdrRight}>
              <div className={styles.collabAvs}>
                <div className={`${styles.collabAv} ${styles.avGold}`}>{myInit}</div>
                <div className={`${styles.collabAv} ${styles.avTeal}`}>{partnerInit}</div>
              </div>
              {studio.status !== 'complete' && (
                <button className={styles.btnProposeClose} onClick={proposeClose}>
                  Propose closing Studio
                </button>
              )}
            </div>
          </div>

          {/* TABS */}
          <div className={styles.studioTabs}>
            {['overview','milestones','files','notes'].map(tab => (
              <div
                key={tab}
                className={`${styles.stab} ${activeTab === tab ? styles.stabActive : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </div>
            ))}
          </div>

          <div className={styles.tabPanels}>

            {/* OVERVIEW */}
            {activeTab === 'overview' && (
              <div className={styles.tabPanel}>

                {closeProposed && (
                  <div className={styles.closeProposalCard}>
                    <div className={styles.cpTitle}>⚑ Studio close proposed</div>
                    <div className={styles.cpText}>
                      You've proposed closing this Loft Studio. {partnerFirst} needs to agree before the Studio closes and you both receive a rating request.
                    </div>
                    <div className={styles.cpBtns}>
                      <button className={styles.btnConfirmClose} onClick={confirmClose}>Confirm close</button>
                      <button className={styles.btnDeclineClose} onClick={withdrawClose}>Withdraw proposal</button>
                    </div>
                  </div>
                )}

                {showComplete && !ratingDone && (
                  <div className={styles.completionPrompt}>
                    <div className={styles.cpGoldTitle}>✦ This Loft Studio is complete.</div>
                    <div className={styles.cpGoldText}>
                      Both parties have agreed to close. Rate your collaboration with {partnerFirst} — it only takes a minute and it matters to the next person who considers working with them.
                    </div>
                    <button className={styles.btnRate} onClick={() => setShowRating(true)}>
                      Rate this collaboration ↗
                    </button>
                  </div>
                )}

                <div className={styles.secLbl}>The brief</div>
                <div className={styles.briefCard}>
                  <div className={styles.briefCardTitle}>{studio.project_title || 'Untitled'}</div>
                  <div className={styles.briefCardText}>
                    {studio.collab_type === 'exchange' ? 'Creative exchange' : studio.collab_type === 'paid' ? `Paid · $${studio.fee_from||''}${studio.fee_to?'–'+studio.fee_to:''}` : 'Revenue share'}
                    {studio.timeline ? ` · ${studio.timeline}` : ''}
                    {studio.deadline ? ` · Deadline ${new Date(studio.deadline).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}` : ''}
                  </div>
                </div>

                {total > 0 && (
                  <>
                    <div className={styles.secLbl}>Progress</div>
                    <div className={styles.progressWrap}>
                      <div className={styles.progressTop}>
                        <span className={styles.progressLabel}>Overall completion</span>
                        <span className={styles.progressPct}>{pct}%</span>
                      </div>
                      <div className={styles.progressBarBg}>
                        <div className={styles.progressBarFill} style={{ width:`${pct}%` }} />
                      </div>
                      <div className={styles.progressSub}>
                        <span>{done} of {total} milestones complete</span>
                      </div>
                    </div>

                    <div className={styles.secLbl}>Milestones</div>
                    <MilestoneList />
                  </>
                )}

                {files.length > 0 && (
                  <>
                    <div className={styles.secLbl}>Recent files</div>
                    <div className={styles.filesGrid}>
                      {files.slice(0, 5).map(f => (
                        <a key={f.id} href={f.url} target="_blank" rel="noopener noreferrer" className={styles.fileCard}>
                          <div className={styles.fileIcon}>{fileIcon(f.type)}</div>
                          <div className={styles.fileName}>{f.name}</div>
                          <div className={styles.fileMeta}>{formatBytes(f.size)} · {dateStr(f.created_at)}</div>
                        </a>
                      ))}
                    </div>
                  </>
                )}

                <input ref={fileInputRef} type="file" style={{ display:'none' }} onChange={e => { if(e.target.files[0]) uploadFile(e.target.files[0]); e.target.value='' }} />
                <button className={styles.btnUpload} onClick={() => fileInputRef.current?.click()}>
                  {uploading ? 'Uploading…' : '+ Upload a file'}
                </button>
              </div>
            )}

            {/* MILESTONES */}
            {activeTab === 'milestones' && (
              <div className={styles.tabPanel}>
                <div className={styles.secLbl}>All milestones — click to mark complete</div>
                {milestones.length === 0 ? (
                  <div className={styles.emptyState}>No milestones added yet. Add them in the Collab Terms.</div>
                ) : <MilestoneList />}
              </div>
            )}

            {/* FILES */}
            {activeTab === 'files' && (
              <div className={styles.tabPanel}>
                <div className={styles.secLbl}>Project files</div>
                {files.length === 0 ? (
                  <div className={styles.emptyState}>No files uploaded yet.</div>
                ) : (
                  <div className={styles.filesGrid} style={{ marginBottom:'0.85rem' }}>
                    {files.map(f => (
                      <a key={f.id} href={f.url} target="_blank" rel="noopener noreferrer" className={styles.fileCard}>
                        <div className={styles.fileIcon}>{fileIcon(f.type)}</div>
                        <div className={styles.fileName}>{f.name}</div>
                        <div className={styles.fileMeta}>{formatBytes(f.size)} · {dateStr(f.created_at)}</div>
                      </a>
                    ))}
                  </div>
                )}
                <input ref={fileInputRef} type="file" style={{ display:'none' }} onChange={e => { if(e.target.files[0]) uploadFile(e.target.files[0]); e.target.value='' }} />
                <button className={styles.btnUpload} onClick={() => fileInputRef.current?.click()}>
                  {uploading ? 'Uploading…' : '+ Upload a file'}
                </button>
              </div>
            )}

            {/* NOTES */}
            {activeTab === 'notes' && (
              <div className={styles.tabPanel}>
                <div className={styles.secLblRow}>
                  <div className={styles.secLbl}>Shared notes</div>
                  {savingNotes && <span className={styles.savingNote}>Saving…</span>}
                </div>
                <textarea
                  className={styles.notesArea}
                  value={notes}
                  onChange={e => handleNotesChange(e.target.value)}
                  placeholder="Add shared notes, references, or ideas for this project…"
                />
              </div>
            )}
          </div>
        </div>

        {/* RIGHT CHAT */}
        <div className={styles.studioChat}>
          <div className={styles.chatHdr}>
            <span>Studio chat</span>
            <div className={styles.chatOnline}>
              <div className={styles.onlineDot} />
              <span>{partnerFirst}</span>
            </div>
          </div>

          <div className={styles.chatMsgs}>
            {messages.map((msg, i) => {
              const isMe  = msg.sender_id === myProfile?.id
              const isSys = msg.type === 'sys'
              return (
                <div key={msg.id || i} className={`${styles.msg} ${isSys ? styles.msgSys : isMe ? styles.msgMine : styles.msgTheirs}`}>
                  {!isMe && !isSys && <div className={styles.msgSender}>{partnerFirst}</div>}
                  <div className={styles.msgBubble}>{msg.content}</div>
                  {msg.created_at && !isSys && <div className={styles.msgTime}>{timeStr(msg.created_at)}</div>}
                </div>
              )
            })}
            <div ref={chatEndRef} />
          </div>

          <div className={styles.chatInputArea}>
            <div className={styles.chatInputWrap}>
              <input
                className={styles.chatInp}
                type="text"
                placeholder={`Message ${partnerFirst}…`}
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChat()}
              />
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
              <div className={styles.rmSub}>How was working with <strong>{partner ? `${partner.firstname} ${partner.lastname}` : 'your collaborator'}</strong>?</div>
            </div>
            <div className={styles.rmBody}>
              <div>
                <div className={styles.starLbl}>Overall rating</div>
                <div className={styles.starsInput}>
                  {[1,2,3,4,5].map(n => (
                    <button
                      key={n}
                      className={`${styles.starBtn} ${displayStars >= n ? styles.lit : ''}`}
                      onClick={() => setRatingStars(n)}
                      onMouseEnter={() => setHoverStar(n)}
                      onMouseLeave={() => setHoverStar(0)}
                    >★</button>
                  ))}
                </div>
              </div>
              <div>
                <div className={styles.starLbl}>Endorsements <span className={styles.opt}>— select all that apply</span></div>
                <div className={styles.endorseTags}>
                  {ENDORSE_OPTS.map(tag => (
                    <button
                      key={tag}
                      className={`${styles.endorseTag} ${endorsed.includes(tag) ? styles.on : ''}`}
                      onClick={() => setEndorsed(prev => prev.includes(tag) ? prev.filter(t=>t!==tag) : [...prev,tag])}
                    >{tag}</button>
                  ))}
                </div>
              </div>
              <div className={styles.rmField}>
                <label>Written review <span className={styles.opt}>— minimum 50 characters</span></label>
                <textarea
                  value={reviewText}
                  onChange={e => setReviewText(e.target.value)}
                  placeholder={`Tell other creatives what it was actually like working with ${partnerFirst}.`}
                  rows={4}
                />
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