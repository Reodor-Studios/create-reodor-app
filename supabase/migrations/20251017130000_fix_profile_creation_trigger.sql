-- Drop existing trigger if it exists
drop trigger if exists on_auth_user_created on auth.users;

-- Recreate the function with improved error handling
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

-- Create the trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
