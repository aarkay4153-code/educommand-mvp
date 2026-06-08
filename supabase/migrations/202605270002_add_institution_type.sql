-- Add institution operating mode to existing EduCommand installations.
-- Safe to run on an existing database: adds the column only if it does not exist,
-- then adds the allowed-value check constraint only if it does not exist.

alter table public.schools
  add column if not exists institution_type text not null default 'school';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'schools_institution_type_check'
      and conrelid = 'public.schools'::regclass
  ) then
    alter table public.schools
      add constraint schools_institution_type_check
      check (institution_type in ('school', 'college', 'coaching_centre', 'training_institute'));
  end if;
end $$;
