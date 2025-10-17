set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_user_todo_stats(user_uuid uuid)
 RETURNS TABLE(user_id uuid, total_todos bigint, completed_todos bigint, pending_todos bigint, overdue_todos bigint, high_priority_todos bigint, medium_priority_todos bigint, low_priority_todos bigint, no_priority_todos bigint, completion_rate numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;


