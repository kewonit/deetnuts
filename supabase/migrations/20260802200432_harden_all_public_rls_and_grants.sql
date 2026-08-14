begin;

set local lock_timeout = '5s';
set local statement_timeout = '5min';

-- Every table exposed through the public schema must have RLS enabled. Revoke
-- legacy automatic Data API grants first, then add back only the capabilities
-- required by the application below.
do $enable_rls$
declare
  table_record record;
begin
  for table_record in
    select tables.tablename
    from pg_tables as tables
    where tables.schemaname = 'public'
  loop
    execute format(
      'alter table public.%I enable row level security',
      table_record.tablename
    );
  end loop;
end
$enable_rls$;

revoke all privileges on all tables in schema public
  from public, anon, authenticated;

-- Public reference datasets are read-only through the Data API. Import and
-- maintenance jobs continue to use the backend-only service role.
do $public_reference_tables$
declare
  table_name text;
  policy_record record;
  public_read_tables constant text[] := array[
    '2023-mhtcet-rank-percentile',
    '2023-round-one-pcm-mhtcet-state-cutoffs',
    'MH_Colleges',
    'MH_Institute',
    'Product',
    'Round',
    'Years',
    'colleges_within_mhtcet_pcm',
    'mhtcet-allindia-cutoffs-round-one-2023',
    'mhtcet-allindia-cutoffs-round-three-2023',
    'mhtcet-allindia-cutoffs-round-two-2023',
    'mhtcet-state-cutoff-pcm-round-one-2023',
    'mhtcet-state-cutoffs-pcm-round-one-2023',
  ];
begin
  foreach table_name in array public_read_tables
  loop
    if to_regclass(format('%I.%I', 'public', table_name)) is not null then
      for policy_record in
        select policies.policyname
        from pg_policies as policies
        where policies.schemaname = 'public'
          and policies.tablename = table_name
          and policies.cmd = 'SELECT'
      loop
        execute format(
          'drop policy %I on public.%I',
          policy_record.policyname,
          table_name
        );
      end loop;

      execute format(
        'create policy %I on public.%I for select to anon, authenticated using (true)',
        'Public reference data is readable',
        table_name
      );
      execute format(
        'grant select on table public.%I to anon, authenticated',
        table_name
      );
    end if;
  end loop;
end
$public_reference_tables$;

-- Profiles and todos are private, authenticated, and owner-scoped. UPDATE
-- policies include both USING and WITH CHECK to prevent ownership changes.
do $owner_scoped_tables$
begin
  if to_regclass('public.profiles') is not null then
    execute 'drop policy if exists "Public profiles are viewable by everyone." on public.profiles';
    execute 'drop policy if exists "Users can insert their own profile." on public.profiles';
    execute 'drop policy if exists "Users can update own profile." on public.profiles';
    execute 'drop policy if exists "Users can update their own profile" on public.profiles';
    execute 'drop policy if exists "Users can view their own profile" on public.profiles';

    execute 'create policy "Users can view their own profile" on public.profiles for select to authenticated using ((select auth.uid()) = id)';
    execute 'create policy "Users can insert their own profile" on public.profiles for insert to authenticated with check ((select auth.uid()) = id)';
    execute 'create policy "Users can update their own profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id)';
    execute 'grant select, insert, update on table public.profiles to authenticated';
  end if;

  if to_regclass('public.todos') is not null then
    execute 'drop policy if exists "Users can create their own todos." on public.todos';
    execute 'drop policy if exists "Users can delete their own todos." on public.todos';
    execute 'drop policy if exists "Users can update their own todos." on public.todos';
    execute 'drop policy if exists "Users can view their own todos." on public.todos';
    execute 'drop policy if exists "Users can create their own todos" on public.todos';
    execute 'drop policy if exists "Users can delete their own todos" on public.todos';
    execute 'drop policy if exists "Users can update their own todos" on public.todos';
    execute 'drop policy if exists "Users can view their own todos" on public.todos';

    execute 'create policy "Users can view their own todos" on public.todos for select to authenticated using ((select auth.uid()) = user_id)';
    execute 'create policy "Users can create their own todos" on public.todos for insert to authenticated with check ((select auth.uid()) = user_id)';
    execute 'create policy "Users can update their own todos" on public.todos for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)';
    execute 'create policy "Users can delete their own todos" on public.todos for delete to authenticated using ((select auth.uid()) = user_id)';
    execute 'grant select, insert, update, delete on table public.todos to authenticated';
    execute 'create index if not exists idx_todos_user_id on public.todos (user_id)';
  end if;
end
$owner_scoped_tables$;

-- Mock-exam state is available only to the signed-in owner. Supporting event
-- and question rows are read-only to clients; attempt/response writes remain
-- restricted by their ownership policies.
do $mock_exam_tables$
begin
  if to_regclass('public.mht_cet_mock_attempt_events') is not null then
    execute 'drop policy if exists "users read own attempt events" on public.mht_cet_mock_attempt_events';
    execute 'create policy "users read own attempt events" on public.mht_cet_mock_attempt_events for select to authenticated using (user_id = (select auth.uid()))';
    execute 'grant select on table public.mht_cet_mock_attempt_events to authenticated';
    execute 'create index if not exists idx_mht_cet_mock_attempt_events_user_id on public.mht_cet_mock_attempt_events (user_id)';
  end if;

  if to_regclass('public.mht_cet_mock_attempt_questions') is not null then
    execute 'drop policy if exists "users read own attempt questions" on public.mht_cet_mock_attempt_questions';
    execute 'create policy "users read own attempt questions" on public.mht_cet_mock_attempt_questions for select to authenticated using (exists (select 1 from public.mht_cet_mock_attempts as attempts where attempts.id = attempt_id and attempts.user_id = (select auth.uid())))';
    execute 'grant select on table public.mht_cet_mock_attempt_questions to authenticated';
  end if;

  if to_regclass('public.mht_cet_mock_attempts') is not null then
    execute 'drop policy if exists "users insert own attempts" on public.mht_cet_mock_attempts';
    execute 'drop policy if exists "users read own attempts" on public.mht_cet_mock_attempts';
    execute 'drop policy if exists "users update own attempts" on public.mht_cet_mock_attempts';
    execute 'create policy "users insert own attempts" on public.mht_cet_mock_attempts for insert to authenticated with check ((select auth.uid()) = user_id)';
    execute 'create policy "users read own attempts" on public.mht_cet_mock_attempts for select to authenticated using ((select auth.uid()) = user_id)';
    execute 'create policy "users update own attempts" on public.mht_cet_mock_attempts for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)';
    execute 'grant select, insert, update on table public.mht_cet_mock_attempts to authenticated';
  end if;

  if to_regclass('public.mht_cet_mock_responses') is not null then
    execute 'drop policy if exists "users read own responses" on public.mht_cet_mock_responses';
    execute 'drop policy if exists "users upsert own responses" on public.mht_cet_mock_responses';
    execute 'drop policy if exists "users insert own responses" on public.mht_cet_mock_responses';
    execute 'drop policy if exists "users update own responses" on public.mht_cet_mock_responses';
    execute 'create policy "users read own responses" on public.mht_cet_mock_responses for select to authenticated using (exists (select 1 from public.mht_cet_mock_attempts as attempts where attempts.id = attempt_id and attempts.user_id = (select auth.uid())))';
    execute 'create policy "users insert own responses" on public.mht_cet_mock_responses for insert to authenticated with check (exists (select 1 from public.mht_cet_mock_attempts as attempts where attempts.id = attempt_id and attempts.user_id = (select auth.uid()) and attempts.status = ''in_progress'' and attempts.ends_at > now()))';
    execute 'create policy "users update own responses" on public.mht_cet_mock_responses for update to authenticated using (exists (select 1 from public.mht_cet_mock_attempts as attempts where attempts.id = attempt_id and attempts.user_id = (select auth.uid()))) with check (exists (select 1 from public.mht_cet_mock_attempts as attempts where attempts.id = attempt_id and attempts.user_id = (select auth.uid()) and attempts.status = ''in_progress'' and attempts.ends_at > now()))';
    execute 'grant select, insert, update on table public.mht_cet_mock_responses to authenticated';
  end if;
end
$mock_exam_tables$;

-- Only approved question content is public. Source-table column privileges are
-- deliberately narrow so policy joins can verify provenance without exposing
-- reviewer IDs, import filenames, or hashes.
do $question_bank_tables$
begin
  if to_regclass('public.mht_cet_chapters') is not null then
    execute 'drop policy if exists "public read active chapters" on public.mht_cet_chapters';
    execute 'create policy "public read active chapters" on public.mht_cet_chapters for select to anon, authenticated using (active = true)';
    execute 'grant select on table public.mht_cet_chapters to anon, authenticated';
  end if;

  if to_regclass('public.mht_cet_question_sources') is not null then
    execute 'drop policy if exists "public read approved source status" on public.mht_cet_question_sources';
    execute 'create policy "public read approved source status" on public.mht_cet_question_sources for select to anon, authenticated using (verification_status = ''approved'')';
    execute 'grant select (id, verification_status) on table public.mht_cet_question_sources to anon, authenticated';
  end if;

  if to_regclass('public.mht_cet_questions') is not null then
    execute 'drop policy if exists "public read approved questions" on public.mht_cet_questions';
    execute 'create policy "public read approved questions" on public.mht_cet_questions for select to anon, authenticated using (verification_status = ''approved'' and exists (select 1 from public.mht_cet_question_sources as sources where sources.id = source_id and sources.verification_status = ''approved''))';
    execute 'grant select on table public.mht_cet_questions to anon, authenticated';
  end if;

  if to_regclass('public.mht_cet_question_options') is not null then
    execute 'drop policy if exists "public read approved options" on public.mht_cet_question_options';
    execute 'create policy "public read approved options" on public.mht_cet_question_options for select to anon, authenticated using (exists (select 1 from public.mht_cet_questions as questions join public.mht_cet_question_sources as sources on sources.id = questions.source_id where questions.id = question_id and questions.verification_status = ''approved'' and sources.verification_status = ''approved''))';
    execute 'grant select on table public.mht_cet_question_options to anon, authenticated';
  end if;
end
$question_bank_tables$;

-- Bot telemetry remains backend-only with operation-specific privileges.
do $bot_tables$
begin
  if to_regclass('public.bot_processed_events') is not null then
    execute 'revoke all privileges on table public.bot_processed_events from service_role';
    execute 'grant select, insert, update on table public.bot_processed_events to service_role';
  end if;

  if to_regclass('public.bot_usage_events') is not null then
    execute 'revoke all privileges on table public.bot_usage_events from service_role';
    execute 'grant select, insert on table public.bot_usage_events to service_role';
  end if;
end
$bot_tables$;

-- Avatar reads are public, while writes require authentication, ownership, a
-- per-user top-level folder, an allow-listed extension, and the bucket limits.
update storage.buckets
set
  file_size_limit = 2097152,
  allowed_mime_types = array[
    'image/gif',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]::text[],
  updated_at = now()
where id = 'avatars';

drop policy if exists "Anyone can upload an avatar." on storage.objects;
drop policy if exists "Anyone can update their own avatar." on storage.objects;
drop policy if exists "Avatar images are publicly accessible." on storage.objects;
drop policy if exists "Authenticated users can upload their own avatar" on storage.objects;
drop policy if exists "Authenticated users can update their own avatar" on storage.objects;

create policy "Avatar images are publicly accessible"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'avatars');

create policy "Authenticated users can upload their own avatar"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and lower(storage.extension(name)) = any (
    array['jpg', 'jpeg', 'png', 'webp', 'gif']
  )
);

create policy "Authenticated users can update their own avatar"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and owner = (select auth.uid())
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'avatars'
  and owner = (select auth.uid())
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and lower(storage.extension(name)) = any (
    array['jpg', 'jpeg', 'png', 'webp', 'gif']
  )
);

-- Trigger functions are not public RPC endpoints.
do $trigger_function$
begin
  if to_regprocedure('public.handle_new_user()') is not null then
    execute 'revoke execute on function public.handle_new_user() from public, anon, authenticated';
  end if;
end
$trigger_function$;

-- Fail closed if a future schema variation prevents any critical invariant
-- above from being applied. Raising here rolls back the whole migration.
do $verify_rls$
declare
  table_name text;
  public_read_tables constant text[] := array[
    '2023-mhtcet-rank-percentile',
    '2023-round-one-pcm-mhtcet-state-cutoffs',
    'MH_Colleges',
    'MH_Institute',
    'Product',
    'Round',
    'Years',
    'colleges_within_mhtcet_pcm',
    'mhtcet-allindia-cutoffs-round-one-2023',
    'mhtcet-allindia-cutoffs-round-three-2023',
    'mhtcet-allindia-cutoffs-round-two-2023',
    'mhtcet-state-cutoff-pcm-round-one-2023',
    'mhtcet-state-cutoffs-pcm-round-one-2023',
  ];
begin
  if exists (
    select 1
    from pg_class as relations
    join pg_namespace as schemas on schemas.oid = relations.relnamespace
    where schemas.nspname = 'public'
      and relations.relkind in ('r', 'p')
      and not relations.relrowsecurity
  ) then
    raise exception 'RLS hardening failed: a public table does not have RLS enabled';
  end if;

  if exists (
    select 1
    from pg_policies as policies
    where policies.schemaname = 'public'
      and 'public'::name = any (policies.roles)
  ) then
    raise exception 'RLS hardening failed: a public-schema policy still targets PUBLIC';
  end if;

  if exists (
    select 1
    from pg_class as relations
    join pg_namespace as schemas on schemas.oid = relations.relnamespace
    where schemas.nspname = 'public'
      and relations.relkind in ('r', 'p')
      and (
        has_table_privilege('anon', relations.oid, 'INSERT')
        or has_table_privilege('anon', relations.oid, 'UPDATE')
        or has_table_privilege('anon', relations.oid, 'DELETE')
      )
  ) then
    raise exception 'RLS hardening failed: anon retains a public-table write privilege';
  end if;

  if exists (
    select 1
    from pg_class as relations
    join pg_namespace as schemas on schemas.oid = relations.relnamespace
    where schemas.nspname = 'public'
      and relations.relkind in ('r', 'p')
      and (
        (
          has_table_privilege('authenticated', relations.oid, 'INSERT')
          and relations.relname not in (
            'profiles',
            'todos',
            'mht_cet_mock_attempts',
            'mht_cet_mock_responses'
          )
        )
        or (
          has_table_privilege('authenticated', relations.oid, 'UPDATE')
          and relations.relname not in (
            'profiles',
            'todos',
            'mht_cet_mock_attempts',
            'mht_cet_mock_responses'
          )
        )
        or (
          has_table_privilege('authenticated', relations.oid, 'DELETE')
          and relations.relname <> 'todos'
        )
      )
  ) then
    raise exception 'RLS hardening failed: authenticated retains an unexpected write privilege';
  end if;

  foreach table_name in array public_read_tables
  loop
    if to_regclass(format('%I.%I', 'public', table_name)) is not null
      and (
        not has_table_privilege(
          'anon',
          to_regclass(format('%I.%I', 'public', table_name)),
          'SELECT'
        )
        or not has_table_privilege(
          'authenticated',
          to_regclass(format('%I.%I', 'public', table_name)),
          'SELECT'
        )
        or not exists (
          select 1
          from pg_policies as policies
          where policies.schemaname = 'public'
            and policies.tablename = table_name
            and policies.policyname = 'Public reference data is readable'
            and policies.cmd = 'SELECT'
            and policies.roles @> array['anon', 'authenticated']::name[]
        )
      )
    then
      raise exception 'RLS hardening failed for public reference table %', table_name;
    end if;
  end loop;

  foreach table_name in array array[
    '2026_mht_cet_round_one_cutoffs',
    'bot_processed_events',
    'bot_usage_events',
    'mht_cet_institute_eligibility',
    'mht_cet_question_answers',
    'mht_cet_question_import_batches',
    'mht_cet_question_import_errors'
  ]::text[]
  loop
    if to_regclass(format('%I.%I', 'public', table_name)) is not null
      and (
        has_table_privilege(
          'anon',
          to_regclass(format('%I.%I', 'public', table_name)),
          'SELECT'
        )
        or has_table_privilege(
          'authenticated',
          to_regclass(format('%I.%I', 'public', table_name)),
          'SELECT'
        )
      )
    then
      raise exception 'RLS hardening failed: sensitive table % is client-readable', table_name;
    end if;
  end loop;

  if to_regclass('public.mht_cet_question_sources') is not null
    and (
      has_table_privilege(
        'anon',
        'public.mht_cet_question_sources',
        'SELECT'
      )
      or not has_column_privilege(
        'anon',
        'public.mht_cet_question_sources',
        'id',
        'SELECT'
      )
      or has_column_privilege(
        'anon',
        'public.mht_cet_question_sources',
        'reviewed_by',
        'SELECT'
      )
    )
  then
    raise exception 'RLS hardening failed: question-source column privileges are unsafe';
  end if;

  if to_regclass('public.profiles') is not null
    and not exists (
      select 1
      from pg_policies as policies
      where policies.schemaname = 'public'
        and policies.tablename = 'profiles'
        and policies.policyname = 'Users can update their own profile'
        and policies.cmd = 'UPDATE'
        and policies.roles = array['authenticated']::name[]
        and policies.qual is not null
        and policies.with_check is not null
    )
  then
    raise exception 'RLS hardening failed: profile UPDATE policy is incomplete';
  end if;

  if not exists (
    select 1
    from pg_policies as policies
    where policies.schemaname = 'storage'
      and policies.tablename = 'objects'
      and policies.policyname = 'Authenticated users can update their own avatar'
      and policies.cmd = 'UPDATE'
      and policies.roles = array['authenticated']::name[]
      and policies.qual is not null
      and policies.with_check is not null
  ) then
    raise exception 'RLS hardening failed: avatar UPDATE policy is incomplete';
  end if;
end
$verify_rls$;

commit;
