create index if not exists access_requests_reviewed_by_idx on public.access_requests(reviewed_by) where reviewed_by is not null;
create index if not exists audit_log_actor_user_idx on public.audit_log(actor_user_id) where actor_user_id is not null;
create index if not exists incident_notifications_created_by_idx on public.incident_notifications(created_by) where created_by is not null;
create index if not exists incident_notifications_organization_idx on public.incident_notifications(organization_id) where organization_id is not null;

drop policy if exists organizations_admin_write on public.organizations;
create policy organizations_admin_insert on public.organizations for insert to authenticated with check (private.is_staff(array['admin'::public.app_role]));
create policy organizations_admin_update on public.organizations for update to authenticated using (private.is_staff(array['admin'::public.app_role])) with check (private.is_staff(array['admin'::public.app_role]));
create policy organizations_admin_delete on public.organizations for delete to authenticated using (private.is_staff(array['admin'::public.app_role]));

drop policy if exists profiles_admin_read on public.profiles;
drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_or_admin_read on public.profiles for select to authenticated using ((select auth.uid()) = user_id or private.is_staff(array['admin'::public.app_role]));
