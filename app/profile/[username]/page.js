'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import styles from './profile.module.css'

// ── Skill bar widths ──────────────────────────────────────────────────────────
const SKILL_WIDTHS = [95, 88, 78, 65, 55, 48, 42, 38]

// ── Gallery placeholder tiles ─────────────────────────────────────────────────
const GALLERY_BG = ['#1c1228','#0f1e1b','#1e1510','#0e1520','#1a0f15','#141a0e']

// ── Discipline color keys ─────────────────────────────────────────────────────
const DISC_COLOR = {
  'visual art':   'gold',
  'music':        'teal',
  'writing':      'purple',
  'design & web': 'blue',
  'film':         'pink',
  'photography':  'green',
  'performance':  'orange',
  'creative tech':'cyan',
}

export default function ProfilePage() {
  const params = useParams()
  const username = params?.username

  const [profile,  setProfile]  = useState(null)
  const [studios,  setStudios]  = useState([])
  const [ratings,  setRatings]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeTab, setActiveTab] = useState('work')
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!username) return
    loadProfile()
  }, [username])

  async function loadProfile() {
    setLoading(true)

    // Try to find by id first (UUID), then by name slug
    let query = supabase.from('profiles').select('*')

    // Check if it looks like a UUID
    const isUuid = /^[0-9a-f-]{36}$/.test(username)
    if (isUuid) {
      query = query.eq('id', username)
    } else {
      // Slug format: firstname-lastname
      const parts = username.split('-')
      if (parts.length >= 2) {
        query = query
          .ilike('firstname', parts[0])
          .ilike('lastname', parts.slice(1).join(' '))
      } else {
        query = query.ilike('firstname', username)
      }
    }

    const { data, error } = await query.single()

    if (error || !data) {
      setNotFound(true)
      setLoading(false)
      return
    }

    setProfile(data)

    // Load completed studios
    const { data: studioData } = await supabase
      .from('studios')
      .select('*, profiles!studios_collaborator_id_fkey(firstname, lastname, headline)')
      .or(`poster_id.eq.${data.id},collaborator_id.eq.${data.id}`)
      .eq('status', 'complete')
      .order('created_at', { ascending: false })

    setStudios(studioData || [])

    // Load ratings for this profile
    const { data: ratingData } = await supabase
      .from('ratings')
      .select('*, profiles!ratings_rater_id_fkey(firstname, lastname, headline)')
      .eq('ratee_id', data.id)
      .eq('submitted', true)

    setRatings(ratingData || [])
    setLoading(false)
  }

  // ── Derived values ───────────────────────────────────────────────────────
  if (loading) return (
    <div className={styles.loading}>
      <div className={styles.loadingDot}>✦</div>
    </div>
  )

  if (notFound) return (
    <div className={styles.notFound}>
      <div className={styles.nfIcon}>✦</div>
      <div className={styles.nfTitle}>Profile not found</div>
      <div className={styles.nfSub}>This creative may have moved or doesn't exist yet.</div>
      <Link href="/discover" className={styles.nfBtn}>Browse Creatives</Link>
    </div>
  )

  const fullName    = `${profile.firstname || ''} ${profile.lastname || ''}`.trim()
  const initials    = [(profile.firstname||'?')[0], (profile.lastname||'?')[0]].join('').toUpperCase()
  const location    = [profile.city, profile.state, profile.country].filter(Boolean).join(', ')
  const disciplines = profile.disciplines || []
  const skills      = profile.skills || []
  const avgRating   = ratings.length
    ? (ratings.reduce((s, r) => s + r.stars, 0) / ratings.length).toFixed(1)
    : null

  const availText = [
    profile.seeking ? `Seeking ${profile.seeking}.` : null,
    profile.location_preference ? `${profile.location_preference}.` : null,
    profile.compensation?.length ? profile.compensation.join(' or ') + '.' : null,
  ].filter(Boolean).join(' ')

  const links = [
    profile.website      && { icon: '🔗', label: profile.website.replace(/^https?:\/\//, ''),      href: profile.website },
    profile.instagram    && { icon: '📷', label: `@${profile.instagram.replace('@','')}`,           href: `https://instagram.com/${profile.instagram.replace('@','')}` },
    profile.soundcloud   && { icon: '🎵', label: profile.soundcloud.replace(/^https?:\/\//, ''),    href: profile.soundcloud },
    profile.other_link   && { icon: '🔗', label: profile.other_link.replace(/^https?:\/\//, ''),   href: profile.other_link },
    profile.portfolio_link && { icon: '💼', label: profile.portfolio_link.replace(/^https?:\/\//, ''), href: profile.portfolio_link },
  ].filter(Boolean)

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* Nav */}
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>Collective <span>Loft</span></Link>
        <div className={styles.navLinks}>
          <Link href="/discover">Discover</Link>
          <Link href="/briefs">Collabs</Link>
          <Link href="/studio">Studio</Link>
          <Link href="/join" className={styles.btnEdit}>Edit profile</Link>
        </div>
      </nav>

      {/* Cover banner */}
      <div className={styles.coverBanner}>
        {profile.cover_url
          ? <img src={profile.cover_url} alt="Cover" className={styles.coverImg} />
          : <div className={styles.coverPattern} />
        }
      </div>

      {/* Identity strip */}
      <div className={styles.identityStrip}>
        <div className={styles.avWrap}>
          <div className={styles.avCircle}>
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt={fullName} />
              : <span>{initials}</span>
            }
            <div className={styles.onlineDot} />
          </div>
        </div>
        <div className={styles.identityContent}>
          <div className={styles.identityTop}>
            <div>
              <div className={styles.profileName}>{fullName}</div>
              <div className={styles.profileHeadline}>{profile.headline}</div>
            </div>
            <div className={styles.actionBtns}>
              <button className={styles.btnMessage}>Message</button>
              <button
                className={styles.btnConnect}
                onClick={() => setConnected(true)}
                style={connected ? { background: 'var(--teal)' } : {}}
              >
                {connected ? '✦ Sent' : '+ Connect'}
              </button>
            </div>
          </div>
          <div className={styles.metaRow}>
            {location && <div className={styles.metaItem}><span>📍</span><span>{location}</span></div>}
            <div className={styles.metaItem}><span>⊞</span><span>{profile.connections_count || 0} connections</span></div>
            <div className={styles.metaItem}><span>◎</span><span>{profile.collabs_count || 0} collabs completed</span></div>
          </div>
          <div className={styles.profileTags}>
            {profile.availability === 'open' && <span className={`${styles.ptag} ${styles.ptagOpen}`}>Open to collabs</span>}
            {disciplines.slice(0, 2).map(d => (
              <span key={d} className={`${styles.ptag} ${styles.ptagDisc}`}>{d}</span>
            ))}
            {skills.slice(0, 2).map(s => (
              <span key={s} className={styles.ptag}>{s}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabsBar}>
        {['work','about','collabs','briefs'].map(tab => (
          <div
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.active : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </div>
        ))}
      </div>

      {/* Profile body */}
      <div className={styles.profileBody}>

        {/* Main content */}
        <div className={styles.profileMain}>

          {/* WORK tab */}
          {activeTab === 'work' && (
            <>
              {/* Bio + Right Now */}
              <div className={styles.contentSection}>
                <div className={styles.secLabel}>About</div>
                {profile.bio
                  ? <div className={styles.bioText}>{profile.bio}</div>
                  : <div className={styles.emptyState}>No bio added yet.</div>
                }
                {profile.rightnow && (
                  <div className={styles.rightnowCard}>
                    <div className={styles.rnLabel}>Right now</div>
                    <div className={styles.rnText}>{profile.rightnow}</div>
                  </div>
                )}
              </div>

              {/* Gallery */}
              <div className={styles.contentSection}>
                <div className={styles.secLabel}>Portfolio · selected works</div>
                <div className={styles.galleryGrid}>
                  {GALLERY_BG.map((bg, i) => (
                    <div key={i} className={styles.galleryItem} style={{ background: bg }}>
                      <div className={styles.giPlaceholder}>✦</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Past collabs */}
              <div className={styles.contentSection}>
                <div className={styles.secLabel}>Past collaborations</div>
                {studios.length === 0 ? (
                  <div className={styles.emptyState}>No completed collaborations yet. Post a brief or apply to one to start building your track record.</div>
                ) : (
                  studios.map(s => {
                    const collab = s.profiles
                    const collabName = collab ? `${collab.firstname} ${collab.lastname}` : 'Collaborator'
                    const collabInitials = collab ? `${collab.firstname[0]}${collab.lastname[0]}` : '??'
                    return (
                      <div key={s.id} className={styles.collabItem}>
                        <div className={`${styles.collabAv} ${styles.avTeal}`}>{collabInitials}</div>
                        <div className={styles.collabInfo}>
                          <div className={styles.collabName}>{collabName} · {collab?.headline}</div>
                          <div className={styles.collabRole}>{s.title}</div>
                        </div>
                        <span className={styles.collabStatus}>Completed</span>
                      </div>
                    )
                  })
                )}
              </div>
            </>
          )}

          {/* ABOUT tab */}
          {activeTab === 'about' && (
            <>
              <div className={styles.contentSection}>
                <div className={styles.secLabel}>Bio</div>
                <div className={styles.bioText}>{profile.bio || 'No bio added yet.'}</div>
              </div>
              <div className={styles.contentSection}>
                <div className={styles.secLabel}>Disciplines &amp; skills</div>
                <div className={styles.discTags} style={{ marginBottom: '1rem' }}>
                  {disciplines.map(d => <span key={d} className={styles.discTag}>{d}</span>)}
                </div>
                <div className={styles.skillList}>
                  {skills.slice(0, 8).map((s, i) => (
                    <div key={s} className={styles.skillRow}>
                      <span className={styles.skillName}>{s}</span>
                      <div className={styles.skillBarBg}>
                        <div className={styles.skillBarFill} style={{ width: `${SKILL_WIDTHS[i] || 40}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.contentSection}>
                <div className={styles.secLabel}>Collaboration preferences</div>
                <div className={styles.prefText}>
                  {[
                    profile.compensation?.length && `Open to ${profile.compensation.join(' and ').toLowerCase()}`,
                    profile.location_preference && profile.location_preference,
                    profile.seeking && `Currently looking for: ${profile.seeking}`,
                  ].filter(Boolean).join('. ')}
                </div>
              </div>
            </>
          )}

          {/* COLLABS tab */}
          {activeTab === 'collabs' && (
            <div className={styles.contentSection}>
              <div className={styles.secLabel}>Collaboration history</div>
              {studios.length === 0 ? (
                <div className={styles.emptyState}>Once you complete a collab through Collective Loft, it will appear here as part of your track record.</div>
              ) : (
                studios.map(s => {
                  const collab = s.profiles
                  const collabName = collab ? `${collab.firstname} ${collab.lastname}` : 'Collaborator'
                  const collabInitials = collab ? `${collab.firstname[0]}${collab.lastname[0]}` : '??'
                  return (
                    <div key={s.id} className={styles.collabItem}>
                      <div className={`${styles.collabAv} ${styles.avTeal}`}>{collabInitials}</div>
                      <div className={styles.collabInfo}>
                        <div className={styles.collabName}>{collabName} · {collab?.headline}</div>
                        <div className={styles.collabRole}>{s.title}</div>
                      </div>
                      <span className={styles.collabStatus}>Completed</span>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* BRIEFS tab */}
          {activeTab === 'briefs' && (
            <div className={styles.contentSection}>
              <div className={styles.secLabel}>Active briefs</div>
              {profile.rightnow ? (
                <div className={styles.briefCard}>
                  <div className={styles.briefTitle}>{fullName} — {profile.headline}</div>
                  <div className={styles.briefTags}>
                    {disciplines.slice(0,3).map(d => <span key={d} className={`${styles.ptag} ${styles.ptagDisc}`}>{d}</span>)}
                    {profile.compensation?.map(c => <span key={c} className={`${styles.ptag} ${styles.ptagOpen}`}>{c}</span>)}
                  </div>
                  <div className={styles.briefDesc}>{profile.rightnow}</div>
                </div>
              ) : (
                <div className={styles.emptyState}>No active briefs posted yet.</div>
              )}
            </div>
          )}

        </div>

        {/* Sidebar */}
        <aside className={styles.profileSidebar}>

          {/* Activity stats */}
          <div>
            <div className={styles.sbLabel}>Activity</div>
            <div className={styles.statGrid}>
              <div className={styles.statCard}><div className={styles.statNum}>{studios.length}</div><div className={styles.statLbl}>Collabs</div></div>
              <div className={styles.statCard}><div className={styles.statNum}>{profile.connections_count || 0}</div><div className={styles.statLbl}>Connections</div></div>
              <div className={styles.statCard}><div className={styles.statNum}>{avgRating || '—'}</div><div className={styles.statLbl}>Rating</div></div>
              <div className={styles.statCard}><div className={styles.statNum}>{ratings.length}</div><div className={styles.statLbl}>Reviews</div></div>
            </div>
          </div>

          {/* Availability */}
          {(profile.seeking || profile.compensation?.length) && (
            <div className={styles.availCard}>
              <div className={styles.availTitle}>Open to collaborate</div>
              <div className={styles.availText}>{availText}</div>
            </div>
          )}

          {/* Disciplines */}
          {disciplines.length > 0 && (
            <div>
              <div className={styles.sbLabel}>Disciplines</div>
              <div className={styles.discTags}>
                {disciplines.map(d => <span key={d} className={styles.discTag}>{d}</span>)}
              </div>
            </div>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <div>
              <div className={styles.sbLabel}>Skills</div>
              <div className={styles.skillList}>
                {skills.slice(0, 6).map((s, i) => (
                  <div key={s} className={styles.skillRow}>
                    <span className={styles.skillName}>{s}</span>
                    <div className={styles.skillBarBg}>
                      <div className={styles.skillBarFill} style={{ width: `${SKILL_WIDTHS[i] || 40}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Community voice — ratings */}
          {ratings.length > 0 && (
            <div>
              <div className={styles.sbLabel}>Community voice</div>
              <div className={styles.endorsements}>
                {ratings.slice(0, 3).map(r => {
                  const rater = r.profiles
                  const raterName = rater ? `${rater.firstname} ${rater.lastname}` : 'Collaborator'
                  return r.review ? (
                    <div key={r.id} className={styles.endorse}>
                      <div className={styles.endorseText}>"{r.review}"</div>
                      <div className={styles.endorseBy}>— {raterName}{rater?.headline ? `, ${rater.headline}` : ''}</div>
                    </div>
                  ) : null
                }).filter(Boolean)}
              </div>
            </div>
          )}

          {/* Links */}
          {links.length > 0 && (
            <div>
              <div className={styles.sbLabel}>Links</div>
              <div className={styles.profileLinks}>
                {links.map((l, i) => (
                  <a key={i} href={l.href} target="_blank" rel="noopener noreferrer" className={styles.profileLink}>
                    <span className={styles.linkIcon}>{l.icon}</span>
                    <span>{l.label}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

        </aside>
      </div>
    </>
  )
}