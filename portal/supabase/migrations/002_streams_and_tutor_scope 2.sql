-- Streams + tutor 1-1 assignments (run in Supabase SQL Editor after 001)

alter table public.classes
  add column if not exists stream text not null default 'masterclass'
  check (stream in ('masterclass', 'private'));

create table if not exists public.private_assignments (
  tutor_id uuid not null references public.profiles (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  subject text not null default '',
  note text not null default '',
  created_at timestamptz not null default now(),
  primary key (tutor_id, student_id)
);

create index if not exists private_assignments_student_idx
  on public.private_assignments (student_id);

alter table public.private_assignments enable row level security;

create policy private_assignments_select on public.private_assignments
  for select using (
    tutor_id = auth.uid()
    or student_id = auth.uid()
    or public.current_role() = 'admin'
  );

create policy private_assignments_admin on public.private_assignments
  for all using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

-- Tutors may insert/update sessions for their assigned private students
drop policy if exists sessions_write on public.sessions;
create policy sessions_write on public.sessions
  for all using (
    public.current_role() = 'admin'
    or (
      public.current_role() = 'tutor'
      and (
        tutor_id = auth.uid()
        or exists (
          select 1 from public.private_assignments pa
          where pa.tutor_id = auth.uid()
            and pa.student_id = sessions.student_id
        )
      )
    )
  )
  with check (
    public.current_role() = 'admin'
    or (
      public.current_role() = 'tutor'
      and tutor_id = auth.uid()
      and (
        student_id is null
        or exists (
          select 1 from public.private_assignments pa
          where pa.tutor_id = auth.uid()
            and pa.student_id = student_id
        )
      )
    )
  );

-- Resource file writes: admin only (tutors do not upload/release)
drop policy if exists resource_files_write on public.resource_files;
create policy resource_files_write on public.resource_files
  for all using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');
