-- Student profile fields (admin-managed)
alter table public.profiles
  add column if not exists year_level text not null default '',
  add column if not exists subjects text[] not null default '{}';

comment on column public.profiles.year_level is 'School year level for students (e.g. Year 11); admin-managed';
comment on column public.profiles.subjects is 'Subjects the student takes; admin-managed';
