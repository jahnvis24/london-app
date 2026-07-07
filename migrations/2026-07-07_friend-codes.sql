-- Friend codes: a short, typeable code per user so two people who both have the
-- app can connect by scanning a QR (the invite link) or typing each other's code.
-- Run once in the Supabase SQL editor. Safe to re-run.
alter table profiles add column if not exists friend_code text;
-- Unique so a typed code resolves to exactly one person. Case is normalised to
-- uppercase in the app before storing/looking up.
create unique index if not exists profiles_friend_code_key on profiles (friend_code);
