create schema if not exists private;
revoke all on schema private from public;
create or replace function private.handle_new_auth_user() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles(user_id,email,full_name,organization,role,active)
 values(new.id,coalesce(new.email,''),coalesce(new.raw_user_meta_data->>'full_name',split_part(coalesce(new.email,''),'@',1)),new.raw_user_meta_data->>'organization',case when lower(coalesce(new.email,''))='contacto@innova-space-edu.cl' then 'admin'::public.app_role else 'operator'::public.app_role end,case when lower(coalesce(new.email,''))='contacto@innova-space-edu.cl' then true else false end)
 on conflict(user_id) do update set email=excluded.email,updated_at=now(); return new;
end$$;
revoke all on function private.handle_new_auth_user() from public;
create trigger on_auth_user_created_emergency_profile after insert on auth.users for each row execute function private.handle_new_auth_user();
