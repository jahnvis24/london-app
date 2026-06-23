-- Collaborative bucket lists: a list two+ connected friends can both add to and tick off.
-- Run once in the Supabase SQL editor. Safe to re-run.
create extension if not exists pgcrypto;

create table if not exists shared_lists (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  emoji      text default '✨',
  owner      uuid not null,
  created_at timestamptz default now()
);

create table if not exists shared_list_members (
  list_id  uuid not null references shared_lists(id) on delete cascade,
  user_id  uuid not null,
  added_at timestamptz default now(),
  primary key (list_id, user_id)
);

create table if not exists shared_list_items (
  id              uuid primary key default gen_random_uuid(),
  list_id         uuid not null references shared_lists(id) on delete cascade,
  added_by        uuid not null,
  name            text not null,
  category        text,
  address         text,
  area            text,
  comment         text,
  lat             double precision,
  lng             double precision,
  google_place_id text,
  google_rating   text,
  price           text,
  website         text,
  photo_url       text,
  done            boolean default false,
  done_by         uuid,
  done_at         timestamptz,
  created_at      timestamptz default now()
);

-- Membership check as SECURITY DEFINER so policies don't recurse on shared_list_members.
create or replace function is_list_member(p_list uuid, p_user uuid)
returns boolean language sql security definer stable as $$
  select exists (select 1 from shared_list_members where list_id = p_list and user_id = p_user);
$$;

alter table shared_lists enable row level security;
alter table shared_list_members enable row level security;
alter table shared_list_items enable row level security;

-- shared_lists
drop policy if exists "sl read" on shared_lists;
create policy "sl read" on shared_lists for select to authenticated using (owner = auth.uid() or is_list_member(id, auth.uid()));
drop policy if exists "sl insert" on shared_lists;
create policy "sl insert" on shared_lists for insert to authenticated with check (owner = auth.uid());
drop policy if exists "sl update" on shared_lists;
create policy "sl update" on shared_lists for update to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
drop policy if exists "sl delete" on shared_lists;
create policy "sl delete" on shared_lists for delete to authenticated using (owner = auth.uid());

-- shared_list_members
drop policy if exists "slm read" on shared_list_members;
create policy "slm read" on shared_list_members for select to authenticated using (is_list_member(list_id, auth.uid()));
drop policy if exists "slm insert" on shared_list_members;
create policy "slm insert" on shared_list_members for insert to authenticated with check (user_id = auth.uid() or auth.uid() = (select owner from shared_lists where id = list_id));
drop policy if exists "slm delete" on shared_list_members;
create policy "slm delete" on shared_list_members for delete to authenticated using (user_id = auth.uid() or auth.uid() = (select owner from shared_lists where id = list_id));

-- shared_list_items
drop policy if exists "sli read" on shared_list_items;
create policy "sli read" on shared_list_items for select to authenticated using (is_list_member(list_id, auth.uid()));
drop policy if exists "sli insert" on shared_list_items;
create policy "sli insert" on shared_list_items for insert to authenticated with check (is_list_member(list_id, auth.uid()) and added_by = auth.uid());
drop policy if exists "sli update" on shared_list_items;
create policy "sli update" on shared_list_items for update to authenticated using (is_list_member(list_id, auth.uid())) with check (is_list_member(list_id, auth.uid()));
drop policy if exists "sli delete" on shared_list_items;
create policy "sli delete" on shared_list_items for delete to authenticated using (added_by = auth.uid() or auth.uid() = (select owner from shared_lists where id = list_id));
