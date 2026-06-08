# Demo Setup

Use this guide to load the EduCommand demo data with real Supabase Auth users.

## 1. Create Auth Users

In Supabase, open **Authentication > Users** and create users manually for the demo accounts you want to test.

Suggested demo emails:

- `principal@demo.educommand.local`
- `coordinator.academic@demo.educommand.local`
- `coordinator.events@demo.educommand.local`
- `maths.teacher@demo.educommand.local`
- `science.teacher@demo.educommand.local`
- `english.teacher@demo.educommand.local`
- `social.teacher@demo.educommand.local`
- `telugu.teacher@demo.educommand.local`
- `hindi.teacher@demo.educommand.local`
- `grade6.teacher@demo.educommand.local`
- `grade8.teacher@demo.educommand.local`

Set temporary passwords in Supabase for local testing.

## 2. Copy User UUIDs

After each user is created, copy the user UUID from the Supabase Auth user details page.

## 3. Replace Profile Placeholder UUIDs

Open `supabase/seed.sql` and replace the placeholder profile IDs with the real Auth user UUIDs.

Example:

```sql
-- Replace this placeholder:
00000000-0000-4000-8000-000000000001

-- With the real Supabase Auth user id:
8f1c2f54-6a7e-4f8a-9b11-3f8a0c0a1234
```

Each `profiles.id` value must match a real `auth.users.id`, because `profiles.id` has a foreign key to Supabase Auth.

## 4. Run Schema and Seed

In the Supabase SQL editor:

1. Run `supabase/schema.sql`.
2. Run your edited `supabase/seed.sql`.

## 5. Test Login

Start the app locally and log in with one of the demo accounts.

All roles currently redirect to `/dashboard` after login. The topbar should show the profile full name and role from the `profiles` table.
