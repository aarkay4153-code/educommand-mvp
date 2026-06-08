-- Add module locking/unlocking support for EduCommand institutions.
-- Safe to run on an existing database.

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('principal', 'coordinator', 'teacher', 'management'));

create table if not exists public.school_modules (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete cascade,
  module_key text not null,
  is_enabled boolean not null default true,
  updated_at timestamp with time zone not null default now(),
  unique (school_id, module_key)
);

create index if not exists school_modules_school_key_idx on public.school_modules (school_id, module_key);

alter table public.school_modules enable row level security;

drop trigger if exists set_school_modules_updated_at on public.school_modules;
create trigger set_school_modules_updated_at
before update on public.school_modules
for each row execute function public.set_updated_at();

drop policy if exists "read own school modules" on public.school_modules;
create policy "read own school modules"
on public.school_modules for select
to authenticated
using (school_id = public.current_school_id());

drop policy if exists "principals insert school modules" on public.school_modules;
create policy "principals insert school modules"
on public.school_modules for insert
to authenticated
with check (school_id = public.current_school_id() and public.is_principal());

drop policy if exists "principals update school modules" on public.school_modules;
create policy "principals update school modules"
on public.school_modules for update
to authenticated
using (school_id = public.current_school_id() and public.is_principal())
with check (school_id = public.current_school_id() and public.is_principal());
