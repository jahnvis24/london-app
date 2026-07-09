-- Fix connect-by-word: the profiles table had a SELECT policy but NO update
-- policy, so client-side writes to friend_code were silently blocked by RLS
-- (0 rows changed, no error) and codes never actually persisted. This lets a
-- signed-in user update THEIR OWN profile row (needed to claim a friend_code).
-- Run once in the Supabase SQL editor. Safe to re-run.
drop policy if exists "profiles update own" on profiles;
create policy "profiles update own" on profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);
