-- Function to automatically update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for profiles updated_at
create trigger profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

-- Trigger for todos updated_at
create trigger todos_updated_at
  before update on public.todos
  for each row
  execute function public.handle_updated_at();

-- Trigger for media updated_at
create trigger media_updated_at
  before update on public.media
  for each row
  execute function public.handle_updated_at();

-- Function to automatically create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
declare
  user_role public.user_role;
begin
  -- Safely extract and validate the role from metadata
  begin
    -- Try to get role from user_metadata first, then app_metadata, then default to user
    if new.raw_user_meta_data ? 'role' then
      user_role := (new.raw_user_meta_data->>'role')::public.user_role;
    elsif new.raw_app_meta_data ? 'role' then
      user_role := (new.raw_app_meta_data->>'role')::public.user_role;
    else
      user_role := 'user'::public.user_role;
    end if;
  exception when others then
    -- If role casting fails, default to user
    user_role := 'user'::public.user_role;
  end;

  -- Insert the user profile
  insert into public.profiles (
    id,
    email,
    full_name,
    phone_number,
    avatar_url,
    role
  ) values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'first_name',
      new.raw_user_meta_data->>'name'
    ),
    new.raw_user_meta_data->>'phone_number',
    new.raw_user_meta_data->>'avatar_url',
    user_role
  );

  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Trigger to create profile on user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Demo RPC Function: Get user todo statistics
-- Returns comprehensive statistics about a user's todos with full type inference
create or replace function public.get_user_todo_stats(user_uuid uuid)
returns table (
  user_id uuid,
  total_todos bigint,
  completed_todos bigint,
  pending_todos bigint,
  overdue_todos bigint,
  high_priority_todos bigint,
  medium_priority_todos bigint,
  low_priority_todos bigint,
  no_priority_todos bigint,
  completion_rate numeric
) as $$
begin
  return query
  select
    user_uuid as user_id,
    count(*) as total_todos,
    count(*) filter (where t.completed = true) as completed_todos,
    count(*) filter (where t.completed = false) as pending_todos,
    count(*) filter (
      where t.completed = false
      and t.due_date is not null
      and t.due_date < now()
    ) as overdue_todos,
    count(*) filter (where t.priority = 'high') as high_priority_todos,
    count(*) filter (where t.priority = 'medium') as medium_priority_todos,
    count(*) filter (where t.priority = 'low') as low_priority_todos,
    count(*) filter (where t.priority is null) as no_priority_todos,
    case
      when count(*) > 0 then
        round((count(*) filter (where t.completed = true)::numeric / count(*)::numeric) * 100, 2)
      else 0::numeric
    end as completion_rate
  from public.todos t
  where t.user_id = user_uuid;
end;
$$ language plpgsql security definer;
