do $migration$
begin
  perform set_config('lock_timeout', '5s', true);
  perform set_config('statement_timeout', '30s', true);

  alter table public.mht_cet_institute_eligibility enable row level security;
  revoke all privileges on table public.mht_cet_institute_eligibility
    from public, anon, authenticated, service_role;
  grant select on table public.mht_cet_institute_eligibility to service_role;

  alter table public.bot_usage_events enable row level security;
  revoke all privileges on table public.bot_usage_events
    from public, anon, authenticated, service_role;
  grant select, insert on table public.bot_usage_events to service_role;
end
$migration$;
