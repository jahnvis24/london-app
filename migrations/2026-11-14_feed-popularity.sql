-- Friends feed + real "Trending" on Discover.
-- Run once in the Supabase SQL editor. Safe to re-run.
--
-- The friends feed itself needs no new tables: it reads friends' rows from
-- `experiences` through the existing "experiences read friend" policy. This file
-- only adds indexes for that query, plus two aggregate functions that count saves
-- across ALL users. RLS stops a client counting other people's saves, so the
-- functions are SECURITY DEFINER and only ever return a place and a number,
-- never who saved it, their notes, folders or visit dates. A place has to be
-- saved by at least 3 different people before it appears, so a count can't be
-- used to work out what one person saved.

create index if not exists experiences_user_created_idx on experiences (user_id, created_at desc);
create index if not exists experiences_place_key_idx on experiences ((coalesce(google_place_id, lower(trim(name)))));

-- How many people saved each of the given places. Keys use the app's
-- same-place rule: google_place_id, else the lowercased, trimmed name.
create or replace function public.place_save_counts(keys text[])
returns table (place_key text, savers int)
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(google_place_id, lower(trim(name))) as place_key,
         count(distinct user_id)::int as savers
  from experiences
  where user_id is not null
    and coalesce(google_place_id, lower(trim(name))) = any (keys[1:200])
  group by 1
  having count(distinct user_id) >= 3;
$$;

-- The most-saved places in the last `days` days, across all users.
-- Place details come from the approved catalogue row when one exists, else from
-- the most recent user save, and only non-personal columns are returned.
create or replace function public.popular_places(days int default 7, lim int default 12)
returns table (place_key text, savers int, place jsonb)
language sql
stable
security definer
set search_path = public
as $$
  with recent as (
    select coalesce(google_place_id, lower(trim(name))) as k, count(distinct user_id)::int as n
    from experiences
    where user_id is not null
      and coalesce(is_event, false) = false
      and created_at >= now() - make_interval(days => least(greatest(days, 1), 90))
    group by 1
    having count(distinct user_id) >= 3
  ),
  rep as (
    select distinct on (coalesce(e.google_place_id, lower(trim(e.name))))
      coalesce(e.google_place_id, lower(trim(e.name))) as k,
      jsonb_build_object(
        'id', e.id, 'name', e.name, 'address', e.address, 'area', e.area, 'zone', e.zone,
        'category', e.category, 'price', e.price, 'vibe_tags', e.vibe_tags,
        'celebrity_tags', e.celebrity_tags, 'lat', e.lat, 'lng', e.lng,
        'google_place_id', e.google_place_id, 'google_rating', e.google_rating,
        'website', e.website, 'photo_url', e.photo_url,
        -- the description only comes from the curated catalogue, never a user's row
        'comment', case when e.user_id is null and e.status = 'approved' then e.comment end
      ) as place
    from experiences e
    join recent r on r.k = coalesce(e.google_place_id, lower(trim(e.name)))
    order by coalesce(e.google_place_id, lower(trim(e.name))),
             (e.user_id is null and e.status = 'approved') desc,
             (e.photo_url is not null) desc,
             e.created_at desc
  )
  select r.k, r.n, p.place
  from recent r join rep p on p.k = r.k
  order by r.n desc
  limit least(greatest(lim, 1), 50);
$$;

revoke all on function public.place_save_counts(text[]) from public, anon;
revoke all on function public.popular_places(int, int) from public, anon;
grant execute on function public.place_save_counts(text[]) to authenticated;
grant execute on function public.popular_places(int, int) to authenticated;
