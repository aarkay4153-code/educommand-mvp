# EduCommand

EduCommand is a production-ready MVP web app for school heads, coordinators, and teachers.

It is not a full school ERP. It is a principal's command dashboard for syllabus coverage, teacher updates, delegated tasks, school events, delays, reports, proof uploads, and institutional readiness.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth, Postgres, Row Level Security, and Storage
- Local shadcn-style UI primitives

## Environment Variables

Create `.env.local` for local development. In Vercel, add the same keys under Project Settings -> Environment Variables.

```bash
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

Do not commit `.env.local` or real Supabase keys. This repository includes `.env.example` only.

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the example environment file:

   ```bash
   copy .env.example .env.local
   ```

3. Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open:

   - Landing page: `http://localhost:3000`
   - Demo mode: `http://localhost:3000/demo`
   - Authenticated app: `http://localhost:3000/login`

## Supabase Setup

1. Create a new Supabase project.
2. Open the Supabase SQL Editor.
3. Run the complete schema file:

   ```sql
   -- paste and run supabase/schema.sql
   ```

   The `supabase/migrations` folder is also included for incremental setup history. For a fresh project, `supabase/schema.sql` is the easiest one-file setup.

4. Optional: run demo seed data:

   ```sql
   -- paste and run supabase/seed.sql
   ```

5. Confirm the `proof-uploads` storage bucket exists.

   The schema creates the bucket and storage policies. If you create it manually, use:

   - Bucket name: `proof-uploads`
   - Public bucket for MVP proof links
   - Max file size: 5 MB
   - Allowed files: PDF, JPG, PNG, DOC, DOCX

## Creating Auth Users

For the MVP there is no public signup. Create users manually in Supabase.

1. Go to Supabase Dashboard -> Authentication -> Users.
2. Click Add user.
3. Create the principal, coordinators, and teachers with email/password.
4. Copy each generated Auth user UUID.
5. Insert or update the matching row in `public.profiles`.

The important link is:

```sql
public.profiles.id = auth.users.id
```

Example principal profile:

```sql
insert into public.profiles (
  id,
  school_id,
  full_name,
  email,
  role,
  designation,
  is_active
) values (
  'AUTH_USER_UUID_HERE',
  'SCHOOL_UUID_HERE',
  'Principal Name',
  'principal@example.com',
  'principal',
  'Principal',
  true
);
```

See `docs/demo-setup.md` for a more detailed local demo setup flow.

## Running Checks

```bash
npm run lint
npm run build
```

Both should pass before deployment.

## Deploying to Vercel

1. Push the repository to GitHub, GitLab, or Bitbucket.
2. Create a new Vercel project from the repository.
3. Framework preset should be Next.js.
4. Add environment variables in Vercel:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

5. Deploy.
6. After deployment, test:

   - Public landing page
   - Demo mode
   - Login page
   - Protected app routes
   - Role-based navigation

## Production Checklist

- Create Supabase project.
- Run `supabase/schema.sql`.
- Optional: run `supabase/seed.sql` for demo data.
- Confirm or create `proof-uploads` storage bucket.
- Set `NEXT_PUBLIC_SUPABASE_URL` in Vercel.
- Set `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel.
- Create principal user in Supabase Auth.
- Insert matching `profiles` row using the principal Auth UUID.
- Create coordinator and teacher users if needed.
- Link every Auth user to a `profiles` row.
- Test principal login.
- Test role access for principal, coordinator, and teacher.
- Test syllabus update submission.
- Test task update and proof upload.
- Test event creation and milestone update.
- Test institution brief print using browser Print / Save as PDF.
- Confirm no real secrets are committed.

## MVP Routes

Public:

- `/`
- `/demo`
- `/demo/dashboard`
- `/demo/school-dashboard`
- `/demo/college-dashboard`
- `/demo/board-command`
- `/demo/board-command/class-10`
- `/demo/board-command/class-12`
- `/demo/syllabus`
- `/demo/tasks`
- `/demo/calendar`
- `/demo/institution-brief`
- `/login`

Protected:

- `/dashboard`
- `/staff-status`
- `/student-attendance`
- `/timetable`
- `/weekly-workflow`
- `/syllabus`
- `/tasks`
- `/calendar`
- `/board-command`
- `/board-command/class-10`
- `/board-command/class-12`
- `/board-command/teacher-inputs`
- `/college-command`
- `/college-command/courses`
- `/college-command/courses/btech`
- `/college-final-exams`
- `/college-fees`
- `/placements`
- `/accreditation`
- `/institution-brief`
- `/reports`
- `/settings`

## Notes

- Demo mode uses static sample data and does not connect to Supabase.
- Browser print is used for PDF export placeholders.
- Supabase Row Level Security policies are included in `supabase/schema.sql`.
- `.env.local` is ignored by Git through `.gitignore`.
