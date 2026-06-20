-- Creates the two missing tables behind the console errors:
--   /api/track-login 500  -> needs `profiles`
--   plan_reviews 404      -> needs `plan_reviews`
-- Run once in the Supabase SQL editor. Safe to re-run.

-- Login tracking (written by /api/track-login using the service key).
create table if not exists profiles (
  id          uuid primary key,
  email       text,
  name        text,
  avatar_url  text,
  last_login  timestamptz,
  login_count int default 0,
  created_at  timestamptz default now()
);
alter table profiles enable row level security;
drop policy if exists "profiles read" on profiles;
create policy "profiles read" on profiles for select to authenticated using (true);
-- inserts/updates happen via the service key, which bypasses RLS.

-- Itinerary feedback / star ratings.
create table if not exists plan_reviews (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid,
  plan_id        text,
  overall_rating int,
  stop_ratings   jsonb,
  comment        text,
  created_at     timestamptz default now()
);
alter table plan_reviews enable row level security;
drop policy if exists "plan_reviews insert own" on plan_reviews;
create policy "plan_reviews insert own" on plan_reviews for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "plan_reviews read" on plan_reviews;
create policy "plan_reviews read" on plan_reviews for select to authenticated using (true);
