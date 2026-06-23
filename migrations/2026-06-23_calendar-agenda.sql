-- Calendar agenda: let a bucket-list item carry a target date so it shows on the
-- Saves → Calendar agenda alongside spots, events, and scheduled plans.
-- Run once in the Supabase SQL editor. Safe to re-run.
alter table shared_list_items add column if not exists target_date date;
