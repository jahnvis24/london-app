-- Plans table: stores AI-generated itineraries per user
-- Replaces localStorage cl_plans
create table if not exists plans (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  result jsonb not null,
  ans jsonb,
  times jsonb,
  saved_at text,
  created_at bigint,
  scheduled_date text,
  updated_at timestamptz default now()
);

create index if not exists idx_plans_user on plans(user_id);

-- RLS
alter table plans enable row level security;

create policy "Users can read own plans"
  on plans for select using (auth.uid() = user_id);

create policy "Users can insert own plans"
  on plans for insert with check (auth.uid() = user_id);

create policy "Users can update own plans"
  on plans for update using (auth.uid() = user_id);

create policy "Users can delete own plans"
  on plans for delete using (auth.uid() = user_id);
