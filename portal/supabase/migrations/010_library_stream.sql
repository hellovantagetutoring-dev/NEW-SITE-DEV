-- Vantage Resource Library stream (shared mocks / retrieval / practice packs)
-- Safe to re-run.

do $$ begin
  alter type public.resource_category add value if not exists 'shared_library';
exception
  when undefined_object then null;
  when duplicate_object then null;
end $$;

do $$
begin
  -- Expand stream check to include library (drop old check if present).
  alter table public.classes drop constraint if exists classes_stream_check;
exception
  when undefined_object then null;
end $$;

alter table public.classes
  drop constraint if exists classes_stream_check;

alter table public.classes
  add constraint classes_stream_check
  check (stream in ('masterclass', 'private', 'library'));

-- Browse library classes like shared masterclass shelves (download still app-gated).
drop policy if exists classes_select_shared_library on public.classes;
create policy classes_select_shared_library on public.classes
  for select using (
    stream = 'library'
    and public.current_role() in ('student', 'tutor', 'admin')
  );

drop policy if exists resource_sets_select_shared_library on public.resource_sets;
create policy resource_sets_select_shared_library on public.resource_sets
  for select using (
    exists (
      select 1 from public.classes c
      where c.id = class_id
        and c.stream = 'library'
        and public.current_role() in ('student', 'tutor', 'admin')
    )
    and (release_at is null or release_at <= now() or public.current_role() in ('tutor', 'admin'))
  );

drop policy if exists resource_files_select_shared_library on public.resource_files;
create policy resource_files_select_shared_library on public.resource_files
  for select using (
    exists (
      select 1
      from public.resource_sets s
      join public.classes c on c.id = s.class_id
      where s.id = set_id
        and c.stream = 'library'
        and public.current_role() in ('student', 'tutor', 'admin')
        and (s.release_at is null or s.release_at <= now() or public.current_role() in ('tutor', 'admin'))
    )
    and (
      kind <> 'solutions'
      or solutions_released_at is not null
      or public.current_role() in ('tutor', 'admin')
    )
  );
