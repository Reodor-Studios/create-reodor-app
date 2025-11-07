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

-- Trigger for conversations updated_at
create trigger conversations_updated_at
  before update on public.conversations
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

-- ============================================================================
-- Full Text Search Functions
-- ============================================================================

/**
 * Search conversations using full text search with ranking
 * Searches both title and preview with weighted ranking (title: A, preview: B)
 *
 * @param user_uuid - The UUID of the user whose conversations to search
 * @param search_text - The search query (supports web search syntax: quotes, OR, -)
 * @returns Conversations matching the search query, ranked by relevance
 */
create or replace function public.search_conversations(
  user_uuid uuid,
  search_text text
)
returns table (
  id uuid,
  user_id uuid,
  title text,
  pinned boolean,
  preview text,
  created_at timestamptz,
  updated_at timestamptz,
  rank real
) as $$
begin
  return query
  select
    c.id,
    c.user_id,
    c.title,
    c.pinned,
    c.preview,
    c.created_at,
    c.updated_at,
    ts_rank(c.fts_weighted, websearch_to_tsquery('english', search_text)) as rank
  from public.conversations c
  where c.user_id = user_uuid
    and c.fts_weighted @@ websearch_to_tsquery('english', search_text)
  order by rank desc, c.updated_at desc;
end;
$$ language plpgsql security definer;

/**
 * Search messages within conversations using full text search
 * Useful for finding specific messages within a conversation
 *
 * @param conversation_uuid - The UUID of the conversation to search within
 * @param search_text - The search query (supports web search syntax)
 * @returns Messages matching the search query, ranked by relevance
 */
create or replace function public.search_messages_in_conversation(
  conversation_uuid uuid,
  search_text text
)
returns table (
  id uuid,
  conversation_id uuid,
  role message_role,
  parts jsonb,
  metadata jsonb,
  created_at timestamptz,
  sequence_number integer,
  rank real
) as $$
begin
  return query
  select
    m.id,
    m.conversation_id,
    m.role,
    m.parts,
    m.metadata,
    m.created_at,
    m.sequence_number,
    ts_rank(m.fts, websearch_to_tsquery('english', search_text)) as rank
  from public.messages m
  where m.conversation_id = conversation_uuid
    and m.fts @@ websearch_to_tsquery('english', search_text)
  order by rank desc, m.sequence_number asc;
end;
$$ language plpgsql security definer;

/**
 * Search messages across all user's conversations
 * Returns conversations that contain matching messages
 *
 * @param user_uuid - The UUID of the user
 * @param search_text - The search query (supports web search syntax)
 * @returns Conversations containing matching messages, with highest ranked message
 */
create or replace function public.search_conversations_by_messages(
  user_uuid uuid,
  search_text text
)
returns table (
  id uuid,
  user_id uuid,
  title text,
  pinned boolean,
  preview text,
  created_at timestamptz,
  updated_at timestamptz,
  rank real,
  matching_message_count bigint
) as $$
begin
  return query
  select
    c.id,
    c.user_id,
    c.title,
    c.pinned,
    c.preview,
    c.created_at,
    c.updated_at,
    max(ts_rank(m.fts, websearch_to_tsquery('english', search_text))) as rank,
    count(m.id) as matching_message_count
  from public.conversations c
  inner join public.messages m on m.conversation_id = c.id
  where c.user_id = user_uuid
    and m.fts @@ websearch_to_tsquery('english', search_text)
  group by c.id, c.user_id, c.title, c.pinned, c.preview, c.created_at, c.updated_at
  order by rank desc, c.updated_at desc;
end;
$$ language plpgsql security definer;
