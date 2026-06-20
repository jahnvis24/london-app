-- Shareable itineraries: anyone with the link (?plan=<id>) can view a plan.
-- Run once in the Supabase SQL editor. Safe to re-run.
create table if not exists shared_plans (
  id         text primary key,
  plan       jsonb not null,
  times      jsonb,
  title      text,
  created_at timestamptz default now()
);
alter table shared_plans enable row level security;
drop policy if exists "shared_plans read" on shared_plans;
create policy "shared_plans read" on shared_plans for select using (true);     -- public view (incl. logged-out recipients)
drop policy if exists "shared_plans insert" on shared_plans;
create policy "shared_plans insert" on shared_plans for insert with check (true);
drop policy if exists "shared_plans update" on shared_plans;
create policy "shared_plans update" on shared_plans for update using (true) with check (true);
