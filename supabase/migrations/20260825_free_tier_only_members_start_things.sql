-- The free tier.
--
-- Until now the platform had two states: paying, or locked out. That charged
-- admission to the supply the platform exists to make findable. A musician who
-- cannot finish work cannot earn a rating, and the record of finished work is
-- the thing this whole product produces.
--
-- So membership stops deciding whether you can be here and starts deciding
-- what you can START. Free members are found, receive terms, agree them, run
-- the Loft Studio, get paid, and build a reputation. Posting a brief and
-- reaching out first are the paid actions.
--
-- It keeps the filter and sharpens it: people who exploit creatives do it by
-- contacting a great many at once, and that is now exactly the side that costs
-- money.
--
-- The browser gates these buttons too, but the browser is a courtesy. A member
-- holding a session token can insert straight into either table, so the gate
-- lives here.

create or replace function public.is_paid_member(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = p_id
      and (
        subscription_status in ('active', 'trialing', 'cancelled')
        or comped_until  > now()
        or student_until > now()
      )
  );
$$;

comment on function public.is_paid_member(uuid) is
  'True when the member may start things: post a brief or reach out first. Subscribed, comped, or a verified student. Free members do everything else.';

-- Mirrored in lib/membership.js canInitiate(). If one changes the other is a
-- lie, and the browser one is the one that will look right while being wrong.
--
-- 'cancelled' counts: the processor marks a subscription cancelled the moment
-- renewal is switched off, but the member has paid through the period.
-- Students count: Terms 3.6 grants them full access, and a student filmmaker
-- hiring a composer is the funnel working.
grant execute on function public.is_paid_member(uuid) to authenticated, service_role;

drop policy if exists "Users can insert their own briefs" on public.briefs;
create policy "Members can post briefs"
  on public.briefs
  for insert
  to authenticated
  with check (auth.uid() = poster_id and public.is_paid_member(auth.uid()));

-- Reaching out IS this insert: the terms builder writes the collab_terms row
-- that opens a Loft Studio. The partner only ever UPDATEs that row, so a free
-- member answering is untouched by this.
drop policy if exists "Users can insert" on public.collab_terms;
create policy "Members can start collaborations"
  on public.collab_terms
  for insert
  to authenticated
  with check (auth.uid() = initiator_id and public.is_paid_member(auth.uid()));

-- Verified against real rows in a rolled-back transaction: a paid member posts
-- a brief and starts a collaboration; a lapsed member is refused both; and the
-- lapsed member can still agree the terms they were sent and apply to briefs.
