create extension if not exists "pg_trgm" with schema "public" version '1.6';

create type "public"."message_role" as enum ('user', 'assistant', 'system');

-- Drop all policies that reference media_type before altering the enum
drop policy if exists "Users can insert their own media" on "public"."media";
drop policy if exists "Avatar media is viewable by everyone" on "public"."media";
drop policy if exists "Todo attachments are viewable by todo owner" on "public"."media";

alter type "public"."media_type" rename to "media_type__old_version_to_be_dropped";

create type "public"."media_type" as enum ('avatar', 'todo_attachment', 'chat_attachment', 'other');

create table "public"."conversations" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "title" text not null default 'New conversation'::text,
    "pinned" boolean not null default false,
    "preview" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."conversations" enable row level security;

create table "public"."messages" (
    "id" uuid not null default gen_random_uuid(),
    "conversation_id" uuid not null,
    "role" message_role not null,
    "parts" jsonb not null,
    "metadata" jsonb,
    "created_at" timestamp with time zone not null default now(),
    "sequence_number" integer not null
);


alter table "public"."messages" enable row level security;

alter table "public"."media" alter column media_type type "public"."media_type" using media_type::text::"public"."media_type";

drop type "public"."media_type__old_version_to_be_dropped";

alter table "public"."media" add column "conversation_id" uuid;

CREATE INDEX conversations_pinned_idx ON public.conversations USING btree (pinned);

CREATE UNIQUE INDEX conversations_pkey ON public.conversations USING btree (id);

CREATE INDEX conversations_title_trgm_idx ON public.conversations USING gin (title gin_trgm_ops);

CREATE INDEX conversations_updated_at_idx ON public.conversations USING btree (updated_at DESC);

CREATE INDEX conversations_user_id_idx ON public.conversations USING btree (user_id);

CREATE INDEX media_conversation_id_idx ON public.media USING btree (conversation_id);

CREATE INDEX messages_conversation_id_idx ON public.messages USING btree (conversation_id);

CREATE INDEX messages_parts_idx ON public.messages USING gin (parts);

CREATE UNIQUE INDEX messages_pkey ON public.messages USING btree (id);

CREATE INDEX messages_sequence_idx ON public.messages USING btree (conversation_id, sequence_number);

alter table "public"."conversations" add constraint "conversations_pkey" PRIMARY KEY using index "conversations_pkey";

alter table "public"."messages" add constraint "messages_pkey" PRIMARY KEY using index "messages_pkey";

alter table "public"."conversations" add constraint "conversations_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."conversations" validate constraint "conversations_user_id_fkey";

alter table "public"."media" add constraint "media_conversation_id_fkey" FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE not valid;

alter table "public"."media" validate constraint "media_conversation_id_fkey";

alter table "public"."messages" add constraint "messages_conversation_id_fkey" FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE not valid;

alter table "public"."messages" validate constraint "messages_conversation_id_fkey";

grant delete on table "public"."conversations" to "anon";

grant insert on table "public"."conversations" to "anon";

grant references on table "public"."conversations" to "anon";

grant select on table "public"."conversations" to "anon";

grant trigger on table "public"."conversations" to "anon";

grant truncate on table "public"."conversations" to "anon";

grant update on table "public"."conversations" to "anon";

grant delete on table "public"."conversations" to "authenticated";

grant insert on table "public"."conversations" to "authenticated";

grant references on table "public"."conversations" to "authenticated";

grant select on table "public"."conversations" to "authenticated";

grant trigger on table "public"."conversations" to "authenticated";

grant truncate on table "public"."conversations" to "authenticated";

grant update on table "public"."conversations" to "authenticated";

grant delete on table "public"."conversations" to "service_role";

grant insert on table "public"."conversations" to "service_role";

grant references on table "public"."conversations" to "service_role";

grant select on table "public"."conversations" to "service_role";

grant trigger on table "public"."conversations" to "service_role";

grant truncate on table "public"."conversations" to "service_role";

grant update on table "public"."conversations" to "service_role";

grant delete on table "public"."messages" to "anon";

grant insert on table "public"."messages" to "anon";

grant references on table "public"."messages" to "anon";

grant select on table "public"."messages" to "anon";

grant trigger on table "public"."messages" to "anon";

grant truncate on table "public"."messages" to "anon";

grant update on table "public"."messages" to "anon";

grant delete on table "public"."messages" to "authenticated";

grant insert on table "public"."messages" to "authenticated";

grant references on table "public"."messages" to "authenticated";

grant select on table "public"."messages" to "authenticated";

grant trigger on table "public"."messages" to "authenticated";

grant truncate on table "public"."messages" to "authenticated";

grant update on table "public"."messages" to "authenticated";

grant delete on table "public"."messages" to "service_role";

grant insert on table "public"."messages" to "service_role";

grant references on table "public"."messages" to "service_role";

grant select on table "public"."messages" to "service_role";

grant trigger on table "public"."messages" to "service_role";

grant truncate on table "public"."messages" to "service_role";

grant update on table "public"."messages" to "service_role";

create policy "Users can create their own conversations"
on "public"."conversations"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can delete their own conversations"
on "public"."conversations"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can update their own conversations"
on "public"."conversations"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view their own conversations"
on "public"."conversations"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Chat attachments are viewable by conversation owner"
on "public"."media"
as permissive
for select
to public
using (((media_type = 'chat_attachment'::media_type) AND (conversation_id IN ( SELECT conversations.id
   FROM conversations
  WHERE (conversations.user_id = auth.uid())))));


create policy "Users can create messages in their conversations"
on "public"."messages"
as permissive
for insert
to public
with check ((conversation_id IN ( SELECT conversations.id
   FROM conversations
  WHERE (conversations.user_id = auth.uid()))));


create policy "Users can view messages in their conversations"
on "public"."messages"
as permissive
for select
to public
using ((conversation_id IN ( SELECT conversations.id
   FROM conversations
  WHERE (conversations.user_id = auth.uid()))));


create policy "Users can insert their own media"
on "public"."media"
as permissive
for insert
to public
with check (((auth.uid() = owner_id) AND (((media_type = 'todo_attachment'::media_type) AND (todo_id IN ( SELECT todos.id
   FROM todos
  WHERE (todos.user_id = auth.uid())))) OR ((media_type = 'chat_attachment'::media_type) AND (conversation_id IN ( SELECT conversations.id
   FROM conversations
  WHERE (conversations.user_id = auth.uid())))) OR ((media_type <> 'todo_attachment'::media_type) AND (media_type <> 'chat_attachment'::media_type)))));


CREATE TRIGGER conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Recreate the policies that were dropped for enum alteration
create policy "Avatar media is viewable by everyone"
  on "public"."media"
  as permissive
  for select
  to public
  using (media_type = 'avatar'::media_type);

create policy "Todo attachments are viewable by todo owner"
  on "public"."media"
  as permissive
  for select
  to public
  using (
    media_type = 'todo_attachment'::media_type
    AND todo_id IN (
      SELECT todos.id
      FROM todos
      WHERE todos.user_id = auth.uid()
    )
  );


