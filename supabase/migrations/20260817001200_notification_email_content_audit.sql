alter table public.incident_notifications add column if not exists subject text;
alter table public.incident_notifications add column if not exists message_text text;
alter table public.incident_notifications add column if not exists cc_recipients text[] not null default '{}';
create index if not exists incident_notifications_created_at_idx on public.incident_notifications(created_at desc);
