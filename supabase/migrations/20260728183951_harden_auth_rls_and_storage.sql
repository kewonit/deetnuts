-- Keep private user data behind authenticated, owner-scoped policies.
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
drop policy if exists "Users can insert their own profile." on public.profiles;
drop policy if exists "Users can update own profile." on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users can view their own profile" on public.profiles;

create policy "Users can view their own profile"
on public.profiles for select
to authenticated
using ((select auth.uid()) = id);

create policy "Users can insert their own profile"
on public.profiles for insert
to authenticated
with check ((select auth.uid()) = id);

create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

revoke all privileges on table public.profiles from anon, authenticated;
grant select, insert, update on table public.profiles to authenticated;

drop policy if exists "Users can create their own todos." on public.todos;
drop policy if exists "Users can delete their own todos." on public.todos;
drop policy if exists "Users can update their own todos." on public.todos;
drop policy if exists "Users can view their own todos." on public.todos;

create policy "Users can view their own todos"
on public.todos for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own todos"
on public.todos for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own todos"
on public.todos for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own todos"
on public.todos for delete
to authenticated
using ((select auth.uid()) = user_id);

revoke all privileges on table public.todos from anon, authenticated;
grant select, insert, update, delete on table public.todos to authenticated;

create index if not exists idx_todos_user_id on public.todos (user_id);

-- Restrict mock-exam records to signed-in owners.
alter policy "users read own attempt events"
on public.mht_cet_mock_attempt_events
to authenticated;

alter policy "users read own attempt questions"
on public.mht_cet_mock_attempt_questions
to authenticated;

alter policy "users insert own attempts"
on public.mht_cet_mock_attempts
to authenticated;

alter policy "users read own attempts"
on public.mht_cet_mock_attempts
to authenticated;

alter policy "users update own attempts"
on public.mht_cet_mock_attempts
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

alter policy "users read own responses"
on public.mht_cet_mock_responses
to authenticated;

alter policy "users upsert own responses"
on public.mht_cet_mock_responses
to authenticated;

revoke all privileges on table
  public.mht_cet_mock_attempt_events,
  public.mht_cet_mock_attempt_questions,
  public.mht_cet_mock_attempts,
  public.mht_cet_mock_responses
from anon, authenticated;

grant select on table public.mht_cet_mock_attempt_events to authenticated;
grant select on table public.mht_cet_mock_attempt_questions to authenticated;
grant select, insert, update on table public.mht_cet_mock_attempts to authenticated;
grant select, insert, update on table public.mht_cet_mock_responses to authenticated;

create index if not exists idx_mht_cet_mock_attempt_events_user_id
on public.mht_cet_mock_attempt_events (user_id);

-- Bot ingestion is service-role only.
revoke all privileges on table
  public.bot_processed_events,
  public.bot_usage_events
from anon, authenticated;

-- Avatar downloads stay public, but only authenticated users may write inside
-- their own top-level folder.
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

create policy "Authenticated users can upload their own avatar"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and lower(storage.extension(name)) = any (array['jpg', 'jpeg', 'png', 'webp', 'gif'])
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
  and lower(storage.extension(name)) = any (array['jpg', 'jpeg', 'png', 'webp', 'gif'])
);

-- The trigger can execute without exposing its security-definer function as RPC.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
