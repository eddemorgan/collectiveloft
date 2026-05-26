'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Nav from '../components/Nav'
import Footer from '../components/Footer'

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'Just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7)   return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function NotifCard({ icon, iconColor, title, sub, meta, href, tag, tagColor }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: '1rem',
        padding: '1.1rem 1.25rem', background: 'var(--bg1)',
        border: '0.5px solid rgba(240,236,227,0.07)', borderRadius: '4px',
        marginBottom: '0.65rem', transition: 'border-color 0.15s, background 0.15s', cursor: 'pointer',
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.25)'; e.currentTarget.style.background = 'rgba(201,168,76,0.03)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(240,236,227,0.07)'; e.currentTarget.style.background = 'var(--bg1)' }}
      >
        <div style={{ width:'36px', height:'36px', borderRadius:'50%', flexShrink:0, background:iconColor||'rgba(201,168,76,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.9rem' }}>
          {icon}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.2rem', flexWrap:'wrap' }}>
            <span style={{ fontFamily:'var(--sans)', fontSize:'0.78rem', fontWeight:600, color:'var(--cream)' }}>{title}</span>
            {tag && (
              <span style={{ fontFamily:'var(--sans)', fontSize:'0.58rem', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:tagColor||'var(--gold)', background:tagColor?`${tagColor}22`:'rgba(201,168,76,0.12)', padding:'1px 6px', borderRadius:'2px' }}>
                {tag}
              </span>
            )}
          </div>
          <div style={{ fontFamily:'var(--sans)', fontSize:'0.72rem', color:'rgba(240,236,227,0.5)', lineHeight:1.5 }}>{sub}</div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'0.3rem', flexShrink:0 }}>
          <span style={{ fontFamily:'var(--sans)', fontSize:'0.62rem', color:'rgba(240,236,227,0.25)' }}>{meta}</span>
          <span style={{ color:'rgba(240,236,227,0.2)', fontSize:'0.75rem' }}>↗</span>
        </div>
      </div>
    </Link>
  )
}

function SectionLabel({ label, count }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.65rem', marginTop:'1.5rem' }}>
      <span style={{ fontFamily:'var(--sans)', fontSize:'0.58rem', letterSpacing:'0.16em', textTransform:'uppercase', color:'rgba(240,236,227,0.3)' }}>{label}</span>
      {count > 0 && <span style={{ fontFamily:'var(--sans)', fontSize:'0.58rem', fontWeight:700, background:'rgba(201,168,76,0.15)', color:'var(--gold)', padding:'1px 6px', borderRadius:'2px' }}>{count}</span>}
    </div>
  )
}

export default function NotificationsPage() {
  const router = useRouter()
  const [loading,     setLoading]     = useState(true)
  const [actionItems, setActionItems] = useState([])
  const [updateItems, setUpdateItems] = useState([])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const actions = []
      const updates = []

      // 1. Terms waiting for my review
      const { data: pendingTerms } = await supabase
        .from('collab_terms')
        .select(`*, initiator:profiles!collab_terms_initiator_id_fkey(firstname, lastname)`)
        .or(`initiator_id.eq.${user.id},partner_id.eq.${user.id}`)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      for (const t of pendingTerms || []) {
        const isInitiator = t.initiator_id === user.id
        const other = t.initiator ? `${t.initiator.firstname} ${t.initiator.lastname}` : 'Someone'
        const myTurn = (t.current_editor === 'partner' && !isInitiator) || (t.current_editor === 'initiator' && isInitiator)

        if (myTurn) {
          actions.push({
            key: `terms-${t.id}`,
            icon: '📋',
            iconColor: 'rgba(201,168,76,0.18)',
            title: isInitiator ? `Your modified terms are back` : `${other} sent you collab terms`,
            sub: t.project_title ? `Project: ${t.project_title} · Review on your profile Briefs tab` : 'Review the terms on your profile Briefs tab.',
            meta: timeAgo(t.created_at),
            href: `/profile/${user.id}#briefs`,
            tag: 'Action required',
            tagColor: '#C9A84C',
          })
        }
      }

      // 2. Completed studios I haven't rated -- check ratings table per-user, not rated flag
      const { data: completedStudios } = await supabase
        .from('collab_terms')
        .select(`*, initiator:profiles!collab_terms_initiator_id_fkey(firstname, lastname), partner:profiles!collab_terms_partner_id_fkey(firstname, lastname)`)
        .or(`initiator_id.eq.${user.id},partner_id.eq.${user.id}`)
        .eq('status', 'complete')
        .order('updated_at', { ascending: false })

      const { data: myRatings } = await supabase
        .from('ratings')
        .select('studio_id')
        .eq('rater_id', user.id)
        .eq('submitted', true)

      const ratedStudioIds = new Set((myRatings || []).map(r => r.studio_id))

      for (const t of completedStudios || []) {
        if (ratedStudioIds.has(t.id)) continue
        const other = t.initiator_id === user.id ? t.partner : t.initiator
        const name  = other ? `${other.firstname} ${other.lastname}` : 'your collaborator'
        actions.push({
          key: `rate-${t.id}`,
          icon: '★',
          iconColor: 'rgba(86,179,156,0.18)',
          title: `Rate your collab with ${name}`,
          sub: t.project_title ? `${t.project_title} is complete. Leave a review.` : 'This collaboration is complete. Leave a review.',
          meta: timeAgo(t.updated_at),
          href: `/rating?studio=${t.id}`,
          tag: 'Rate now',
          tagColor: '#56B39C',
        })
      }

      // 3. Applications to my briefs
      const { data: myBriefs } = await supabase
        .from('briefs')
        .select('id, title')
        .eq('poster_id', user.id)
        .eq('status', 'open')

      if (myBriefs && myBriefs.length > 0) {
        const briefMap = Object.fromEntries(myBriefs.map(b => [b.id, b]))
        const briefIds = myBriefs.map(b => b.id)

        const { data: apps } = await supabase
          .from('applications')
          .select(`*, applicant:profiles!applications_applicant_id_fkey(firstname, lastname)`)
          .in('brief_id', briefIds)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(20)

        for (const a of apps || []) {
          const name  = a.applicant ? `${a.applicant.firstname} ${a.applicant.lastname}` : 'Someone'
          const brief = briefMap[a.brief_id]
          const title = brief?.title || 'your brief'
          updates.push({
            key: `app-${a.id}`,
            icon: '✉',
            iconColor: 'rgba(160,120,208,0.18)',
            title: `${name} applied to your brief`,
            sub: `"${title}" · Click to open the brief and review their application`,
            meta: timeAgo(a.created_at),
            href: `/briefs?open=${a.brief_id}`,
            tag: 'New application',
            tagColor: '#a078d0',
          })
        }
      }

      // 4. Active studios
      const { data: activeStudios } = await supabase
        .from('collab_terms')
        .select(`*, initiator:profiles!collab_terms_initiator_id_fkey(firstname, lastname), partner:profiles!collab_terms_partner_id_fkey(firstname, lastname)`)
        .or(`initiator_id.eq.${user.id},partner_id.eq.${user.id}`)
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(5)

      for (const t of activeStudios || []) {
        const other = t.initiator_id === user.id ? t.partner : t.initiator
        const name  = other ? `${other.firstname} ${other.lastname}` : 'your collaborator'
        updates.push({
          key: `studio-${t.id}`,
          icon: '◈',
          iconColor: 'rgba(86,140,195,0.18)',
          title: `Studio open with ${name}`,
          sub: t.project_title ? `${t.project_title} · In progress` : 'Your collaboration is active.',
          meta: timeAgo(t.updated_at),
          href: `/studio/${t.id}`,
          tag: 'Active',
          tagColor: '#568cc3',
        })
      }

      setActionItems(actions)
      setUpdateItems(updates)
      setLoading(false)
    }
    load()
  }, [])

  const totalCount = actionItems.length + updateItems.length

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh' }}>
      <Nav />

      <div style={{ maxWidth:'640px', margin:'0 auto', padding:'2.5rem 1.5rem', width:'100%', flex:1 }}>
        <div style={{ marginBottom:'2rem' }}>
          <div style={{ fontFamily:'var(--sans)', fontSize:'0.58rem', letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--gold)', opacity:0.75, marginBottom:'0.4rem' }}>Collective Loft</div>
          <div style={{ fontFamily:'var(--serif)', fontSize:'2rem', fontWeight:700, color:'var(--cream)', marginBottom:'0.3rem' }}>Message Center</div>
          <div style={{ fontFamily:'var(--sans)', fontSize:'0.75rem', color:'rgba(240,236,227,0.4)', fontWeight:300 }}>
            {loading ? 'Loading…' : totalCount === 0 ? 'You\'re all caught up.' : `${totalCount} item${totalCount > 1 ? 's' : ''} waiting for you`}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:'3rem', color:'rgba(240,236,227,0.25)', fontFamily:'var(--sans)', fontSize:'0.78rem' }}>✦ Loading…</div>
        ) : totalCount === 0 ? (
          <div style={{ textAlign:'center', padding:'4rem 2rem', background:'var(--bg1)', border:'0.5px solid rgba(240,236,227,0.06)', borderRadius:'6px' }}>
            <div style={{ fontSize:'2rem', marginBottom:'0.75rem', opacity:0.3 }}>✉</div>
            <div style={{ fontFamily:'var(--serif)', fontSize:'1.1rem', color:'var(--cream)', marginBottom:'0.4rem' }}>All caught up.</div>
            <div style={{ fontFamily:'var(--sans)', fontSize:'0.72rem', color:'rgba(240,236,227,0.35)', lineHeight:1.65 }}>No pending terms, ratings, or applications right now. When something needs your attention, it'll show up here.</div>
          </div>
        ) : (
          <>
            {actionItems.length > 0 && (
              <>
                <SectionLabel label="Action required" count={actionItems.length} />
                {actionItems.map(n => <NotifCard key={n.key} {...n} />)}
              </>
            )}
            {updateItems.length > 0 && (
              <>
                <SectionLabel label="Updates" count={updateItems.length} />
                {updateItems.map(n => <NotifCard key={n.key} {...n} />)}
              </>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  )
}