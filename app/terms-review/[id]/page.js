'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import Nav from '../../components/Nav'
import Footer from '../../components/Footer'

const RIGHTS_LABELS = {
  transfer: 'Full transfer on payment',
  shared: 'Shared credit',
  license: 'License only',
  negotiate: 'Negotiate separately',
}

function SpecRow({ label, value, gold }) {
  if (!value) return null
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'0.6rem 0', borderBottom:'0.5px solid rgba(240,236,227,0.06)' }}>
      <span style={{ fontFamily:'var(--sans)', fontSize:'0.68rem', color:'rgba(240,236,227,0.35)', letterSpacing:'0.04em' }}>{label}</span>
      <span style={{ fontFamily:'var(--sans)', fontSize:'0.78rem', color: gold ? 'var(--gold)' : 'var(--cream)', textAlign:'right', maxWidth:'60%' }}>{value}</span>
    </div>
  )
}

function FieldInput({ label, value, original, onChange, type }) {
  const changed = original !== undefined && value !== original && value !== ''
  return (
    <div style={{ marginBottom:'1rem' }}>
      <label style={{ display:'block', fontFamily:'var(--sans)', fontSize:'0.62rem', letterSpacing:'0.08em', textTransform:'uppercase', color: changed ? 'var(--gold)' : 'rgba(240,236,227,0.4)', marginBottom:'0.35rem' }}>
        {label}{changed && <span style={{ marginLeft:'0.4rem', fontSize:'0.55rem', opacity:0.7 }}>· modified</span>}
      </label>
      <input
        type={type || 'text'}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        style={{
          width:'100%', boxSizing:'border-box',
          background:'rgba(240,236,227,0.04)',
          border:`1px solid ${changed ? 'var(--gold)' : 'rgba(240,236,227,0.12)'}`,
          borderRadius:'4px', padding:'0.6rem 0.85rem',
          fontFamily:'var(--sans)', fontSize:'0.82rem',
          color:'var(--cream)', outline:'none',
          boxShadow: changed ? '0 0 0 3px rgba(201,168,76,0.08)' : 'none',
          transition:'border-color 0.15s, box-shadow 0.15s',
        }}
      />
    </div>
  )
}

function SelectInput({ label, value, original, onChange, options }) {
  const changed = original !== undefined && value !== original && value !== ''
  return (
    <div style={{ marginBottom:'1rem' }}>
      <label style={{ display:'block', fontFamily:'var(--sans)', fontSize:'0.62rem', letterSpacing:'0.08em', textTransform:'uppercase', color: changed ? 'var(--gold)' : 'rgba(240,236,227,0.4)', marginBottom:'0.35rem' }}>
        {label}{changed && <span style={{ marginLeft:'0.4rem', fontSize:'0.55rem', opacity:0.7 }}>· modified</span>}
      </label>
      <select
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        style={{
          width:'100%', boxSizing:'border-box',
          background:'rgba(240,236,227,0.04)',
          border:`1px solid ${changed ? 'var(--gold)' : 'rgba(240,236,227,0.12)'}`,
          borderRadius:'4px', padding:'0.6rem 0.85rem',
          fontFamily:'var(--sans)', fontSize:'0.82rem',
          color:'var(--cream)', outline:'none',
          boxShadow: changed ? '0 0 0 3px rgba(201,168,76,0.08)' : 'none',
        }}
      >
        <option value="">Select…</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

export default function TermsReviewPage() {
  const params = useParams()
  const router = useRouter()
  const termId = params?.id

  const [term,        setTerm]        = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [notFound,    setNotFound]    = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [acting,      setActing]      = useState(null) // 'accepting' | 'declining' | 'modifying'
  const [modifyMode,  setModifyMode]  = useState(false)
  const [draft,       setDraft]       = useState({})
  const [originals,   setOriginals]   = useState({})

  useEffect(() => {
    if (termId) load()
  }, [termId])

  async function load() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setCurrentUser(user)

    const { data, error } = await supabase
      .from('collab_terms')
      .select(`
        *,
        initiator:profiles!collab_terms_initiator_id_fkey(id, firstname, lastname, disciplines, headline),
        partner:profiles!collab_terms_partner_id_fkey(id, firstname, lastname, disciplines, headline)
      `)
      .eq('id', termId)
      .single()

    if (error || !data) { setNotFound(true); setLoading(false); return }

    // Make sure this user is part of these terms
    if (data.initiator_id !== user.id && data.partner_id !== user.id) {
      setNotFound(true); setLoading(false); return
    }

    setTerm(data)
    setLoading(false)
  }

  function isMyTurn(t) {
    if (!currentUser || !t) return false
    if (t.current_editor === 'initiator') return t.initiator_id === currentUser.id
    if (t.current_editor === 'partner')   return t.partner_id   === currentUser.id
    return false
  }

  function getPartner(t) {
    if (!currentUser || !t) return null
    return t.initiator_id === currentUser.id ? t.partner : t.initiator
  }

  function startModify() {
    const d = {
      timeline:     term.timeline     || '',
      deadline:     term.deadline     || '',
      location:     term.location     || '',
      cadence:      term.cadence      || '',
      fee_from:     term.fee_from     || '',
      fee_to:       term.fee_to       || '',
      pay_schedule: term.pay_schedule || '',
      my_share:     term.my_share     || '',
      their_share:  term.their_share  || '',
      rev_sources:  term.rev_sources  || '',
    }
    setOriginals(d)
    setDraft(d)
    setModifyMode(true)
  }

  async function handleAccept() {
    setActing('accepting')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from('collab_terms').update({ status: 'active', terms_status: 'agreed' }).eq('id', term.id)

      // Close the brief -- the Loft Studio is the golden ticket, brief is done
      if (term.brief_id) {
        await supabase.from('briefs').update({ status: 'closed' }).eq('id', term.brief_id)
      }

      const ms = term.milestones || []
      if (ms.length > 0) {
        await supabase.from('studio_milestones').insert(
          ms.map((m, i) => ({ studio_id: term.id, title: m.desc || m.title || `Milestone ${i+1}`, due_date: null, done: false, sort_order: i }))
        )
      }
      await supabase.from('studio_notes').upsert({ studio_id: term.id, content: '' }, { onConflict: 'studio_id' })
      await supabase.from('studio_messages').insert({
        studio_id: term.id, sender_id: null, type: 'sys',
        content: `Studio created · ${new Date().toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}`,
      })
      router.push(`/studio/${term.id}`)
    } catch (e) {
      console.error(e)
      setActing(null)
    }
  }

  async function handleDecline() {
    if (!confirm('Decline these terms? This cannot be undone.')) return
    setActing('declining')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const amInitiator = term.initiator_id === user.id

      await supabase.from('collab_terms').update({ status: 'declined' }).eq('id', term.id)

      if (term.brief_id) {
        if (amInitiator) {
          // Initiator declines -- brief deleted
          await supabase.from('briefs').update({ status: 'deleted' }).eq('id', term.brief_id)
        } else {
          // Partner declines -- brief goes back to active
          await supabase.from('briefs').update({ status: 'open' }).eq('id', term.brief_id)
          await supabase.from('applications').update({ status: 'pending' })
            .eq('brief_id', term.brief_id).eq('applicant_id', user.id)
        }
      }

      // Go back to profile briefs tab
      const partner = getPartner(term)
      const profileUser = amInitiator ? term.initiator : term.partner
      if (profileUser) {
        router.push(`/profile/${profileUser.firstname.toLowerCase()}-${profileUser.lastname.toLowerCase()}`)
      } else {
        router.push('/briefs')
      }
    } catch (e) {
      console.error(e)
      setActing(null)
    }
  }

  async function handleSubmitModify() {
    setActing('modifying')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const amInitiator = term.initiator_id === user.id
      const nextEditor  = amInitiator ? 'partner' : 'initiator'

      const { error } = await supabase.from('collab_terms').update({
        ...draft,
        current_editor: nextEditor,
        terms_status: 'negotiating',
      }).eq('id', term.id)

      if (error) { console.error('modify error:', error); setActing(null); return }

      // Reload the term to get fresh data
      const { data: updated } = await supabase
        .from('collab_terms')
        .select(`*, initiator:profiles!collab_terms_initiator_id_fkey(id, firstname, lastname, disciplines, headline), partner:profiles!collab_terms_partner_id_fkey(id, firstname, lastname, disciplines, headline)`)
        .eq('id', term.id)
        .single()

      setTerm(updated)
      setModifyMode(false)
      setDraft({})
      setActing(null)
    } catch (e) {
      console.error(e)
      setActing(null)
    }
  }

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh' }}>
      <Nav />
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(240,236,227,0.25)', fontFamily:'var(--sans)', fontSize:'0.78rem' }}>✦ Loading…</div>
      <Footer />
    </div>
  )

  if (notFound) return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh' }}>
      <Nav />
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'1rem' }}>
        <div style={{ fontFamily:'var(--serif)', fontSize:'1.5rem', color:'var(--cream)' }}>Terms not found</div>
        <div style={{ fontFamily:'var(--sans)', fontSize:'0.75rem', color:'rgba(240,236,227,0.4)' }}>This terms agreement doesn't exist or you don't have access to it.</div>
        <Link href="/briefs" style={{ fontFamily:'var(--sans)', fontSize:'0.72rem', color:'var(--gold)', textDecoration:'none' }}>Back to Collabs</Link>
      </div>
      <Footer />
    </div>
  )

  const myTurn  = isMyTurn(term)
  const partner = getPartner(term)
  const partnerSlug = partner ? `${partner.firstname.toLowerCase()}-${partner.lastname.toLowerCase()}` : null

  const compLabel = term.collab_type === 'exchange' ? 'Creative exchange'
    : term.collab_type === 'paid' ? 'Paid'
    : 'Revenue share'

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh' }}>
      <Nav />

      <div style={{ maxWidth:'680px', margin:'0 auto', padding:'3rem 1.5rem', width:'100%', flex:1 }}>

        {/* Header */}
        <div style={{ marginBottom:'2.5rem' }}>
          <div style={{ fontFamily:'var(--sans)', fontSize:'0.58rem', letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--gold)', opacity:0.7, marginBottom:'0.5rem' }}>
            Collective Loft · Terms under review
          </div>
          <div style={{ fontFamily:'var(--serif)', fontSize:'2rem', color:'var(--cream)', lineHeight:1.2, marginBottom:'0.5rem' }}>
            {term.project_title || 'Untitled project'}
          </div>
          <div style={{ fontFamily:'var(--sans)', fontSize:'0.75rem', color:'rgba(240,236,227,0.4)' }}>
            With{' '}
            {partnerSlug
              ? <Link href={`/profile/${partnerSlug}`} style={{ color:'var(--teal)', textDecoration:'none' }}>{partner?.firstname} {partner?.lastname}</Link>
              : `${partner?.firstname} ${partner?.lastname}`
            }
            {' · '}{compLabel}
          </div>
        </div>

        {/* Turn indicator */}
        <div style={{
          padding:'0.85rem 1.1rem', borderRadius:'4px', marginBottom:'2rem',
          background: myTurn ? 'rgba(201,168,76,0.08)' : 'rgba(240,236,227,0.03)',
          border: `0.5px solid ${myTurn ? 'rgba(201,168,76,0.3)' : 'rgba(240,236,227,0.08)'}`,
          display:'flex', alignItems:'center', gap:'0.75rem',
        }}>
          <span style={{ fontSize:'1.1rem' }}>{myTurn ? '⟳' : '⏳'}</span>
          <div>
            <div style={{ fontFamily:'var(--sans)', fontSize:'0.75rem', fontWeight:600, color: myTurn ? 'var(--gold)' : 'rgba(240,236,227,0.5)', marginBottom:'0.1rem' }}>
              {myTurn ? 'Your turn to review these terms' : `Waiting for ${partner?.firstname} to review`}
            </div>
            <div style={{ fontFamily:'var(--sans)', fontSize:'0.65rem', color:'rgba(240,236,227,0.3)' }}>
              {myTurn ? 'Accept, modify, or decline below.' : 'You\'ll be notified when they respond.'}
            </div>
          </div>
        </div>

        {/* Terms summary */}
        <div style={{ background:'rgba(240,236,227,0.02)', border:'0.5px solid rgba(240,236,227,0.08)', borderRadius:'6px', padding:'1.5rem', marginBottom:'2rem' }}>
          <div style={{ fontFamily:'var(--sans)', fontSize:'0.58rem', letterSpacing:'0.14em', textTransform:'uppercase', color:'rgba(240,236,227,0.3)', marginBottom:'1rem' }}>Current terms</div>

          <SpecRow label="Compensation type" value={compLabel} />
          {term.collab_type === 'paid' && (
            <>
              <SpecRow label="Fee range" value={term.fee_from ? `$${term.fee_from}${term.fee_to ? '–' + term.fee_to : ''}` : null} gold />
              <SpecRow label="Payment schedule" value={term.pay_schedule} />
            </>
          )}
          {term.collab_type === 'revenue' && (
            <>
              <SpecRow label="My share" value={term.my_share} gold />
              <SpecRow label="Their share" value={term.their_share} gold />
              <SpecRow label="Revenue sources" value={term.rev_sources} />
            </>
          )}
          <SpecRow label="Rights" value={RIGHTS_LABELS[term.rights] || term.rights} />
          <SpecRow label="Timeline" value={term.timeline} />
          <SpecRow label="Deadline" value={term.deadline ? new Date(term.deadline).toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' }) : null} />
          <SpecRow label="Location" value={term.location} />
          <SpecRow label="Cadence" value={term.cadence} />

          {(term.deliverables || []).length > 0 && (
            <div style={{ paddingTop:'0.75rem', borderTop:'0.5px solid rgba(240,236,227,0.06)', marginTop:'0.5rem' }}>
              <div style={{ fontFamily:'var(--sans)', fontSize:'0.58rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(240,236,227,0.25)', marginBottom:'0.5rem' }}>Deliverables</div>
              {term.deliverables.map((d, i) => (
                <div key={i} style={{ display:'flex', gap:'0.5rem', alignItems:'flex-start', marginBottom:'0.3rem' }}>
                  <span style={{ color:'var(--gold)', fontSize:'0.65rem', marginTop:'0.1rem', flexShrink:0 }}>✓</span>
                  <span style={{ fontFamily:'var(--sans)', fontSize:'0.75rem', color:'rgba(240,236,227,0.6)' }}>{d}</span>
                </div>
              ))}
            </div>
          )}

          {(term.milestones || []).length > 0 && (
            <div style={{ paddingTop:'0.75rem', borderTop:'0.5px solid rgba(240,236,227,0.06)', marginTop:'0.5rem' }}>
              <div style={{ fontFamily:'var(--sans)', fontSize:'0.58rem', letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(240,236,227,0.25)', marginBottom:'0.5rem' }}>Milestones</div>
              {term.milestones.map((m, i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.3rem' }}>
                  <span style={{ fontFamily:'var(--sans)', fontSize:'0.75rem', color:'rgba(240,236,227,0.6)' }}>{m.desc || m.title || `Milestone ${i+1}`}</span>
                  {m.pct && <span style={{ fontFamily:'var(--sans)', fontSize:'0.72rem', color:'var(--gold)' }}>{m.pct}%</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modify form -- only shown when in modify mode */}
        {modifyMode && myTurn && (
          <div style={{ background:'rgba(201,168,76,0.04)', border:'0.5px solid rgba(201,168,76,0.2)', borderRadius:'6px', padding:'1.5rem', marginBottom:'2rem' }}>
            <div style={{ fontFamily:'var(--sans)', fontSize:'0.58rem', letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--gold)', marginBottom:'1.25rem', opacity:0.8 }}>
              Modifying terms — project title is locked. Changed fields highlight in gold.
            </div>

            {/* Locked project title */}
            <div style={{ marginBottom:'1rem' }}>
              <label style={{ display:'block', fontFamily:'var(--sans)', fontSize:'0.62rem', letterSpacing:'0.08em', textTransform:'uppercase', color:'rgba(240,236,227,0.25)', marginBottom:'0.35rem' }}>Project title (locked)</label>
              <div style={{ fontFamily:'var(--sans)', fontSize:'0.82rem', color:'rgba(240,236,227,0.4)', padding:'0.6rem 0.85rem', background:'rgba(240,236,227,0.02)', border:'1px solid rgba(240,236,227,0.06)', borderRadius:'4px' }}>
                {term.project_title || '—'}
              </div>
            </div>

            <FieldInput label="Timeline" value={draft.timeline} original={originals.timeline} onChange={v => setDraft(d => ({ ...d, timeline: v }))} />
            <FieldInput label="Deadline" value={draft.deadline} original={originals.deadline} type="date" onChange={v => setDraft(d => ({ ...d, deadline: v }))} />
            <SelectInput label="Location" value={draft.location} original={originals.location} onChange={v => setDraft(d => ({ ...d, location: v }))} options={['Local only','Remote OK','Remote only','No preference']} />
            <SelectInput label="Communication cadence" value={draft.cadence} original={originals.cadence} onChange={v => setDraft(d => ({ ...d, cadence: v }))} options={['As needed','Weekly check-ins','Bi-weekly check-ins','Daily updates']} />

            {term.collab_type === 'paid' && (
              <>
                <FieldInput label="Fee from" value={draft.fee_from} original={originals.fee_from} onChange={v => setDraft(d => ({ ...d, fee_from: v }))} />
                <FieldInput label="Fee to" value={draft.fee_to} original={originals.fee_to} onChange={v => setDraft(d => ({ ...d, fee_to: v }))} />
                <SelectInput label="Payment schedule" value={draft.pay_schedule} original={originals.pay_schedule} onChange={v => setDraft(d => ({ ...d, pay_schedule: v }))} options={['50% upfront, 50% on delivery','Milestone-based','On delivery','Monthly retainer']} />
              </>
            )}

            {term.collab_type === 'revenue' && (
              <>
                <FieldInput label="My share" value={draft.my_share} original={originals.my_share} onChange={v => setDraft(d => ({ ...d, my_share: v }))} />
                <FieldInput label="Their share" value={draft.their_share} original={originals.their_share} onChange={v => setDraft(d => ({ ...d, their_share: v }))} />
                <FieldInput label="Revenue sources" value={draft.rev_sources} original={originals.rev_sources} onChange={v => setDraft(d => ({ ...d, rev_sources: v }))} />
              </>
            )}
          </div>
        )}

        {/* Action buttons */}
        {myTurn && !modifyMode && (
          <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap', marginBottom:'2rem' }}>
            <button onClick={handleAccept} disabled={!!acting} style={{ background:'var(--gold)', color:'#0D0D0D', border:'none', borderRadius:'4px', padding:'0.65rem 1.5rem', fontFamily:'var(--sans)', fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer', opacity:acting?0.5:1 }}>
              {acting === 'accepting' ? 'Opening studio…' : 'Accept & open studio ↗'}
            </button>
            <button onClick={startModify} disabled={!!acting} style={{ background:'none', border:'1px solid rgba(201,168,76,0.4)', borderRadius:'4px', padding:'0.65rem 1.25rem', fontFamily:'var(--sans)', fontSize:'0.72rem', color:'var(--gold)', letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer' }}>
              Modify terms
            </button>
            <button onClick={handleDecline} disabled={!!acting} style={{ background:'none', border:'1px solid rgba(194,112,128,0.3)', borderRadius:'4px', padding:'0.65rem 1.25rem', fontFamily:'var(--sans)', fontSize:'0.72rem', color:'#c27080', letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer', opacity:acting?0.5:1 }}>
              {acting === 'declining' ? 'Declining…' : 'Decline'}
            </button>
          </div>
        )}

        {myTurn && modifyMode && (
          <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap', marginBottom:'2rem' }}>
            <button onClick={handleSubmitModify} disabled={!!acting} style={{ background:'var(--gold)', color:'#0D0D0D', border:'none', borderRadius:'4px', padding:'0.65rem 1.5rem', fontFamily:'var(--sans)', fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer', opacity:acting?0.5:1 }}>
              {acting === 'modifying' ? 'Sending…' : 'Send modified terms ↗'}
            </button>
            <button onClick={() => { setModifyMode(false); setDraft({}) }} disabled={!!acting} style={{ background:'none', border:'1px solid rgba(240,236,227,0.15)', borderRadius:'4px', padding:'0.65rem 1.25rem', fontFamily:'var(--sans)', fontSize:'0.72rem', color:'rgba(240,236,227,0.5)', letterSpacing:'0.06em', textTransform:'uppercase', cursor:'pointer' }}>
              Cancel
            </button>
          </div>
        )}

        {/* Back link */}
        <div>
          <Link href="/briefs" style={{ fontFamily:'var(--sans)', fontSize:'0.68rem', color:'rgba(240,236,227,0.3)', textDecoration:'none', letterSpacing:'0.04em' }}>
            ← Back to Collabs
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  )
}