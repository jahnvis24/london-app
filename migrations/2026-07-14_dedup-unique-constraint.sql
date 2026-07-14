-- Prevent duplicate saves per user. The primary key is google_place_id (stable
-- across screenshots, links, manual entry). Falls back to lowercase name for
-- venues without a Google match.
-- Run once in the Supabase SQL editor. Safe to re-run.

-- Deduplicate existing rows first: keep the earliest entry per user+place_id
DELETE FROM experiences a
  USING experiences b
  WHERE a.user_id = b.user_id
    AND a.google_place_id IS NOT NULL
    AND a.google_place_id = b.google_place_id
    AND a.created_at > b.created_at;

CREATE UNIQUE INDEX IF NOT EXISTS experiences_user_place_unique
  ON experiences (user_id, google_place_id)
  WHERE google_place_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS experiences_user_name_unique
  ON experiences (user_id, lower(name))
  WHERE google_place_id IS NULL;
