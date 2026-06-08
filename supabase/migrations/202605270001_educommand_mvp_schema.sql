-- EduCommand MVP schema
-- Run this migration after Supabase Auth is enabled for the project.

create extension if not exists "pgcrypto";

create type public.app_role as enum ('principal', 'coordinator', 'teacher');
create type public.task_priority as enum ('low', 'medium', 'high', 'urgent');
create type public.task_status as enum ('open', 'in_progress', 'blocked', 'completed', 'cancelled');
create type public.syllabus_status as enum ('on_track', 'needs_attention', 'delayed', 'completed');
create type public.event_intensity as enum ('low', 'medium', 'high', 'critical');
create type public.event_status as enum ('planned', 'in_progress', 'needs_attention', 'ready', 'completed', 'cancelled');
create type public.milestone_status as enum ('open', 'in_progress', 'blocked', 'completed');

create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text,
  address text,
  city text,
  state text,
  country text default 'India',
  academic_year text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  role public.app_role not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, school_id)
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  section text,
  academic_year text not null,
  class_teacher_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, school_id),
  unique (school_id, academic_year, name, section),
  foreign key (class_teacher_id, school_id) references public.profiles(id, school_id) on delete restrict
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, school_id),
  unique (school_id, name)
);

create table public.teacher_assignments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  teacher_id uuid not null,
  class_id uuid not null,
  subject_id uuid not null,
  academic_year text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, teacher_id, class_id, subject_id, academic_year),
  foreign key (teacher_id, school_id) references public.profiles(id, school_id) on delete cascade,
  foreign key (class_id, school_id) references public.classes(id, school_id) on delete cascade,
  foreign key (subject_id, school_id) references public.subjects(id, school_id) on delete cascade
);

create table public.syllabus_updates (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  teacher_id uuid not null,
  class_id uuid not null,
  subject_id uuid not null,
  planned_portion text not null,
  completed_portion text,
  completion_percentage numeric(5,2) not null default 0,
  status public.syllabus_status not null default 'on_track',
  delay_reason text,
  next_week_target text,
  week_start_date date not null,
  week_end_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (completion_percentage >= 0 and completion_percentage <= 100),
  check (week_end_date >= week_start_date),
  unique (school_id, teacher_id, class_id, subject_id, week_start_date),
  foreign key (teacher_id, school_id) references public.profiles(id, school_id) on delete cascade,
  foreign key (class_id, school_id) references public.classes(id, school_id) on delete cascade,
  foreign key (subject_id, school_id) references public.subjects(id, school_id) on delete cascade
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  title text not null,
  description text,
  assigned_by uuid not null,
  assigned_to uuid not null,
  due_date date,
  priority public.task_priority not null default 'medium',
  status public.task_status not null default 'open',
  delay_reason text,
  proof_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  foreign key (assigned_by, school_id) references public.profiles(id, school_id) on delete restrict,
  foreign key (assigned_to, school_id) references public.profiles(id, school_id) on delete cascade
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  event_name text not null,
  description text,
  event_date date not null,
  intensity public.event_intensity not null default 'medium',
  owner_id uuid not null,
  status public.event_status not null default 'planned',
  completion_percentage numeric(5,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (completion_percentage >= 0 and completion_percentage <= 100),
  unique (id, school_id),
  foreign key (owner_id, school_id) references public.profiles(id, school_id) on delete restrict
);

create table public.event_milestones (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  event_id uuid not null,
  title text not null,
  owner_id uuid not null,
  due_date date,
  status public.milestone_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (event_id, school_id) references public.events(id, school_id) on delete cascade,
  foreign key (owner_id, school_id) references public.profiles(id, school_id) on delete restrict
);

create table public.institution_profile (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  principal_name text,
  board_affiliation text,
  school_level text,
  academic_year text,
  address text,
  contact_email text,
  contact_phone text,
  website_url text,
  student_count integer,
  staff_count integer,
  operating_hours text,
  vision text,
  strengths text[] not null default '{}',
  improvement_areas text[] not null default '{}',
  key_contacts jsonb not null default '[]'::jsonb,
  brief_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id),
  check (student_count is null or student_count >= 0),
  check (staff_count is null or staff_count >= 0)
);

create index schools_name_idx on public.schools (name);
create index profiles_school_role_idx on public.profiles (school_id, role);
create index profiles_school_active_idx on public.profiles (school_id, is_active);
create index classes_school_year_idx on public.classes (school_id, academic_year);
create index subjects_school_name_idx on public.subjects (school_id, name);
create index teacher_assignments_teacher_idx on public.teacher_assignments (teacher_id);
create index teacher_assignments_class_subject_idx on public.teacher_assignments (school_id, class_id, subject_id);
create index syllabus_updates_teacher_week_idx on public.syllabus_updates (teacher_id, week_start_date desc);
create index syllabus_updates_school_status_idx on public.syllabus_updates (school_id, status);
create index syllabus_updates_class_subject_idx on public.syllabus_updates (class_id, subject_id, week_start_date desc);
create index tasks_assigned_to_status_idx on public.tasks (assigned_to, status, due_date);
create index tasks_school_due_idx on public.tasks (school_id, due_date);
create index tasks_school_status_priority_idx on public.tasks (school_id, status, priority);
create index events_school_date_idx on public.events (school_id, event_date);
create index events_owner_status_idx on public.events (owner_id, status);
create index event_milestones_event_idx on public.event_milestones (event_id);
create index event_milestones_owner_status_idx on public.event_milestones (owner_id, status, due_date);
create index institution_profile_school_idx on public.institution_profile (school_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_schools_updated_at before update on public.schools
  for each row execute function public.set_updated_at();
create trigger set_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_classes_updated_at before update on public.classes
  for each row execute function public.set_updated_at();
create trigger set_subjects_updated_at before update on public.subjects
  for each row execute function public.set_updated_at();
create trigger set_teacher_assignments_updated_at before update on public.teacher_assignments
  for each row execute function public.set_updated_at();
create trigger set_syllabus_updates_updated_at before update on public.syllabus_updates
  for each row execute function public.set_updated_at();
create trigger set_tasks_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();
create trigger set_events_updated_at before update on public.events
  for each row execute function public.set_updated_at();
create trigger set_event_milestones_updated_at before update on public.event_milestones
  for each row execute function public.set_updated_at();
create trigger set_institution_profile_updated_at before update on public.institution_profile
  for each row execute function public.set_updated_at();

create or replace function public.current_profile_school_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.school_id
  from public.profiles p
  where p.id = auth.uid()
    and p.is_active = true
  limit 1
$$;

create or replace function public.current_profile_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid()
    and p.is_active = true
  limit 1
$$;

create or replace function public.is_school_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_profile_role() in ('principal', 'coordinator'), false)
$$;

alter table public.schools enable row level security;
alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.subjects enable row level security;
alter table public.teacher_assignments enable row level security;
alter table public.syllabus_updates enable row level security;
alter table public.tasks enable row level security;
alter table public.events enable row level security;
alter table public.event_milestones enable row level security;
alter table public.institution_profile enable row level security;

create policy "Users can view their school"
on public.schools for select
to authenticated
using (id = public.current_profile_school_id());

create policy "School admins can update their school"
on public.schools for update
to authenticated
using (id = public.current_profile_school_id() and public.is_school_admin())
with check (id = public.current_profile_school_id() and public.is_school_admin());

create policy "Users can view own profile and admins can view school profiles"
on public.profiles for select
to authenticated
using (
  id = auth.uid()
  or (school_id = public.current_profile_school_id() and public.is_school_admin())
);

create policy "Users can update own profile"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (
  id = auth.uid()
  and school_id = public.current_profile_school_id()
);

create policy "School admins can manage profiles"
on public.profiles for all
to authenticated
using (school_id = public.current_profile_school_id() and public.is_school_admin())
with check (school_id = public.current_profile_school_id() and public.is_school_admin());

create policy "Users can view classes in their school"
on public.classes for select
to authenticated
using (school_id = public.current_profile_school_id());

create policy "School admins can manage classes"
on public.classes for all
to authenticated
using (school_id = public.current_profile_school_id() and public.is_school_admin())
with check (school_id = public.current_profile_school_id() and public.is_school_admin());

create policy "Users can view subjects in their school"
on public.subjects for select
to authenticated
using (school_id = public.current_profile_school_id());

create policy "School admins can manage subjects"
on public.subjects for all
to authenticated
using (school_id = public.current_profile_school_id() and public.is_school_admin())
with check (school_id = public.current_profile_school_id() and public.is_school_admin());

create policy "Users can view teacher assignments in their school"
on public.teacher_assignments for select
to authenticated
using (school_id = public.current_profile_school_id());

create policy "School admins can manage teacher assignments"
on public.teacher_assignments for all
to authenticated
using (school_id = public.current_profile_school_id() and public.is_school_admin())
with check (school_id = public.current_profile_school_id() and public.is_school_admin());

create policy "Users can view syllabus updates in their school"
on public.syllabus_updates for select
to authenticated
using (school_id = public.current_profile_school_id());

create policy "Teachers can create their own syllabus updates"
on public.syllabus_updates for insert
to authenticated
with check (
  school_id = public.current_profile_school_id()
  and teacher_id = auth.uid()
);

create policy "Teachers can update their own syllabus updates"
on public.syllabus_updates for update
to authenticated
using (
  school_id = public.current_profile_school_id()
  and teacher_id = auth.uid()
)
with check (
  school_id = public.current_profile_school_id()
  and teacher_id = auth.uid()
);

create policy "School admins can manage syllabus updates"
on public.syllabus_updates for all
to authenticated
using (school_id = public.current_profile_school_id() and public.is_school_admin())
with check (school_id = public.current_profile_school_id() and public.is_school_admin());

create policy "Users can view relevant tasks"
on public.tasks for select
to authenticated
using (
  school_id = public.current_profile_school_id()
  and (
    public.is_school_admin()
    or assigned_to = auth.uid()
    or assigned_by = auth.uid()
  )
);

create policy "Users can create tasks in their school"
on public.tasks for insert
to authenticated
with check (
  school_id = public.current_profile_school_id()
  and assigned_by = auth.uid()
);

create policy "Users can update relevant tasks"
on public.tasks for update
to authenticated
using (
  school_id = public.current_profile_school_id()
  and (
    public.is_school_admin()
    or assigned_to = auth.uid()
    or assigned_by = auth.uid()
  )
)
with check (
  school_id = public.current_profile_school_id()
  and (
    public.is_school_admin()
    or assigned_to = auth.uid()
    or assigned_by = auth.uid()
  )
);

create policy "School admins can delete tasks"
on public.tasks for delete
to authenticated
using (school_id = public.current_profile_school_id() and public.is_school_admin());

create policy "Users can view events in their school"
on public.events for select
to authenticated
using (school_id = public.current_profile_school_id());

create policy "School admins and owners can manage events"
on public.events for all
to authenticated
using (
  school_id = public.current_profile_school_id()
  and (public.is_school_admin() or owner_id = auth.uid())
)
with check (
  school_id = public.current_profile_school_id()
  and (public.is_school_admin() or owner_id = auth.uid())
);

create policy "Users can view event milestones in their school"
on public.event_milestones for select
to authenticated
using (school_id = public.current_profile_school_id());

create policy "School admins and owners can manage event milestones"
on public.event_milestones for all
to authenticated
using (
  school_id = public.current_profile_school_id()
  and (public.is_school_admin() or owner_id = auth.uid())
)
with check (
  school_id = public.current_profile_school_id()
  and (public.is_school_admin() or owner_id = auth.uid())
);

create policy "Users can view institution profile"
on public.institution_profile for select
to authenticated
using (school_id = public.current_profile_school_id());

create policy "School admins can manage institution profile"
on public.institution_profile for all
to authenticated
using (school_id = public.current_profile_school_id() and public.is_school_admin())
with check (school_id = public.current_profile_school_id() and public.is_school_admin());

grant usage on schema public to authenticated;
grant select, insert, update, delete on
  public.schools,
  public.profiles,
  public.classes,
  public.subjects,
  public.teacher_assignments,
  public.syllabus_updates,
  public.tasks,
  public.events,
  public.event_milestones,
  public.institution_profile
to authenticated;
