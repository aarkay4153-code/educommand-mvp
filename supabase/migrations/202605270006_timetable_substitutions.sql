-- ---------------------------------------------------------------------------
-- Timetable and Substitution
-- Daily class periods and simple substitution planning.
-- This does not replace the school events calendar.
-- ---------------------------------------------------------------------------

create table if not exists public.timetable_periods (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  class_section_id uuid references public.class_sections(id) on delete cascade,
  subject_id uuid references public.subjects(id),
  teacher_id uuid references public.profiles(id),
  day_of_week text not null check (day_of_week in ('monday','tuesday','wednesday','thursday','friday','saturday','sunday')),
  period_number integer not null check (period_number > 0),
  start_time time,
  end_time time,
  room text,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.substitutions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  date date not null,
  absent_teacher_id uuid references public.profiles(id),
  original_period_id uuid references public.timetable_periods(id) on delete cascade,
  substitute_teacher_id uuid references public.profiles(id),
  class_section_id uuid references public.class_sections(id),
  subject_id uuid references public.subjects(id),
  status text not null default 'suggested' check (status in ('suggested','assigned','acknowledged','completed','missed')),
  remarks text,
  created_by uuid references public.profiles(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

drop trigger if exists set_substitutions_updated_at on public.substitutions;
create trigger set_substitutions_updated_at
before update on public.substitutions
for each row execute function public.set_updated_at();

create index if not exists timetable_periods_school_day_idx on public.timetable_periods (school_id, day_of_week, period_number);
create index if not exists timetable_periods_teacher_day_idx on public.timetable_periods (teacher_id, day_of_week, period_number);
create index if not exists timetable_periods_class_day_idx on public.timetable_periods (class_section_id, day_of_week, period_number);
create index if not exists substitutions_school_date_idx on public.substitutions (school_id, date desc);
create index if not exists substitutions_substitute_date_idx on public.substitutions (substitute_teacher_id, date desc);
create index if not exists substitutions_absent_teacher_idx on public.substitutions (absent_teacher_id, date desc);
create index if not exists substitutions_status_idx on public.substitutions (school_id, status);

alter table public.timetable_periods enable row level security;
alter table public.substitutions enable row level security;

drop policy if exists "leaders read timetable periods" on public.timetable_periods;
create policy "leaders read timetable periods"
on public.timetable_periods for select
using (school_id = public.current_school_id() and public.is_school_leader());

drop policy if exists "teachers read own timetable periods" on public.timetable_periods;
create policy "teachers read own timetable periods"
on public.timetable_periods for select
using (school_id = public.current_school_id() and teacher_id = auth.uid());

drop policy if exists "leaders insert timetable periods" on public.timetable_periods;
create policy "leaders insert timetable periods"
on public.timetable_periods for insert
with check (school_id = public.current_school_id() and public.is_school_leader());

drop policy if exists "leaders update timetable periods" on public.timetable_periods;
create policy "leaders update timetable periods"
on public.timetable_periods for update
using (school_id = public.current_school_id() and public.is_school_leader())
with check (school_id = public.current_school_id() and public.is_school_leader());

drop policy if exists "leaders read substitutions" on public.substitutions;
create policy "leaders read substitutions"
on public.substitutions for select
using (school_id = public.current_school_id() and public.is_school_leader());

drop policy if exists "teachers read assigned substitutions" on public.substitutions;
create policy "teachers read assigned substitutions"
on public.substitutions for select
using (
  school_id = public.current_school_id()
  and (substitute_teacher_id = auth.uid() or absent_teacher_id = auth.uid())
);

drop policy if exists "leaders insert substitutions" on public.substitutions;
create policy "leaders insert substitutions"
on public.substitutions for insert
with check (school_id = public.current_school_id() and public.is_school_leader());

drop policy if exists "leaders update substitutions" on public.substitutions;
create policy "leaders update substitutions"
on public.substitutions for update
using (school_id = public.current_school_id() and public.is_school_leader())
with check (school_id = public.current_school_id() and public.is_school_leader());

drop policy if exists "teachers update own substitution duty" on public.substitutions;
create policy "teachers update own substitution duty"
on public.substitutions for update
using (school_id = public.current_school_id() and substitute_teacher_id = auth.uid())
with check (school_id = public.current_school_id() and substitute_teacher_id = auth.uid());

grant select, insert, update on public.timetable_periods, public.substitutions to authenticated;
