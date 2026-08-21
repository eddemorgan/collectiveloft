// Student membership rules, shared by the signup page, the subscribe page,
// and the /api/student routes.
//
// The account email is the credential. A member whose sign-in address ends in
// .edu can request a six-digit code, sent to that address, and entering it
// grants a year of free access (student_until on profiles). Owning the inbox
// is the proof: the code never travels anywhere except to the .edu address
// itself. Re-verification is the same flow run again, which is what makes the
// annual expiry honest. A graduate who loses the inbox loses the tier.
//
// Coverage is every country that runs a RESTRICTED academic namespace, where
// the suffix itself carries the accreditation and a pattern match is therefore
// proof of an institution. That is the US (.edu), the UK (.ac.uk), and the
// roughly thirty other countries that reserve .ac.XX or .edu.XX.
//
// It deliberately does NOT cover France, Germany, Switzerland, the Netherlands
// and others, where universities sit on ordinary national domains: tum.de and
// uva.nl are indistinguishable from any business by pattern alone. Students
// there need a curated institution allowlist or document review, which is a
// later decision, not an oversight. Until then they are simply not offered the
// tier, rather than offered it and silently failed.
//
// Known ceiling, everywhere including the US: a domain proves affiliation, not
// current enrolment. Alumni and staff hold these addresses too. Annual
// re-verification by inbox is a soft check, chosen because it costs nothing at
// this size. Document or registry verification is the answer at scale.

export const STUDENT_MEMBERSHIP_DAYS = 365

// A code is useless to a shoulder-surfer twenty minutes after it lands.
export const CODE_TTL_MINUTES = 30

// Five wrong guesses burns the code. Six digits at five attempts is a
// 1-in-200,000 guessing game per code, and request rate limiting caps how
// often a new game starts.
export const CODE_MAX_ATTEMPTS = 5

// Restricted academic suffixes, by country. Add a country here only when its
// namespace is genuinely reserved for accredited institutions, because this
// list is the whole proof: anything on it grants a free year.
//
// Iran and North Korea run .ac namespaces and are deliberately absent. Morgan
// Collective Group is a US company and granting them memberships raises
// sanctions questions this list should not answer by accident.
export const ACADEMIC_SUFFIXES = [
  '.edu',      // United States
  '.ac.uk',    // United Kingdom
  '.edu.au',   // Australia
  '.ac.nz',    // New Zealand
  '.ac.jp',    // Japan
  '.ac.kr',    // South Korea
  '.edu.cn',   // China, teaching institutions
  '.ac.cn',    // China, research institutes
  '.edu.hk',   // Hong Kong
  '.edu.tw',   // Taiwan
  '.edu.sg',   // Singapore
  '.edu.my',   // Malaysia
  '.ac.th',    // Thailand
  '.ac.id',    // Indonesia
  '.ac.in',    // India
  '.edu.in',   // India
  '.ac.bd',    // Bangladesh
  '.ac.lk',    // Sri Lanka
  '.edu.pk',   // Pakistan
  '.edu.ph',   // Philippines
  '.ac.il',    // Israel
  '.ac.ae',    // United Arab Emirates
  '.ac.za',    // South Africa
  '.ac.ke',    // Kenya
  '.ac.tz',    // Tanzania
  '.ac.ug',    // Uganda
  '.ac.zm',    // Zambia
  '.ac.zw',    // Zimbabwe
  '.ac.bw',    // Botswana
  '.ac.rw',    // Rwanda
  '.ac.ma',    // Morocco
  '.ac.at',    // Austria
  '.ac.be',    // Belgium
  '.ac.cy',    // Cyprus
  '.ac.rs',    // Serbia
  '.ac.cr',    // Costa Rica
  '.ac.fj',    // Fiji
  '.ac.pg',    // Papua New Guinea
  '.edu.mx',   // Mexico
  '.edu.br',   // Brazil
]

// Returns the lowercased domain when the address sits under a restricted
// academic namespace, otherwise null. Requires a real institution label in
// front of the suffix, so a bare 'edu' or 'ac.uk' is rejected, while
// department subdomains like cs.stanford.edu are accepted.
export function academicDomain(email) {
  const parts = String(email || '').trim().toLowerCase().split('@')
  if (parts.length !== 2) return null
  const domain = parts[1]
  if (!domain) return null

  for (const suffix of ACADEMIC_SUFFIXES) {
    // endsWith alone would accept the suffix as the entire domain, which is a
    // registry, not a school.
    if (domain.endsWith(suffix) && domain.length > suffix.length) return domain
  }
  return null
}

// The original name, kept so existing call sites and any half-written branch
// keep working. Same function, wider reach.
export const eduDomain = academicDomain

// True while a profile's student membership is current.
export function studentActive(profile) {
  return !!(profile && profile.student_until && new Date(profile.student_until) > new Date())
}
