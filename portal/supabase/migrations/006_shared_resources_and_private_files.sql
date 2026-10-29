-- Shared masterclass resource visibility + private 1-1 custom files

-- Any verified role can browse masterclass (shared resource) classes
drop policy if exists classes_select_shared_masterclass on public.classes;
create policy classes_select_shared_masterclass on public.classes
  for select using (
    coalesce(stream, 'masterclass') = 'masterclass'
    and public.current_role() in ('student', 'tutor', 'admin')
  );

-- Resource sets/files for shared masterclass classes follow class visibility via is_enrolled OR shared stream
drop policy if exists resource_sets_select_shared on public.resource_sets;
create policy resource_sets_select_shared on public.resource_sets
  for select using (
    exists (
      select 1 from public.classes c
      where c.id = class_id
        and coalesce(c.stream, 'masterclass') = 'masterclass'
        and public.current_role() in ('student', 'tutor', 'admin')
    )
    and (release_at is null or release_at <= now() or public.current_role() in ('tutor', 'admin'))
  );

drop policy if exists resource_files_select_shared on public.resource_files;
create policy resource_files_select_shared on public.resource_files
  for select using (
    exists (
      select 1
      from public.resource_sets s
      join public.classes c on c.id = s.class_id
      where s.id = set_id
        and coalesce(c.stream, 'masterclass') = 'masterclass'
        and public.current_role() in ('student', 'tutor', 'admin')
        and (s.release_at is null or s.release_at <= now() or public.current_role() in ('tutor', 'admin'))
    )
    and (
      kind <> 'solutions'
      or solutions_released_at is not null
      or public.current_role() in ('tutor', 'admin')
    )
  );

create table if not exists public.private_pair_files (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.profiles (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  title text not null default '',
  storage_path text not null,
  created_at timestamptz not null default now()
);

create index if not exists private_pair_files_pair_idx
  on public.private_pair_files (tutor_id, student_id);

alter table public.private_pair_files enable row level security;

drop policy if exists private_pair_files_select on public.private_pair_files;
create policy private_pair_files_select on public.private_pair_files
  for select using (
    public.current_role() = 'admin'
    or tutor_id = auth.uid()
    or student_id = auth.uid()
  );

drop policy if exists private_pair_files_write on public.private_pair_files;
create policy private_pair_files_write on public.private_pair_files
  for all using (
    public.current_role() = 'admin'
    or (
      public.current_role() = 'tutor'
      and tutor_id = auth.uid()
      and exists (
        select 1 from public.private_assignments pa
        where pa.tutor_id = auth.uid() and pa.student_id = private_pair_files.student_id
      )
    )
  )
  with check (
    public.current_role() = 'admin'
    or (
      public.current_role() = 'tutor'
      and tutor_id = auth.uid()
      and exists (
        select 1 from public.private_assignments pa
        where pa.tutor_id = auth.uid() and pa.student_id = student_id
      )
    )
  );
