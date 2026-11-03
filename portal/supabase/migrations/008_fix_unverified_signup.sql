-- Requires enum value 'unverified' (migration 005). If that was never applied, run first:
--   alter type public.user_role add value if not exists 'unverified';
-- then run this file in a new SQL session.

alter table public.profiles
  alter column role set default 'unverified';

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
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    'unverified',
    now()
  )
  on conflict (id) do update
    set last_sign_in_at = now(),
        email = excluded.email;
  return new;
end;
$$;

-- Repair cold sign-ups stuck as student with no class / pair access
update public.profiles p
set role = 'unverified'
where p.role = 'student'
  and not exists (
    select 1 from public.enrolments e where e.profile_id = p.id
  )
  and not exists (
    select 1 from public.private_assignments a where a.student_id = p.id
  )
  and not exists (
    select 1 from public.class_tutors t where t.profile_id = p.id
  );
