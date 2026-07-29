do $migration$
begin

  alter table public.bot_usage_events
    add column if not exists score_mode text,
    add column if not exists score_value numeric;

  alter table public.bot_usage_events
    drop constraint if exists bot_usage_events_event_name_check;

  alter table public.bot_usage_events
    add constraint bot_usage_events_event_name_check
    check (
      event_name in (
        'cutoff_request',
        'cutoff_query',
        'worker_heartbeat',
        'state_cutoff_search'
      )
    );

  alter table public.bot_usage_events
    drop constraint if exists bot_usage_events_score_mode_check;

  alter table public.bot_usage_events
    add constraint bot_usage_events_score_mode_check
    check (score_mode is null or score_mode in ('rank', 'percentile'));

  create index if not exists idx_bot_usage_events_event_created_at
    on public.bot_usage_events (event_name, created_at desc);

  create unique index if not exists idx_state_cutoff_usage_request_once
    on public.bot_usage_events (event_name, platform, request_id)
    where event_name = 'state_cutoff_search';

  alter table public.bot_usage_events enable row level security;
  revoke all privileges on table public.bot_usage_events from anon, authenticated;
  grant select, insert on table public.bot_usage_events to service_role;
end
$migration$;
