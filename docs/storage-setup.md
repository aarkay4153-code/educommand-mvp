# Supabase Storage Setup

EduCommand uses one Supabase Storage bucket for proof files:

- `proof-uploads`

Files are uploaded with this path pattern:

```text
school_id/module/record_id/filename
```

Examples:

```text
10000000-0000-4000-8000-000000000001/tasks/task-id/proof.pdf
10000000-0000-4000-8000-000000000001/syllabus_updates/update-id/photo.png
10000000-0000-4000-8000-000000000001/event_milestones/milestone-id/proof.jpg
```

## Create Bucket

Run this in the Supabase SQL editor:

```sql
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
```

## Storage Policies

These MVP policies let authenticated users read and upload proof files only inside their own school folder.

```sql
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
```

For a stricter production version, split policies by module and verify the user owns the corresponding task, syllabus update, or event milestone row before allowing upload.
