import { ImageResponse } from 'next/og'

// The link-preview card for every page that doesn't override it.
export const alt = 'Collective Loft — Where Creatives Find Each Other'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

async function loadCormorant() {
  try {
    const css = await fetch(
      'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600',
      { headers: { 'User-Agent': 'Mozilla/4.0' } }
    ).then(r => r.text())
    const url = css.match(/src: url\((.+?)\)/)?.[1]
    if (!url) return null
    return await fetch(url).then(r => r.arrayBuffer())
  } catch {
    return null
  }
}

export default async function Image() {
  const cormorant = await loadCormorant()
  const serif = cormorant ? 'Cormorant' : 'serif'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F0ECE3',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            background: '#C9A84C',
            transform: 'rotate(45deg)',
            marginBottom: 40,
            display: 'flex',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'baseline', fontFamily: serif, fontSize: 104, fontWeight: 600, lineHeight: 1 }}>
          <span style={{ color: '#1A1814' }}>Collective&nbsp;</span>
          <span style={{ color: '#8B6914' }}>Loft</span>
        </div>
        <div
          style={{
            marginTop: 26,
            fontSize: 22,
            letterSpacing: 12,
            color: '#7A7060',
            textTransform: 'uppercase',
            display: 'flex',
          }}
        >
          Where creatives find each other
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 54,
            fontFamily: serif,
            fontSize: 34,
            color: '#8B6914',
            display: 'flex',
          }}
        >
          Find collaborators, not bosses.
        </div>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: '#8B6914', display: 'flex' }} />
      </div>
    ),
    {
      ...size,
      fonts: cormorant
        ? [{ name: 'Cormorant', data: cormorant, weight: 600, style: 'normal' }]
        : undefined,
    }
  )
}
