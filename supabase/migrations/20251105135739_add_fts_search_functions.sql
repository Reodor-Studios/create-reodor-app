set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.search_conversations(user_uuid uuid, search_text text)
 RETURNS TABLE(id uuid, user_id uuid, title text, pinned boolean, preview text, created_at timestamp with time zone, updated_at timestamp with time zone, rank real)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.search_conversations_by_messages(user_uuid uuid, search_text text)
 RETURNS TABLE(id uuid, user_id uuid, title text, pinned boolean, preview text, created_at timestamp with time zone, updated_at timestamp with time zone, rank real, matching_message_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.search_messages_in_conversation(conversation_uuid uuid, search_text text)
 RETURNS TABLE(id uuid, conversation_id uuid, role message_role, parts jsonb, metadata jsonb, created_at timestamp with time zone, sequence_number integer, rank real)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;


