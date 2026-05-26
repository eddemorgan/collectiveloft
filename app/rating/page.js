'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import styles from './rating.module.css'

const STAR_LABELS = ['', 'Not quite right', 'It was okay', 'Good collaboration', 'Really enjoyed it', 'Exceptional — would collab again']

const ENDORSE_OPTS = [
  'Communicative', 'Met deadlines', 'Delivered quality work', 'Creative',
  'Flexible', 'Professional', 'Would collab again', 'Went above and beyond',
  'Responsive', 'Respected the brief', 'Great communicator', 'Brought their own ideas',
]

function RatingForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const studioId     = searchParams.get('studio')

  const [myProfile,  setMyProfile]  = useState(null)
  const [partner,    setPartner]    = useState(null)
  const [studio,     setStudio]     = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [already,    setAlready]    = useState(false)

  const [stars,      setStarsVal]   = useState(0)
  const [hoverStar,  setHoverStar]  = useState(0)
  const [endorsed,   setEndorsed]   = useState([])
  const [review,     setReview]     = useState('')
  const [errors,     setErrors]     = useState({})
  const [saving,     setSaving]     = useState(false)
  const [submitted,  setSubmitted]  = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: me } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setMyProfile(me)

      if (studioId) {
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
        }

        // Check if this user already submitted a rating
        const { data: existing } = await supabase
          .from('ratings')
          .select('id')
          .eq('studio_id', studioId)
          .eq('rater_id', user.id)
          .eq('submitted', true)
          .single()
        if (existing) setAlready(true)
      }
      setLoading(false)
    }
    load()
  }, [studioId])

  function toggleEndorse(tag) {
    setEndorsed(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  function validate() {
    const errs = {}
    if (!stars) errs.stars = 'Please give a star rating before submitting.'
    if (review.trim().length < 50) errs.review = 'Please write at least 50 characters so the review is meaningful.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    setSaving(true)
    try {
      await supabase.from('ratings').insert({
        rater_id:  myProfile.id,
        ratee_id:  partner?.id,
        studio_id: studioId,
        stars,
        endorsed,
        review:    review.trim(),
        submitted: true,
      })
      await supabase.from('collab_terms').update({ rated: true }).eq('id', studioId)
    } catch (e) {
      console.error(e)
    }
    setSaving(false)
    setSubmitted(true)
  }

  const partnerFirst = partner?.firstname || 'your collaborator'
  const partnerFull  = partner ? `${partner.firstname} ${partner.lastname}` : 'your collaborator'
  const myInit       = myProfile ? `${myProfile.firstname?.[0]}${myProfile.lastname?.[0]}` : '?'
  const partnerInit  = partner   ? `${partner.firstname?.[0]}${partner.lastname?.[0]}`     : '?'
  const displayStars = hoverStar || stars

  if (loading) return <div className={styles.loading}><div>✦</div></div>

  if (already) return (
    <div className={styles.successState}>
      <div className={styles.successMark}>✦</div>
      <div className={styles.successTitle}>Already <span>submitted.</span></div>
      <div className={styles.successSub}>
        You've already submitted your review for this collaboration. Thank you for contributing to the community.
      </div>
      <div className={styles.successActions}>
        <Link href="/my-studios" className={styles.btnStudios}>Back to my studios</Link>
      </div>
    </div>
  )

  if (submitted) return (
    <div className={styles.successState}>
      <div className={styles.successMark}>✦</div>
      <div className={styles.successTitle}>Review <span>submitted.</span></div>
      <div className={styles.successSub}>
        Your review of {partnerFull} is live on their profile. Once {partnerFirst} submits their review of you, both will become visible — and you'll get a notification. Thank you for making the platform more trustworthy.
      </div>
      <div className={styles.successActions}>
        <Link href={`/profile/${partner?.id}`} className={styles.btnViewProfile}>
          View {partnerFirst}'s profile
        </Link>
        <Link href="/my-studios" className={styles.btnStudios}>Back to my studios</Link>
      </div>
    </div>
  )

  return (
    <>
      {studio && (
        <div className={styles.contextCard}>
          <div className={styles.contextAvs}>
            <div className={styles.ctxAv} style={{ background: 'rgba(201,168,76,0.18)', color: 'var(--gold)' }}>{myInit}</div>
            <div className={styles.ctxAv} style={{ background: 'rgba(86,179,156,0.18)', color: 'var(--teal)' }}>{partnerInit}</div>
          </div>
          <div className={styles.contextInfo}>
            <div className={styles.ctxStudioName}>{studio.project_title || 'Collaboration'}</div>
            <div className={styles.ctxMeta}>
              <span>With {partnerFull} · {partner?.headline || ''}</span>
              <span className={styles.ctxComplete}>Complete</span>
            </div>
          </div>
        </div>
      )}

      <div className={styles.pageHdr}>
        <div className={styles.pageEyebrow}>Loft Studio · Collab complete</div>
        <div className={styles.pageTitle}>How was working with <em>{partnerFull}?</em></div>
        <div className={styles.pageSub}>
          Your review appears on {partnerFirst}'s profile under Community Voice. Be specific and honest — this is what makes the next creative decide whether to reach out to them. It matters.
        </div>
      </div>

      <div className={styles.ratingForm}>

        <div className={styles.formSection}>
          <div className={styles.fsecLabel}>Overall rating</div>
          <div className={styles.fsecDesc}>How would you rate this collaboration overall?</div>
          <div className={styles.starDisplay}>
            <div className={styles.starRow}>
              <div className={styles.starsWrap}>
                {[1,2,3,4,5].map(n => (
                  <button
                    key={n}
                    className={`${styles.starBtn} ${displayStars >= n ? styles.lit : ''}`}
                    onClick={() => setStarsVal(n)}
                    onMouseEnter={() => setHoverStar(n)}
                    onMouseLeave={() => setHoverStar(0)}
                  >★</button>
                ))}
              </div>
              <div className={styles.starLabel}>{STAR_LABELS[displayStars] || 'Tap to rate'}</div>
            </div>
          </div>
          {errors.stars && <div className={styles.errorMsg}>{errors.stars}</div>}
        </div>

        <div className={styles.formSection}>
          <div className={styles.fsecLabel}>Endorsements</div>
          <div className={styles.fsecDesc}>
            Select all that describe working with {partnerFirst}. These accumulate on their profile as verified signals from real collaborators.
          </div>
          <div className={styles.endorseGrid}>
            {ENDORSE_OPTS.map(tag => (
              <button
                key={tag}
                className={`${styles.endorseTag} ${endorsed.includes(tag) ? styles.on : ''}`}
                onClick={() => toggleEndorse(tag)}
              >
                {endorsed.includes(tag) ? '✓  ' : ''}{tag}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.formSection}>
          <div className={styles.fsecLabel}>Written review</div>
          <div className={styles.fsecDesc}>
            Tell other creatives what it was actually like. What made this collab work? What would you want to know before reaching out to someone like {partnerFirst}?
          </div>
          <div className={styles.reviewField}>
            <label>Your review <span className={styles.opt}>— minimum 50 characters</span></label>
            <textarea
              maxLength={600}
              placeholder={`Working with ${partnerFirst} was a genuine creative partnership…`}
              value={review}
              onChange={e => setReview(e.target.value)}
              rows={6}
              className={errors.review ? styles.fieldError : ''}
            />
            <div className={`${styles.charCount} ${review.length > 550 ? styles.warn : ''}`}>
              {review.length} / 600
            </div>
            <div className={styles.hint}>This is quoted with your name on {partnerFirst}'s profile. Write something you'd stand behind publicly.</div>
            {errors.review && <div className={styles.errorMsg}>{errors.review}</div>}
          </div>
        </div>

        <div className={styles.visibilityNote}>
          <strong>Where this appears:</strong> Your written review and star rating appear on {partnerFirst}'s profile under Community Voice, attributed to you by name. Endorsed skill tags accumulate as a count visible to anyone viewing their profile. Neither party can edit or delete reviews after submission.
        </div>

        <div className={styles.submitArea}>
          <div className={styles.submitRow}>
            <button className={styles.btnSubmit} onClick={handleSubmit} disabled={saving}>
              {saving ? 'Submitting…' : 'Submit review ↗'}
            </button>
            <Link href="/my-studios" className={styles.btnSkip}>Skip for now</Link>
          </div>
          <div className={styles.submitNote}>
            You can submit this review at any time from your My Studios page. {partnerFirst} will also be submitting a review of you — you won't see each other's reviews until both are submitted.
          </div>
        </div>

      </div>
    </>
  )
}

export default function RatingPage() {
  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>Collective <span>Loft</span></Link>
        <Link href="/my-studios" className={styles.navBack}>My Loft Studios</Link>
      </nav>
      <div className={styles.inner}>
        <Suspense fallback={<div className={styles.loading}>Loading…</div>}>
          <RatingForm />
        </Suspense>
      </div>
    </div>
  )
}