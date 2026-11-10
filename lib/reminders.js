// Advance notice before a membership changes under someone.
//
// Three clocks run out on members: a founding (or other) comp, a student year,
// and a Paddle free trial. Terms 3.7 promises an email before a trial ends, and
// nobody should discover on the day that they can no longer post a brief. A
// daily job (app/api/cron/reminders) asks this file who is due a notice.
//
// Each kind has stages, counted in days before the end. A run sends at most one
// notice per member: the most urgent stage that has come due and has not been
// sent. A member the job first sees four days out gets the 7-day notice late
// rather than never; one first seen at half a day gets only the 1-day notice,
// not a backlog of stale ones.

export const STAGES = {
  founding: [7, 1],
  student: [30, 20, 10, 5, 1],
  trial: [2],
}

const DAY = 24 * 60 * 60 * 1000

// The stage due now, or null. `sent` is the set of stage_days already sent
// for this member, kind, and end date.
export function dueStage(kind, endsAt, sent = new Set(), now = Date.now()) {
  const daysLeft = (new Date(endsAt).getTime() - now) / DAY
  if (!(daysLeft > 0)) return null
  const candidates = STAGES[kind].filter(d => d >= daysLeft)
  if (candidates.length === 0) return null
  const stage = Math.min(...candidates)
  return sent.has(stage) ? null : stage
}

// Which clock, if any, a member should hear about. Only one at a time, and only
// when its ending actually changes what they can do: a comp ending under a paid
// subscription or a longer student year changes nothing, so it gets no email.
export function remindersFor(profile) {
  const out = []
  const paid = ['active', 'trialing', 'cancelled'].includes(profile.subscription_status)
  const t = v => (v ? new Date(v).getTime() : 0)

  if (profile.subscription_status === 'trialing' && profile.trial_ends_at) {
    out.push({ kind: 'trial', endsAt: profile.trial_ends_at })
  }
  if (profile.comped_until && t(profile.comped_until) > Date.now() && !paid
      && t(profile.student_until) <= t(profile.comped_until)) {
    out.push({ kind: 'founding', endsAt: profile.comped_until })
  }
  if (profile.student_until && t(profile.student_until) > Date.now() && !paid
      && t(profile.comped_until) <= t(profile.student_until)) {
    out.push({ kind: 'student', endsAt: profile.student_until })
  }
  return out
}

// Matches the profile URL the site builds in app/hooks/useIsMember.js.
export function profilePath(profile) {
  if (!profile?.firstname) return '/onboarding'
  const slug = `${profile.firstname.toLowerCase()}-${(profile.lastname || '').toLowerCase()}`
  return `/profile/${encodeURIComponent(slug)}`
}

export function longDate(d) {
  return new Date(d).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/Chicago',
  })
}
