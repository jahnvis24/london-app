-- Per-spot notes and planned visit date, stored on the experiences row so they
-- sync across devices (previously kept in localStorage).
-- Run once in the Supabase SQL editor. Safe to re-run.
alter table experiences add column if not exists note       text;
alter table experiences add column if not exists visit_date date;
