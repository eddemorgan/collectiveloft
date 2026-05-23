'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import styles from './my-studios.module.css'

const DISC_COLORS = {
  'Visual Art':    { bg: 'rgba(201,168,76,0.18)',  color: 'var(--gold)' },
  'Music':         { bg: 'rgba(86,179,156,0.18)',  color: 'var(--teal)' },
  'Writing':       { bg: 'rgba(160,120,208,0.18)', color: '#a078d0' },
  'Design & Web':  { bg: 'rgba(86,140,195,0.18)',  color: '#568cc3' },
  'Film':          { bg: 'rgba(194,112,128,0.18)', color: '#c27080' },
  'Photography':   { bg: 'rgba(130,180,120,0.18)', color: '#82b478' },
  'Performance':   { bg: 'rgba(200,140,100,0.18)', color: '#c88c64' },
  'Creative Tech': { bg: 'rgba(100,180,170,0.18)', color: '#64b4aa' },
}

const RIGHTS_LABELS = {
  transfer:  'Full transfer on payment',
  shared:    'Shared credit',
  license:   'License only',
  negotiate: 'Negotiate separately',
}

function avatarColor(disciplines) {
  const disc = (disciplines || [])[0]
  return DISC_COLORS[disc] || { bg: 'rgba(201,168,76,0.18)', color: 'var(--gold)' }
}

function initials(first, last) {
  return `${(first || '')[0] || ''}${(last || '')[0] || ''}`.toUpperCase()
}

function progressWidth(current, total) {
  if (!total) return 0
  return Math.round((current / total) * 100)
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

// Highlighted field -- shows gold border if value changed from original
function TermsField({ label, value, original, onChange, type = 'text', children, locked }) {
  const changed = original !== undefined && value !== original && value !== ''
  return (
    <div style={{ marginBottom: '0.85rem' }}>
      <label style={{
        display: 'block',
        fontFamily: 'var(--sans)', fontSize: '0.65rem',
        letterSpacing: '0.06em', textTransform: 'uppercase',
        color: changed ? 'var(--gold)' : 'rgba(240,236,227,0.4)',
        marginBottom: '0.3rem',
      }}>
        {label} {changed && <span style={{ fontSize: '0.55rem', opacity: 0.7 }}>· modified</span>}
      </label>
      {locked ? (
        <div style={{
          fontFamily: 'var(--sans)', fontSize: '0.8rem', color: 'rgba(240,236,227,0.5)',
          padding: '0.5rem 0.75rem',
          background: 'rgba(240,236,227,0.03)',
          border: '0.5px solid rgba(240,236,227,0.08)',
          borderRadius: '3px',
        }}>{value || '—'}</div>
      ) : children ? children : (
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'var(--bg1)',
            border: `0.5px solid ${changed ? 'var(--gold)' : 'rgba(240,236,227,0.12)'}`,
            borderRadius: '3px', padding: '0.5rem 0.75rem',
            fontFamily: 'var(--sans)', fontSize: '0.8rem',
            color: 'var(--cream)', outline: 'none',
            boxShadow: changed ? '0 0 0 2px rgba(201,168,76,0.1)' : 'none',
          }}
        />
      )}
    </div>
  )
}

export default function MyStudiosPage() {
  const router = useRouter()
  const [myProfile,   setMyProfile]   = useState(null)
  const [studios,     setStudios]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [acting,      setActing]      = useState({})
  const [modifyingId, setModifyingId] = useState(null) // studio being modified
  const [modifyDraft, setModifyDraft] = useState({})   // draft values
  const [originals,   setOriginals]   = useState({})   // original values for comparison

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setMyProfile(profile)

      const { data: terms } = await supabase
        .from('collab_terms')
        .select(`
          *,
          initiator:profiles!collab_terms_initiator_id_fkey(id, firstname, lastname, disciplines, headline),
          partner:profiles!collab_terms_partner_id_fkey(id, firstname, lastname, disciplines, headline)
        `)
        .or(`initiator_id.eq.${user.id},partner_id.eq.${user.id}`)
        .not('status', 'eq', 'declined')
        .order('created_at', { ascending: false })

      setStudios(terms || [])
      setLoading(false)
    }
    load()
  }, [])

  function partnerFor(studio) {
    if (!myProfile) return null
    return studio.initiator_id === myProfile.id ? studio.partner : studio.initiator
  }

  function isRecipient(studio) {
    return myProfile && studio.partner_id === myProfile.id
  }

  // Who needs to act now?
  function isMyTurn(studio) {
    if (!myProfile) return false
    const amInitiator = studio.initiator_id === myProfile.id
    const amPartner   = studio.partner_id   === myProfile.id
    if (studio.current_editor === 'initiator') return amInitiator
    if (studio.current_editor === 'partner')   return amPartner
    return false
  }

  async function acceptTerms(studio) {
    setActing(prev => ({ ...prev, [studio.id]: 'accepting' }))
    try {
      await supabase.from('collab_terms').update({
        status: 'active',
        terms_status: 'agreed',
      }).eq('id', studio.id)

      const ms = studio.milestones || []
      if (ms.length > 0) {
        const rows = ms.map((m, i) => ({
          studio_id:  studio.id,
          title:      m.desc || m.title || `Milestone ${i + 1}`,
          due_date:   null, done: false, sort_order: i,
        }))
        await supabase.from('studio_milestones').insert(rows)
      }
      await supabase.from('studio_notes').upsert({ studio_id: studio.id, content: '' }, { onConflict: 'studio_id' })
      await supabase.from('studio_messages').insert({
        studio_id: studio.id, sender_id: null, type: 'sys',
        content: `Studio created · ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      })
      setStudios(prev => prev.map(s => s.id === studio.id ? { ...s, status: 'active', terms_status: 'agreed' } : s))
      router.push(`/studio/${studio.id}`)
    } catch (e) {
      console.error(e)
    }
    setActing(prev => ({ ...prev, [studio.id]: null }))
  }

  async function declineTerms(studio) {
    setActing(prev => ({ ...prev, [studio.id]: 'declining' }))
    try {
      const amInitiator = myProfile && studio.initiator_id === myProfile.id

      if (amInitiator) {
        // Initiator declines -- brief gets deleted
        await supabase.from('collab_terms').update({ status: 'declined' }).eq('id', studio.id)
        if (studio.brief_id) {
          await supabase.from('briefs').update({ status: 'deleted' }).eq('id', studio.brief_id)
        }
      } else {
        // Partner declines -- brief goes back to active, application back to pending
        await supabase.from('collab_terms').update({ status: 'declined' }).eq('id', studio.id)
        if (studio.brief_id) {
          await supabase.from('briefs').update({ status: 'open' }).eq('id', studio.brief_id)
          // Reset the application status back to pending
          await supabase.from('applications')
            .update({ status: 'pending' })
            .eq('brief_id', studio.brief_id)
            .eq('applicant_id', myProfile.id)
        }
      }
      setStudios(prev => prev.filter(s => s.id !== studio.id))
    } catch (e) {
      console.error(e)
    }
    setActing(prev => ({ ...prev, [studio.id]: null }))
  }

  function startModify(studio) {
    const draft = {
      collab_type:  studio.collab_type  || 'exchange',
      timeline:     studio.timeline     || '',
      deadline:     studio.deadline     || '',
      location:     studio.location     || '',
      cadence:      studio.cadence      || '',
      rights:       studio.rights       || 'transfer',
      fee_from:     studio.fee_from     || '',
      fee_to:       studio.fee_to       || '',
      pay_schedule: studio.pay_schedule || '',
      my_share:     studio.my_share     || '',
      their_share:  studio.their_share  || '',
      rev_sources:  studio.rev_sources  || '',
    }
    setOriginals(draft)
    setModifyDraft(draft)
    setModifyingId(studio.id)
  }

  async function submitModify(studio) {
    setActing(prev => ({ ...prev, [studio.id]: 'modifying' }))
    try {
      const amInitiator = studio.initiator_id === myProfile.id
      const nextEditor  = amInitiator ? 'partner' : 'initiator'

      await supabase.from('collab_terms').update({
        ...modifyDraft,
        current_editor: nextEditor,
        terms_status:   'negotiating',
      }).eq('id', studio.id)

      setStudios(prev => prev.map(s => s.id === studio.id
        ? { ...s, ...modifyDraft, current_editor: nextEditor, terms_status: 'negotiating' }
        : s
      ))
      setModifyingId(null)
      setModifyDraft({})
    } catch (e) {
      console.error(e)
    }
    setActing(prev => ({ ...prev, [studio.id]: null }))
  }

  const active        = studios.filter(s => s.status === 'active')
  const pending       = studios.filter(s => s.status === 'pending')
  const paused        = studios.filter(s => s.status === 'paused')
  const complete      = studios.filter(s => s.status === 'complete')
  const pendingRating = complete.filter(s => !s.rated)

  const myInitials  = myProfile ? initials(myProfile.firstname, myProfile.lastname) : '?'
  const myDiscColor = myProfile ? avatarColor(myProfile.disciplines) : { bg: 'rgba(201,168,76,0.18)', color: 'var(--gold)' }

  function PendingCard({ studio, delay = 0 }) {
    const partner  = partnerFor(studio)
    const pColor   = partner ? avatarColor(partner.disciplines) : { bg: 'rgba(86,179,156,0.18)', color: 'var(--teal)' }
    const pInit    = partner ? initials(partner.firstname, partner.lastname) : '?'
    const myTurn   = isMyTurn(studio)
    const isActing = acting[studio.id]
    const isModifying = modifyingId === studio.id

    const partnerSlug = partner ? `${partner.firstname.toLowerCase()}-${partner.lastname.toLowerCase()}` : null

    const compType = studio.collab_type === 'exchange' ? 'Creative exchange'
      : studio.collab_type === 'paid' ? `Paid${studio.fee_from ? ` · $${studio.fee_from}${studio.fee_to ? '–' + studio.fee_to : ''}` : ''}`
      : 'Revenue share'

    return (
      <div className={styles.pendingCard} style={{ animationDelay: `${delay}ms` }}>
        <div className={styles.pcStripe} />
        <div className={styles.pcBody}>
          <div className={styles.pcTop}>
            <div className={styles.cardAvs}>
              <div className={styles.cardAv} style={{ background: myDiscColor.bg, color: myDiscColor.color }}>{myInitials}</div>
              <div className={styles.cardAv} style={{ background: pColor.bg, color: pColor.color }}>{pInit}</div>
            </div>
            <span className={styles.pillPending}>{myTurn ? 'Your turn to review' : 'Awaiting review'}</span>
          </div>

          <div className={styles.pcTitle}>{studio.project_title || 'Untitled project'}</div>

          <div className={styles.pcWith}>
            {partnerSlug ? (
              <Link href={`/profile/${partnerSlug}`} style={{ color:'var(--teal)', textDecoration:'none' }}>
                {partner?.firstname} {partner?.lastname}
              </Link>
            ) : `${partner?.firstname} ${partner?.lastname}`}
            {myTurn
              ? ' has sent you updated terms to review'
              : ` is reviewing your terms`}
          </div>

          {/* MODIFY MODE */}
          {isModifying ? (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ fontFamily:'var(--sans)', fontSize:'0.6rem', letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--gold)', marginBottom:'1rem', opacity:0.8 }}>
                Modifying terms — project title is locked
              </div>

              {/* Locked project title */}
              <TermsField label="Project title" value={studio.project_title} locked />

              <TermsField label="Timeline" value={modifyDraft.timeline} original={originals.timeline}
                onChange={v => setModifyDraft(d => ({ ...d, timeline: v }))} />

              <TermsField label="Deadline" value={modifyDraft.deadline} original={originals.deadline}
                type="date" onChange={v => setModifyDraft(d => ({ ...d, deadline: v }))} />

              <TermsField label="Location" value={modifyDraft.location} original={originals.location}
                onChange={v => setModifyDraft(d => ({ ...d, location: v }))}>
                <select value={modifyDraft.location} onChange={e => setModifyDraft(d => ({ ...d, location: e.target.value }))}
                  style={{ width:'100%', background:'var(--bg1)', border:`0.5px solid ${modifyDraft.location !== originals.location ? 'var(--gold)' : 'rgba(240,236,227,0.12)'}`, borderRadius:'3px', padding:'0.5rem 0.75rem', fontFamily:'var(--sans)', fontSize:'0.8rem', color:'var(--cream)', outline:'none' }}>
                  <option value="">Select…</option>
                  <option>Local only</option>
                  <option>Remote OK</option>
                  <option>Remote only</option>
                  <option>No preference</option>
                </select>
              </TermsField>

              {studio.collab_type === 'paid' && (
                <>
                  <TermsField label="Fee from" value={modifyDraft.fee_from} original={originals.fee_from}
                    onChange={v => setModifyDraft(d => ({ ...d, fee_from: v }))} />
                  <TermsField label="Fee to" value={modifyDraft.fee_to} original={originals.fee_to}
                    onChange={v => setModifyDraft(d => ({ ...d, fee_to: v }))} />
                  <TermsField label="Payment schedule" value={modifyDraft.pay_schedule} original={originals.pay_schedule}
                    onChange={v => setModifyDraft(d => ({ ...d, pay_schedule: v }))}>
                    <select value={modifyDraft.pay_schedule} onChange={e => setModifyDraft(d => ({ ...d, pay_schedule: e.target.value }))}
                      style={{ width:'100%', background:'var(--bg1)', border:`0.5px solid ${modifyDraft.pay_schedule !== originals.pay_schedule ? 'var(--gold)' : 'rgba(240,236,227,0.12)'}`, borderRadius:'3px', padding:'0.5rem 0.75rem', fontFamily:'var(--sans)', fontSize:'0.8rem', color:'var(--cream)', outline:'none' }}>
                      <option value="">Select…</option>
                      <option>50% upfront, 50% on delivery</option>
                      <option>Milestone-based</option>
                      <option>On delivery</option>
                      <option>Monthly retainer</option>
                    </select>
                  </TermsField>
                </>
              )}

              {studio.collab_type === 'revenue' && (
                <>
                  <TermsField label="My share" value={modifyDraft.my_share} original={originals.my_share}
                    onChange={v => setModifyDraft(d => ({ ...d, my_share: v }))} />
                  <TermsField label="Their share" value={modifyDraft.their_share} original={originals.their_share}
                    onChange={v => setModifyDraft(d => ({ ...d, their_share: v }))} />
                  <TermsField label="Revenue sources" value={modifyDraft.rev_sources} original={originals.rev_sources}
                    onChange={v => setModifyDraft(d => ({ ...d, rev_sources: v }))} />
                </>
              )}

              <div style={{ display:'flex', gap:'0.75rem', marginTop:'1.25rem' }}>
                <button onClick={() => submitModify(studio)} disabled={!!isActing} style={{
                  background:'var(--gold)', color:'#0D0D0D', border:'none', borderRadius:'3px',
                  padding:'0.5rem 1.1rem', fontFamily:'var(--sans)', fontSize:'0.65rem',
                  fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer',
                  opacity: isActing ? 0.5 : 1,
                }}>
                  {isActing === 'modifying' ? 'Sending…' : 'Send modified terms ↗'}
                </button>
                <button onClick={() => { setModifyingId(null); setModifyDraft({}) }} style={{
                  background:'none', border:'0.5px solid rgba(240,236,227,0.15)', borderRadius:'3px',
                  padding:'0.5rem 0.85rem', fontFamily:'var(--sans)', fontSize:'0.65rem',
                  color:'rgba(240,236,227,0.5)', letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer',
                }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Terms summary */}
              <div className={styles.termsSummary}>
                <div className={styles.tsRow}><span className={styles.tsK}>Type</span><span className={styles.tsV}>{compType}</span></div>
                {studio.rights && <div className={styles.tsRow}><span className={styles.tsK}>Rights</span><span className={styles.tsV}>{RIGHTS_LABELS[studio.rights] || studio.rights}</span></div>}
                {studio.timeline && <div className={styles.tsRow}><span className={styles.tsK}>Timeline</span><span className={styles.tsV}>{studio.timeline}</span></div>}
                {studio.location && <div className={styles.tsRow}><span className={styles.tsK}>Location</span><span className={styles.tsV}>{studio.location}</span></div>}
                {(studio.deliverables || []).length > 0 && <div className={styles.tsRow}><span className={styles.tsK}>Deliverables</span><span className={styles.tsV}>{studio.deliverables.length} agreed</span></div>}
                {(studio.milestones || []).length > 0 && <div className={styles.tsRow}><span className={styles.tsK}>Milestones</span><span className={styles.tsV}>{studio.milestones.length} milestones</span></div>}
              </div>

              {myTurn ? (
                <div className={styles.pcActions}>
                  <button className={styles.btnAccept} onClick={() => acceptTerms(studio)} disabled={!!isActing}>
                    {isActing === 'accepting' ? 'Opening studio…' : 'Accept & open studio ↗'}
                  </button>
                  <button onClick={() => startModify(studio)} disabled={!!isActing} style={{
                    background:'none', border:'0.5px solid rgba(201,168,76,0.3)', borderRadius:'3px',
                    padding:'0.45rem 0.9rem', fontFamily:'var(--sans)', fontSize:'0.65rem',
                    color:'var(--gold)', letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer',
                  }}>
                    Modify
                  </button>
                  <button className={styles.btnDecline} onClick={() => declineTerms(studio)} disabled={!!isActing}>
                    {isActing === 'declining' ? 'Declining…' : 'Decline'}
                  </button>
                </div>
              ) : (
                <div className={styles.pcWaiting}>
                  <span className={styles.waitingDot} />
                  Waiting for {partner?.firstname} to review
                </div>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  function StudioCard({ studio, delay = 0 }) {
    const partner      = partnerFor(studio)
    const partnerColor = partner ? avatarColor(partner.disciplines) : { bg: 'rgba(86,179,156,0.18)', color: 'var(--teal)' }
    const partnerInit  = partner ? initials(partner.firstname, partner.lastname) : '?'
    const prog         = progressWidth(studio.milestones_done || 0, studio.milestones_total || (studio.milestones?.length || 0))
    const needsRating  = studio.status === 'complete' && !studio.rated

    const stripeClass = studio.status === 'active' ? styles.stripeActive : studio.status === 'complete' ? styles.stripeComplete : styles.stripePaused
    const fillClass   = studio.status === 'active' ? styles.fillActive   : studio.status === 'complete' ? styles.fillComplete   : styles.fillPaused
    const pillClass   = studio.status === 'active' ? styles.pillActive   : studio.status === 'complete' && !needsRating ? styles.pillComplete : studio.status === 'complete' && needsRating ? styles.pillRate : styles.pillPaused
    const pillText    = studio.status === 'active' ? 'In progress'       : studio.status === 'complete' && needsRating ? 'Rate ↗' : studio.status === 'complete' ? '★ Rated' : 'Paused'
    const href        = needsRating ? `/rating?studio=${studio.id}` : `/studio/${studio.id}`

    return (
      <Link href={href}
        className={`${styles.studioCard} ${studio.status === 'paused' ? styles.cardPaused : ''} ${studio.status === 'complete' ? styles.cardComplete : ''}`}
        style={{ animationDelay: `${delay}ms` }}>
        <div className={`${styles.cardStripe} ${stripeClass}`} />
        <div className={styles.cardBody}>
          <div className={styles.cardAvs}>
            <div className={styles.cardAv} style={{ background: myDiscColor.bg, color: myDiscColor.color }}>{myInitials}</div>
            <div className={styles.cardAv} style={{ background: partnerColor.bg, color: partnerColor.color }}>{partnerInit}</div>
          </div>
          <div className={styles.cardTitle}>{studio.project_title || 'Untitled project'}</div>
          <div className={styles.cardWith}>
            With {partner ? `${partner.firstname} ${partner.lastname}` : 'collaborator'} · {partner?.headline || (partner?.disciplines || [])[0] || ''}
          </div>
          <div className={styles.cardProgBg}>
            <div className={`${styles.cardProgFill} ${fillClass}`} style={{ width: `${studio.status === 'complete' ? 100 : prog}%` }} />
          </div>
          <div className={styles.cardMeta}>
            <span>{studio.milestones_done || 0} of {studio.milestones_total || (studio.milestones?.length || 0)} milestones</span>
            <span>
              {studio.status === 'complete'
                ? `Completed ${formatDate(studio.completed_at || studio.updated_at)}`
                : studio.deadline ? `Due ${formatDate(studio.deadline)}`
                : studio.status === 'paused' ? 'On hold' : 'In progress'}
            </span>
          </div>
          <div className={styles.cardFooter}>
            <span className={styles.cardBriefSnippet}>
              {studio.project_title || 'Untitled'} · {studio.collab_type === 'exchange' ? 'Creative exchange' : studio.collab_type === 'paid' ? `Paid · $${studio.fee_from || ''}` : 'Revenue share'}
            </span>
            <span className={`${styles.statusPill} ${pillClass}`}>{pillText}</span>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh' }}>
      <Nav />

      <div className={styles.pageLayout} style={{ flex: 1 }}>
        <aside className={styles.sidebar}>
          {myProfile && (
            <div className={styles.sbProfileRow}>
              <div className={styles.sbAv} style={{ background: myDiscColor.bg, color: myDiscColor.color }}>{myInitials}</div>
              <div>
                <div className={styles.sbPname}>{myProfile.firstname} {myProfile.lastname}</div>
                <div className={styles.sbProle}>{(myProfile.disciplines || [])[0] || 'Creative'}</div>
              </div>
            </div>
          )}
          <div className={styles.sbNav}>
            <div className={styles.sbNavLabel}>Navigate</div>
            <Link href="/discover" className={styles.sbNavItem}><div className={styles.sbNavIcon}>◎</div>Discover</Link>
            <Link href="/my-studios" className={`${styles.sbNavItem} ${styles.sbNavItemActive}`}><div className={styles.sbNavIcon}>◈</div>My Studios</Link>
            <Link href="/matching" className={styles.sbNavItem}><div className={styles.sbNavIcon}>✦</div>Matching</Link>
          </div>
        </aside>

        <div className={styles.mainContent}>
          <div className={styles.pageHdr}>
            <div className={styles.pageEyebrow}>Collective Loft</div>
            <div className={styles.pageTitle}>My Loft Studios</div>
            <div className={styles.pageSub}>Every collaboration you're part of — active, paused, and complete.</div>
          </div>

          {pendingRating.length > 0 && (
            <div className={styles.ratingBanner}>
              <div className={styles.rbLeft}>
                <div className={styles.rbIcon}>✦</div>
                <div className={styles.rbText}>
                  <strong>You have {pendingRating.length} pending review{pendingRating.length > 1 ? 's' : ''}.</strong>{' '}
                  Rate your collaboration{pendingRating.length > 1 ? 's' : ''}. It takes 2 minutes and it matters.
                </div>
              </div>
              <Link href={`/rating?studio=${pendingRating[0].id}`} className={styles.btnRateNow}>Rate now ↗</Link>
            </div>
          )}

          {loading ? (
            <div className={styles.loading}>Loading your studios…</div>
          ) : (
            <>
              {pending.length > 0 && (
                <>
                  <div className={styles.sectionLbl}>Pending terms</div>
                  <div className={styles.studiosGrid}>
                    {pending.map((s, i) => <PendingCard key={s.id} studio={s} delay={i * 40} />)}
                  </div>
                </>
              )}

              <div className={styles.sectionLbl}>Active</div>
              <div className={styles.studiosGrid}>
                {active.length === 0 ? (
                  <div className={styles.emptyState}>No active studios yet.</div>
                ) : (
                  active.map((s, i) => <StudioCard key={s.id} studio={s} delay={i * 40} />)
                )}
                <Link href="/briefs" className={styles.newStudioCard}>
                  <div className={styles.newStudioIcon}>+</div>
                  <div className={styles.newStudioText}>Start a new Loft Studio</div>
                  <div className={styles.newStudioSub}>Post a brief or apply to one — a Studio opens when both parties agree.</div>
                </Link>
              </div>

              {paused.length > 0 && (
                <>
                  <div className={styles.sectionLbl}>Paused</div>
                  <div className={styles.studiosGrid}>
                    {paused.map((s, i) => <StudioCard key={s.id} studio={s} delay={i * 40} />)}
                  </div>
                </>
              )}

              {complete.length > 0 && (
                <>
                  <div className={styles.sectionLbl}>Complete</div>
                  <div className={styles.studiosGrid}>
                    {complete.map((s, i) => <StudioCard key={s.id} studio={s} delay={i * 40} />)}
                  </div>
                </>
              )}

              {studios.length === 0 && (
                <div className={styles.bigEmpty}>
                  <div className={styles.beIcon}>◈</div>
                  <div className={styles.beTitle}>No studios yet.</div>
                  <div className={styles.beSub}>A Loft Studio opens when you and a collaborator agree on terms. Start by finding someone on Discover or posting a brief.</div>
                  <div className={styles.beActions}>
                    <Link href="/discover" className={styles.btnGold}>Discover creatives</Link>
                    <Link href="/briefs" className={styles.btnGhost}>Browse briefs</Link>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}