-- Enable Supabase Realtime on the connections table so the inviter gets an INSTANT
-- "X connected with you!" notification when a friend joins via their invite link.
-- Without this, the notification still fires on next app load (just not instantly).
-- Run once in the Supabase SQL editor. Safe to re-run (guarded).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'connections'
  ) then
    alter publication supabase_realtime add table connections;
  end if;
end $$;
