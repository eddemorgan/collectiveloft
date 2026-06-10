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

// Visual style per notification type
const TYPE_STYLE = {
  application:   { icon: '✉', iconColor: 'rgba(160,120,208,0.18)', tag: 'New application', tagColor: '#a078d0' },
  term_review:   { icon: '📋', iconColor: 'rgba(201,168,76,0.18)', tag: 'Action required', tagColor: '#C9A84C' },
  rating_prompt: { icon: '★', iconColor: 'rgba(86,179,156,0.18)', tag: 'Rate now',        tagColor: '#56B39C' },
  default:       { icon: '◈', iconColor: 'rgba(86,140,195,0.18)', tag: null,              tagColor: '#568cc3' },
}

function NotifCard({ notif, onOpen }) {
  const style = TYPE_STYLE[notif.type] || TYPE_STYLE.default
  const dim = notif.read
  return (
    <Link href={notif.link || '#'} style={{ textDecoration: 'none' }} onClick={() => onOpen(notif)}>
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: '1rem',
        padding: '1.1rem 1.25rem', background: dim ? 'transparent' : 'var(--bg1)',
        border: '0.5px solid rgba(26,24,20,0.08)', borderRadius: '4px',
        marginBottom: '0.65rem', transition: 'border-color 0.15s, background 0.15s', cursor: 'pointer',
        opacity: dim ? 0.62 : 1,
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.25)'; e.currentTarget.style.background = 'rgba(201,168,76,0.03)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(26,24,20,0.08)'; e.currentTarget.style.background = dim ? 'transparent' : 'var(--bg1)' }}
      >
        <div style={{ width:'36px', height:'36px', borderRadius:'50%', flexShrink:0, background:style.iconColor, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.9rem' }}>
          {style.icon}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.2rem', flexWrap:'wrap' }}>
            <span style={{ fontFamily:'var(--sans)', fontSize:'0.78rem', fontWeight:600, color:'var(--cream)' }}>{notif.title}</span>
            {!notif.read && style.tag && (
              <span style={{ fontFamily:'var(--sans)', fontSize:'0.58rem', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:style.tagColor, background:`${style.tagColor}22`, padding:'1px 6px', borderRadius:'2px' }}>
                {style.tag}
              </span>
            )}
          </div>
          <div style={{ fontFamily:'var(--sans)', fontSize:'0.72rem', color:'var(--cream)', lineHeight:1.5 }}>{notif.body}</div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'0.3rem', flexShrink:0 }}>
          <span style={{ fontFamily:'var(--sans)', fontSize:'0.62rem', color:'var(--muted)' }}>{timeAgo(notif.created_at)}</span>
          <span style={{ color:'var(--muted)', fontSize:'0.75rem' }}>↗</span>
        </div>
      </div>
    </Link>
  )
}

function Tab({ label, count, active, onClick, accent }) {
  return (
    <button onClick={onClick} style={{
      display:'flex', alignItems:'center', gap:'0.45rem',
      fontFamily:'var(--sans)', fontSize:'0.7rem', letterSpacing:'0.1em', textTransform:'uppercase',
      fontWeight:600, color: active ? 'var(--cream)' : 'var(--muted)',
      background:'none', border:'none', cursor:'pointer',
      padding:'0.65rem 0.15rem', marginRight:'1.75rem',
      borderBottom: active ? '2px solid var(--gold)' : '2px solid transparent',
      transition:'color 0.15s, border-color 0.15s',
    }}>
      {label}
      {count > 0 && (
        <span style={{
          fontFamily:'var(--sans)', fontSize:'0.58rem', fontWeight:700,
          background: accent ? 'rgba(201,168,76,0.15)' : 'rgba(26,24,20,0.1)',
          color: accent ? 'var(--gold)' : 'var(--muted)',
          padding:'1px 6px', borderRadius:'2px',
        }}>{count}</span>
      )}
    </button>
  )
}

export default function NotificationsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [items,   setItems]   = useState([])
  const [userId,  setUserId]  = useState(null)
  const [activeTab, setActiveTab] = useState('new')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)

      setItems(data || [])
      setLoading(false)
    }
    load()
  }, [])

  // Mark a single notification read (optimistic + DB write). Navigation proceeds via the Link.
  async function handleOpen(notif) {
    if (notif.read) return
    setItems(prev => prev.map(n => n.id === notif.id ? { ...n, read: true, read_at: new Date().toISOString() } : n))
    await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', notif.id)
      .eq('user_id', userId)
  }

  async function markAllRead() {
    const unreadIds = items.filter(n => !n.read).map(n => n.id)
    if (unreadIds.length === 0) return
    setItems(prev => prev.map(n => ({ ...n, read: true })))
    await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .in('id', unreadIds)
      .eq('user_id', userId)
  }

  const newItems  = items.filter(n => !n.read)
  const readItems = items.filter(n => n.read)
  const newCount  = newItems.length

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh' }}>
      <Nav />

      <div style={{ maxWidth:'640px', margin:'0 auto', padding:'2.5rem 1.5rem', width:'100%', flex:1 }}>
        <div style={{ marginBottom:'2rem' }}>
          <div style={{ fontFamily:'var(--sans)', fontSize:'0.58rem', letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--gold)', opacity:0.75, marginBottom:'0.4rem' }}>Collective Loft</div>
          <div style={{ fontFamily:'var(--serif)', fontSize:'2rem', fontWeight:700, color:'var(--cream)', marginBottom:'0.3rem' }}>Message Center</div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem', flexWrap:'wrap' }}>
            <div style={{ fontFamily:'var(--sans)', fontSize:'0.75rem', color:'var(--muted)', fontWeight:300 }}>
              {loading ? 'Loading…' : newCount === 0 ? 'You\'re all caught up.' : `${newCount} new message${newCount > 1 ? 's' : ''} waiting for you`}
            </div>
            {!loading && newCount > 0 && (
              <button onClick={markAllRead} style={{ fontFamily:'var(--sans)', fontSize:'0.66rem', letterSpacing:'0.04em', color:'var(--muted)', background:'none', border:'0.5px solid rgba(26,24,20,0.15)', borderRadius:'3px', padding:'4px 10px', cursor:'pointer' }}>
                Mark all read
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:'3rem', color:'var(--muted)', fontFamily:'var(--sans)', fontSize:'0.78rem' }}>✦ Loading…</div>
        ) : items.length === 0 ? (
          <div style={{ textAlign:'center', padding:'4rem 2rem', background:'var(--bg1)', border:'0.5px solid rgba(26,24,20,0.06)', borderRadius:'6px' }}>
            <div style={{ fontSize:'2rem', marginBottom:'0.75rem', opacity:0.3 }}>✉</div>
            <div style={{ fontFamily:'var(--serif)', fontSize:'1.1rem', color:'var(--cream)', marginBottom:'0.4rem' }}>All caught up.</div>
            <div style={{ fontFamily:'var(--sans)', fontSize:'0.72rem', color:'var(--muted)', lineHeight:1.65 }}>No applications, terms, or rating prompts right now. When something needs your attention, it&apos;ll show up here.</div>
          </div>
        ) : (
          <>
            <div style={{ display:'flex', alignItems:'center', borderBottom:'0.5px solid rgba(26,24,20,0.12)', marginBottom:'1.25rem' }}>
              <Tab label="New" count={newItems.length} active={activeTab === 'new'} onClick={() => setActiveTab('new')} accent />
              <Tab label="Read" count={readItems.length} active={activeTab === 'read'} onClick={() => setActiveTab('read')} />
            </div>

            {activeTab === 'new' && (
              newItems.length > 0
                ? newItems.map(n => <NotifCard key={n.id} notif={n} onOpen={handleOpen} />)
                : <div style={{ textAlign:'center', padding:'3rem 2rem', color:'var(--muted)', fontFamily:'var(--sans)', fontSize:'0.74rem' }}>No new messages. You&apos;re all caught up.</div>
            )}

            {activeTab === 'read' && (
              readItems.length > 0
                ? readItems.map(n => <NotifCard key={n.id} notif={n} onOpen={handleOpen} />)
                : <div style={{ textAlign:'center', padding:'3rem 2rem', color:'var(--muted)', fontFamily:'var(--sans)', fontSize:'0.74rem' }}>No read messages yet.</div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  )
}
