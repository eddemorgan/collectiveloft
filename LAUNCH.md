# Collective Loft — Launch Day Runbook

The production move: dev → main, then open the doors. Execute in order. Each step
has a check. Do not move on until the check passes.

Written July 30, 2026. Everything below is built, tested, and on `dev`.

---

## State going in

- **dev** (`origin/dev`) holds the full platform: the new taxonomy, the email
  layer, legal pages, the member guide, and the founding admission flow. ~324
  commits ahead of main.
- **main** (`origin/main`) is the founding landing page with the "the loft opens
  August 1" announcement, plus the blog.
- **Database is wiped clean**: 0 profiles, 0 accounts. The 50 founding members
  are loaded into `founding_invites` (allowlist), 0 redeemed.
- **Backup** of the pre-wipe test data: `~/Documents/collectiveloft_db_backup_2026-07-20.json`.
- **No founding email has been sent.** The send is manual and gated (step 5).

Local dev needs: `eval "$(/opt/homebrew/bin/brew shellenv zsh)"` first (brew PATH),
repo at `~/Documents/collectiveloft`. If the repo or .env.local is missing, re-clone
(`gh` is authed) — `.env.local` will have STUB keys after a re-clone; that is fine
for the merge/build, but the founding send (step 5) needs REAL keys.

---

## Step 1 — Merge dev → main (the risky step)

Do it on a branch, build locally, preview on Vercel, THEN merge to main. Never edit
main directly. Only new commits deploy; never use Vercel "Redeploy" to fix red.

```bash
git fetch origin
git checkout -b merge-golive origin/main
git merge origin/dev --no-commit --no-ff
```

**Five files conflict. Resolve them:**

| File | Resolution |
|---|---|
| `app/globals.css` | Take **dev** (the light cream brand). Fixes the FAQ colors. |
| `app/page.js` | Take **dev** (the platform landing "Your people are here"). This replaces the founding page — correct, its job is done. |
| `app/landing.module.css` | Take **dev**. |
| `public/demo.html` | Inspect; almost certainly delete. |
| `app/layout.js` | **HAND-MERGE. Do not take either side whole.** |

**`layout.js` is a two-way trap.** `main`'s version has all the SEO (metadataBase,
OpenGraph, JSON-LD org schema, favicon, font preconnect) and **no** SubscriptionGuard.
`dev`'s version has the SubscriptionGuard and **no** SEO. Taking dev loses all SEO;
taking main ships with no auth guard on private pages. Merge by hand so the result
has **both**: dev's SubscriptionGuard wrapping `{children}` AND main's metadata +
JSON-LD + favicon + fonts.

**The blog survives automatically** — all posts, blog pages, sitemap, and FAQ merge
clean; they are dev-has-no-opinion files. The founding admission flow (redeem route,
guard, emails, send script) also merges clean; those are dev-only files.

```bash
git commit                      # complete the merge
npm run build                   # MUST be green before pushing
```

**Check:** local build green. Then push the branch for a Vercel preview:

```bash
git push -u origin merge-golive
```

Wait for the preview deploy, open its URL, and verify on the preview BEFORE main:
- Landing, browse, how-it-works, about, morgan-collective, help, signup, subscribe render.
- A blog post (e.g. `/blog/why-creative-collaborations-fail`) is readable **logged out**
  (the PUBLIC_PATHS prefix fix handles this — confirm it, this was a real bug).
- `/legal/terms`, `/legal/privacy`, `/guide` load logged out.

**Only when the preview is clean**, merge to production:

```bash
git checkout main
git merge --ff-only merge-golive     # confirm it is a clean fast-forward first
git push origin main
```

**Gate:** collectiveloft.com serves the full platform (not the old founding page),
every surface renders on phone and laptop, the blog resolves and reads logged out.

---

## Step 2 — Flip the environment to production

In Vercel → collectiveloft project → Settings → Environment Variables (Production):

- `NEXT_PUBLIC_APP_URL` → `https://collectiveloft.com`  **(required — email links use this)**
- Stripe live keys, live webhook, live price ID — **optional for founding launch**
  (founding members are comped 90 days, no card). Needed before day 90 and for
  non-founding $15 conversions. If flipping Stripe live, also confirm the success
  route still redirects to `/onboarding?onboarding=true`.

Redeploy production so the new env takes effect (a fresh commit or Vercel redeploy
of the LATEST main).

**Gate:** no env var points at test or localhost. `NEXT_PUBLIC_APP_URL` is
collectiveloft.com.

---

## Step 3 — Verify production with a real signup

Sign up on collectiveloft.com with a throwaway (non-allowlisted) email:
- Goes through signup → subscribe (7-day trial) → onboarding → profile.
- The welcome email arrives.

Then confirm the founding path is ready (do NOT create a founding account yet — that
happens when they click their real email): the `founding_invites` table has 50 rows,
0 redeemed.

**Gate:** a normal signup completes end to end and lands on onboarding.

---

## Step 4 — Clear the orphaned storage files

Supabase dashboard → Storage → each bucket (avatars, covers, portfolio-images,
portfolio-video, portfolio-audio, portfolio-docs, studio-files) → select all → delete.
40 leftover test files the SQL wipe could not touch. Not blocking, but do it for a
true clean slate.

---

## Step 5 — Open the doors: send the founding emails

**This is the only step that sends email. Everything before it sent nothing.**

Run it with REAL keys in the environment (from Vercel, or set for this run). It is
DRY-RUN by default; `--send` actually sends and it refuses with placeholder keys.

```bash
# dry run first — prints all 50 recipients, writes scripts/founding-sample.html, sends nothing
NEXT_PUBLIC_APP_URL=https://collectiveloft.com \
SUPABASE_SERVICE_ROLE_KEY='<real service key>' \
RESEND_API_KEY='<real resend key>' \
node scripts/send-founding-invites.mjs

# review the sample and the recipient list, THEN send for real
NEXT_PUBLIC_APP_URL=https://collectiveloft.com \
SUPABASE_SERVICE_ROLE_KEY='<real service key>' \
RESEND_API_KEY='<real resend key>' \
node scripts/send-founding-invites.mjs --send
```

Each founding member gets "Your founding spot is ready" with a `/signup?email=...`
link. They sign up (email pre-filled) → recognized as founding → badge + 90 days free
→ onboarding → Discover fills with real founding members as they arrive.

**Gate:** the sender reports 50 sent, 0 failed. Watch the first few claim their spots.

---

## After launch, tracked not blocking

- **Day-90 conversion:** build the "your founding period is ending, add a card" email
  + add-card flow before the first comps expire (comped_until dates make the trigger exact).
- **Stripe live** if not done at step 2.
- **hello@collectiveloft.com** — verify the mailbox in Google Workspace (legal notices,
  DMACA, data-rights requests route there; it currently may not receive).
- **Centralize the taxonomy** — it is duplicated across 8 files (drift-prone).
- **Leaked-password protection**, storage-bucket listing, DMARC, committed lockfile —
  the open security items.

---

## If something goes wrong

- Backup of pre-wipe data: `~/Documents/collectiveloft_db_backup_2026-07-20.json`.
- Never "Redeploy" a red Vercel build to fix it — commit anew. Only the top row is live.
- Supabase publishable (public) key for testing without the app:
  `sb_publishable_iECwbgj9g8ZbtERNjSQYVA_rxRrfFWK`.
