-- Priority enum type
create type public.priority_level as enum ('low', 'medium', 'high');

-- User role enum type
create type public.user_role as enum ('user', 'admin');

-- Media type enum
create type public.media_type as enum (
  'avatar',
  'todo_attachment',
  'other'
);

-- Profiles table
create table public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text unique not null,
  full_name text,
  avatar_url text,
  role public.user_role default 'user' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Todos table
create table public.todos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  completed boolean default false not null,
  priority public.priority_level,
  due_date timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Indexes for performance
create index todos_user_id_idx on public.todos(user_id);
create index todos_completed_idx on public.todos(completed);
create index todos_due_date_idx on public.todos(due_date);

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
comment on table public.profiles is 'User profiles extending auth.users';
comment on table public.todos is 'User todo items';
comment on column public.todos.priority is 'Priority level: low, medium, or high';
comment on table public.media is 'Centralized media storage for all file uploads';
comment on column public.media.file_path is 'Path to file in Supabase Storage (without bucket prefix)';
