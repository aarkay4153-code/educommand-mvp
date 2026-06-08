-- ---------------------------------------------------------------------------
-- Accreditation Readiness
-- NAAC/NBA/AICTE-style readiness tracker and evidence repository.
-- This does not claim official accreditation compliance.
-- ---------------------------------------------------------------------------

create table if not exists public.accreditation_criteria (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  accreditation_type text check (accreditation_type in ('naac','nba','aicte','university','internal')),
  criterion_code text,
  criterion_title text,
  description text,
  owner_id uuid references public.profiles(id),
  target_date date,
  status text check (status in ('not_started','in_progress','completed','delayed','needs_review')),
  completion_percentage integer not null default 0 check (completion_percentage between 0 and 100),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.accreditation_evidence (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  criterion_id uuid references public.accreditation_criteria(id) on delete cascade,
  evidence_title text,
  evidence_description text,
  file_url text,
  uploaded_by uuid references public.profiles(id),
  status text check (status in ('uploaded','verified','rejected','needs_revision')),
  remarks text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

drop trigger if exists set_accreditation_criteria_updated_at on public.accreditation_criteria;
create trigger set_accreditation_criteria_updated_at
before update on public.accreditation_criteria
for each row execute function public.set_updated_at();

drop trigger if exists set_accreditation_evidence_updated_at on public.accreditation_evidence;
create trigger set_accreditation_evidence_updated_at
before update on public.accreditation_evidence
for each row execute function public.set_updated_at();

create index if not exists accreditation_criteria_school_type_idx on public.accreditation_criteria (school_id, accreditation_type);
create index if not exists accreditation_criteria_owner_idx on public.accreditation_criteria (owner_id);
create index if not exists accreditation_criteria_status_idx on public.accreditation_criteria (school_id, status);
create index if not exists accreditation_evidence_school_status_idx on public.accreditation_evidence (school_id, status);
create index if not exists accreditation_evidence_criterion_idx on public.accreditation_evidence (criterion_id);

alter table public.accreditation_criteria enable row level security;
alter table public.accreditation_evidence enable row level security;

drop policy if exists "accreditation users read criteria" on public.accreditation_criteria;
create policy "accreditation users read criteria"
on public.accreditation_criteria for select
using (school_id = public.current_school_id() and public.current_user_role() in ('principal','coordinator','management'));

drop policy if exists "leaders manage accreditation criteria" on public.accreditation_criteria;
create policy "leaders manage accreditation criteria"
on public.accreditation_criteria for all
using (school_id = public.current_school_id() and public.is_school_leader())
with check (school_id = public.current_school_id() and public.is_school_leader());

drop policy if exists "accreditation users read evidence" on public.accreditation_evidence;
create policy "accreditation users read evidence"
on public.accreditation_evidence for select
using (school_id = public.current_school_id() and public.current_user_role() in ('principal','coordinator','management'));

drop policy if exists "leaders manage accreditation evidence" on public.accreditation_evidence;
create policy "leaders manage accreditation evidence"
on public.accreditation_evidence for all
using (school_id = public.current_school_id() and public.is_school_leader())
with check (school_id = public.current_school_id() and public.is_school_leader());

grant select, insert, update on public.accreditation_criteria, public.accreditation_evidence to authenticated;
