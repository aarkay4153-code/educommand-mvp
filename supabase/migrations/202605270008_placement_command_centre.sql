-- ---------------------------------------------------------------------------
-- Placement Command Centre
-- Internal placement readiness, recruiters, drives, offers and internships.
-- No external job portal integration.
-- ---------------------------------------------------------------------------

create table if not exists public.placement_profiles (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  branch text,
  year_of_study text,
  cgpa numeric,
  backlog_count integer not null default 0,
  resume_url text,
  skills text,
  coding_score numeric,
  aptitude_score numeric,
  communication_score numeric,
  placement_status text check (placement_status in ('not_registered','registered','training','eligible','placed','not_placed','higher_studies','entrepreneurship')),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.recruiters (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  company_name text,
  industry text,
  contact_person text,
  contact_email text,
  contact_phone text,
  remarks text,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.placement_drives (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  recruiter_id uuid references public.recruiters(id) on delete set null,
  drive_date date,
  role_title text,
  eligibility_criteria text,
  package_ctc numeric,
  status text check (status in ('planned','open','completed','cancelled')),
  created_at timestamp with time zone not null default now()
);

create table if not exists public.placement_offers (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  placement_drive_id uuid references public.placement_drives(id) on delete set null,
  company_name text,
  role_title text,
  ctc numeric,
  offer_letter_url text,
  status text check (status in ('offered','accepted','rejected','joined','not_joined')),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.internships (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  company_name text,
  role_title text,
  start_date date,
  end_date date,
  mode text check (mode in ('online','offline','hybrid')),
  stipend numeric,
  certificate_url text,
  status text check (status in ('applied','selected','ongoing','completed','rejected')),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

drop trigger if exists set_placement_profiles_updated_at on public.placement_profiles;
create trigger set_placement_profiles_updated_at
before update on public.placement_profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_placement_offers_updated_at on public.placement_offers;
create trigger set_placement_offers_updated_at
before update on public.placement_offers
for each row execute function public.set_updated_at();

drop trigger if exists set_internships_updated_at on public.internships;
create trigger set_internships_updated_at
before update on public.internships
for each row execute function public.set_updated_at();

create index if not exists placement_profiles_school_status_idx on public.placement_profiles (school_id, placement_status);
create index if not exists placement_profiles_branch_year_idx on public.placement_profiles (school_id, branch, year_of_study);
create index if not exists placement_profiles_student_idx on public.placement_profiles (student_id);
create index if not exists recruiters_school_company_idx on public.recruiters (school_id, company_name);
create index if not exists placement_drives_school_date_idx on public.placement_drives (school_id, drive_date desc);
create index if not exists placement_drives_recruiter_idx on public.placement_drives (recruiter_id);
create index if not exists placement_offers_school_status_idx on public.placement_offers (school_id, status);
create index if not exists placement_offers_student_idx on public.placement_offers (student_id);
create index if not exists internships_school_status_idx on public.internships (school_id, status);
create index if not exists internships_student_idx on public.internships (student_id);

alter table public.placement_profiles enable row level security;
alter table public.recruiters enable row level security;
alter table public.placement_drives enable row level security;
alter table public.placement_offers enable row level security;
alter table public.internships enable row level security;

drop policy if exists "placement users read own school placement profiles" on public.placement_profiles;
create policy "placement users read own school placement profiles"
on public.placement_profiles for select
using (school_id = public.current_school_id() and public.current_user_role() in ('principal','coordinator','management'));

drop policy if exists "leaders manage placement profiles" on public.placement_profiles;
create policy "leaders manage placement profiles"
on public.placement_profiles for all
using (school_id = public.current_school_id() and public.is_school_leader())
with check (school_id = public.current_school_id() and public.is_school_leader());

drop policy if exists "placement users read recruiters" on public.recruiters;
create policy "placement users read recruiters"
on public.recruiters for select
using (school_id = public.current_school_id() and public.current_user_role() in ('principal','coordinator','management'));

drop policy if exists "leaders manage recruiters" on public.recruiters;
create policy "leaders manage recruiters"
on public.recruiters for all
using (school_id = public.current_school_id() and public.is_school_leader())
with check (school_id = public.current_school_id() and public.is_school_leader());

drop policy if exists "placement users read drives" on public.placement_drives;
create policy "placement users read drives"
on public.placement_drives for select
using (school_id = public.current_school_id() and public.current_user_role() in ('principal','coordinator','management'));

drop policy if exists "leaders manage drives" on public.placement_drives;
create policy "leaders manage drives"
on public.placement_drives for all
using (school_id = public.current_school_id() and public.is_school_leader())
with check (school_id = public.current_school_id() and public.is_school_leader());

drop policy if exists "placement users read offers" on public.placement_offers;
create policy "placement users read offers"
on public.placement_offers for select
using (school_id = public.current_school_id() and public.current_user_role() in ('principal','coordinator','management'));

drop policy if exists "leaders manage offers" on public.placement_offers;
create policy "leaders manage offers"
on public.placement_offers for all
using (school_id = public.current_school_id() and public.is_school_leader())
with check (school_id = public.current_school_id() and public.is_school_leader());

drop policy if exists "placement users read internships" on public.internships;
create policy "placement users read internships"
on public.internships for select
using (school_id = public.current_school_id() and public.current_user_role() in ('principal','coordinator','management'));

drop policy if exists "leaders manage internships" on public.internships;
create policy "leaders manage internships"
on public.internships for all
using (school_id = public.current_school_id() and public.is_school_leader())
with check (school_id = public.current_school_id() and public.is_school_leader());

grant select, insert, update on
  public.placement_profiles,
  public.recruiters,
  public.placement_drives,
  public.placement_offers,
  public.internships
to authenticated;
