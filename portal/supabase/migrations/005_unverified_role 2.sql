-- Role for people who signed in without being enrolled / authorised

do $$
begin
  if not exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'user_role' and e.enumlabel = 'unverified'
  ) then
    alter type public.user_role add value 'unverified';
  end if;
end $$;

-- New self-serve sign-ins default to unverified until Admin enrols them
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
    'unverified',
    now()
  )
  on conflict (id) do update
    set last_sign_in_at = now(),
        email = excluded.email;
  return new;
end;
$$;
