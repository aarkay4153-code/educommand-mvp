# Supabase Setup

Run `migrations/202605270001_educommand_mvp_schema.sql` in your Supabase project to create the EduCommand MVP schema.

The migration includes:

- Core tables for schools, profiles, classes, subjects, teacher assignments, syllabus updates, tasks, events, milestones, and institution profile details.
- Enum types for roles and workflow statuses.
- Foreign keys linking `profiles.id` to `auth.users.id`.
- Sensible indexes for dashboard, task, syllabus, and event queries.
- Row level security policies for principal, coordinator, and teacher access.

For the first principal profile, use the Supabase service role or SQL editor after creating the auth user, because normal users cannot assign their own initial school role through RLS.

For proof uploads, create the `proof-uploads` Supabase Storage bucket and policies using `docs/storage-setup.md`.
