// The Terms and the Privacy Policy, rendered from the lawyer-approved files.
//
// The text lives in content/legal/terms.md and content/legal/privacy.md, which
// are the exact files counsel approved, copied in byte for byte. This component
// renders them and holds no legal wording of its own. To change a word of
// either document, change the approved file, never this one: anything typed
// here would be text the lawyer never saw.
//
// Rendered by the onboarding consent modal and by the public pages at
// /legal/terms and /legal/privacy, so a member can read what they agreed to
// at any time, not only during signup.
//
// The pages print each document's title and opening line in their own hero,
// so the renderer skips the file's "# Title" and the paragraph after it. The
// rest of the opening, before the first numbered section, goes in the gold
// intro panel.

import termsMd from '../../content/legal/terms.md'
import privacyMd from '../../content/legal/privacy.md'

const s = {
  p: { fontSize:'0.78rem', color:'var(--cream)', lineHeight:1.75, fontWeight:300, marginBottom:'0.75rem' },
  h: { fontFamily:'var(--serif)', fontSize:'1.05rem', fontWeight:700, color:'var(--cream)', marginBottom:'0.5rem', marginTop:'1.5rem', paddingTop:'1rem', borderTop:'0.5px solid var(--rule)' },
  sub: { fontSize:'0.72rem', fontWeight:600, color:'var(--gold)', marginBottom:'0.35rem', marginTop:'1rem', letterSpacing:'0.02em' },
  li: { fontSize:'0.76rem', color:'var(--muted)', lineHeight:1.65, paddingLeft:'1rem', position:'relative', marginBottom:'0.25rem' },
  caps: { fontSize:'0.74rem', color:'var(--cream)', lineHeight:1.7, fontWeight:500, marginBottom:'0.75rem' },
  meta: { fontSize:'0.68rem', color:'var(--muted)', lineHeight:1.7, margin:'0.25rem 0 0' },
  table: { width:'100%', borderCollapse:'collapse', fontSize:'0.72rem', lineHeight:1.55, margin:'0.25rem 0 0.9rem' },
  th: { textAlign:'left', fontWeight:600, color:'var(--gold)', padding:'0.4rem 0.6rem 0.4rem 0', borderBottom:'0.5px solid var(--rule)', verticalAlign:'bottom' },
  td: { color:'var(--muted)', padding:'0.4rem 0.6rem 0.4rem 0', borderBottom:'0.5px solid var(--rule)', verticalAlign:'top' },
  intro: { background:'rgba(201,168,76,0.06)', border:'0.5px solid rgba(201,168,76,0.15)', borderRadius:'4px', padding:'1rem', marginBottom:'1.5rem' },
}

// **bold** is the only inline markup the approved files use.
function inline(text, key) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={`${key}-${i}`} style={{ fontWeight:600 }}>{part.slice(2, -2)}</strong>
      : part
  )
}

// A paragraph keeps its own line breaks (the contact blocks rely on them).
function lines(text, key) {
  const rows = text.split('\n')
  return rows.flatMap((row, i) => i === 0 ? inline(row, `${key}-${i}`) : [<br key={`${key}-br-${i}`} />, ...inline(row, `${key}-${i}`)])
}

// Legal shouting: a paragraph whose letters are almost all capitals, as in the
// warranty and liability sections, gets the heavier caps style.
function isCaps(text) {
  const letters = text.replace(/[^A-Za-z]/g, '')
  if (letters.length < 40) return false
  const upper = letters.replace(/[^A-Z]/g, '').length
  return upper / letters.length > 0.8
}

function cells(row) {
  return row.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim())
}

function renderBlocks(blocks, keyBase) {
  return blocks.map((block, i) => {
    const key = `${keyBase}-${i}`
    const first = block.split('\n')[0]

    if (first.startsWith('### ')) {
      return <div key={key} style={s.sub}>{inline(first.slice(4), key)}</div>
    }

    if (first.startsWith('## ')) {
      const heading = first.slice(3)
      const m = heading.match(/^(\d+)\.\s+(.*)$/)
      return (
        <div key={key} style={s.h}>
          {m ? <><span style={{ color:'var(--gold)', marginRight:'0.5rem' }}>{m[1]}.</span>{inline(m[2], key)}</> : inline(heading, key)}
        </div>
      )
    }

    if (first.startsWith('- ')) {
      const items = block.split('\n').filter(l => l.startsWith('- ')).map(l => l.slice(2))
      return (
        <ul key={key} style={{ listStyle:'none', padding:0, margin:'0 0 0.75rem 0' }}>
          {items.map((item, j) => (
            <li key={`${key}-${j}`} style={s.li}>
              <span style={{ position:'absolute', left:0, color:'var(--gold)', fontSize:'0.55rem', top:'0.2rem' }}>○</span>
              {inline(item, `${key}-${j}`)}
            </li>
          ))}
        </ul>
      )
    }

    if (first.startsWith('|')) {
      const rows = block.split('\n').filter(l => l.startsWith('|'))
      const head = cells(rows[0])
      const body = rows.slice(2).map(cells)
      return (
        <div key={key} style={{ overflowX:'auto' }}>
          <table style={s.table}>
            <thead><tr>{head.map((h, j) => <th key={j} style={s.th}>{inline(h, `${key}-h${j}`)}</th>)}</tr></thead>
            <tbody>{body.map((r, j) => (
              <tr key={j}>{r.map((c, k) => <td key={k} style={k === 0 ? { ...s.td, color:'var(--cream)' } : s.td}>{inline(c, `${key}-${j}-${k}`)}</td>)}</tr>
            ))}</tbody>
          </table>
        </div>
      )
    }

    if (block.startsWith('Effective Date:')) {
      return <p key={key} style={s.meta}>{inline(block, key)}</p>
    }

    return <p key={key} style={isCaps(block) ? s.caps : s.p}>{lines(block, key)}</p>
  })
}

function LegalDocument({ markdown }) {
  const blocks = markdown.replace(/\r\n/g, '\n').trim().split(/\n{2,}/)
  // Drop "# Title" and the opening line after it; the page hero prints both.
  const body = blocks[0].startsWith('# ') ? blocks.slice(2) : blocks
  const firstSection = body.findIndex(b => b.startsWith('## '))
  const intro = firstSection === -1 ? [] : body.slice(0, firstSection)
  const rest = firstSection === -1 ? body : body.slice(firstSection)
  return (
    <div style={{ fontFamily:'var(--sans)' }}>
      {intro.length > 0 && <div style={s.intro}>{renderBlocks(intro, 'intro')}</div>}
      {renderBlocks(rest, 'doc')}
    </div>
  )
}

export const TermsDoc = () => <LegalDocument markdown={termsMd} />
export const PrivacyDoc = () => <LegalDocument markdown={privacyMd} />
