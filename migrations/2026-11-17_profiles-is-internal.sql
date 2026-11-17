-- Flag the owner's and testers' accounts so their activity can be filtered out of
-- analytics. Separate from is_admin: internal accounts get no extra permissions.
alter table profiles add column if not exists is_internal boolean not null default false;
-- Admins are always internal.
update profiles set is_internal = true where is_admin = true;
