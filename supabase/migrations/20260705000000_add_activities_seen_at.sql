-- Track when each user last viewed the activity feed, so we can show a
-- "new activities" badge on the feed shortcut. Defaults to now() so existing
-- users don't see the entire activity history flagged as new.
alter table public.profiles
  add column if not exists activities_seen_at timestamptz not null default now();
