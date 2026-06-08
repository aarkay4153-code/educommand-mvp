-- ---------------------------------------------------------------------------
-- Student Attendance Intelligence
-- Lightweight command-level attendance and early warning.
-- This is not fee, marks, report-card, or parent-login functionality.
-- ---------------------------------------------------------------------------

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete cascade,
  full_name text,
  created_at timestamp with time zone not null default now()
);

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

alter table public.students enable row level security;
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
