create or replace function public.admin_dashboard_stats()
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  result jsonb;
begin
  if not private.is_staff(array['admin'::app_role]) then
    raise exception 'No autorizado' using errcode='42501';
  end if;

  select jsonb_build_object(
    'total_incidents', (select count(*) from public.incidents),
    'active_incidents', (select count(*) from public.incidents where status not in ('resolved','discarded')),
    'resolved_incidents', (select count(*) from public.incidents where status='resolved'),
    'critical_incidents', (select count(*) from public.incidents where status not in ('resolved','discarded') and (status='critical' or severity>=4)),
    'total_reports', (select count(*) from public.reports),
    'total_evidence', (select count(*) from public.evidence),
    'image_evidence', (select count(*) from public.evidence where media_type='image'),
    'video_evidence', (select count(*) from public.evidence where media_type='video'),
    'total_ai_runs', (select count(*) from public.ai_agent_runs),
    'pending_ai', (select count(*) from public.incidents where status not in ('resolved','discarded') and ai_decision is null),
    'total_notifications', (select count(*) from public.incident_notifications),
    'sent_notifications', (select count(*) from public.incident_notifications where status='sent'),
    'total_emails', (select count(*) from public.email_delivery_log),
    'failed_emails', (select count(*) from public.email_delivery_log where status='failed'),
    'active_users', (select count(*) from public.profiles where active=true),
    'pending_access', (select count(*) from public.access_requests where status='pending'),
    'categories', (select coalesce(jsonb_object_agg(category,cnt),'{}'::jsonb) from (select category,count(*)::int cnt from public.incidents group by category) q),
    'statuses', (select coalesce(jsonb_object_agg(status::text,cnt),'{}'::jsonb) from (select status,count(*)::int cnt from public.incidents group by status) q)
  ) into result;
  return result;
end;
$$;

revoke all on function public.admin_dashboard_stats() from public;
grant execute on function public.admin_dashboard_stats() to authenticated;
comment on function public.admin_dashboard_stats() is 'Totales y distribuciones del dashboard, accesibles solo al rol admin.';
