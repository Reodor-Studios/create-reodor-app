create type "public"."user_role" as enum ('user', 'admin');

alter table "public"."profiles" add column "role" user_role not null default 'user'::user_role;

alter table "public"."todos" alter column "id" set default gen_random_uuid();


