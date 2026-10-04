'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import { LEGAL_VERSION, EFFECTIVE_DATE, TERMS_URL, PRIVACY_URL, MARKETING_CONSENT_TEXT } from '../../lib/legal'

// Shown once to each existing member after a new Terms version takes effect,
// until they accept it. This screen is also where existing members are asked
// about updates, with the same unticked checkbox new members see at signup.
// Deliberately NOT asked by email: in the UK, an email asking for marketing
// consent is itself marketing, and the regulator has fined companies for it.
export default function ReAccept({ profile, onDone }) {
  const [agree, setAgree] = useState(false)
  const [updates, setUpdates] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const askMarketing = !profile?.marketing_opt_in

  async function submit() {
    if (!agree) return
    setSaving(true)
    setError('')
    const now = new Date().toISOString()
    const patch = {
      terms_version: LEGAL_VERSION,
      terms_accepted_at: now,
      privacy_version: LEGAL_VERSION,
      privacy_accepted_at: now,
      ...(askMarketing && updates ? {
        marketing_opt_in: true,
        marketing_consent_at: now,
        marketing_consent_text: MARKETING_CONSENT_TEXT,
      } : {}),
    }
    const { error: err } = await supabase.from('profiles').update(patch).eq('id', profile.id)
    if (err) {
      setError('Could not save. Please try again.')
      setSaving(false)
      return
    }
    onDone(patch)
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg0, #F0ECE3)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1.5rem' }}>
      <div style={{ maxWidth:'34rem', background:'var(--bg1, #E8E3D9)', border:'0.5px solid rgba(139,105,20,0.25)', borderRadius:'4px', padding:'2rem 2.2rem' }}>
        <div style={{ color:'#8B6914', fontSize:'0.68rem', letterSpacing:'0.22em', textTransform:'uppercase', marginBottom:'0.9rem' }}>Updated terms</div>
        <h1 style={{ fontFamily:'var(--serif)', fontWeight:600, fontSize:'1.7rem', margin:'0 0 0.8rem', color:'var(--cream, #1A1814)' }}>We updated the fine print.</h1>
        <p style={{ fontSize:'0.9rem', lineHeight:1.7, color:'rgba(26,24,20,0.7)', margin:'0 0 1rem' }}>
          Our <Link href={TERMS_URL} target="_blank" style={{ color:'#8B6914' }}>Terms &amp; Conditions</Link> and{' '}
          <Link href={PRIVACY_URL} target="_blank" style={{ color:'#8B6914' }}>Privacy Policy</Link> changed on {EFFECTIVE_DATE}.
          You were emailed about this in advance. The short version: stronger protections in writing, including a release
          framework for member disputes, a liability cap, and an arbitration opt-out you can exercise within 30 days.
          Nothing about your membership or billing changes.
        </p>
        <label style={{ display:'flex', alignItems:'flex-start', gap:'0.6rem', margin:'0 0 0.7rem', cursor:'pointer', fontSize:'0.85rem', color:'var(--cream, #1A1814)', lineHeight:1.5 }}>
          <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} style={{ marginTop:'3px', accentColor:'#8B6914' }} />
          <span>I agree to the updated Terms &amp; Conditions and Privacy Policy.</span>
        </label>
        {askMarketing && (
          <label style={{ display:'flex', alignItems:'flex-start', gap:'0.6rem', margin:'0 0 1.1rem', cursor:'pointer', fontSize:'0.8rem', color:'rgba(26,24,20,0.6)', lineHeight:1.5 }}>
            <input type="checkbox" checked={updates} onChange={e => setUpdates(e.target.checked)} style={{ marginTop:'2px', accentColor:'#8B6914' }} />
            <span>{MARKETING_CONSENT_TEXT} <span style={{ opacity:0.7 }}>(optional)</span></span>
          </label>
        )}
        {error && <div style={{ color:'#A04732', fontSize:'0.8rem', marginBottom:'0.7rem' }}>{error}</div>}
        <button
          onClick={submit}
          disabled={!agree || saving}
          style={{ background: agree ? '#8B6914' : 'rgba(139,105,20,0.35)', color:'#F0ECE3', border:'none', padding:'0.8rem 1.6rem', borderRadius:'3px', fontSize:'0.8rem', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', cursor: agree ? 'pointer' : 'default' }}
        >
          {saving ? 'Saving…' : 'Continue to Collective Loft'}
        </button>
      </div>
    </div>
  )
}
