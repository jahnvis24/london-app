-- Saved-tab capture → global experiences pool.
-- Run once in the Supabase SQL editor (Dashboard → SQL → New query → Run).
-- Safe to re-run: every statement is IF NOT EXISTS.

alter table experiences
  add column if not exists user_id     uuid,   -- tags a personal contribution (Add tab leaves null)
  add column if not exists source_url  text,   -- link to view the source (TikTok / Instagram / screenshot / Maps)
  add column if not exists source_type text,   -- 'tiktok' | 'instagram' | 'screenshot' | 'maps' | 'mapslist'
  add column if not exists event_time  text;   -- free-text time, e.g. '7pm–11pm' (date lives in event_start/end)

-- Speeds up "show my saved spots" in the Saved tab.
create index if not exists experiences_user_id_idx on experiences (user_id);
