import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Public, anonymized preview of real creatives.
// Server-side only: selects ONLY safe fields, never name/email/location/photo.
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, disciplines, skills, seeking_disciplines, seeking_skills')

    if (error) {
      return Response.json({ creatives: [] }, { status: 200 })
    }

    // Keep only profiles that have at least a discipline — so cards aren't empty
    const usable = (data || []).filter(
      p => Array.isArray(p.disciplines) && p.disciplines.length > 0
    )

    // Shuffle
    for (let i = usable.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[usable[i], usable[j]] = [usable[j], usable[i]]
    }

    // Take 20, and strip to ONLY the safe, capped fields.
    // No name, no email, no location, no photo — anonymization happens here, server-side.
    const creatives = usable.slice(0, 20).map((p, idx) => ({
      key: idx, // positional key only — not the real id
      discipline: (p.disciplines && p.disciplines[0]) || 'Creative',
      skills: Array.isArray(p.skills) ? p.skills.slice(0, 3) : [],
      seekingDiscipline:
        Array.isArray(p.seeking_disciplines) && p.seeking_disciplines.length > 0
          ? p.seeking_disciplines[0]
          : null,
      seekingSkills: Array.isArray(p.seeking_skills)
        ? p.seeking_skills.slice(0, 3)
        : [],
    }))

    return Response.json({ creatives }, { status: 200 })
  } catch (err) {
    return Response.json({ creatives: [] }, { status: 200 })
  }
}
