-- Two open defects from the launch review, fixed together because both are
-- cases where a write that matters silently did not happen.
--
-- 1. Membership payments were invisible. /api/paddle/webhook subscribed to
--    subscription.* only, so an actual charge left no trace anywhere in this
--    database. Nothing confirmed a member had been billed, no failed payment
--    surfaced, and revenue could only be read off Paddle's dashboard. This
--    table is the ledger the webhook now writes to.
--
-- 2. collabs_count only ever incremented for the member who clicked Confirm
--    Complete. The browser wrote both profiles, but RLS allows a member to
--    update only their own row, so the other party's increment failed with an
--    error nobody checked. Reputation counting is the platform's core promise,
--    so it moves to a server route holding the service role, and the increment
--    itself becomes one atomic statement rather than read-then-write.

-- One row per Paddle membership transaction. Separate from public.payments,
-- which is the Stripe Connect ledger for member to member collab money. These
-- two never mix: this is revenue, that is passthrough.
create table if not exists public.membership_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  paddle_transaction_id text not null unique,
  paddle_subscription_id text,
  paddle_customer_id text,
  status text not null,
  amount numeric,
  tax numeric,
  currency text,
  occurred_at timestamptz,
  raw jsonb,
  created_at timestamptz not null default now()
);

comment on table public.membership_payments is
  'Paddle membership billing ledger, written only by /api/paddle/webhook. paddle_transaction_id is unique so Paddle''s retries upsert instead of duplicating.';
comment on column public.membership_payments.user_id is
  'Nullable and ON DELETE SET NULL on purpose: a closed account must not erase the record that money moved.';
comment on column public.membership_payments.amount is
  'Major units (dollars), converted from the minor units Paddle sends as strings.';

create index if not exists membership_payments_user_idx
  on public.membership_payments (user_id, occurred_at desc);
create index if not exists membership_payments_occurred_idx
  on public.membership_payments (occurred_at desc);

alter table public.membership_payments enable row level security;

-- Supabase grants the client roles full table privileges on anything new in
-- public. RLS would refuse a client write anyway, since no insert, update or
-- delete policy exists for anyone, but that grant should not be the only thing
-- standing between a session token and the revenue ledger.
revoke insert, update, delete on public.membership_payments from anon;
revoke insert, update, delete on public.membership_payments from authenticated;

-- A member may read their own billing history and nothing else. Writes are the
-- service role's alone, which in practice means the Paddle webhook.
drop policy if exists "Members read their own payments" on public.membership_payments;
create policy "Members read their own payments"
  on public.membership_payments
  for select
  using (auth.uid() = user_id);

-- Increments both sides of a completed collaboration in one statement, so the
-- two rows cannot drift and no read-modify-write can lose a concurrent update.
-- SECURITY DEFINER because it deliberately writes rows the caller does not
-- own, which is the whole point; execute is therefore revoked from clients and
-- granted only to the service role, meaning only a server route can call it.
create or replace function public.increment_collab_counts(
  p_ids uuid[],
  p_first_time boolean
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles
     set collabs_count     = coalesce(collabs_count, 0) + 1,
         connections_count = coalesce(connections_count, 0)
                             + case when p_first_time then 1 else 0 end
   where id = any(p_ids);
$$;

revoke all on function public.increment_collab_counts(uuid[], boolean) from public;
revoke all on function public.increment_collab_counts(uuid[], boolean) from anon;
revoke all on function public.increment_collab_counts(uuid[], boolean) from authenticated;
grant execute on function public.increment_collab_counts(uuid[], boolean) to service_role;

-- Housekeeping on the trigger function from the August 21 migration. It is
-- SECURITY DEFINER and every client role could call it over /rest/v1/rpc,
-- which the database linter flags. Postgres checks EXECUTE on a trigger
-- function when the trigger is created, not each time it fires, so revoking
-- now closes the RPC surface and leaves the guard itself working. Verified in
-- a rolled-back transaction: after the revoke an ordinary column write from an
-- authenticated session still succeeds and a comped_until write is still
-- refused with "This field is managed by the platform."
-- Revoke from PUBLIC first. anon and authenticated hold this privilege through
-- the default PUBLIC grant, not a grant of their own, so naming only those two
-- roles leaves the privilege exactly where it was.
revoke all on function public.protect_privileged_profile_columns() from public;
revoke all on function public.protect_privileged_profile_columns() from anon;
revoke all on function public.protect_privileged_profile_columns() from authenticated;
