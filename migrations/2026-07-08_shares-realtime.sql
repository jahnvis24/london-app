-- Enable Supabase Realtime on the shares table so you get an INSTANT toast +
-- People-tab badge when a friend sends you a spot list or itinerary. Without
-- this the badge still updates on app load — just not in real time.
-- Run once in the Supabase SQL editor. Safe to re-run (guarded).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'shares'
  ) then
    alter publication supabase_realtime add table shares;
  end if;
end $$;
