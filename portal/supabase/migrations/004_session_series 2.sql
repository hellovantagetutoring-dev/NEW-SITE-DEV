-- Recurring weekly schedule for tutoring pairs / classes

create table if not exists public.session_series (
  id uuid primary key default gen_random_uuid(),
  type public.session_type not null default 'private',
  tutor_id uuid references public.profiles (id) on delete cascade,
  student_id uuid references public.profiles (id) on delete cascade,
  class_id uuid references public.classes (id) on delete set null,
  title text not null default '',
  weekday int not null check (weekday between 0 and 6),
  time_local text not null default '16:00',
  duration_minutes int not null default 60,
  location_or_link text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists session_series_pair_idx
  on public.session_series (tutor_id, student_id)
  where active = true;

alter table public.sessions
  add column if not exists series_id uuid references public.session_series (id) on delete set null;

create index if not exists sessions_series_idx
  on public.sessions (series_id)
  where series_id is not null;

alter table public.session_series enable row level security;

drop policy if exists session_series_select on public.session_series;
create policy session_series_select on public.session_series
  for select using (
    public.current_role() = 'admin'
    or tutor_id = auth.uid()
    or student_id = auth.uid()
    or (class_id is not null and public.is_enrolled(class_id))
  );

drop policy if exists session_series_write on public.session_series;
create policy session_series_write on public.session_series
  for all using (
    public.current_role() = 'admin'
    or (
      public.current_role() = 'tutor'
      and tutor_id = auth.uid()
    )
  )
  with check (
    public.current_role() = 'admin'
    or (
      public.current_role() = 'tutor'
      and tutor_id = auth.uid()
    )
  );
