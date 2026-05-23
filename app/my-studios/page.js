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

export default function MyStudiosPage() {
  const router = useRouter()
  const [myProfile, setMyProfile] = useState(null)
  const [studios,   setStudios]   = useState([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setMyProfile(profile)

      // Only load active, paused, and complete studios -- NOT pending terms
      const { data: terms } = await supabase
        .from('collab_terms')
        .select(`
          *,
          initiator:profiles!collab_terms_initiator_id_fkey(id, firstname, lastname, disciplines, headline),
          partner:profiles!collab_terms_partner_id_fkey(id, firstname, lastname, disciplines, headline)
        `)
        .or(`initiator_id.eq.${user.id},partner_id.eq.${user.id}`)
        .in('status', ['active', 'paused', 'complete'])
        .order('created_at', { ascending: false })

      setStudios(terms || [])
      setLoading(false)
    }
    load()
  }, [])

  const active        = studios.filter(s => s.status === 'active')
  const paused        = studios.filter(s => s.status === 'paused')
  const complete      = studios.filter(s => s.status === 'complete')
  const pendingRating = complete.filter(s => !s.rated)

  const myInitials  = myProfile ? initials(myProfile.firstname, myProfile.lastname) : '?'
  const myDiscColor = myProfile ? avatarColor(myProfile.disciplines) : { bg: 'rgba(201,168,76,0.18)', color: 'var(--gold)' }

  function partnerFor(studio) {
    if (!myProfile) return null
    return studio.initiator_id === myProfile.id ? studio.partner : studio.initiator
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
            <div className={styles.pageSub}>Your active collaborations — the work in progress.</div>
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
                  <div className={styles.newStudioSub}>Post a brief or apply to one — a Studio opens when both parties agree on terms.</div>
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