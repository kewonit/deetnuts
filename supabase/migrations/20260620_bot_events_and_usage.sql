create table if not exists public.bot_processed_events (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  external_id text not null,
  action text not null,
  status text not null default 'processing',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (platform, external_id)
);

do $constraints$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.bot_processed_events'::regclass
      and conname = 'bot_processed_events_status_check'
  ) then
    alter table public.bot_processed_events
      add constraint bot_processed_events_status_check
      check (status in ('processing', 'replied', 'skipped', 'failed'));
  end if;
end
$constraints$;

create index if not exists idx_bot_processed_events_created_at
  on public.bot_processed_events (created_at desc);

create index if not exists idx_bot_processed_events_platform_status_created_at
  on public.bot_processed_events (platform, status, created_at desc);

alter table public.bot_processed_events enable row level security;

create table if not exists public.bot_usage_events (
  id uuid primary key default gen_random_uuid(),
  request_id text not null,
  external_id text,
  platform text not null,
  source text,
  event_name text not null,
  status text not null,
  percentile numeric,
  year int,
  round int,
  result_count int,
  duration_ms int,
  error_code text,
  created_at timestamptz not null default now()
);

do $constraints$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.bot_usage_events'::regclass
      and conname = 'bot_usage_events_event_name_check'
  ) then
    alter table public.bot_usage_events
      add constraint bot_usage_events_event_name_check
      check (event_name in ('cutoff_request', 'cutoff_query', 'worker_heartbeat'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.bot_usage_events'::regclass
      and conname = 'bot_usage_events_status_check'
  ) then
    alter table public.bot_usage_events
      add constraint bot_usage_events_status_check
      check (status in ('served', 'rejected', 'failed', 'duplicate', 'skipped', 'heartbeat'));
  end if;
end
$constraints$;

create index if not exists idx_bot_usage_events_created_at
  on public.bot_usage_events (created_at desc);

create index if not exists idx_bot_usage_events_platform_status_created_at
  on public.bot_usage_events (platform, status, created_at desc);

create unique index if not exists idx_bot_usage_events_request_once
  on public.bot_usage_events (event_name, platform, request_id)
  where event_name = 'cutoff_request';

alter table public.bot_usage_events enable row level security;
