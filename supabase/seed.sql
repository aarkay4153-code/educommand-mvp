-- EduCommand demo seed data
-- Demo school: Demo Public School
--
-- Important:
-- profiles.id references auth.users(id). The placeholder UUIDs below are only
-- for local demo wiring. Replace every profile UUID with real Supabase Auth user
-- UUIDs before running this seed in a project with foreign key checks enabled.

-- ---------------------------------------------------------------------------
-- Placeholder auth user UUIDs to replace during local testing
-- ---------------------------------------------------------------------------
-- Principal:
--   00000000-0000-4000-8000-000000000001 -> principal@demo.educommand.local
-- Coordinators:
--   00000000-0000-4000-8000-000000000002 -> coordinator.academic@demo.educommand.local
--   00000000-0000-4000-8000-000000000003 -> coordinator.events@demo.educommand.local
-- Teachers:
--   00000000-0000-4000-8000-000000000004 -> maths.teacher@demo.educommand.local
--   00000000-0000-4000-8000-000000000005 -> science.teacher@demo.educommand.local
--   00000000-0000-4000-8000-000000000006 -> english.teacher@demo.educommand.local
--   00000000-0000-4000-8000-000000000007 -> social.teacher@demo.educommand.local
--   00000000-0000-4000-8000-000000000008 -> telugu.teacher@demo.educommand.local
--   00000000-0000-4000-8000-000000000009 -> hindi.teacher@demo.educommand.local
--   00000000-0000-4000-8000-000000000010 -> grade6.teacher@demo.educommand.local
--   00000000-0000-4000-8000-000000000011 -> grade8.teacher@demo.educommand.local

-- ---------------------------------------------------------------------------
-- School
-- ---------------------------------------------------------------------------
insert into public.schools (
  id,
  name,
  address,
  city,
  state,
  board,
  institution_type,
  established_year
) values (
  '10000000-0000-4000-8000-000000000001',
  'Demo Public School',
  '12 Learning Avenue',
  'Hyderabad',
  'Telangana',
  'State Board',
  'school',
  1998
) on conflict (id) do update set
  name = excluded.name,
  address = excluded.address,
  city = excluded.city,
  state = excluded.state,
  board = excluded.board,
  institution_type = excluded.institution_type,
  established_year = excluded.established_year;

insert into public.school_modules (school_id, module_key, is_enabled)
values
  ('10000000-0000-4000-8000-000000000001', 'dashboard', true),
  ('10000000-0000-4000-8000-000000000001', 'staff_status', true),
  ('10000000-0000-4000-8000-000000000001', 'student_attendance', true),
  ('10000000-0000-4000-8000-000000000001', 'timetable', true),
  ('10000000-0000-4000-8000-000000000001', 'syllabus', true),
  ('10000000-0000-4000-8000-000000000001', 'tasks', true),
  ('10000000-0000-4000-8000-000000000001', 'calendar', true),
  ('10000000-0000-4000-8000-000000000001', 'board_command', true),
  ('10000000-0000-4000-8000-000000000001', 'complaints', true),
  ('10000000-0000-4000-8000-000000000001', 'compliance_vault', true),
  ('10000000-0000-4000-8000-000000000001', 'maintenance', true),
  ('10000000-0000-4000-8000-000000000001', 'institution_brief', true),
  ('10000000-0000-4000-8000-000000000001', 'reports', true),
  ('10000000-0000-4000-8000-000000000001', 'alerts', true)
on conflict (school_id, module_key) do update set
  is_enabled = excluded.is_enabled,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- Profiles
-- Replace ids with real auth.users UUIDs before running against Supabase.
-- ---------------------------------------------------------------------------
insert into public.profiles (
  id,
  school_id,
  full_name,
  email,
  phone,
  role,
  department,
  designation
) values
  ('00000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Ananya Rao', 'principal@demo.educommand.local', '9000000001', 'principal', 'Leadership', 'Principal'),
  ('00000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'Ravi Kumar', 'coordinator.academic@demo.educommand.local', '9000000002', 'coordinator', 'Academics', 'Academic Coordinator'),
  ('00000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'Nisha Varma', 'coordinator.events@demo.educommand.local', '9000000003', 'coordinator', 'Operations', 'Events Coordinator'),
  ('00000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', 'Meera Sharma', 'maths.teacher@demo.educommand.local', '9000000004', 'teacher', 'Mathematics', 'Maths Teacher'),
  ('00000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000001', 'Arjun Menon', 'science.teacher@demo.educommand.local', '9000000005', 'teacher', 'Science', 'Science Teacher'),
  ('00000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000001', 'Fatima Khan', 'english.teacher@demo.educommand.local', '9000000006', 'teacher', 'English', 'English Teacher'),
  ('00000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000001', 'Rohan Das', 'social.teacher@demo.educommand.local', '9000000007', 'teacher', 'Social Studies', 'Social Studies Teacher'),
  ('00000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000001', 'Lakshmi Reddy', 'telugu.teacher@demo.educommand.local', '9000000008', 'teacher', 'Telugu', 'Telugu Teacher'),
  ('00000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000001', 'Sanjay Patel', 'hindi.teacher@demo.educommand.local', '9000000009', 'teacher', 'Hindi', 'Hindi Teacher'),
  ('00000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000001', 'Priya Nair', 'grade6.teacher@demo.educommand.local', '9000000010', 'teacher', 'Primary Academics', 'Class Teacher'),
  ('00000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000001', 'Vikram Singh', 'grade8.teacher@demo.educommand.local', '9000000011', 'teacher', 'Middle School', 'Class Teacher')
on conflict (id) do update set
  school_id = excluded.school_id,
  full_name = excluded.full_name,
  email = excluded.email,
  phone = excluded.phone,
  role = excluded.role,
  department = excluded.department,
  designation = excluded.designation,
  is_active = true;

-- ---------------------------------------------------------------------------
-- Classes
-- ---------------------------------------------------------------------------
insert into public.class_sections (id, school_id, class_name, section, academic_year) values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '6', 'A', '2026-27'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '6', 'B', '2026-27'),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', '7', 'A', '2026-27'),
  ('20000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', '7', 'B', '2026-27'),
  ('20000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000001', '8', 'A', '2026-27'),
  ('20000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000001', '8', 'B', '2026-27'),
  ('20000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000001', '9', 'A', '2026-27'),
  ('20000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000001', '10', 'A', '2026-27')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Subjects
-- ---------------------------------------------------------------------------
insert into public.subjects (id, school_id, subject_name) values
  ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Maths'),
  ('30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'Science'),
  ('30000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'English'),
  ('30000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', 'Social Studies'),
  ('30000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000001', 'Telugu'),
  ('30000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000001', 'Hindi')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Teacher assignments
-- ---------------------------------------------------------------------------
insert into public.teacher_assignments (
  id,
  school_id,
  teacher_id,
  class_section_id,
  subject_id,
  academic_year
) values
  ('40000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '2026-27'),
  ('40000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001', '2026-27'),
  ('40000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000002', '2026-27'),
  ('40000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000002', '2026-27'),
  ('40000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000005', '30000000-0000-4000-8000-000000000003', '2026-27'),
  ('40000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000007', '20000000-0000-4000-8000-000000000006', '30000000-0000-4000-8000-000000000004', '2026-27'),
  ('40000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000007', '30000000-0000-4000-8000-000000000005', '2026-27'),
  ('40000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000009', '20000000-0000-4000-8000-000000000008', '30000000-0000-4000-8000-000000000006', '2026-27'),
  ('40000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000010', '20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000003', '2026-27'),
  ('40000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000011', '20000000-0000-4000-8000-000000000005', '30000000-0000-4000-8000-000000000004', '2026-27')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Syllabus updates
-- ---------------------------------------------------------------------------
insert into public.syllabus_updates (
  id,
  school_id,
  teacher_id,
  class_section_id,
  subject_id,
  week_start_date,
  week_end_date,
  planned_portion,
  completed_portion,
  completion_percentage,
  status,
  delay_reason,
  next_week_target,
  proof_url,
  submitted_at
) values
  ('50000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '2026-05-18', '2026-05-23', 'Fractions and decimals', 'Fractions completed, decimals started', 80, 'on_track', null, 'Decimal operations', null, now()),
  ('50000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001', '2026-05-18', '2026-05-23', 'Ratio introduction', 'Ratio introduction completed', 100, 'completed', null, 'Practice worksheet', null, now()),
  ('50000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000002', '2026-05-18', '2026-05-23', 'Plant systems', 'Only introduction completed', 35, 'behind', 'Lab period was cancelled due to assembly practice', 'Leaf structure and activity', null, now()),
  ('50000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000002', '2026-05-18', '2026-05-23', 'Force and pressure', 'Force basics completed', 60, 'on_track', null, 'Pressure numericals', null, now()),
  ('50000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000005', '30000000-0000-4000-8000-000000000003', '2026-05-18', '2026-05-23', 'Letter writing', 'Formal letters completed', 90, 'on_track', null, 'Informal letters', null, now()),
  ('50000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000007', '20000000-0000-4000-8000-000000000006', '30000000-0000-4000-8000-000000000004', '2026-05-18', '2026-05-23', 'Medieval kingdoms', 'Not started', 0, 'not_started', 'Teacher assigned election duty', 'Begin kingdoms overview', null, null),
  ('50000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000007', '30000000-0000-4000-8000-000000000005', '2026-05-18', '2026-05-23', 'Poetry unit', 'Two poems completed', 70, 'on_track', null, 'Grammar revision', null, now()),
  ('50000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000009', '20000000-0000-4000-8000-000000000008', '30000000-0000-4000-8000-000000000006', '2026-05-18', '2026-05-23', 'Reading comprehension', 'Completed with worksheet', 100, 'completed', null, 'Essay writing', null, now()),
  ('50000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000010', '20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000003', '2026-05-25', '2026-05-30', 'Story reading', 'Story introduction completed', 40, 'behind', 'Extra time spent on reading assessment', 'Finish chapter and vocabulary', null, now()),
  ('50000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000011', '20000000-0000-4000-8000-000000000005', '30000000-0000-4000-8000-000000000004', '2026-05-25', '2026-05-30', 'Civics chapter 1', 'Completed introduction and notes', 75, 'on_track', null, 'Class debate', null, now()),
  ('50000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000007', '30000000-0000-4000-8000-000000000001', '2026-05-25', '2026-05-30', 'Linear equations', 'Practice problems completed', 85, 'on_track', null, 'Word problems', null, now()),
  ('50000000-0000-4000-8000-000000000012', '10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000008', '30000000-0000-4000-8000-000000000002', '2026-05-25', '2026-05-30', 'Chemical reactions', 'Only demonstration completed', 50, 'behind', 'Chemicals not available in lab', 'Balance equations', null, now())
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Tasks
-- ---------------------------------------------------------------------------
insert into public.tasks (
  id,
  school_id,
  title,
  description,
  assigned_by,
  assigned_to,
  due_date,
  priority,
  status,
  delay_reason,
  proof_required,
  proof_url,
  remarks,
  completion_percentage
) values
  ('60000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Submit Grade 10 revision plan', 'Prepare chapter-wise revision plan for June.', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000006', '2026-05-31', 'high', 'in_progress', null, true, null, 'Draft is in progress.', 60),
  ('60000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'Confirm lab safety audit', 'Check lab safety checklist and submit gaps.', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000005', '2026-05-28', 'critical', 'delayed', 'Lab assistant unavailable', true, null, 'Audit delayed by staff availability.', 35),
  ('60000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'Collect class attendance reports', 'Collect weekly attendance summaries from class teachers.', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000010', '2026-05-29', 'medium', 'submitted', null, false, null, 'Submitted for review.', 100),
  ('60000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', 'Prepare debate schedule', 'Draft inter-house debate schedule.', '00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000006', '2026-06-02', 'medium', 'assigned', null, false, null, null, 0),
  ('60000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000001', 'Update Telugu worksheet bank', 'Upload worksheets for Grade 9 Telugu revision.', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000008', '2026-06-04', 'low', 'acknowledged', null, true, null, 'Will upload by Friday.', 15),
  ('60000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000001', 'Sports Day volunteer list', 'Share staff volunteer assignments.', '00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000011', '2026-06-05', 'high', 'in_progress', null, false, null, 'Half the volunteer list is ready.', 45),
  ('60000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000001', 'Science exhibition project list', 'Collect project names from Grade 8 and 9.', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000005', '2026-06-06', 'high', 'in_progress', null, false, null, 'Waiting for Grade 9 entries.', 55),
  ('60000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000001', 'Morning assembly rota', 'Prepare teacher duty rota for next month.', '00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000007', '2026-05-27', 'medium', 'delayed', 'Awaiting house captain list', false, null, 'Need final house captain list.', 20),
  ('60000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000001', 'Board display refresh', 'Update academic board display.', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000009', '2026-06-01', 'low', 'completed', null, true, 'https://example.com/demo-proof/board-display', 'Completed and photographed.', 100),
  ('60000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000001', 'Parent meeting agenda', 'Draft agenda for upcoming parent teacher meeting.', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', '2026-05-30', 'critical', 'in_progress', null, false, null, 'Agenda draft under review.', 70),
  ('60000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000001', 'Unit test seating plan', 'Prepare room-wise seating plan.', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000010', '2026-06-08', 'high', 'assigned', null, false, null, null, 0),
  ('60000000-0000-4000-8000-000000000012', '10000000-0000-4000-8000-000000000001', 'Hindi reading assessment', 'Submit Grade 10 Hindi reading assessment notes.', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000009', '2026-06-03', 'medium', 'returned', 'Needs clearer rubric', true, null, 'Rubric revision requested.', 80),
  ('60000000-0000-4000-8000-000000000013', '10000000-0000-4000-8000-000000000001', 'Social studies map activity', 'Prepare map activity materials for Grade 8.', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000007', '2026-06-07', 'medium', 'acknowledged', null, false, null, 'Materials identified.', 10),
  ('60000000-0000-4000-8000-000000000014', '10000000-0000-4000-8000-000000000001', 'Maths remedial list', 'Identify students needing remedial support.', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000004', '2026-06-01', 'high', 'submitted', null, true, null, 'List submitted for review.', 100),
  ('60000000-0000-4000-8000-000000000015', '10000000-0000-4000-8000-000000000001', 'English speaking activity', 'Plan speaking activity for Grade 8.', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000006', '2026-06-09', 'low', 'assigned', null, false, null, null, 0)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Events
-- ---------------------------------------------------------------------------
insert into public.events (
  id,
  school_id,
  event_name,
  description,
  event_date,
  intensity,
  owner_id,
  status,
  completion_percentage
) values
  ('70000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Parent Teacher Meeting', 'Monthly parent interaction for Grades 6 to 10.', '2026-05-30', 'medium', '00000000-0000-4000-8000-000000000002', 'in_progress', 75),
  ('70000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'Sports Day', 'Annual sports day planning and execution.', '2026-06-15', 'high', '00000000-0000-4000-8000-000000000003', 'in_progress', 45),
  ('70000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'Unit Test', 'First unit test schedule for middle and high school.', '2026-06-10', 'medium', '00000000-0000-4000-8000-000000000002', 'planned', 30),
  ('70000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', 'Science Exhibition', 'Student science project exhibition.', '2026-06-22', 'high', '00000000-0000-4000-8000-000000000005', 'at_risk', 35),
  ('70000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000001', 'Morning Assembly Duty', 'Weekly staff and student assembly duties.', '2026-06-03', 'low', '00000000-0000-4000-8000-000000000003', 'planned', 20)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Event milestones
-- ---------------------------------------------------------------------------
insert into public.event_milestones (
  id,
  school_id,
  event_id,
  title,
  description,
  owner_id,
  due_date,
  status,
  proof_url,
  delay_reason
) values
  ('80000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000001', 'Finalize parent slots', 'Publish class-wise PTM slots.', '00000000-0000-4000-8000-000000000002', '2026-05-28', 'completed', null, null),
  ('80000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000001', 'Prepare teacher summary sheets', 'Collect class progress remarks.', '00000000-0000-4000-8000-000000000010', '2026-05-29', 'in_progress', null, null),
  ('80000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000002', 'Ground inspection', 'Check track markings and equipment.', '00000000-0000-4000-8000-000000000011', '2026-06-06', 'in_progress', null, null),
  ('80000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000002', 'Volunteer allocation', 'Allocate staff for event counters.', '00000000-0000-4000-8000-000000000003', '2026-06-08', 'not_started', null, null),
  ('80000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000003', 'Question paper collection', 'Collect sealed question papers from teachers.', '00000000-0000-4000-8000-000000000002', '2026-06-05', 'not_started', null, null),
  ('80000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000003', 'Invigilation chart', 'Prepare invigilation duty chart.', '00000000-0000-4000-8000-000000000006', '2026-06-07', 'not_started', null, null),
  ('80000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000004', 'Project shortlist', 'Finalize student project entries.', '00000000-0000-4000-8000-000000000005', '2026-06-12', 'delayed', null, 'Few classes have not submitted project names'),
  ('80000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000004', 'Display layout', 'Plan stall and display layout.', '00000000-0000-4000-8000-000000000007', '2026-06-16', 'blocked', null, 'Hall availability not confirmed'),
  ('80000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000005', 'Duty rota', 'Prepare morning assembly teacher rota.', '00000000-0000-4000-8000-000000000003', '2026-06-01', 'in_progress', null, null),
  ('80000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000005', 'Student anchors', 'Select anchors and practice script.', '00000000-0000-4000-8000-000000000006', '2026-06-02', 'not_started', null, null)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Institution profile
-- ---------------------------------------------------------------------------
insert into public.institution_profile (
  id,
  school_id,
  vision,
  mission,
  total_students,
  total_teachers,
  total_admin_staff,
  total_classes,
  infrastructure_summary,
  achievements,
  special_programs,
  contact_email,
  contact_phone,
  website
) values (
  '90000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'To build confident learners with strong academic foundations and social responsibility.',
  'To deliver structured teaching, timely feedback, inclusive activities, and transparent school operations.',
  860,
  46,
  14,
  32,
  'Digital classrooms, science laboratory, library, playground, transport support, and basic medical room.',
  'District-level science fair recognition, strong board results, and active inter-school participation.',
  'Remedial learning, spoken English club, STEM projects, sports coaching, and community service activities.',
  'office@demopublicschool.example',
  '+91 90000 00000',
  'https://demopublicschool.example'
) on conflict (id) do update set
  vision = excluded.vision,
  mission = excluded.mission,
  total_students = excluded.total_students,
  total_teachers = excluded.total_teachers,
  total_admin_staff = excluded.total_admin_staff,
  total_classes = excluded.total_classes,
  infrastructure_summary = excluded.infrastructure_summary,
  achievements = excluded.achievements,
  special_programs = excluded.special_programs,
  contact_email = excluded.contact_email,
  contact_phone = excluded.contact_phone,
  website = excluded.website,
  updated_at = now();
