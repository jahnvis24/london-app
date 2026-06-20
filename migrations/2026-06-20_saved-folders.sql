-- Saved-tab folders. Run once in the Supabase SQL editor.
-- Safe to re-run.
alter table experiences
  add column if not exists folder text;
