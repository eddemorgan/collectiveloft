-- Student membership + privileged column protection.
--
-- Two jobs in one migration because the second exists to make the first safe.
--
-- 1. Student fields on profiles. A verified .edu member gets student_until a
--    year out, re-verified annually through /api/student/request + confirm.
--    SubscriptionGuard treats an unexpired student_until like an active
--    subscription.
--
-- 2. A trigger locking the membership and billing columns against client
--    writes. The existing RLS policy ("Users can update their own profile")
--    covers every column, so before this trigger any member could set their
--    own comped_until or founding_member from the browser console with their
--    session token. That hole predates the student tier; student_until would
--    have widened it into free membership for anyone who can read a network
--    tab. Server routes use the service role and are unaffected.

alter table public.profiles
  add column if not exists student_until timestamptz,
  add column if not exists student_domain text,
  add column if not exists student_verified_at timestamptz;

comment on column public.profiles.student_until is
  'If in the future, grants free student access with no subscription. Granted only by /api/student/confirm after a code sent to the member''s .edu address is entered. Re-verified annually.';
comment on column public.profiles.student_domain is
  'The .edu domain the member verified, e.g. oberlin.edu. Set by /api/student/confirm.';
comment on column public.profiles.student_verified_at is
  'Most recent successful .edu verification. Set by /api/student/confirm.';

-- One row per outstanding verification code. Service-role only: RLS is on and
-- no policies exist, so anon and authenticated cannot read or write codes.
create table if not exists public.student_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.student_verifications enable row level security;

create index if not exists student_verifications_user_created_idx
  on public.student_verifications (user_id, created_at desc);

-- Membership, billing, and student columns change only through server routes
-- (service role) or the SQL editor (postgres). auth.role() is 'authenticated'
-- for browser clients, 'service_role' for the service key, and null for direct
-- database connections, so raising only on 'authenticated' blocks exactly the
-- client path and nothing else.
create or replace function public.protect_privileged_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'authenticated' then
    if new.subscription_status         is distinct from old.subscription_status
    or new.comped_until                is distinct from old.comped_until
    or new.founding_member             is distinct from old.founding_member
    or new.student_until               is distinct from old.student_until
    or new.student_domain              is distinct from old.student_domain
    or new.student_verified_at         is distinct from old.student_verified_at
    or new.connect_onboarded           is distinct from old.connect_onboarded
    or new.stripe_customer_id          is distinct from old.stripe_customer_id
    or new.stripe_connect_id           is distinct from old.stripe_connect_id
    or new.paddle_customer_id          is distinct from old.paddle_customer_id
    or new.paddle_subscription_id      is distinct from old.paddle_subscription_id
    or new.lemonsqueezy_customer_id    is distinct from old.lemonsqueezy_customer_id
    or new.lemonsqueezy_subscription_id is distinct from old.lemonsqueezy_subscription_id
    then
      raise exception 'This field is managed by the platform.'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_privileged_profiles on public.profiles;
create trigger protect_privileged_profiles
  before update on public.profiles
  for each row
  execute function public.protect_privileged_profile_columns();
