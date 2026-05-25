'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Footer from '../components/Footer'
import styles from './terms.module.css'

const COLLAB_TYPES = [
  { key: 'exchange', icon: '⇄', name: 'Creative exchange', badge: 'Exchange', badgeClass: 'badgeEx', desc: 'Both parties contribute work of equal value. No money changes hands.' },
  { key: 'paid',     icon: '$', name: 'Paid collaboration', badge: 'Paid',     badgeClass: 'badgePd', desc: 'One party pays the other. Fee, milestones, and rights are agreed upfront.' },
  { key: 'revenue',  icon: '%', name: 'Revenue share',      badge: 'Rev share',badgeClass: 'badgeRs', desc: 'No upfront fee. Both parties share in the revenue the work generates.' },
]

const RIGHTS_OPTS = [
  { key: 'transfer',  title: 'Full transfer on payment', desc: 'All rights pass to client on final payment. Creator retains portfolio use only.' },
  { key: 'shared',    title: 'Shared credit',            desc: 'Both parties credited. Creator may display work publicly.' },
  { key: 'license',   title: 'License only',             desc: 'Client licenses for defined use. Creator retains underlying IP.' },
  { key: 'negotiate', title: 'Negotiate separately',     desc: 'Terms to be added to the Studio before work begins.' },
]

const DEFAULT_DELIVERABLES = [
  'Live portfolio website, mobile-responsive',
  'CMS access so artist can update independently',
  'Source files transferred on final payment',
]

function TermsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const partnerId  = searchParams.get('with')
  const briefId    = searchParams.get('brief')
  const briefTitle = searchParams.get('title')

  const [myProfile,    setMyProfile]    = useState(null)
  const [partner,      setPartner]      = useState(null)
  const [collabType,   setCollabType]   = useState('exchange')
  const [rights,       setRights]       = useState('transfer')
  const [deliverables, setDeliverables] = useState(DEFAULT_DELIVERABLES)
  const [delChecked,   setDelChecked]   = useState([true, true, true])
  const [newDel,       setNewDel]       = useState('')
  const [milestones,   setMilestones]   = useState([
    { desc: 'Design mockup approved', pct: '30' },
    { desc: 'Development complete',   pct: '50' },
    { desc: 'Final delivery',         pct: '20' },
  ])
  const [feeFrom,      setFeeFrom]      = useState('')
  const [feeTo,        setFeeTo]        = useState('')
  const [paySchedule,  setPaySchedule]  = useState('')
  const [myShare,      setMyShare]      = useState('')
  const [theirShare,   setTheirShare]   = useState('')
  const [revSources,   setRevSources]   = useState('')
  const [timeline,     setTimeline]     = useState('')
  const [deadline,     setDeadline]     = useState('')
  const [location,     setLocation]     = useState('')
  const [cadence,      setCadence]      = useState('')
  const [projectTitle, setProjectTitle] = useState(briefTitle || '')
  const [submitted,    setSubmitted]    = useState(false)
  const [saving,       setSaving]       = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setMyProfile(data)
      if (partnerId) {
        const { data: p } = await supabase.from('profiles').select('*').eq('id', partnerId).single()
        setPartner(p)
      }
      // Pre-fill title from brief if provided
      if (briefTitle) setProjectTitle(decodeURIComponent(briefTitle))
    }
    load()
  }, [partnerId, briefTitle])

  function addDeliverable() {
    if (!newDel.trim()) return
    setDeliverables(prev => [...prev, newDel.trim()])
    setDelChecked(prev => [...prev, true])
    setNewDel('')
  }

  function toggleDel(i) {
    setDelChecked(prev => prev.map((v, idx) => idx === i ? !v : v))
  }

  function updateMilestone(i, field, val) {
    setMilestones(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: val } : m))
  }

  function addMilestone() {
    setMilestones(prev => [...prev, { desc: '', pct: '' }])
  }

  async function handleSubmit() {
    setSaving(true)
    try {
      const termsData = {
        initiator_id:  myProfile?.id,
        partner_id:    partner?.id,
        collab_type:   collabType,
        project_title: projectTitle,
        rights,
        deliverables:  deliverables.filter((_, i) => delChecked[i]),
        milestones:    collabType === 'paid' ? milestones : [],
        fee_from:      collabType === 'paid' ? feeFrom : null,
        fee_to:        collabType === 'paid' ? feeTo : null,
        pay_schedule:  collabType === 'paid' ? paySchedule : null,
        my_share:      collabType === 'revenue' ? myShare : null,
        their_share:   collabType === 'revenue' ? theirShare : null,
        rev_sources:   collabType === 'revenue' ? revSources : null,
        timeline,
        deadline:      deadline || null,
        location,
        cadence,
        status:        'pending',
        terms_status:  'negotiating',
        current_editor: 'partner', // partner reviews first
        brief_id:      briefId || null,
      }

      const { data: inserted } = await supabase
        .from('collab_terms')
        .insert(termsData)
        .select()
        .single()

      if (inserted && partner?.id && myProfile?.id) {
        await fetch('/api/send-terms-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studioId: inserted.id, initiatorId: myProfile.id, partnerId: partner.id }),
        })
      }
    } catch (e) {
      console.error(e)
    }
    setSaving(false)
    setSubmitted(true)
  }

  const partnerFirst = partner?.firstname || 'your collaborator'
  const myFirst      = myProfile?.firstname || 'You'
  const summaryComp  = collabType === 'exchange' ? 'Creative exchange' : collabType === 'paid' ? 'Paid · fee agreed' : 'Revenue share'

  return (
    <div className={styles.page} style={{ display:'flex', flexDirection:'column', minHeight:'100vh' }}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>Collective <span>Loft</span></Link>
        <div className={styles.navStep}>
          <div className={`${styles.step} ${styles.stepDone}`}><div className={styles.stepNum}>1</div><span className={styles.stepLabel}>Discover</span></div>
          <div className={styles.stepDivider} />
          <div className={`${styles.step} ${styles.stepDone}`}><div className={styles.stepNum}>2</div><span className={styles.stepLabel}>Brief</span></div>
          <div className={styles.stepDivider} />
          <div className={`${styles.step} ${styles.stepActive}`}><div className={styles.stepNum}>3</div><span className={styles.stepLabel}>Terms</span></div>
          <div className={styles.stepDivider} />
          <div className={`${styles.step} ${styles.stepUpcoming}`}><div className={styles.stepNum}>4</div><span className={styles.stepLabel}>Studio</span></div>
        </div>
      </nav>

      <div className={styles.pageLayout} style={{ flex: 1 }}>
        <div className={styles.formSide}>

          {(myProfile || partner) && (
            <div className={styles.contextBar}>
              <div className={styles.ctxAvs}>
                <div className={`${styles.ctxAv} ${styles.avGold}`}>{myProfile ? `${myProfile.firstname?.[0]}${myProfile.lastname?.[0]}` : '?'}</div>
                <div className={`${styles.ctxAv} ${styles.avTeal}`}>{partner ? `${partner.firstname?.[0]}${partner.lastname?.[0]}` : '?'}</div>
              </div>
              <div className={styles.ctxInfo}>
                <div className={styles.ctxTitle}>{myFirst} + {partnerFirst}</div>
                <div className={styles.ctxMeta}>Setting collab terms · {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
              </div>
            </div>
          )}

          <div className={styles.pageHdr}>
            <div className={styles.pageEyebrow}>Collective Loft</div>
            <div className={styles.pageTitle}>Collab Terms</div>
            <div className={styles.pageSub}>Set the terms before the work starts. Clear agreements make better collaborations — and protect both sides if things get complicated.</div>
          </div>

          <div className={styles.formSection}>
            <div className={styles.fsecLabel}>Project</div>
            <div className={styles.field}>
              <label>Project title</label>
              <input type="text" placeholder="e.g. Portfolio site for gallery submissions" value={projectTitle} onChange={e => setProjectTitle(e.target.value)} />
            </div>
          </div>

          <div className={styles.formSection}>
            <div className={styles.fsecLabel}>Collaboration type</div>
            <div className={styles.typeChooser}>
              {COLLAB_TYPES.map(t => (
                <div key={t.key} className={`${styles.typeCard} ${collabType === t.key ? styles.typeCardSelected : ''}`} onClick={() => setCollabType(t.key)}>
                  <div className={styles.typeIcon}>{t.icon}</div>
                  <div className={styles.typeName}>{t.name}</div>
                  <div className={`${styles.typeBadge} ${styles[t.badgeClass]}`}>{t.badge}</div>
                  <div className={styles.typeDesc}>{t.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {collabType === 'paid' && (
            <div className={styles.formSection}>
              <div className={styles.fsecLabel}>Payment</div>
              <div className={styles.field}>
                <label>Fee range</label>
                <div className={styles.amountRow}>
                  <div className={styles.currencyBox}>$</div>
                  <input className={styles.amtInput} type="text" placeholder="From" value={feeFrom} onChange={e => setFeeFrom(e.target.value)} />
                  <span className={styles.amtTo}>to</span>
                  <input className={styles.amtInput} type="text" placeholder="To" value={feeTo} onChange={e => setFeeTo(e.target.value)} />
                </div>
              </div>
              <div className={styles.field}>
                <label>Payment schedule</label>
                <select value={paySchedule} onChange={e => setPaySchedule(e.target.value)}>
                  <option value="">Select…</option>
                  <option>50% upfront, 50% on delivery</option>
                  <option>Milestone-based</option>
                  <option>On delivery</option>
                  <option>Monthly retainer</option>
                </select>
              </div>
              <div className={styles.field}>
                <label>Milestones</label>
                <div className={styles.msBuilder}>
                  {milestones.map((m, i) => (
                    <div key={i} className={styles.msRow}>
                      <div className={styles.msNum}>{i + 1}</div>
                      <input className={styles.msInp} type="text" placeholder="Milestone description" value={m.desc} onChange={e => updateMilestone(i, 'desc', e.target.value)} />
                      <input className={styles.msPct} type="text" placeholder="%" value={m.pct} onChange={e => updateMilestone(i, 'pct', e.target.value)} />
                    </div>
                  ))}
                </div>
                <button className={styles.btnAddMs} onClick={addMilestone}>+ Add milestone</button>
              </div>
            </div>
          )}

          {collabType === 'revenue' && (
            <div className={styles.formSection}>
              <div className={styles.fsecLabel}>Revenue split</div>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label>My share</label>
                  <div className={styles.amountRow}>
                    <input className={styles.amtInput} type="text" placeholder="e.g. 85%" value={myShare} onChange={e => setMyShare(e.target.value)} />
                  </div>
                </div>
                <div className={styles.field}>
                  <label>Their share</label>
                  <div className={styles.amountRow}>
                    <input className={styles.amtInput} type="text" placeholder="e.g. 15%" value={theirShare} onChange={e => setTheirShare(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className={styles.field}>
                <label>Revenue sources covered</label>
                <input type="text" placeholder="e.g. Sales, streaming, licensing, exhibition proceeds" value={revSources} onChange={e => setRevSources(e.target.value)} />
              </div>
            </div>
          )}

          <div className={styles.formSection}>
            <div className={styles.fsecLabel}>Deliverables</div>
            <div className={styles.delList}>
              {deliverables.map((d, i) => (
                <div key={i} className={styles.delRow}>
                  <div className={`${styles.delChk} ${delChecked[i] ? styles.delChkOn : ''}`} onClick={() => toggleDel(i)}>{delChecked[i] ? '✓' : ''}</div>
                  <span className={`${styles.delText} ${delChecked[i] ? styles.delTextOn : ''}`}>{d}</span>
                </div>
              ))}
            </div>
            <div className={styles.field} style={{ marginTop: '0.75rem' }}>
              <input type="text" placeholder="Add a deliverable…" value={newDel} onChange={e => setNewDel(e.target.value)} onKeyDown={e => e.key === 'Enter' && addDeliverable()} />
              <div className={styles.hint}>Once both parties accept, this list locks. No scope creep.</div>
            </div>
          </div>

          <div className={styles.formSection}>
            <div className={styles.fsecLabel}>Rights & credit</div>
            <div className={styles.rightsGrid}>
              {RIGHTS_OPTS.map(r => (
                <div key={r.key} className={`${styles.rightsOpt} ${rights === r.key ? styles.rightsOptSelected : ''}`} onClick={() => setRights(r.key)}>
                  <div className={styles.rightsTitle}>{r.title}</div>
                  <div className={styles.rightsDesc}>{r.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.formSection}>
            <div className={styles.fsecLabel}>Timeline</div>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label>Estimated duration</label>
                <input type="text" placeholder="e.g. 6–8 weeks" value={timeline} onChange={e => setTimeline(e.target.value)} />
              </div>
              <div className={styles.field}>
                <label>Hard deadline <span className={styles.opt}>— if applicable</span></label>
                <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
              </div>
            </div>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label>Location</label>
                <select value={location} onChange={e => setLocation(e.target.value)}>
                  <option value="">Select…</option>
                  <option>Local only</option>
                  <option>Remote OK</option>
                  <option>Remote only</option>
                  <option>No preference</option>
                </select>
              </div>
              <div className={styles.field}>
                <label>Communication cadence</label>
                <select value={cadence} onChange={e => setCadence(e.target.value)}>
                  <option value="">Select…</option>
                  <option>As needed</option>
                  <option>Weekly check-ins</option>
                  <option>Bi-weekly check-ins</option>
                  <option>Daily updates</option>
                </select>
              </div>
            </div>
          </div>

          <div className={styles.exampleStrip}>
            <div className={styles.exampleCard}>
              <div className={styles.exLabel}>Creative exchange example</div>
              <div className={styles.exTitle}>Poet + cover artist</div>
              <div className={styles.exPeople}>James Delacroix & Marisol Vega</div>
              <div className={styles.exTerms}>James gets a <strong>painting for his book cover</strong>. Marisol gets a <strong>poem about one of her works</strong>. No money moves.</div>
            </div>
            <div className={styles.exampleCard}>
              <div className={styles.exLabel}>Paid example</div>
              <div className={styles.exTitle}>Singer + producer</div>
              <div className={styles.exPeople}>Simone Adeyemi & Tariq Osman</div>
              <div className={styles.exTerms}>Simone pays <strong>$1,500 across 3 milestones</strong>. Rights transfer fully on final payment.</div>
            </div>
            <div className={styles.exampleCard}>
              <div className={styles.exLabel}>Revenue share example</div>
              <div className={styles.exTitle}>Filmmaker + composer</div>
              <div className={styles.exPeople}>Leila Mora & René Pellegrini</div>
              <div className={styles.exTerms}>No upfront fee. René scores the film and receives <strong>15% of festival prize money and streaming revenue</strong>.</div>
            </div>
          </div>

          <div className={styles.submitRow}>
            <button className={styles.btnSubmit} onClick={handleSubmit} disabled={saving}>
              {saving ? 'Sending…' : `Send to ${partnerFirst} for review ↗`}
            </button>
            <Link href="/briefs" className={styles.btnBack}>Back</Link>
          </div>
        </div>

        <aside className={styles.summarySide}>
          <div className={styles.summaryHeader}>Live agreement summary</div>
          <div className={`${styles.summaryCard} ${projectTitle || collabType ? styles.hasContent : ''}`}>
            <div className={styles.scHdr}>
              <div className={styles.scType}>{collabType === 'exchange' ? 'Creative exchange' : collabType === 'paid' ? 'Paid collaboration' : 'Revenue share'}</div>
              <div className={styles.scTitle}>{projectTitle || 'Untitled project'}</div>
            </div>
            <div className={styles.scRows}>
              <div className={styles.scRow}><span className={styles.scK}>Parties</span><span className={styles.scV}>{myFirst} + {partnerFirst}</span></div>
              <div className={styles.scRow}><span className={styles.scK}>Compensation</span><span className={`${styles.scV} ${styles.gold}`}>{summaryComp}</span></div>
              {collabType === 'paid' && (
                <>
                  <div className={styles.scRow}><span className={styles.scK}>Fee range</span><span className={`${styles.scV} ${styles.gold} ${!feeFrom && !feeTo ? styles.empty : ''}`}>{feeFrom || feeTo ? `$${feeFrom}${feeTo ? '–' + feeTo : ''}` : '—'}</span></div>
                  <div className={styles.scRow}><span className={styles.scK}>Schedule</span><span className={`${styles.scV} ${!paySchedule ? styles.empty : ''}`}>{paySchedule || '—'}</span></div>
                </>
              )}
              {collabType === 'revenue' && (
                <div className={styles.scRow}><span className={styles.scK}>Split</span><span className={`${styles.scV} ${styles.gold} ${!myShare && !theirShare ? styles.empty : ''}`}>{myShare || theirShare ? `${myShare || '?'} / ${theirShare || '?'}` : '—'}</span></div>
              )}
              <div className={styles.scRow}><span className={styles.scK}>Rights</span><span className={styles.scV}>{RIGHTS_OPTS.find(r => r.key === rights)?.title}</span></div>
              <div className={styles.scRow}>
                <span className={styles.scK}>Timeline</span>
                <span className={`${styles.scV} ${!timeline && !deadline ? styles.empty : ''}`}>
                  {timeline || deadline ? [timeline, deadline ? 'Deadline: ' + new Date(deadline + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''].filter(Boolean).join(' · ') : 'Not set'}
                </span>
              </div>
              <div className={styles.scRow}><span className={styles.scK}>Location</span><span className={`${styles.scV} ${!location ? styles.empty : ''}`}>{location || 'Not set'}</span></div>
              <div className={styles.scRow}><span className={styles.scK}>Status</span><span className={`${styles.scV} ${styles.teal}`}>Draft · pending {partnerFirst}'s review</span></div>
            </div>
          </div>

          <div className={styles.summaryHeader} style={{ marginTop: '0.5rem' }}>What Collective Loft protects</div>
          <div className={styles.protectionList}>
            {['Terms stored on record — both parties can reference at any time','Milestone payments only release when both parties confirm','Deliverables list locks once accepted — no scope creep','Rights terms timestamped and cannot be altered retroactively','Disputes can be flagged to the Collective Loft team for mediation'].map((item, i) => <div key={i} className={styles.protectionItem}>{item}</div>)}
          </div>

          <button className={styles.btnSidebarSend} onClick={handleSubmit} disabled={saving}>
            {saving ? 'Sending…' : `Send to ${partnerFirst} for review ↗`}
          </button>
          <button className={styles.btnPreview}>Preview as agreement doc</button>
        </aside>
      </div>

      <Footer />

      {submitted && (
        <div className={styles.successOverlay}>
          <div className={styles.successInner}>
            <div className={styles.successMark}>✦</div>
            <div className={styles.successTitle}>Sent to <span>{partnerFirst}</span>.</div>
            <div className={styles.successSub}>
              The agreement has been sent to {partnerFirst} for review. Once they confirm, the Loft Studio opens and your collaboration officially begins.
            </div>
<div className={styles.successActions}>
  <Link href={`/profile/${myProfile?.firstname?.trim().toLowerCase()}-${myProfile?.lastname?.trim().toLowerCase()}`} className={styles.btnOpenStudio}>Open my profile</Link>
  <Link href="/briefs" className={styles.btnBackLink}>Back to Collabs</Link>
</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function TermsPageWrapper() {
  return (
    <Suspense fallback={<div style={{color:'var(--faint)',padding:'4rem',textAlign:'center'}}>Loading…</div>}>
      <TermsPage />
    </Suspense>
  )
}