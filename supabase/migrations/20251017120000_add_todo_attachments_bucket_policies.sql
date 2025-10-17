-- Create storage bucket for todo attachments if it doesn't exist
insert into storage.buckets (id, name, public)
values ('todo_attachments', 'todo_attachments', false)
on conflict (id) do nothing;

-- Policy: Users can upload files to their own todo folders
create policy "Users can upload todo attachments"
on storage.objects for insert
with check (
  bucket_id = 'todo_attachments'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can view their own todo attachments
create policy "Users can view their own todo attachments"
on storage.objects for select
using (
  bucket_id = 'todo_attachments'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own todo attachments
create policy "Users can update their own todo attachments"
on storage.objects for update
using (
  bucket_id = 'todo_attachments'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own todo attachments
create policy "Users can delete their own todo attachments"
on storage.objects for delete
using (
  bucket_id = 'todo_attachments'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);
