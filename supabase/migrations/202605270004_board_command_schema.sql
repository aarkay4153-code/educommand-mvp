-- Board Command schema for Class 10 and Class 12 readiness tracking.
-- Safe migration: creates missing dependency/table objects without replacing existing tables.

-- Minimal dependency table for Board Command student references.
-- If a richer students table already exists, this statement does nothing.
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete cascade,
  full_name text,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.board_students (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  board_class text check (board_class in ('class_10', 'class_12')),
  stream text check (stream in ('science', 'commerce', 'humanities', 'not_applicable')),
  subject_combination text,
  competitive_exam_focus boolean not null default false,
  target_score_percentage numeric,
  current_predicted_percentage numeric,
  risk_category text,
  improvement_trend text not null default 'unknown' check (improvement_trend in ('improving', 'stagnant', 'declining', 'unknown')),
  parent_intervention_required boolean not null default false,
  principal_intervention_required boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.board_subjects (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete cascade,
  board_class text check (board_class in ('class_10', 'class_12')),
  stream text,
  subject_name text not null,
  teacher_id uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.board_daily_inputs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete cascade,
  board_class text check (board_class in ('class_10', 'class_12')),
  subject_id uuid references public.board_subjects(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete set null,
  input_date date,
  topic_taught_today text,
  planned_syllabus_completed boolean,
  students_absent jsonb,
  students_struggled jsonb,
  students_performed_well jsonb,
  urgent_concern text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.board_weekly_inputs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete cascade,
  board_class text check (board_class in ('class_10', 'class_12')),
  subject_id uuid references public.board_subjects(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete set null,
  week_start_date date,
  week_end_date date,
  test_title text,
  test_marks_summary jsonb,
  weak_students jsonb,
  improving_students jsonb,
  declining_students jsonb,
  students_needing_extra_coaching jsonb,
  high_score_potential_students jsonb,
  main_weak_chapters text,
  remedial_class_attendance jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.board_monthly_inputs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete cascade,
  board_class text check (board_class in ('class_10', 'class_12')),
  subject_id uuid references public.board_subjects(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete set null,
  month text,
  syllabus_completion_percentage integer check (syllabus_completion_percentage between 0 and 100),
  revision_status text check (revision_status in ('not_started', 'started', 'in_progress', 'completed')),
  mock_preboard_performance_summary text,
  predicted_board_result text,
  students_needing_parent_meeting jsonb,
  students_needing_principal_intervention jsonb,
  top_academic_risks text,
  top_merit_prospects jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.board_alerts (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete cascade,
  board_class text check (board_class in ('class_10', 'class_12')),
  alert_type text,
  severity text check (severity in ('red', 'amber', 'green', 'blue')),
  title text,
  message text,
  related_student_id uuid references public.students(id) on delete set null,
  related_subject_id uuid references public.board_subjects(id) on delete set null,
  status text not null default 'new' check (status in ('new', 'acknowledged', 'resolved', 'dismissed')),
  created_at timestamp with time zone not null default now(),
  resolved_at timestamp with time zone
);

-- Timestamp triggers.
drop trigger if exists set_board_students_updated_at on public.board_students;
create trigger set_board_students_updated_at
before update on public.board_students
for each row execute function public.set_updated_at();

drop trigger if exists set_board_daily_inputs_updated_at on public.board_daily_inputs;
create trigger set_board_daily_inputs_updated_at
before update on public.board_daily_inputs
for each row execute function public.set_updated_at();

drop trigger if exists set_board_weekly_inputs_updated_at on public.board_weekly_inputs;
create trigger set_board_weekly_inputs_updated_at
before update on public.board_weekly_inputs
for each row execute function public.set_updated_at();

drop trigger if exists set_board_monthly_inputs_updated_at on public.board_monthly_inputs;
create trigger set_board_monthly_inputs_updated_at
before update on public.board_monthly_inputs
for each row execute function public.set_updated_at();

-- Useful indexes.
create index if not exists students_school_idx on public.students (school_id);

create index if not exists board_students_school_idx on public.board_students (school_id);
create index if not exists board_students_class_idx on public.board_students (board_class);
create index if not exists board_students_student_idx on public.board_students (student_id);

create index if not exists board_subjects_school_idx on public.board_subjects (school_id);
create index if not exists board_subjects_class_idx on public.board_subjects (board_class);
create index if not exists board_subjects_teacher_idx on public.board_subjects (teacher_id);

create index if not exists board_daily_inputs_school_idx on public.board_daily_inputs (school_id);
create index if not exists board_daily_inputs_class_idx on public.board_daily_inputs (board_class);
create index if not exists board_daily_inputs_teacher_idx on public.board_daily_inputs (teacher_id);
create index if not exists board_daily_inputs_subject_idx on public.board_daily_inputs (subject_id);
create index if not exists board_daily_inputs_date_idx on public.board_daily_inputs (input_date);

create index if not exists board_weekly_inputs_school_idx on public.board_weekly_inputs (school_id);
create index if not exists board_weekly_inputs_class_idx on public.board_weekly_inputs (board_class);
create index if not exists board_weekly_inputs_teacher_idx on public.board_weekly_inputs (teacher_id);
create index if not exists board_weekly_inputs_subject_idx on public.board_weekly_inputs (subject_id);
create index if not exists board_weekly_inputs_week_idx on public.board_weekly_inputs (week_start_date);

create index if not exists board_monthly_inputs_school_idx on public.board_monthly_inputs (school_id);
create index if not exists board_monthly_inputs_class_idx on public.board_monthly_inputs (board_class);
create index if not exists board_monthly_inputs_teacher_idx on public.board_monthly_inputs (teacher_id);
create index if not exists board_monthly_inputs_subject_idx on public.board_monthly_inputs (subject_id);
create index if not exists board_monthly_inputs_month_idx on public.board_monthly_inputs (month);

create index if not exists board_alerts_school_idx on public.board_alerts (school_id);
create index if not exists board_alerts_class_idx on public.board_alerts (board_class);
create index if not exists board_alerts_subject_idx on public.board_alerts (related_subject_id);
create index if not exists board_alerts_student_idx on public.board_alerts (related_student_id);

-- RLS.
alter table public.students enable row level security;
alter table public.board_students enable row level security;
alter table public.board_subjects enable row level security;
alter table public.board_daily_inputs enable row level security;
alter table public.board_weekly_inputs enable row level security;
alter table public.board_monthly_inputs enable row level security;
alter table public.board_alerts enable row level security;

-- Basic student reference access for leadership. Board student detail is intentionally leadership-scoped.
drop policy if exists "board students read by leaders" on public.students;
create policy "board students read by leaders"
on public.students for select
to authenticated
using (school_id = public.current_school_id() and public.is_school_leader());

drop policy if exists "principals manage students" on public.students;
create policy "principals manage students"
on public.students for all
to authenticated
using (school_id = public.current_school_id() and public.is_principal())
with check (school_id = public.current_school_id() and public.is_principal());

-- Principal can view and manage all Board Command data for their school.
drop policy if exists "principals manage board students" on public.board_students;
create policy "principals manage board students"
on public.board_students for all
to authenticated
using (school_id = public.current_school_id() and public.is_principal())
with check (school_id = public.current_school_id() and public.is_principal());

drop policy if exists "principals manage board subjects" on public.board_subjects;
create policy "principals manage board subjects"
on public.board_subjects for all
to authenticated
using (school_id = public.current_school_id() and public.is_principal())
with check (school_id = public.current_school_id() and public.is_principal());

drop policy if exists "principals manage board daily inputs" on public.board_daily_inputs;
create policy "principals manage board daily inputs"
on public.board_daily_inputs for all
to authenticated
using (school_id = public.current_school_id() and public.is_principal())
with check (school_id = public.current_school_id() and public.is_principal());

drop policy if exists "principals manage board weekly inputs" on public.board_weekly_inputs;
create policy "principals manage board weekly inputs"
on public.board_weekly_inputs for all
to authenticated
using (school_id = public.current_school_id() and public.is_principal())
with check (school_id = public.current_school_id() and public.is_principal());

drop policy if exists "principals manage board monthly inputs" on public.board_monthly_inputs;
create policy "principals manage board monthly inputs"
on public.board_monthly_inputs for all
to authenticated
using (school_id = public.current_school_id() and public.is_principal())
with check (school_id = public.current_school_id() and public.is_principal());

drop policy if exists "principals manage board alerts" on public.board_alerts;
create policy "principals manage board alerts"
on public.board_alerts for all
to authenticated
using (school_id = public.current_school_id() and public.is_principal())
with check (school_id = public.current_school_id() and public.is_principal());

-- Coordinator can view all Board Command data for their school.
drop policy if exists "coordinators read board students" on public.board_students;
create policy "coordinators read board students"
on public.board_students for select
to authenticated
using (school_id = public.current_school_id() and public.is_coordinator());

drop policy if exists "coordinators read board subjects" on public.board_subjects;
create policy "coordinators read board subjects"
on public.board_subjects for select
to authenticated
using (school_id = public.current_school_id() and public.is_coordinator());

drop policy if exists "coordinators read board daily inputs" on public.board_daily_inputs;
create policy "coordinators read board daily inputs"
on public.board_daily_inputs for select
to authenticated
using (school_id = public.current_school_id() and public.is_coordinator());

drop policy if exists "coordinators read board weekly inputs" on public.board_weekly_inputs;
create policy "coordinators read board weekly inputs"
on public.board_weekly_inputs for select
to authenticated
using (school_id = public.current_school_id() and public.is_coordinator());

drop policy if exists "coordinators read board monthly inputs" on public.board_monthly_inputs;
create policy "coordinators read board monthly inputs"
on public.board_monthly_inputs for select
to authenticated
using (school_id = public.current_school_id() and public.is_coordinator());

drop policy if exists "coordinators read board alerts" on public.board_alerts;
create policy "coordinators read board alerts"
on public.board_alerts for select
to authenticated
using (school_id = public.current_school_id() and public.is_coordinator());

-- Teacher can view own assigned board subjects and own submitted inputs.
drop policy if exists "teachers read own board subjects" on public.board_subjects;
create policy "teachers read own board subjects"
on public.board_subjects for select
to authenticated
using (school_id = public.current_school_id() and teacher_id = auth.uid());

drop policy if exists "teachers read own board daily inputs" on public.board_daily_inputs;
create policy "teachers read own board daily inputs"
on public.board_daily_inputs for select
to authenticated
using (school_id = public.current_school_id() and teacher_id = auth.uid());

drop policy if exists "teachers read own board weekly inputs" on public.board_weekly_inputs;
create policy "teachers read own board weekly inputs"
on public.board_weekly_inputs for select
to authenticated
using (school_id = public.current_school_id() and teacher_id = auth.uid());

drop policy if exists "teachers read own board monthly inputs" on public.board_monthly_inputs;
create policy "teachers read own board monthly inputs"
on public.board_monthly_inputs for select
to authenticated
using (school_id = public.current_school_id() and teacher_id = auth.uid());

-- Teacher can create and update only their own daily/weekly/monthly inputs.
drop policy if exists "teachers insert own board daily inputs" on public.board_daily_inputs;
create policy "teachers insert own board daily inputs"
on public.board_daily_inputs for insert
to authenticated
with check (school_id = public.current_school_id() and teacher_id = auth.uid());

drop policy if exists "teachers update own board daily inputs" on public.board_daily_inputs;
create policy "teachers update own board daily inputs"
on public.board_daily_inputs for update
to authenticated
using (school_id = public.current_school_id() and teacher_id = auth.uid())
with check (school_id = public.current_school_id() and teacher_id = auth.uid());

drop policy if exists "teachers insert own board weekly inputs" on public.board_weekly_inputs;
create policy "teachers insert own board weekly inputs"
on public.board_weekly_inputs for insert
to authenticated
with check (school_id = public.current_school_id() and teacher_id = auth.uid());

drop policy if exists "teachers update own board weekly inputs" on public.board_weekly_inputs;
create policy "teachers update own board weekly inputs"
on public.board_weekly_inputs for update
to authenticated
using (school_id = public.current_school_id() and teacher_id = auth.uid())
with check (school_id = public.current_school_id() and teacher_id = auth.uid());

drop policy if exists "teachers insert own board monthly inputs" on public.board_monthly_inputs;
create policy "teachers insert own board monthly inputs"
on public.board_monthly_inputs for insert
to authenticated
with check (school_id = public.current_school_id() and teacher_id = auth.uid());

drop policy if exists "teachers update own board monthly inputs" on public.board_monthly_inputs;
create policy "teachers update own board monthly inputs"
on public.board_monthly_inputs for update
to authenticated
using (school_id = public.current_school_id() and teacher_id = auth.uid())
with check (school_id = public.current_school_id() and teacher_id = auth.uid());

grant select, insert, update on
  public.students,
  public.board_students,
  public.board_subjects,
  public.board_daily_inputs,
  public.board_weekly_inputs,
  public.board_monthly_inputs,
  public.board_alerts
to authenticated;
