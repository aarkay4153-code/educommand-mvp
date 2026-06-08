-- ---------------------------------------------------------------------------
-- College Mode Academic Command Layer
-- Safe additive schema for multi-course colleges: B.Tech, MBA, Diploma, etc.
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

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'courses','departments','academic_batches','college_subjects','college_syllabus_progress',
    'college_internal_assessments','college_final_exams','college_exam_subjects','college_fee_records'
  ]
  loop
    execute format('drop trigger if exists set_%s_updated_at on public.%s', table_name, table_name);
    execute format('create trigger set_%s_updated_at before update on public.%s for each row execute function public.set_updated_at()', table_name, table_name);
  end loop;
end $$;

create index if not exists courses_school_idx on public.courses (school_id, course_type, is_active);
create index if not exists departments_school_course_idx on public.departments (school_id, course_id, is_active);
create index if not exists departments_hod_idx on public.departments (hod_id);
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

create or replace function public.is_department_hod(target_department_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.departments d
    where d.id = target_department_id
      and d.school_id = public.current_school_id()
      and d.hod_id = auth.uid()
  )
$$;

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
