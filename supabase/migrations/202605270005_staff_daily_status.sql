-- ---------------------------------------------------------------------------
-- Daily Staff Status Board
-- A daily command visibility board for school/college leaders.
-- This is not payroll and not biometric attendance.
-- ---------------------------------------------------------------------------

create table if not exists public.staff_daily_status (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  staff_id uuid not null references public.profiles(id) on delete cascade,
  status_date date not null,
  status text not null check (status in ('present','absent','leave','late','half_day','on_duty','training','exam_duty')),
  arrival_time time,
  remarks text,
  substitution_required boolean not null default false,
  recorded_by uuid references public.profiles(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint staff_daily_status_school_staff_date_key unique (school_id, staff_id, status_date)
);

drop trigger if exists set_staff_daily_status_updated_at on public.staff_daily_status;
create trigger set_staff_daily_status_updated_at
before update on public.staff_daily_status
for each row execute function public.set_updated_at();

create index if not exists staff_daily_status_school_date_idx on public.staff_daily_status (school_id, status_date desc);
create index if not exists staff_daily_status_staff_date_idx on public.staff_daily_status (staff_id, status_date desc);
create index if not exists staff_daily_status_school_status_idx on public.staff_daily_status (school_id, status);
create index if not exists staff_daily_status_substitution_idx on public.staff_daily_status (school_id, substitution_required);

alter table public.staff_daily_status enable row level security;

drop policy if exists "leaders read staff daily status" on public.staff_daily_status;
create policy "leaders read staff daily status"
on public.staff_daily_status for select
using (
  school_id = public.current_school_id()
  and public.is_school_leader()
);

drop policy if exists "teachers read own daily status" on public.staff_daily_status;
create policy "teachers read own daily status"
on public.staff_daily_status for select
using (
  school_id = public.current_school_id()
  and staff_id = auth.uid()
);

drop policy if exists "leaders insert staff daily status" on public.staff_daily_status;
create policy "leaders insert staff daily status"
on public.staff_daily_status for insert
with check (
  school_id = public.current_school_id()
  and public.is_school_leader()
);

drop policy if exists "leaders update staff daily status" on public.staff_daily_status;
create policy "leaders update staff daily status"
on public.staff_daily_status for update
using (
  school_id = public.current_school_id()
  and public.is_school_leader()
)
with check (
  school_id = public.current_school_id()
  and public.is_school_leader()
);

grant select, insert, update on public.staff_daily_status to authenticated;
