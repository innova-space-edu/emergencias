alter table public.profiles add column if not exists email_notifications_enabled boolean not null default true;

create table if not exists public.email_delivery_log (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid references public.incidents(id) on delete set null,
  kind text not null check (kind in ('staff_new_incident','authority_notification','admin_contact','access_request','mail_test','agent_prealert')),
  recipient text not null,
  cc text[] not null default '{}',
  provider text not null default 'resend',
  provider_message_id text,
  status text not null check (status in ('sent','failed','skipped')),
  error text,
  created_at timestamptz not null default now()
);

create index if not exists email_delivery_log_incident_created_idx on public.email_delivery_log(incident_id, created_at desc);
create index if not exists email_delivery_log_status_created_idx on public.email_delivery_log(status, created_at desc);

alter table public.email_delivery_log enable row level security;

drop policy if exists email_delivery_log_admin_read on public.email_delivery_log;
create policy email_delivery_log_admin_read on public.email_delivery_log for select to authenticated using (private.is_staff(array['admin'::app_role]));

comment on column public.profiles.email_notifications_enabled is 'Recibe alertas automáticas por correo sobre nuevas emergencias.';
comment on table public.email_delivery_log is 'Auditoría de entregas de correo transaccional vía Resend.';
