-- Keep login activity private to the service role, rather than in profiles
-- which is readable by all authenticated users.
create table if not exists admin_user_logins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  avatar_url text,
  first_login timestamptz not null default now(),
  last_login timestamptz not null default now(),
  login_count integer not null default 1 check (login_count > 0)
);

alter table admin_user_logins enable row level security;
revoke all on table admin_user_logins from anon, authenticated;
grant select on table admin_user_logins to service_role;

insert into admin_user_logins (user_id, email, name, avatar_url, first_login, last_login, login_count)
select
  profile.id,
  coalesce(profile.email, auth_user.email),
  profile.name,
  profile.avatar_url,
  coalesce(profile.created_at, profile.last_login, now()),
  coalesce(profile.last_login, profile.created_at, now()),
  greatest(coalesce(profile.login_count, 1), 1)
from profiles as profile
join auth.users as auth_user on auth_user.id = profile.id
where (profile.last_login is not null or coalesce(profile.login_count, 0) > 0)
  and coalesce(profile.email, auth_user.email) is not null
on conflict (user_id) do nothing;

update profiles set last_login = null, login_count = 0
where last_login is not null or coalesce(login_count, 0) <> 0;

create or replace function public.record_admin_user_login(
  p_user_id uuid,
  p_email text,
  p_name text,
  p_avatar_url text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into admin_user_logins (user_id, email, name, avatar_url, first_login, last_login, login_count)
  values (p_user_id, p_email, p_name, p_avatar_url, now(), now(), 1)
  on conflict (user_id) do update
  set email = excluded.email,
      name = excluded.name,
      avatar_url = excluded.avatar_url,
      last_login = now(),
      login_count = admin_user_logins.login_count + 1;
end;
$$;

revoke all on function public.record_admin_user_login(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.record_admin_user_login(uuid, text, text, text) to service_role;
