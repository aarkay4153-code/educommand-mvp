-- EduCommand MVP Supabase schema
-- Designed for one school at launch, with school_id on every operational table for multi-school support later.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Core school and user profile tables
-- ---------------------------------------------------------------------------
create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  city text,
  state text,
  board text,
  institution_type text not null default 'school' check (
    institution_type in ('school', 'college', 'coaching_centre', 'training_institute')
  ),
  established_year integer,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  school_id uuid references public.schools(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  role text not null check (role in ('principal', 'coordinator', 'teacher', 'management')),
  department text,
  designation text,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now()
);

-- ---------------------------------------------------------------------------
-- Academic structure
-- ---------------------------------------------------------------------------
create table if not exists public.class_sections (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete cascade,
  class_name text not null,
  section text,
  academic_year text,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete cascade,
  subject_name text not null,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.teacher_assignments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  class_section_id uuid references public.class_sections(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  academic_year text,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.school_modules (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete cascade,
  module_key text not null,
  is_enabled boolean not null default true,
  updated_at timestamp with time zone not null default now(),
  unique (school_id, module_key)
);

-- ---------------------------------------------------------------------------
-- Syllabus coverage tracking
-- ---------------------------------------------------------------------------
create table if not exists public.syllabus_updates (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  class_section_id uuid references public.class_sections(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  week_start_date date,
  week_end_date date,
  planned_portion text,
  completed_portion text,
  completion_percentage integer not null default 0 check (completion_percentage between 0 and 100),
  status text not null default 'not_started' check (status in ('on_track', 'behind', 'completed', 'not_started')),
  delay_reason text,
  next_week_target text,
  proof_url text,
  submitted_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  check (week_end_date is null or week_start_date is null or week_end_date >= week_start_date)
);

-- ---------------------------------------------------------------------------
-- Task delegation tracking
-- ---------------------------------------------------------------------------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete cascade,
  title text not null,
  description text,
  assigned_by uuid references public.profiles(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null,
  due_date date,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  status text not null default 'assigned' check (
    status in ('assigned', 'acknowledged', 'in_progress', 'submitted', 'returned', 'completed', 'delayed', 'overdue')
  ),
  delay_reason text,
  proof_required boolean not null default false,
  proof_url text,
  remarks text,
  completion_percentage integer not null default 0 check (completion_percentage between 0 and 100),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- ---------------------------------------------------------------------------
-- School calendar and event readiness tracking
-- ---------------------------------------------------------------------------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete cascade,
  event_name text not null,
  description text,
  event_date date not null,
  intensity text not null default 'medium' check (intensity in ('low', 'medium', 'high')),
  owner_id uuid references public.profiles(id) on delete set null,
  status text not null default 'planned' check (
    status in ('planned', 'in_progress', 'completed', 'delayed', 'at_risk', 'cancelled')
  ),
  completion_percentage integer not null default 0 check (completion_percentage between 0 and 100),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.event_milestones (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete cascade,
  event_id uuid references public.events(id) on delete cascade,
  title text not null,
  description text,
  owner_id uuid references public.profiles(id) on delete set null,
  due_date date,
  status text not null default 'not_started' check (
    status in ('not_started', 'in_progress', 'completed', 'delayed', 'blocked')
  ),
  proof_url text,
  delay_reason text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- ---------------------------------------------------------------------------
-- Institution brief and generated reports
-- ---------------------------------------------------------------------------
create table if not exists public.institution_profile (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete cascade,
  vision text,
  mission text,
  total_students integer,
  total_teachers integer,
  total_admin_staff integer,
  total_classes integer,
  infrastructure_summary text,
  achievements text,
  special_programs text,
  contact_email text,
  contact_phone text,
  website text,
  updated_at timestamp with time zone not null default now(),
  check (total_students is null or total_students >= 0),
  check (total_teachers is null or total_teachers >= 0),
  check (total_admin_staff is null or total_admin_staff >= 0),
  check (total_classes is null or total_classes >= 0)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete cascade,
  title text,
  report_type text,
  generated_by uuid references public.profiles(id) on delete set null,
  content jsonb,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  entity_type text,
  entity_id uuid,
  action text,
  old_value jsonb,
  new_value jsonb,
  created_at timestamp with time zone not null default now()
);

-- ---------------------------------------------------------------------------
-- Supabase Storage bucket for proof uploads
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'proof-uploads',
  'proof-uploads',
  true,
  5242880,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- Timestamp maintenance
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_tasks_updated_at on public.tasks;
create trigger set_tasks_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

drop trigger if exists set_events_updated_at on public.events;
create trigger set_events_updated_at
before update on public.events
for each row execute function public.set_updated_at();

drop trigger if exists set_event_milestones_updated_at on public.event_milestones;
create trigger set_event_milestones_updated_at
before update on public.event_milestones
for each row execute function public.set_updated_at();

drop trigger if exists set_institution_profile_updated_at on public.institution_profile;
create trigger set_institution_profile_updated_at
before update on public.institution_profile
for each row execute function public.set_updated_at();

drop trigger if exists set_school_modules_updated_at on public.school_modules;
create trigger set_school_modules_updated_at
before update on public.school_modules
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Useful indexes for dashboard filters, ownership checks, and reporting
-- ---------------------------------------------------------------------------
create index if not exists schools_name_idx on public.schools (name);
create index if not exists profiles_school_id_idx on public.profiles (school_id);
create index if not exists profiles_school_role_idx on public.profiles (school_id, role);
create index if not exists profiles_email_idx on public.profiles (email);
create index if not exists class_sections_school_year_idx on public.class_sections (school_id, academic_year);
create index if not exists subjects_school_name_idx on public.subjects (school_id, subject_name);
create index if not exists teacher_assignments_school_teacher_idx on public.teacher_assignments (school_id, teacher_id);
create index if not exists teacher_assignments_class_subject_idx on public.teacher_assignments (class_section_id, subject_id);
create index if not exists school_modules_school_key_idx on public.school_modules (school_id, module_key);
create index if not exists syllabus_updates_school_week_idx on public.syllabus_updates (school_id, week_start_date desc);
create index if not exists syllabus_updates_teacher_week_idx on public.syllabus_updates (teacher_id, week_start_date desc);
create index if not exists syllabus_updates_class_subject_idx on public.syllabus_updates (class_section_id, subject_id);
create index if not exists tasks_school_status_due_idx on public.tasks (school_id, status, due_date);
create index if not exists tasks_assigned_to_idx on public.tasks (assigned_to);
create index if not exists tasks_assigned_by_idx on public.tasks (assigned_by);
create index if not exists events_school_date_idx on public.events (school_id, event_date);
create index if not exists events_owner_idx on public.events (owner_id);
create index if not exists event_milestones_event_idx on public.event_milestones (event_id);
create index if not exists event_milestones_owner_status_idx on public.event_milestones (owner_id, status);
create index if not exists institution_profile_school_idx on public.institution_profile (school_id);
create index if not exists reports_school_type_idx on public.reports (school_id, report_type, created_at desc);
create index if not exists activity_logs_entity_idx on public.activity_logs (school_id, entity_type, entity_id, created_at desc);
create index if not exists activity_logs_actor_idx on public.activity_logs (actor_id, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS helper functions
-- These keep policies readable. They return values from the signed-in user's profile.
-- ---------------------------------------------------------------------------
create or replace function public.current_school_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select school_id
  from public.profiles
  where id = auth.uid()
    and is_active = true
  limit 1
$$;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
    and is_active = true
  limit 1
$$;

create or replace function public.is_principal()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'principal', false)
$$;

create or replace function public.is_coordinator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'coordinator', false)
$$;

create or replace function public.is_school_leader()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() in ('principal', 'coordinator'), false)
$$;

-- ---------------------------------------------------------------------------
-- Enable Row Level Security
-- ---------------------------------------------------------------------------
alter table public.schools enable row level security;
alter table public.profiles enable row level security;
alter table public.class_sections enable row level security;
alter table public.subjects enable row level security;
alter table public.teacher_assignments enable row level security;
alter table public.school_modules enable row level security;
alter table public.syllabus_updates enable row level security;
alter table public.tasks enable row level security;
alter table public.events enable row level security;
alter table public.event_milestones enable row level security;
alter table public.institution_profile enable row level security;
alter table public.reports enable row level security;
alter table public.activity_logs enable row level security;

-- ---------------------------------------------------------------------------
-- Storage policies for proof uploads
-- Files must live under school_id/module/record_id/filename.
-- ---------------------------------------------------------------------------
create policy "Users can read proof files for own school"
on storage.objects for select
to authenticated
using (
  bucket_id = 'proof-uploads'
  and split_part(name, '/', 1) = public.current_school_id()::text
);

create policy "Users can upload proof files for own school"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'proof-uploads'
  and split_part(name, '/', 1) = public.current_school_id()::text
);

create policy "Users can update proof files for own school"
on storage.objects for update
to authenticated
using (
  bucket_id = 'proof-uploads'
  and split_part(name, '/', 1) = public.current_school_id()::text
)
with check (
  bucket_id = 'proof-uploads'
  and split_part(name, '/', 1) = public.current_school_id()::text
);

-- ---------------------------------------------------------------------------
-- Read policies: authenticated users can read records from their own school.
-- ---------------------------------------------------------------------------
create policy "read own school"
on public.schools for select
to authenticated
using (id = public.current_school_id());

create policy "read own school profiles"
on public.profiles for select
to authenticated
using (school_id = public.current_school_id());

create policy "read own school class sections"
on public.class_sections for select
to authenticated
using (school_id = public.current_school_id());

create policy "read own school subjects"
on public.subjects for select
to authenticated
using (school_id = public.current_school_id());

create policy "read own school teacher assignments"
on public.teacher_assignments for select
to authenticated
using (school_id = public.current_school_id());

create policy "read own school modules"
on public.school_modules for select
to authenticated
using (school_id = public.current_school_id());

create policy "read own school syllabus updates"
on public.syllabus_updates for select
to authenticated
using (
  school_id = public.current_school_id()
  and (
    public.is_school_leader()
    or teacher_id = auth.uid()
  )
);

create policy "read own school tasks"
on public.tasks for select
to authenticated
using (
  school_id = public.current_school_id()
  and (
    public.is_school_leader()
    or assigned_to = auth.uid()
    or assigned_by = auth.uid()
  )
);

create policy "read own school events"
on public.events for select
to authenticated
using (school_id = public.current_school_id());

create policy "read own school event milestones"
on public.event_milestones for select
to authenticated
using (
  school_id = public.current_school_id()
  and (
    public.is_school_leader()
    or owner_id = auth.uid()
  )
);

create policy "read own school institution profile"
on public.institution_profile for select
to authenticated
using (school_id = public.current_school_id());

create policy "read own school reports"
on public.reports for select
to authenticated
using (school_id = public.current_school_id());

create policy "read own school activity logs"
on public.activity_logs for select
to authenticated
using (school_id = public.current_school_id());

-- ---------------------------------------------------------------------------
-- Principal policies: principals can insert and update most records in their school.
-- ---------------------------------------------------------------------------
create policy "principals update own school"
on public.schools for update
to authenticated
using (id = public.current_school_id() and public.is_principal())
with check (id = public.current_school_id() and public.is_principal());

create policy "principals insert profiles"
on public.profiles for insert
to authenticated
with check (school_id = public.current_school_id() and public.is_principal());

create policy "principals update profiles"
on public.profiles for update
to authenticated
using (school_id = public.current_school_id() and public.is_principal())
with check (school_id = public.current_school_id() and public.is_principal());

create policy "principals insert class sections"
on public.class_sections for insert
to authenticated
with check (school_id = public.current_school_id() and public.is_principal());

create policy "principals update class sections"
on public.class_sections for update
to authenticated
using (school_id = public.current_school_id() and public.is_principal())
with check (school_id = public.current_school_id() and public.is_principal());

create policy "principals insert subjects"
on public.subjects for insert
to authenticated
with check (school_id = public.current_school_id() and public.is_principal());

create policy "principals update subjects"
on public.subjects for update
to authenticated
using (school_id = public.current_school_id() and public.is_principal())
with check (school_id = public.current_school_id() and public.is_principal());

create policy "principals insert teacher assignments"
on public.teacher_assignments for insert
to authenticated
with check (school_id = public.current_school_id() and public.is_principal());

create policy "principals update teacher assignments"
on public.teacher_assignments for update
to authenticated
using (school_id = public.current_school_id() and public.is_principal())
with check (school_id = public.current_school_id() and public.is_principal());

create policy "principals insert school modules"
on public.school_modules for insert
to authenticated
with check (school_id = public.current_school_id() and public.is_principal());

create policy "principals update school modules"
on public.school_modules for update
to authenticated
using (school_id = public.current_school_id() and public.is_principal())
with check (school_id = public.current_school_id() and public.is_principal());

create policy "principals insert institution profile"
on public.institution_profile for insert
to authenticated
with check (school_id = public.current_school_id() and public.is_principal());

create policy "principals update institution profile"
on public.institution_profile for update
to authenticated
using (school_id = public.current_school_id() and public.is_principal())
with check (school_id = public.current_school_id() and public.is_principal());

create policy "principals insert reports"
on public.reports for insert
to authenticated
with check (
  school_id = public.current_school_id()
  and public.is_school_leader()
  and generated_by = auth.uid()
);

create policy "users insert own school activity logs"
on public.activity_logs for insert
to authenticated
with check (
  school_id = public.current_school_id()
  and actor_id = auth.uid()
);

-- ---------------------------------------------------------------------------
-- Principal and coordinator policies for operational records.
-- Coordinators can manage tasks, events, milestones, and syllabus review records.
-- ---------------------------------------------------------------------------
create policy "leaders insert syllabus updates"
on public.syllabus_updates for insert
to authenticated
with check (school_id = public.current_school_id() and public.is_school_leader());

create policy "leaders update syllabus updates"
on public.syllabus_updates for update
to authenticated
using (school_id = public.current_school_id() and public.is_school_leader())
with check (school_id = public.current_school_id() and public.is_school_leader());

create policy "leaders insert tasks"
on public.tasks for insert
to authenticated
with check (school_id = public.current_school_id() and public.is_school_leader());

create policy "leaders update tasks"
on public.tasks for update
to authenticated
using (school_id = public.current_school_id() and public.is_school_leader())
with check (school_id = public.current_school_id() and public.is_school_leader());

create policy "leaders insert events"
on public.events for insert
to authenticated
with check (school_id = public.current_school_id() and public.is_school_leader());

create policy "leaders update events"
on public.events for update
to authenticated
using (school_id = public.current_school_id() and public.is_school_leader())
with check (school_id = public.current_school_id() and public.is_school_leader());

create policy "leaders insert event milestones"
on public.event_milestones for insert
to authenticated
with check (school_id = public.current_school_id() and public.is_school_leader());

create policy "leaders update event milestones"
on public.event_milestones for update
to authenticated
using (school_id = public.current_school_id() and public.is_school_leader())
with check (school_id = public.current_school_id() and public.is_school_leader());

-- ---------------------------------------------------------------------------
-- Teacher policies: teachers can submit their syllabus updates and update assigned work.
-- ---------------------------------------------------------------------------
create policy "teachers insert own syllabus updates"
on public.syllabus_updates for insert
to authenticated
with check (
  school_id = public.current_school_id()
  and public.current_user_role() = 'teacher'
  and teacher_id = auth.uid()
);

create policy "teachers update assigned tasks"
on public.tasks for update
to authenticated
using (
  school_id = public.current_school_id()
  and public.current_user_role() = 'teacher'
  and assigned_to = auth.uid()
)
with check (
  school_id = public.current_school_id()
  and public.current_user_role() = 'teacher'
  and assigned_to = auth.uid()
);

create policy "teachers update assigned event milestones"
on public.event_milestones for update
to authenticated
using (
  school_id = public.current_school_id()
  and public.current_user_role() = 'teacher'
  and owner_id = auth.uid()
)
with check (
  school_id = public.current_school_id()
  and public.current_user_role() = 'teacher'
  and owner_id = auth.uid()
);

-- ---------------------------------------------------------------------------
-- Grants
-- RLS decides row access; these grants let authenticated app users reach the tables.
-- ---------------------------------------------------------------------------
grant usage on schema public to authenticated;
grant select, insert, update on
  public.schools,
  public.profiles,
  public.class_sections,
  public.subjects,
  public.teacher_assignments,
  public.school_modules,
  public.syllabus_updates,
  public.tasks,
  public.events,
  public.event_milestones,
  public.institution_profile,
  public.reports,
  public.activity_logs
to authenticated;

-- ---------------------------------------------------------------------------
-- Board Command schema
-- Class 10 and Class 12 readiness tracking for School Mode.
-- ---------------------------------------------------------------------------
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

alter table public.students enable row level security;
alter table public.board_students enable row level security;
alter table public.board_subjects enable row level security;
alter table public.board_daily_inputs enable row level security;
alter table public.board_weekly_inputs enable row level security;
alter table public.board_monthly_inputs enable row level security;
alter table public.board_alerts enable row level security;

create policy "board students read by leaders" on public.students
  for select to authenticated
  using (school_id = public.current_school_id() and public.is_school_leader());

create policy "principals manage students" on public.students
  for all to authenticated
  using (school_id = public.current_school_id() and public.is_principal())
  with check (school_id = public.current_school_id() and public.is_principal());

create policy "principals manage board students" on public.board_students
  for all to authenticated
  using (school_id = public.current_school_id() and public.is_principal())
  with check (school_id = public.current_school_id() and public.is_principal());

create policy "coordinators read board students" on public.board_students
  for select to authenticated
  using (school_id = public.current_school_id() and public.is_coordinator());

create policy "principals manage board subjects" on public.board_subjects
  for all to authenticated
  using (school_id = public.current_school_id() and public.is_principal())
  with check (school_id = public.current_school_id() and public.is_principal());

create policy "coordinators read board subjects" on public.board_subjects
  for select to authenticated
  using (school_id = public.current_school_id() and public.is_coordinator());

create policy "teachers read own board subjects" on public.board_subjects
  for select to authenticated
  using (school_id = public.current_school_id() and teacher_id = auth.uid());

create policy "principals manage board daily inputs" on public.board_daily_inputs
  for all to authenticated
  using (school_id = public.current_school_id() and public.is_principal())
  with check (school_id = public.current_school_id() and public.is_principal());

create policy "coordinators read board daily inputs" on public.board_daily_inputs
  for select to authenticated
  using (school_id = public.current_school_id() and public.is_coordinator());

create policy "teachers read own board daily inputs" on public.board_daily_inputs
  for select to authenticated
  using (school_id = public.current_school_id() and teacher_id = auth.uid());

create policy "teachers insert own board daily inputs" on public.board_daily_inputs
  for insert to authenticated
  with check (school_id = public.current_school_id() and teacher_id = auth.uid());

create policy "teachers update own board daily inputs" on public.board_daily_inputs
  for update to authenticated
  using (school_id = public.current_school_id() and teacher_id = auth.uid())
  with check (school_id = public.current_school_id() and teacher_id = auth.uid());

create policy "principals manage board weekly inputs" on public.board_weekly_inputs
  for all to authenticated
  using (school_id = public.current_school_id() and public.is_principal())
  with check (school_id = public.current_school_id() and public.is_principal());

create policy "coordinators read board weekly inputs" on public.board_weekly_inputs
  for select to authenticated
  using (school_id = public.current_school_id() and public.is_coordinator());

create policy "teachers read own board weekly inputs" on public.board_weekly_inputs
  for select to authenticated
  using (school_id = public.current_school_id() and teacher_id = auth.uid());

create policy "teachers insert own board weekly inputs" on public.board_weekly_inputs
  for insert to authenticated
  with check (school_id = public.current_school_id() and teacher_id = auth.uid());

create policy "teachers update own board weekly inputs" on public.board_weekly_inputs
  for update to authenticated
  using (school_id = public.current_school_id() and teacher_id = auth.uid())
  with check (school_id = public.current_school_id() and teacher_id = auth.uid());

create policy "principals manage board monthly inputs" on public.board_monthly_inputs
  for all to authenticated
  using (school_id = public.current_school_id() and public.is_principal())
  with check (school_id = public.current_school_id() and public.is_principal());

create policy "coordinators read board monthly inputs" on public.board_monthly_inputs
  for select to authenticated
  using (school_id = public.current_school_id() and public.is_coordinator());

create policy "teachers read own board monthly inputs" on public.board_monthly_inputs
  for select to authenticated
  using (school_id = public.current_school_id() and teacher_id = auth.uid());

create policy "teachers insert own board monthly inputs" on public.board_monthly_inputs
  for insert to authenticated
  with check (school_id = public.current_school_id() and teacher_id = auth.uid());

create policy "teachers update own board monthly inputs" on public.board_monthly_inputs
  for update to authenticated
  using (school_id = public.current_school_id() and teacher_id = auth.uid())
  with check (school_id = public.current_school_id() and teacher_id = auth.uid());

create policy "principals manage board alerts" on public.board_alerts
  for all to authenticated
  using (school_id = public.current_school_id() and public.is_principal())
  with check (school_id = public.current_school_id() and public.is_principal());

create policy "coordinators read board alerts" on public.board_alerts
  for select to authenticated
  using (school_id = public.current_school_id() and public.is_coordinator());

grant select, insert, update on
  public.students,
  public.board_students,
  public.board_subjects,
  public.board_daily_inputs,
  public.board_weekly_inputs,
  public.board_monthly_inputs,
  public.board_alerts
to authenticated;

-- ---------------------------------------------------------------------------
-- Daily Staff Status Board
-- A command visibility board for present, absent, leave, duty and substitution.
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

-- ---------------------------------------------------------------------------
-- Timetable and Substitution
-- Daily class periods and simple substitution planning.
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

-- ---------------------------------------------------------------------------
-- Student Attendance Intelligence
-- Lightweight command-level attendance and early warning.
-- ---------------------------------------------------------------------------
alter table public.students add column if not exists admission_number text;
alter table public.students add column if not exists class_section_id uuid references public.class_sections(id);
alter table public.students add column if not exists parent_name text;
alter table public.students add column if not exists parent_phone text;
alter table public.students add column if not exists is_active boolean not null default true;

create table if not exists public.student_daily_attendance (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  class_section_id uuid references public.class_sections(id),
  attendance_date date not null,
  status text not null check (status in ('present','absent','late','leave')),
  marked_by uuid references public.profiles(id),
  remarks text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint student_daily_attendance_school_student_date_key unique (school_id, student_id, attendance_date)
);

drop trigger if exists set_student_daily_attendance_updated_at on public.student_daily_attendance;
create trigger set_student_daily_attendance_updated_at
before update on public.student_daily_attendance
for each row execute function public.set_updated_at();

create index if not exists students_school_class_idx on public.students (school_id, class_section_id);
create index if not exists students_admission_number_idx on public.students (school_id, admission_number);
create index if not exists student_daily_attendance_school_date_idx on public.student_daily_attendance (school_id, attendance_date desc);
create index if not exists student_daily_attendance_class_date_idx on public.student_daily_attendance (class_section_id, attendance_date desc);
create index if not exists student_daily_attendance_student_date_idx on public.student_daily_attendance (student_id, attendance_date desc);
create index if not exists student_daily_attendance_status_idx on public.student_daily_attendance (school_id, status);

alter table public.student_daily_attendance enable row level security;

drop policy if exists "students read by leaders and assigned teachers" on public.students;
create policy "students read by leaders and assigned teachers"
on public.students for select
using (
  school_id = public.current_school_id()
  and (
    public.is_school_leader()
    or exists (
      select 1
      from public.teacher_assignments ta
      where ta.school_id = public.current_school_id()
        and ta.teacher_id = auth.uid()
        and ta.class_section_id = students.class_section_id
    )
  )
);

drop policy if exists "principals manage students" on public.students;
create policy "principals manage students"
on public.students for all
using (school_id = public.current_school_id() and public.is_principal())
with check (school_id = public.current_school_id() and public.is_principal());

drop policy if exists "leaders read student attendance" on public.student_daily_attendance;
create policy "leaders read student attendance"
on public.student_daily_attendance for select
using (school_id = public.current_school_id() and public.is_school_leader());

drop policy if exists "teachers read assigned class student attendance" on public.student_daily_attendance;
create policy "teachers read assigned class student attendance"
on public.student_daily_attendance for select
using (
  school_id = public.current_school_id()
  and exists (
    select 1
    from public.teacher_assignments ta
    where ta.school_id = public.current_school_id()
      and ta.teacher_id = auth.uid()
      and ta.class_section_id = student_daily_attendance.class_section_id
  )
);

drop policy if exists "leaders insert student attendance" on public.student_daily_attendance;
create policy "leaders insert student attendance"
on public.student_daily_attendance for insert
with check (school_id = public.current_school_id() and public.is_school_leader());

drop policy if exists "leaders update student attendance" on public.student_daily_attendance;
create policy "leaders update student attendance"
on public.student_daily_attendance for update
using (school_id = public.current_school_id() and public.is_school_leader())
with check (school_id = public.current_school_id() and public.is_school_leader());

drop policy if exists "teachers insert assigned class student attendance" on public.student_daily_attendance;
create policy "teachers insert assigned class student attendance"
on public.student_daily_attendance for insert
with check (
  school_id = public.current_school_id()
  and exists (
    select 1
    from public.teacher_assignments ta
    where ta.school_id = public.current_school_id()
      and ta.teacher_id = auth.uid()
      and ta.class_section_id = student_daily_attendance.class_section_id
  )
);

drop policy if exists "teachers update assigned class student attendance" on public.student_daily_attendance;
create policy "teachers update assigned class student attendance"
on public.student_daily_attendance for update
using (
  school_id = public.current_school_id()
  and exists (
    select 1
    from public.teacher_assignments ta
    where ta.school_id = public.current_school_id()
      and ta.teacher_id = auth.uid()
      and ta.class_section_id = student_daily_attendance.class_section_id
  )
)
with check (
  school_id = public.current_school_id()
  and exists (
    select 1
    from public.teacher_assignments ta
    where ta.school_id = public.current_school_id()
      and ta.teacher_id = auth.uid()
      and ta.class_section_id = student_daily_attendance.class_section_id
  )
);

grant select, insert, update on public.students, public.student_daily_attendance to authenticated;

-- ---------------------------------------------------------------------------
-- Placement Command Centre
-- Internal placement readiness, recruiters, drives, offers and internships.
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

-- ---------------------------------------------------------------------------
-- Accreditation Readiness
-- NAAC/NBA/AICTE-style readiness tracker and evidence repository.
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

-- ---------------------------------------------------------------------------
-- College Mode Academic Command Layer
-- The migration file is also kept separately at:
-- supabase/migrations/202605270010_college_mode_academics.sql
-- ---------------------------------------------------------------------------

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  course_name text not null,
  course_type text check (course_type in ('btech','mba','diploma','degree','mtech','mca','bca','bba','other')),
  duration_years integer,
  total_semesters integer,
  governing_body text,
  affiliation_body text,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  department_name text not null,
  department_code text,
  hod_id uuid references public.profiles(id),
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.academic_batches (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  batch_name text not null,
  admission_year integer,
  passing_year integer,
  current_year integer,
  current_semester integer,
  section text,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.college_subjects (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  semester integer,
  subject_code text,
  subject_name text not null,
  subject_type text check (subject_type in ('theory','lab','project','seminar','internship','workshop','elective','other')),
  credits numeric,
  assigned_faculty_id uuid references public.profiles(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.college_syllabus_progress (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  batch_id uuid references public.academic_batches(id) on delete cascade,
  subject_id uuid references public.college_subjects(id) on delete cascade,
  faculty_id uuid references public.profiles(id),
  planned_units text,
  completed_units text,
  completion_percentage integer check (completion_percentage between 0 and 100),
  revision_status text check (revision_status in ('not_started','started','in_progress','completed')),
  lab_completion_percentage integer check (lab_completion_percentage between 0 and 100),
  status text check (status in ('on_track','behind','completed','not_started')),
  delay_reason text,
  week_start_date date,
  week_end_date date,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.college_internal_assessments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  batch_id uuid references public.academic_batches(id) on delete cascade,
  subject_id uuid references public.college_subjects(id) on delete cascade,
  assessment_name text,
  assessment_type text check (assessment_type in ('assignment','quiz','mid_exam','internal_exam','lab_internal','seminar','project_review','case_study','viva','other')),
  max_marks numeric,
  assessment_date date,
  marks_entry_status text check (marks_entry_status in ('not_started','in_progress','completed','delayed')),
  created_by uuid references public.profiles(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.college_final_exams (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  batch_id uuid references public.academic_batches(id) on delete cascade,
  semester integer,
  exam_name text,
  exam_type text check (exam_type in ('semester_final','university_exam','board_exam','practical_exam','project_viva','supplementary','backlog_exam')),
  exam_start_date date,
  exam_end_date date,
  timetable_status text check (timetable_status in ('pending','drafted','published','revised')),
  hall_ticket_status text check (hall_ticket_status in ('not_started','in_progress','issued','blocked')),
  internal_marks_status text check (internal_marks_status in ('pending','in_progress','submitted','delayed')),
  practical_status text check (practical_status in ('not_applicable','pending','in_progress','completed','delayed')),
  exam_readiness_status text check (exam_readiness_status in ('green','amber','red')),
  remarks text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.college_exam_subjects (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  final_exam_id uuid references public.college_final_exams(id) on delete cascade,
  subject_id uuid references public.college_subjects(id) on delete cascade,
  exam_date date,
  exam_time text,
  question_paper_status text check (question_paper_status in ('not_started','set','moderated','submitted','not_applicable')),
  seating_plan_status text check (seating_plan_status in ('pending','prepared','verified','not_applicable')),
  invigilation_status text check (invigilation_status in ('pending','assigned','confirmed')),
  marks_submission_status text check (marks_submission_status in ('pending','submitted','delayed','not_applicable')),
  result_risk_level text check (result_risk_level in ('green','amber','red')),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.college_fee_records (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  batch_id uuid references public.academic_batches(id) on delete cascade,
  fee_category text check (fee_category in ('tuition','hostel','transport','exam','library','lab','university','miscellaneous','other')),
  total_fee numeric,
  amount_paid numeric not null default 0,
  amount_pending numeric,
  due_date date,
  status text check (status in ('paid','partially_paid','pending','overdue','concession_pending','scholarship_pending')),
  concession_amount numeric not null default 0,
  scholarship_status text check (scholarship_status in ('not_applicable','applied','approved','rejected','pending')),
  remarks text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.college_fee_followups (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  fee_record_id uuid references public.college_fee_records(id) on delete cascade,
  followup_date date,
  followup_mode text check (followup_mode in ('call','sms','whatsapp','email','in_person','letter','other')),
  followup_notes text,
  next_followup_date date,
  recorded_by uuid references public.profiles(id),
  created_at timestamp with time zone not null default now()
);

create table if not exists public.college_course_alerts (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  batch_id uuid references public.academic_batches(id) on delete set null,
  alert_type text,
  severity text check (severity in ('green','amber','red','blue')),
  title text,
  message text,
  related_entity_type text,
  related_entity_id uuid,
  status text check (status in ('new','acknowledged','resolved','dismissed')),
  created_at timestamp with time zone not null default now(),
  resolved_at timestamp with time zone
);

create index if not exists courses_school_idx on public.courses (school_id, course_type, is_active);
create index if not exists departments_school_course_idx on public.departments (school_id, course_id, is_active);
create index if not exists academic_batches_school_course_idx on public.academic_batches (school_id, course_id, department_id, current_semester);
create index if not exists college_subjects_school_course_sem_idx on public.college_subjects (school_id, course_id, department_id, semester);
create index if not exists college_subjects_faculty_idx on public.college_subjects (assigned_faculty_id);
create index if not exists college_syllabus_school_course_idx on public.college_syllabus_progress (school_id, course_id, department_id, batch_id);
create index if not exists college_syllabus_faculty_idx on public.college_syllabus_progress (faculty_id, week_start_date desc);
create index if not exists college_assessments_school_status_idx on public.college_internal_assessments (school_id, course_id, department_id, marks_entry_status);
create index if not exists college_final_exams_school_date_idx on public.college_final_exams (school_id, exam_start_date, exam_readiness_status);
create index if not exists college_exam_subjects_exam_idx on public.college_exam_subjects (final_exam_id, exam_date);
create index if not exists college_fee_records_school_due_idx on public.college_fee_records (school_id, due_date, status);
create index if not exists college_fee_records_student_idx on public.college_fee_records (student_id, status);
create index if not exists college_fee_records_course_idx on public.college_fee_records (course_id, department_id, batch_id);
create index if not exists college_course_alerts_school_status_idx on public.college_course_alerts (school_id, status, severity, created_at desc);

alter table public.courses enable row level security;
alter table public.departments enable row level security;
alter table public.academic_batches enable row level security;
alter table public.college_subjects enable row level security;
alter table public.college_syllabus_progress enable row level security;
alter table public.college_internal_assessments enable row level security;
alter table public.college_final_exams enable row level security;
alter table public.college_exam_subjects enable row level security;
alter table public.college_fee_records enable row level security;
alter table public.college_fee_followups enable row level security;
alter table public.college_course_alerts enable row level security;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'courses','departments','academic_batches','college_subjects','college_syllabus_progress',
    'college_internal_assessments','college_final_exams','college_exam_subjects','college_fee_records',
    'college_fee_followups','college_course_alerts'
  ]
  loop
    execute format('drop policy if exists "college leaders read %s" on public.%s', table_name, table_name);
    execute format('create policy "college leaders read %s" on public.%s for select using (school_id = public.current_school_id() and public.current_user_role() in (''principal'',''coordinator'',''management''))', table_name, table_name);
    execute format('drop policy if exists "college leaders manage %s" on public.%s', table_name, table_name);
    execute format('create policy "college leaders manage %s" on public.%s for all using (school_id = public.current_school_id() and public.is_school_leader()) with check (school_id = public.current_school_id() and public.is_school_leader())', table_name, table_name);
  end loop;
end $$;

drop policy if exists "faculty read assigned college subjects" on public.college_subjects;
create policy "faculty read assigned college subjects" on public.college_subjects
for select using (school_id = public.current_school_id() and assigned_faculty_id = auth.uid());

drop policy if exists "faculty manage own college syllabus" on public.college_syllabus_progress;
create policy "faculty manage own college syllabus" on public.college_syllabus_progress
for all using (school_id = public.current_school_id() and faculty_id = auth.uid())
with check (school_id = public.current_school_id() and faculty_id = auth.uid());

grant select, insert, update on
  public.courses,
  public.departments,
  public.academic_batches,
  public.college_subjects,
  public.college_syllabus_progress,
  public.college_internal_assessments,
  public.college_final_exams,
  public.college_exam_subjects,
  public.college_fee_records,
  public.college_fee_followups,
  public.college_course_alerts
to authenticated;
