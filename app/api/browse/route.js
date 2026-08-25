import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Great-circle distance between two lat/lng points, in miles.
function distanceMiles(lat1, lng1, lat2, lng2) {
  const toRad = d => (d * Math.PI) / 180
  const R = 3958.8
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// A public radius search could otherwise be shrunk step by step to pinpoint
// where a member lives. Coordinates are rounded to roughly 7 miles before any
// distance is measured, and the radius has a floor, so the honest answer is
// "someone works near this city" and never "someone lives at this address".
const COARSE = 0.1
const MIN_RADIUS_MILES = 10
const coarsen = n => Math.round(n / COARSE) * COARSE

// Public, anonymized preview of real creatives.
// Server-side only: selects ONLY safe fields, never name/email/photo.
// Location filtering happens here too, so coordinates never reach the client.
export async function GET(request) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, disciplines, skills, seeking_disciplines, seeking_skills, latitude, longitude')
      .is('deleted_at', null)

    if (error) {
      return Response.json({ creatives: [], matched: 0, total: 0, counts: {} }, { status: 200 })
    }

    // Keep only profiles that have at least a discipline — so cards aren't empty
    const usable = (data || []).filter(
      p => Array.isArray(p.disciplines) && p.disciplines.length > 0
    )
    const total = usable.length

    // Optional radius search around a chosen city.
    const params = new URL(request.url).searchParams
    const discipline = (params.get('discipline') || '').trim()
    const lat = parseFloat(params.get('lat'))
    const lng = parseFloat(params.get('lng'))
    const radius = parseFloat(params.get('radius'))
    const unit = params.get('unit') === 'km' ? 'km' : 'mi'

    let inRange = usable
    let located = null
    if (Number.isFinite(lat) && Number.isFinite(lng) && Number.isFinite(radius)) {
      const asMiles = unit === 'km' ? radius * 0.621371 : radius
      const limit = Math.max(asMiles, MIN_RADIUS_MILES)
      located = usable.filter(p => p.latitude != null && p.longitude != null).length
      inRange = usable.filter(p => {
        if (p.latitude == null || p.longitude == null) return false
        return distanceMiles(
          coarsen(lat), coarsen(lng),
          coarsen(p.latitude), coarsen(p.longitude)
        ) <= limit
      })
    }

    const matched = inRange.length

    // Per-discipline totals across everyone in range, not just the handful of
    // cards that get shown. A visitor's real question is not how many people
    // are here, it is whether their people are here, and a count of 18 shuffled
    // cards cannot answer that.
    const counts = {}
    for (const p of inRange) {
      for (const d of p.disciplines || []) {
        if (d) counts[d] = (counts[d] || 0) + 1
      }
    }

    // Filtering happens here rather than in the browser for the same reason:
    // the browser only ever receives 18 cards, so filtering them client side
    // would show two Musicians out of a platform that has forty.
    const filtered = discipline
      ? inRange.filter(p => (p.disciplines || []).includes(discipline))
      : inRange

    const shown = [...filtered]

    // Shuffle
    for (let i = shown.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shown[i], shown[j]] = [shown[j], shown[i]]
    }

    // Take 18, and strip to ONLY the safe, capped fields.
    // No name, no email, no location, no coordinates, no photo.
    const creatives = shown.slice(0, 18).map((p, idx) => ({
      key: idx, // positional key only — not the real id
      discipline: discipline && (p.disciplines || []).includes(discipline)
        ? discipline
        : (p.disciplines && p.disciplines[0]) || 'Creative',
      skills: Array.isArray(p.skills) ? p.skills.slice(0, 3) : [],
      seekingDiscipline:
        Array.isArray(p.seeking_disciplines) && p.seeking_disciplines.length > 0
          ? p.seeking_disciplines[0]
          : null,
      seekingSkills: Array.isArray(p.seeking_skills)
        ? p.seeking_skills.slice(0, 3)
        : [],
    }))

    return Response.json({ creatives, matched, total, located, counts, showing: filtered.length }, { status: 200 })
  } catch (err) {
    return Response.json({ creatives: [], matched: 0, total: 0, counts: {} }, { status: 200 })
  }
}
