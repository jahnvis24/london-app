-- Copy all user data from jahnvisolanki2412@gmail.com to curatedapptester@gmail.com
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- IMPORTANT: The new email must have already signed up on the app first!

DO $$
DECLARE
  old_id uuid;
  new_id uuid;
BEGIN
  -- Look up both user IDs from auth.users
  SELECT id INTO old_id FROM auth.users WHERE email = 'jahnvisolanki2412@gmail.com';
  SELECT id INTO new_id FROM auth.users WHERE email = 'curatedapptester@gmail.com';

  IF old_id IS NULL THEN RAISE EXCEPTION 'Old user not found'; END IF;
  IF new_id IS NULL THEN RAISE EXCEPTION 'New user not found — sign up with that email first'; END IF;

  RAISE NOTICE 'Copying from % to %', old_id, new_id;

  -- 1. Update profile name and avatar on the new account
  UPDATE profiles SET
    name = (SELECT name FROM profiles WHERE id = old_id),
    avatar_url = (SELECT avatar_url FROM profiles WHERE id = old_id)
  WHERE id = new_id;

  -- 2. Copy all saved experiences (skip if duplicate name/place already exists)
  INSERT INTO experiences (
    user_id, name, address, area, zone, postcode, category, price,
    is_event, event_start, event_end, event_time,
    comment, vibe_tags, lat, lng,
    google_place_id, google_rating, google_review_count, google_price_level,
    website, opening_hours, tiktok_url, source_url, source_type,
    photo_url, folder, note, visit_date, status
  )
  SELECT
    new_id, name, address, area, zone, postcode, category, price,
    is_event, event_start, event_end, event_time,
    comment, vibe_tags, lat, lng,
    google_place_id, google_rating, google_review_count, google_price_level,
    website, opening_hours, tiktok_url, source_url, source_type,
    photo_url, folder, note, visit_date, status
  FROM experiences
  WHERE user_id = old_id
  ON CONFLICT DO NOTHING;

  -- 3. Copy connections (make new user connected to same friends)
  INSERT INTO connections (user_a, user_b)
  SELECT
    CASE WHEN user_a = old_id THEN LEAST(new_id, user_b) ELSE LEAST(user_a, new_id) END,
    CASE WHEN user_a = old_id THEN GREATEST(new_id, user_b) ELSE GREATEST(user_a, new_id) END
  FROM connections
  WHERE user_a = old_id OR user_b = old_id
  ON CONFLICT DO NOTHING;

  -- 4. Copy venue ratings
  INSERT INTO venue_ratings (user_id, venue_key, venue_name, stars, comment)
  SELECT new_id, venue_key, venue_name, stars, comment
  FROM venue_ratings
  WHERE user_id = old_id
  ON CONFLICT DO NOTHING;

  -- 5. Copy shared list memberships (add new user to same lists)
  INSERT INTO shared_list_members (list_id, user_id)
  SELECT list_id, new_id
  FROM shared_list_members
  WHERE user_id = old_id
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Done! All data copied to new account.';
END $$;
