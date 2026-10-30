-- Calendar admin: reschedule proposals, feed tokens, indexes, RLS

alter table public.profiles
  add column if not exists calendar_feed_token text unique;

alter table public.reschedule_requests
  add column if not exists requested_by uuid references public.profiles (id) on delete set null;

alter table public.reschedule_requests
  add column if not exists proposed_starts timestamptz[] not null default '{}';

alter table public.reschedule_requests
  add column if not exists proposed_duration_minutes int not null default 60;

alter table public.reschedule_requests
  add column if not exists accepted_start timestamptz;

create index if not exists sessions_tutor_starts_idx
  on public.sessions (tutor_id, starts_at);

create index if not exists sessions_student_starts_idx
  on public.sessions (student_id, starts_at);

create index if not exists sessions_range_idx
  on public.sessions (starts_at, ends_at);

create index if not exists profiles_feed_token_idx
  on public.profiles (calendar_feed_token)
  where calendar_feed_token is not null;

-- Reschedule: party to the session (student or tutor) or admin may insert
drop policy if exists reschedule_insert on public.reschedule_requests;
create policy reschedule_insert on public.reschedule_requests
  for insert with check (
    public.current_role() = 'admin'
    or exists (
      select 1 from public.sessions s
      where s.id = session_id
        and (s.student_id = auth.uid() or s.tutor_id = auth.uid())
    )
  );

drop policy if exists reschedule_select on public.reschedule_requests;
create policy reschedule_select on public.reschedule_requests
  for select using (
    requested_by = auth.uid()
    or student_id = auth.uid()
    or public.current_role() = 'admin'
    or exists (
      select 1 from public.sessions s
      where s.id = session_id and s.tutor_id = auth.uid()
    )
  );

drop policy if exists reschedule_update_staff on public.reschedule_requests;
create policy reschedule_update_staff on public.reschedule_requests
  for update using (
    public.current_role() = 'admin'
    or exists (
      select 1 from public.sessions s
      where s.id = session_id
        and (s.tutor_id = auth.uid() or s.student_id = auth.uid())
    )
  );

-- Ensure every profile can get a feed token lazily via app; helper optional
create or replace function public.ensure_calendar_feed_token(pid uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  tok text;
begin
  select calendar_feed_token into tok from public.profiles where id = pid;
  if tok is null or tok = '' then
    tok := encode(gen_random_bytes(24), 'hex');
    update public.profiles set calendar_feed_token = tok where id = pid;
  end if;
  return tok;
end;
$$;
