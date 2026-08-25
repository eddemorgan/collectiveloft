-- Profiles were readable by the entire internet.
--
-- The policy "Public profiles are viewable by everyone" was SELECT USING (true)
-- granted to PUBLIC, and anon held column privileges on every column. Since the
-- publishable key ships in the client bundle by design, that made a single
-- anonymous REST call enough to dump every member's email address, exact
-- latitude and longitude, subscription status, comp date, and Paddle and Stripe
-- billing ids.
--
-- /api/browse takes such care to strip ids and coarsen coordinates precisely so
-- a public visitor cannot locate a member. The table policy handed all of it
-- back.
--
-- Nothing anonymous actually reads this table: /api/browse runs on the service
-- role, and every client query happens after a session exists (the landing page
-- returns early when logged out). So the fix costs nothing.
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;

create policy "Signed-in members can view profiles"
  on public.profiles
  for select
  to authenticated
  using (true);

revoke select on public.profiles from anon;

-- STILL OPEN, deliberately not fixed here. A signed-in member can read every
-- other member's email, coordinates and billing ids, because RLS is row level
-- and cannot withhold a column. Withholding them needs the table grant dropped
-- and the allowed columns granted back by name, and that breaks the six client
-- files that call select('*') on profiles: discover, studio/[id], terms,
-- my-studios, profile/[username]. Verified by doing it and watching select('*')
-- fail with "permission denied for table profiles". Those six have to name
-- their columns first, or the reads have to move behind a view.
