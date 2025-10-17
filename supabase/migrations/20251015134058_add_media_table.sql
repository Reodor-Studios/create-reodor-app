-- Media type enum
create type public.media_type as enum (
  'avatar',
  'todo_attachment',
  'other'
);

-- Media table for centralized file storage management
create table public.media (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  file_path text not null,
  media_type public.media_type not null,

  -- Foreign keys to link media to specific entities
  todo_id uuid references public.todos(id) on delete cascade,

  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Indexes for performance
create index media_owner_id_idx on public.media(owner_id);
create index media_media_type_idx on public.media(media_type);
create index media_todo_id_idx on public.media(todo_id);

-- Comments for documentation
comment on table public.media is 'Centralized media storage for all file uploads';
comment on column public.media.file_path is 'Path to file in Supabase Storage (without bucket prefix)';

-- Enable RLS
alter table public.media enable row level security;

-- Media policies
-- Avatar media is viewable by everyone (public)
create policy "Avatar media is viewable by everyone"
  on public.media for select
  using (media_type = 'avatar');

-- Todo attachments are viewable by the todo owner
create policy "Todo attachments are viewable by todo owner"
  on public.media for select
  using (
    media_type = 'todo_attachment'
    and todo_id in (
      select id from public.todos where user_id = auth.uid()
    )
  );

-- Users can upload their own media
create policy "Users can insert their own media"
  on public.media for insert
  with check (
    auth.uid() = owner_id
    and (
      -- For todo attachments, verify the user owns the todo
      (media_type = 'todo_attachment' and todo_id in (
        select id from public.todos where user_id = auth.uid()
      ))
      -- For other media types (avatar, etc), just check ownership
      or media_type != 'todo_attachment'
    )
  );

-- Users can update their own media
create policy "Users can update their own media"
  on public.media for update
  using (auth.uid() = owner_id);

-- Users can delete their own media
create policy "Users can delete their own media"
  on public.media for delete
  using (auth.uid() = owner_id);

-- Trigger for media updated_at
create trigger media_updated_at
  before update on public.media
  for each row
  execute function public.handle_updated_at();
