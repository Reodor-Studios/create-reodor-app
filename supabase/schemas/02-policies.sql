-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.todos enable row level security;
alter table public.media enable row level security;

-- Profiles policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Todos policies
create policy "Users can view their own todos"
  on public.todos for select
  using (auth.uid() = user_id);

create policy "Users can create their own todos"
  on public.todos for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own todos"
  on public.todos for update
  using (auth.uid() = user_id);

create policy "Users can delete their own todos"
  on public.todos for delete
  using (auth.uid() = user_id);

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
  with check (auth.uid() = owner_id);

-- Users can update their own media
create policy "Users can update their own media"
  on public.media for update
  using (auth.uid() = owner_id);

-- Users can delete their own media
create policy "Users can delete their own media"
  on public.media for delete
  using (auth.uid() = owner_id);
