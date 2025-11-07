-- Priority enum type
create type public.priority_level as enum ('low', 'medium', 'high');

-- User role enum type
create type public.user_role as enum ('user', 'admin');

-- Media type enum
create type public.media_type as enum (
  'avatar',
  'todo_attachment',
  'chat_attachment',
  'other'
);

-- Message role enum for chat messages
create type public.message_role as enum ('user', 'assistant', 'system');

-- Profiles table
create table public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text unique not null,
  full_name text,
  avatar_url text,
  phone_number text,
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

-- Conversations table for chat feature
create table public.conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null default 'New conversation',
  pinned boolean default false not null,
  preview text, -- First message preview for sidebar
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Indexes for conversations
create index conversations_user_id_idx on public.conversations(user_id);
create index conversations_pinned_idx on public.conversations(pinned);
create index conversations_updated_at_idx on public.conversations(updated_at desc);

-- GIN index for fuzzy text search on title using pg_trgm
create index conversations_title_trgm_idx on public.conversations using gin (title gin_trgm_ops);

-- Messages table for chat messages
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  role public.message_role not null,
  parts jsonb not null, -- Stores UIMessage.parts array from Vercel AI SDK
  metadata jsonb, -- Optional metadata from UIMessage
  created_at timestamptz default now() not null,
  sequence_number integer not null -- Ensures deterministic message ordering
);

-- Indexes for messages
create index messages_conversation_id_idx on public.messages(conversation_id);
create index messages_sequence_idx on public.messages(conversation_id, sequence_number);

-- GIN index for JSONB content search (not trgm since it's JSONB)
create index messages_parts_idx on public.messages using gin (parts);

-- ============================================================================
-- Full Text Search Setup
-- ============================================================================

-- Helper function to extract text content from message parts JSONB
create or replace function public.extract_message_text(parts jsonb)
returns text as $$
begin
  return (
    select string_agg(
      case
        when elem->>'type' = 'text' then elem->>'text'
        else ''
      end,
      ' '
    )
    from jsonb_array_elements(parts) as elem
  );
end;
$$ language plpgsql immutable;

-- Add FTS column to conversations with weighted search (title: A, preview: B)
alter table public.conversations
add column fts_weighted tsvector
generated always as (
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(preview, '')), 'B')
) stored;

-- Create GIN index for conversations FTS
create index conversations_fts_weighted_idx on public.conversations using gin (fts_weighted);

-- Add FTS column to messages for searching message content
alter table public.messages
add column fts tsvector
generated always as (
  to_tsvector('english', coalesce(extract_message_text(parts), ''))
) stored;

-- Create GIN index for messages FTS
create index messages_fts_idx on public.messages using gin (fts);

-- Media table for centralized file storage management
create table public.media (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  file_path text not null,
  media_type public.media_type not null,

  -- Foreign keys to link media to specific entities
  todo_id uuid references public.todos(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete cascade,

  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Indexes for performance
create index media_owner_id_idx on public.media(owner_id);
create index media_media_type_idx on public.media(media_type);
create index media_todo_id_idx on public.media(todo_id);
create index media_conversation_id_idx on public.media(conversation_id);

-- Comments for documentation
comment on table public.profiles is 'User profiles extending auth.users';
comment on table public.todos is 'User todo items';
comment on column public.todos.priority is 'Priority level: low, medium, or high';
comment on table public.conversations is 'User chat conversations with AI assistant';
comment on column public.conversations.preview is 'First message preview for sidebar display';
comment on column public.conversations.fts_weighted is 'Full text search vector with weighted title (A) and preview (B)';
comment on table public.messages is 'Individual messages within conversations';
comment on column public.messages.parts is 'UIMessage.parts array from Vercel AI SDK stored as JSONB';
comment on column public.messages.sequence_number is 'Ensures deterministic message ordering within conversation';
comment on column public.messages.fts is 'Full text search vector for message content extracted from parts JSONB';
comment on table public.media is 'Centralized media storage for all file uploads';
comment on column public.media.file_path is 'Path to file in Supabase Storage (without bucket prefix)';
