-- Priority enum type
create type public.priority_level as enum ('low', 'medium', 'high');

-- Profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Todos table
create table public.todos (
  id uuid default uuid_generate_v4() primary key,
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

-- Comments for documentation
comment on table public.profiles is 'User profiles extending auth.users';
comment on table public.todos is 'User todo items';
comment on column public.todos.priority is 'Priority level: low, medium, or high';
