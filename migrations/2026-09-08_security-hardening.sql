-- ============================================================================
-- SECURITY HARDENING — run once in the Supabase SQL editor. Safe to re-run.
-- ============================================================================
-- Fixes, in order of severity:
--   1. `experiences` had NO row level security at all. The anon key ships in the
--      public JS bundle, so any visitor could read, edit or DELETE every user's
--      saved venues. Confirmed by an anonymous PATCH returning 200.
--   2. `shared_plans` allowed anonymous UPDATE on any row (`using (true)`), so
--      anyone could overwrite anyone's shared itinerary.
--   3. `profiles` let every signed-in user read every other user's email.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 0. Admin flag
-- ---------------------------------------------------------------------------
-- The client-side ADMIN_EMAIL check only hides a button; it is not a control.
-- Admin writes to the curated pool need a real server-side claim.
alter table profiles add column if not exists is_admin boolean not null default false;

-- SECURITY DEFINER so the function can read profiles without tripping the RLS
-- policies defined further down (which would otherwise recurse).
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from profiles where id = auth.uid()), false);
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Grant yourself admin (the tester account stays a normal user on purpose, so
-- testers exercise the same permissions a real user has).
update profiles set is_admin = true where email = 'jahnvisolanki2412@gmail.com';


-- ---------------------------------------------------------------------------
-- 1. Connection helper
-- ---------------------------------------------------------------------------
-- Friend profiles show a friend's saves, so `experiences` SELECT has to allow
-- reading a connected user's rows. SECURITY DEFINER avoids recursing into the
-- RLS policies on `connections`.
create or replace function public.are_connected(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from connections
    where (user_a = a and user_b = b)
       or (user_a = b and user_b = a)
  );
$$;

revoke all on function public.are_connected(uuid, uuid) from public;
grant execute on function public.are_connected(uuid, uuid) to authenticated;


-- ---------------------------------------------------------------------------
-- 2. experiences — THE CRITICAL FIX
-- ---------------------------------------------------------------------------
alter table experiences enable row level security;

drop policy if exists "experiences read own"      on experiences;
drop policy if exists "experiences read friend"   on experiences;
drop policy if exists "experiences read admin"    on experiences;
drop policy if exists "experiences insert own"    on experiences;
drop policy if exists "experiences insert admin"  on experiences;
drop policy if exists "experiences update own"    on experiences;
drop policy if exists "experiences update admin"  on experiences;
drop policy if exists "experiences delete own"    on experiences;
drop policy if exists "experiences delete admin"  on experiences;

-- Legacy policies created by hand in the dashboard (not in any migration).
-- Postgres ORs permissive policies together, so these silently overrode every
-- policy below — "Anon can do everything" let logged-out visitors edit/delete.
drop policy if exists "Anon can do everything"               on experiences;
drop policy if exists "Anon can view pending experiences"    on experiences;
drop policy if exists "Public can view approved experiences" on experiences;

-- READ: your own saves (any status).
create policy "experiences read own" on experiences for select to authenticated
  using (auth.uid() = user_id);

-- READ: a connected friend's saves — powers FriendProfile.
create policy "experiences read friend" on experiences for select to authenticated
  using (user_id is not null and public.are_connected(auth.uid(), user_id));

-- READ: admin sees everything, including the pending review queue.
create policy "experiences read admin" on experiences for select to authenticated
  using (public.is_admin());

-- The curated pool is NOT read through this table any more — it goes through
-- the experiences_public view below, which drops personal columns.

-- WRITE: strictly your own rows. `with check` on update stops a user
-- reassigning a row to somebody else's user_id.
create policy "experiences insert own" on experiences for insert to authenticated
  with check (auth.uid() = user_id);
create policy "experiences update own" on experiences for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "experiences delete own" on experiences for delete to authenticated
  using (auth.uid() = user_id);

-- WRITE: admin manages the curated pool (rows with user_id null).
create policy "experiences insert admin" on experiences for insert to authenticated
  with check (public.is_admin());
create policy "experiences update admin" on experiences for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "experiences delete admin" on experiences for delete to authenticated
  using (public.is_admin());


-- ---------------------------------------------------------------------------
-- 3. experiences_public — the curated catalogue
-- ---------------------------------------------------------------------------
-- Discover / plan generation need the approved venue pool. Reading it straight
-- off `experiences` would also expose `note` (private notes), `visit_date` and
-- `user_id` on any user save an admin has promoted to approved. This view keeps
-- the catalogue readable while dropping every personal column.
--
-- security_invoker is deliberately left OFF: the view is owned by the table
-- owner and bypasses RLS, which is what makes it a public catalogue.
-- Every column EXCEPT the four personal ones: user_id, note, visit_date, folder.
create or replace view experiences_public as
  select
    id, name, address, area, zone, postcode, category, price, price_level,
    comment, vibe_tags, celebrity_tags, plant_friendly, lat, lng,
    google_place_id, google_rating, google_review_count, google_price_level,
    website, opening_hours, phone,
    is_event, event_start, event_end, event_time,
    tiktok_url, source, source_url, source_type,
    photo_url, status, created_at
  from experiences
  where status = 'approved';

grant select on experiences_public to anon, authenticated;


-- ---------------------------------------------------------------------------
-- 4. profiles — stop leaking email addresses
-- ---------------------------------------------------------------------------
-- Previously: `create policy "profiles read" ... using (true)` — every signed-in
-- user could dump the whole table including everyone's email.
drop policy if exists "profiles read"        on profiles;
drop policy if exists "profiles read own"    on profiles;
drop policy if exists "profiles read friend" on profiles;
drop policy if exists "profiles read admin"  on profiles;

create policy "profiles read own" on profiles for select to authenticated
  using (id = auth.uid());
create policy "profiles read friend" on profiles for select to authenticated
  using (public.are_connected(auth.uid(), id));
create policy "profiles read admin" on profiles for select to authenticated
  using (public.is_admin());

-- Friend discovery still needs to resolve a code to a person, and to check code
-- uniqueness at signup — but only over non-identifying columns. No email here.
create or replace view profiles_public as
  select id, name, avatar_url, friend_code
  from profiles;

grant select on profiles_public to authenticated;


-- ---------------------------------------------------------------------------
-- 5. shared_plans — stop anonymous overwrites
-- ---------------------------------------------------------------------------
alter table shared_plans add column if not exists owner uuid references auth.users(id) on delete cascade;

-- Both the original migration and the later "tightening" patch used different
-- policy names, so the permissive `using (true)` UPDATE policy survived. Clear
-- every known name before recreating.
drop policy if exists "shared_plans read"                          on shared_plans;
drop policy if exists "shared_plans insert"                        on shared_plans;
drop policy if exists "shared_plans update"                        on shared_plans;
drop policy if exists "Anyone can read shared plans"               on shared_plans;
drop policy if exists "Authenticated users can insert plans"       on shared_plans;
drop policy if exists "Authenticated users can update own plans"   on shared_plans;
drop policy if exists "Public read"                                on shared_plans;
drop policy if exists "Public insert"                              on shared_plans;
drop policy if exists "Public update"                              on shared_plans;

-- Read stays open: recipients of a share link are often logged out. Security
-- comes from the share id being an unguessable token (widened to 22 chars of
-- crypto-random in the client alongside this migration).
create policy "shared_plans read" on shared_plans for select
  using (true);

create policy "shared_plans insert own" on shared_plans for insert to authenticated
  with check (auth.uid() = owner);

create policy "shared_plans update own" on shared_plans for update to authenticated
  using (auth.uid() = owner) with check (auth.uid() = owner);

create policy "shared_plans delete own" on shared_plans for delete to authenticated
  using (auth.uid() = owner);

-- Backfill so existing links keep working; they become read-only.
update shared_plans set owner = null where owner is null;


-- ---------------------------------------------------------------------------
-- 6. analytics_events — insert-only was right, but add an admin read
-- ---------------------------------------------------------------------------
drop policy if exists "analytics read admin" on analytics_events;
create policy "analytics read admin" on analytics_events for select to authenticated
  using (public.is_admin());

-- GDPR data minimisation: drop events older than 90 days.
-- Requires the pg_cron extension (Database → Extensions → enable pg_cron).
-- Uncomment once enabled:
-- select cron.schedule(
--   'purge-old-analytics', '0 3 * * *',
--   $$delete from analytics_events where created_at < now() - interval '90 days'$$
-- );


-- ---------------------------------------------------------------------------
-- 7. api_usage — per-user daily cap on the Claude proxy
-- ---------------------------------------------------------------------------
-- /api/claude used to be an open proxy with only an in-memory per-IP limit,
-- which resets on every cold start and is not shared across Vercel instances.
-- This counter is the cross-instance backstop on spend.
create table if not exists api_usage (
  user_id uuid references auth.users(id) on delete cascade not null,
  day     date not null,
  count   integer not null default 0,
  primary key (user_id, day)
);

alter table api_usage enable row level security;
-- No policies: only the service key (which bypasses RLS) touches this table.

create or replace function public.bump_api_usage(p_user uuid, p_day date)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  insert into api_usage (user_id, day, count)
  values (p_user, p_day, 1)
  on conflict (user_id, day)
    do update set count = api_usage.count + 1
  returning count into new_count;
  return new_count;
end;
$$;

revoke all on function public.bump_api_usage(uuid, date) from public, anon, authenticated;


-- ---------------------------------------------------------------------------
-- 8. Verify
-- ---------------------------------------------------------------------------
-- Every table below should report rowsecurity = true.
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by rowsecurity, tablename;
