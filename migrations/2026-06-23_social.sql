-- Social features: invite-link connections, in-app sharing, venue ratings.
-- Run once in the Supabase SQL editor. Safe to re-run.

-- Two users linked by opening each other's invite link.
create table if not exists connections (
  user_a     uuid not null,
  user_b     uuid not null,
  created_at timestamptz default now(),
  primary key (user_a, user_b)
);
alter table connections enable row level security;
drop policy if exists "connections read" on connections;
create policy "connections read" on connections for select to authenticated using (auth.uid() = user_a or auth.uid() = user_b);
drop policy if exists "connections insert" on connections;
create policy "connections insert" on connections for insert to authenticated with check (auth.uid() = user_a or auth.uid() = user_b);
drop policy if exists "connections delete" on connections;
create policy "connections delete" on connections for delete to authenticated using (auth.uid() = user_a or auth.uid() = user_b);

-- Send a list or itinerary to a specific user (shows in their "Shared with me").
create table if not exists shares (
  id         uuid primary key default gen_random_uuid(),
  from_user  uuid not null,
  to_user    uuid not null,
  kind       text not null,        -- 'list' | 'plan'
  title      text,
  payload    jsonb not null,       -- list: { name, spots:[...] }  | plan: { plan, times }
  seen       boolean default false,
  created_at timestamptz default now()
);
alter table shares enable row level security;
drop policy if exists "shares read" on shares;
create policy "shares read" on shares for select to authenticated using (auth.uid() = to_user or auth.uid() = from_user);
drop policy if exists "shares insert" on shares;
create policy "shares insert" on shares for insert to authenticated with check (auth.uid() = from_user);
drop policy if exists "shares update" on shares;
create policy "shares update" on shares for update to authenticated using (auth.uid() = to_user) with check (auth.uid() = to_user);

-- Star + comment per user per venue (community ratings on spots).
create table if not exists venue_ratings (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,
  venue_key  text not null,        -- google_place_id, else lowercased name
  venue_name text,
  stars      int not null,
  comment    text,
  created_at timestamptz default now(),
  unique (user_id, venue_key)
);
alter table venue_ratings enable row level security;
drop policy if exists "venue_ratings read" on venue_ratings;
create policy "venue_ratings read" on venue_ratings for select using (true);
drop policy if exists "venue_ratings insert" on venue_ratings;
create policy "venue_ratings insert" on venue_ratings for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "venue_ratings update" on venue_ratings;
create policy "venue_ratings update" on venue_ratings for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
