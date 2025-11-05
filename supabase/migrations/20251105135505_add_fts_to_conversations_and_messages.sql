set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.extract_message_text(parts jsonb)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
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
$function$
;

alter table "public"."conversations" add column "fts_weighted" tsvector generated always as ((setweight(to_tsvector('english'::regconfig, COALESCE(title, ''::text)), 'A'::"char") || setweight(to_tsvector('english'::regconfig, COALESCE(preview, ''::text)), 'B'::"char"))) stored;

alter table "public"."messages" add column "fts" tsvector generated always as (to_tsvector('english'::regconfig, COALESCE(extract_message_text(parts), ''::text))) stored;

CREATE INDEX conversations_fts_weighted_idx ON public.conversations USING gin (fts_weighted);

CREATE INDEX messages_fts_idx ON public.messages USING gin (fts);


