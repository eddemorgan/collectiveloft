// Human labels for the values stored on a profile.
//
// Onboarding writes machine values (`remote_preferred`), and anything that
// displays them has to translate. The profile sidebar printed the raw value
// for a while, so members read "no_preference" on their own page. Import from
// here rather than retyping the strings, so the form and the display cannot
// drift apart.

export const LOCATION_PREFERENCES = [
  { value: 'local',            label: 'Local only' },
  { value: 'remote_ok',        label: 'Remote OK' },
  { value: 'remote_preferred', label: 'Remote preferred' },
  { value: 'no_preference',    label: 'No preference' },
]

export const AVAILABILITY = [
  { value: 'open',            label: 'Open to collabs now' },
  { value: 'available_soon',  label: 'Available in 1–2 months' },
  { value: 'not_available',   label: 'Not available right now' },
]

function labelFor(list, value) {
  if (!value) return null
  const hit = list.find(o => o.value === value)
  // Fall back to the raw value made readable, so an older or unexpected value
  // still reads like language instead of a database field.
  return hit ? hit.label : String(value).replace(/_/g, ' ')
}

export const locationLabel = v => labelFor(LOCATION_PREFERENCES, v)
export const availabilityLabel = v => labelFor(AVAILABILITY, v)
