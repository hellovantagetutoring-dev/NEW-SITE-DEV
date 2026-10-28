-- Vantage Student Portal schema (Supabase Free)
create extension if not exists "pgcrypto";

create type public.user_role as enum ('student', 'tutor', 'admin');
create type public.resource_kind as enum ('workbook', 'homework', 'mock', 'solutions');
create type public.session_type as enum ('masterclass', 'private');
create type public.reschedule_status as enum ('pending', 'approved', 'declined');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text not null default '',
  role public.user_role not null default 'student',
  last_sign_in_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject text not null,
  unit_band text not null default '',
  year_label text not null default '',
  created_at timestamptz not null default now()
);

create table public.enrolments (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  class_id uuid not null references public.classes (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, class_id)
);

create table public.class_tutors (
  class_id uuid not null references public.classes (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  primary key (class_id, profile_id)
);

create table public.resource_sets (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  code text not null,
  title text not null,
  section text not null default 'workbooks', -- workbooks | homework | mocks
  release_at timestamptz,
  cover_path text,
  sort_key text not null default '',
  created_at timestamptz not null default now(),
  unique (class_id, code, section)
);

create table public.resource_files (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references public.resource_sets (id) on delete cascade,
  kind public.resource_kind not null,
  storage_path text not null,
  solutions_released_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.download_events (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  file_id uuid not null references public.resource_files (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references public.classes (id) on delete set null,
  student_id uuid references public.profiles (id) on delete cascade,
  tutor_id uuid references public.profiles (id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  type public.session_type not null,
  title text not null default '',
  location_or_link text not null default '',
  created_at timestamptz not null default now()
);

create table public.reschedule_requests (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  preferred_slots text not null default '',
  note text not null default '',
  status public.reschedule_status not null default 'pending',
  created_at timestamptz not null default now()
);

create index download_events_code_idx on public.download_events (code);
create index sessions_starts_idx on public.sessions (starts_at);
create index resource_sets_class_idx on public.resource_sets (class_id, sort_key);

-- Helpers
create or replace function public.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_enrolled(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.enrolments e
    where e.profile_id = auth.uid() and e.class_id = cid
  ) or exists (
    select 1 from public.class_tutors t
    where t.profile_id = auth.uid() and t.class_id = cid
  ) or public.current_role() = 'admin';
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, last_sign_in_at)
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'student',
    now()
  )
  on conflict (id) do update
    set last_sign_in_at = now(),
        email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.enrolments enable row level security;
alter table public.class_tutors enable row level security;
alter table public.resource_sets enable row level security;
alter table public.resource_files enable row level security;
alter table public.download_events enable row level security;
alter table public.sessions enable row level security;
alter table public.reschedule_requests enable row level security;

create policy profiles_select_self_or_staff on public.profiles
  for select using (
    id = auth.uid()
    or public.current_role() in ('tutor', 'admin')
  );

create policy profiles_update_self on public.profiles
  for update using (id = auth.uid() or public.current_role() = 'admin');

create policy classes_select_enrolled on public.classes
  for select using (public.is_enrolled(id) or public.current_role() = 'admin');

create policy classes_admin_all on public.classes
  for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

create policy enrolments_select on public.enrolments
  for select using (
    profile_id = auth.uid()
    or public.current_role() in ('tutor', 'admin')
  );

create policy enrolments_admin on public.enrolments
  for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

create policy class_tutors_select on public.class_tutors
  for select using (public.is_enrolled(class_id) or public.current_role() = 'admin');

create policy class_tutors_admin on public.class_tutors
  for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

create policy resource_sets_select on public.resource_sets
  for select using (
    public.is_enrolled(class_id)
    and (release_at is null or release_at <= now() or public.current_role() in ('tutor', 'admin'))
  );

create policy resource_sets_write on public.resource_sets
  for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

create policy resource_files_select on public.resource_files
  for select using (
    exists (
      select 1 from public.resource_sets s
      where s.id = set_id and public.is_enrolled(s.class_id)
        and (s.release_at is null or s.release_at <= now() or public.current_role() in ('tutor', 'admin'))
    )
    and (
      kind <> 'solutions'
      or solutions_released_at is not null
      or public.current_role() in ('tutor', 'admin')
    )
  );

create policy resource_files_write on public.resource_files
  for all using (public.current_role() in ('tutor', 'admin'))
  with check (public.current_role() in ('tutor', 'admin'));

create policy download_events_select on public.download_events
  for select using (profile_id = auth.uid() or public.current_role() = 'admin');

create policy download_events_insert on public.download_events
  for insert with check (profile_id = auth.uid() or public.current_role() = 'admin');

create policy sessions_select on public.sessions
  for select using (
    student_id = auth.uid()
    or tutor_id = auth.uid()
    or public.current_role() = 'admin'
    or (class_id is not null and public.is_enrolled(class_id))
  );

create policy sessions_write on public.sessions
  for all using (public.current_role() in ('tutor', 'admin'))
  with check (public.current_role() in ('tutor', 'admin'));

create policy reschedule_select on public.reschedule_requests
  for select using (
    student_id = auth.uid()
    or public.current_role() in ('tutor', 'admin')
  );

create policy reschedule_insert on public.reschedule_requests
  for insert with check (student_id = auth.uid());

create policy reschedule_update_staff on public.reschedule_requests
  for update using (public.current_role() in ('tutor', 'admin'));
