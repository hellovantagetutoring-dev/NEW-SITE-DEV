-- Role + subject + tier resource access (safe to re-run)

create extension if not exists "pgcrypto";

do $$ begin
  create type public.tutor_tier as enum ('academic_tutor', 'senior_tutor');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.enrollment_tier as enum ('private_1on1', 'masterclass', 'both');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.resource_category as enum (
    'core_resource',
    'mc_booklet_blank',
    'mc_solution',
    'mc_recording'
  );
exception when duplicate_object then null;
end $$;

alter table public.profiles
  add column if not exists tutor_tier public.tutor_tier;

alter table public.enrolments
  add column if not exists tier public.enrollment_tier;

update public.enrolments
set tier = 'masterclass'::public.enrollment_tier
where tier is null;

alter table public.enrolments
  alter column tier set default 'masterclass'::public.enrollment_tier;

alter table public.enrolments
  alter column tier set not null;

alter table public.resource_files
  add column if not exists category public.resource_category;

alter table public.resource_files
  add column if not exists video_url text;

-- Backfill categories (stream-aware when available)
update public.resource_files rf
set category = case
  when rf.kind::text = 'solutions' then 'mc_solution'::public.resource_category
  when rf.kind::text = 'workbook' and exists (
    select 1
    from public.resource_sets rs
    join public.classes c on c.id = rs.class_id
    where rs.id = rf.set_id
      and coalesce(c.stream, 'masterclass') = 'masterclass'
  ) then 'mc_booklet_blank'::public.resource_category
  else 'core_resource'::public.resource_category
end
where rf.category is null;

alter table public.resource_files
  alter column category set default 'core_resource'::public.resource_category;

update public.resource_files
set category = 'core_resource'::public.resource_category
where category is null;

alter table public.resource_files
  alter column category set not null;

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

insert into public.subjects (slug, name, description) values
  ('methods', 'Maths Methods', 'Mathematical Methods'),
  ('specialist', 'Specialist Maths', 'Specialist Mathematics'),
  ('chemistry', 'Chemistry', 'Chemistry'),
  ('physics', 'Physics', 'Physics'),
  ('literature', 'Literature', 'Literature'),
  ('english', 'English', 'English'),
  ('economics', 'Economics', 'Economics'),
  ('philosophy', 'Philosophy', 'Philosophy'),
  ('digital-solutions', 'Digital Solutions', 'Digital Solutions'),
  ('engineering', 'Engineering', 'Engineering'),
  ('japanese', 'Japanese', 'Japanese'),
  ('french', 'French', 'French'),
  ('spanish', 'Spanish', 'Spanish'),
  ('ucat', 'UCAT', 'UCAT preparation')
on conflict (slug) do nothing;

create table if not exists public.tutor_subjects (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.profiles (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  unique (tutor_id, subject_id)
);

create table if not exists public.resource_unlocks (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  resource_id uuid not null references public.resource_files (id) on delete cascade,
  unlocked_by uuid not null references public.profiles (id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  unique (student_id, resource_id)
);

create index if not exists resource_unlocks_student_idx on public.resource_unlocks (student_id);
create index if not exists resource_unlocks_resource_idx on public.resource_unlocks (resource_id);
create index if not exists tutor_subjects_tutor_idx on public.tutor_subjects (tutor_id);

alter table public.subjects enable row level security;
alter table public.tutor_subjects enable row level security;
alter table public.resource_unlocks enable row level security;

grant select on public.subjects to authenticated, anon;
grant all on public.subjects to service_role;
grant select on public.tutor_subjects to authenticated;
grant all on public.tutor_subjects to service_role;
grant select on public.resource_unlocks to authenticated;
grant all on public.resource_unlocks to service_role;

drop policy if exists subjects_select_all on public.subjects;
create policy subjects_select_all on public.subjects
  for select using (public.current_role() in ('student', 'tutor', 'admin'));

drop policy if exists subjects_admin_all on public.subjects;
create policy subjects_admin_all on public.subjects
  for all using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

drop policy if exists tutor_subjects_select on public.tutor_subjects;
create policy tutor_subjects_select on public.tutor_subjects
  for select using (
    tutor_id = auth.uid()
    or public.current_role() = 'admin'
  );

drop policy if exists tutor_subjects_admin on public.tutor_subjects;
create policy tutor_subjects_admin on public.tutor_subjects
  for all using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

drop policy if exists resource_unlocks_select on public.resource_unlocks;
create policy resource_unlocks_select on public.resource_unlocks
  for select using (
    student_id = auth.uid()
    or unlocked_by = auth.uid()
    or public.current_role() = 'admin'
    or (
      public.current_role() = 'tutor'
      and exists (
        select 1 from public.private_assignments pa
        where pa.tutor_id = auth.uid() and pa.student_id = resource_unlocks.student_id
      )
    )
  );

drop policy if exists resource_unlocks_write_staff on public.resource_unlocks;
create policy resource_unlocks_write_staff on public.resource_unlocks
  for all using (
    public.current_role() = 'admin'
    or (
      public.current_role() = 'tutor'
      and exists (
        select 1 from public.private_assignments pa
        where pa.tutor_id = auth.uid() and pa.student_id = resource_unlocks.student_id
      )
    )
  )
  with check (
    public.current_role() = 'admin'
    or (
      public.current_role() = 'tutor'
      and unlocked_by = auth.uid()
      and exists (
        select 1 from public.private_assignments pa
        where pa.tutor_id = auth.uid() and pa.student_id = student_id
      )
    )
  );

notify pgrst, 'reload schema';
