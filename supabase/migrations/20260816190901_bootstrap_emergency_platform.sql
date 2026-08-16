create extension if not exists pgcrypto;
create extension if not exists postgis;

create type public.app_role as enum ('admin','operator','authority');
create type public.report_status as enum ('pending_sync','received','reviewing','verified','critical','notified','responding','resolved','discarded');
create type public.notification_status as enum ('queued','sent','delivered','confirmed','failed');
create type public.access_request_status as enum ('pending','approved','rejected');

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  organization text,
  role public.app_role not null default 'operator',
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  public_code text unique not null default ('EMG-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
  category text not null,
  title text,
  public_summary text,
  description_private text,
  severity smallint not null default 1 check (severity between 1 and 5),
  status public.report_status not null default 'received',
  location geography(point,4326) not null,
  latitude double precision generated always as (st_y(location::geometry)) stored,
  longitude double precision generated always as (st_x(location::geometry)) stored,
  region text,
  commune text,
  locality text,
  address_approx text,
  reports_count integer not null default 1 check (reports_count >= 1),
  first_reported_at timestamptz not null default now(),
  last_reported_at timestamptz not null default now(),
  verified_at timestamptz,
  resolved_at timestamptz,
  ai_category text,
  ai_severity smallint check (ai_severity between 1 and 5),
  ai_summary text,
  ai_confidence numeric,
  ai_processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key,
  incident_id uuid references public.incidents(id) on delete set null,
  submission_secret_hash text not null,
  category text not null,
  description text,
  location geography(point,4326) not null,
  region text,
  commune text,
  locality text,
  address_approx text,
  occurred_at timestamptz,
  captured_at timestamptz not null,
  received_at timestamptz not null default now(),
  sync_attempts integer not null default 0,
  client_created_offline boolean not null default false,
  danger_fire boolean not null default false,
  danger_injured boolean not null default false,
  danger_trapped boolean not null default false,
  danger_electric boolean not null default false,
  road_blocked boolean not null default false,
  reporter_session_hash text,
  moderation_state text not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.evidence (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  incident_id uuid references public.incidents(id) on delete set null,
  storage_path text unique not null,
  media_type text not null check (media_type in ('image','video')),
  mime_type text not null,
  bytes bigint check (bytes > 0),
  duration_seconds numeric,
  sha256 text,
  status text not null default 'uploaded',
  created_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(), name text not null, kind text not null,
  region text, commune text, email text, phone text, website text, radio_frequency text,
  active boolean not null default true, created_at timestamptz not null default now()
);

create table public.incident_notifications (
  id uuid primary key default gen_random_uuid(), incident_id uuid not null references public.incidents(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null, organization_name text not null,
  channel text not null check (channel in ('email','sms','whatsapp','web','radio','manual')), destination text,
  status public.notification_status not null default 'queued', provider_message_id text,
  sent_at timestamptz, delivered_at timestamptz, confirmed_at timestamptz, failure_reason text,
  created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now()
);

create table public.access_requests (
  id uuid primary key default gen_random_uuid(), full_name text not null, email text not null, organization text not null,
  position text, requested_role public.app_role not null, message text, status public.access_request_status not null default 'pending',
  created_at timestamptz not null default now(), reviewed_at timestamptz, reviewed_by uuid references auth.users(id) on delete set null
);

create table public.audit_log (
  id bigint generated always as identity primary key, actor_user_id uuid references auth.users(id) on delete set null,
  actor_role public.app_role, action text not null, entity_type text not null, entity_id text, metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create table public.rate_limit_events (
  id bigint generated always as identity primary key, scope text not null, fingerprint_hash text not null, created_at timestamptz not null default now()
);

create index incidents_location_gix on public.incidents using gist(location);
create index incidents_status_idx on public.incidents(status,last_reported_at desc);
create index incidents_category_idx on public.incidents(category,last_reported_at desc);
create index reports_location_gix on public.reports using gist(location);
create index reports_incident_idx on public.reports(incident_id);
create index reports_received_idx on public.reports(received_at desc);
create index evidence_incident_idx on public.evidence(incident_id,created_at);
create index evidence_report_idx on public.evidence(report_id,created_at);
create index incident_notifications_incident_idx on public.incident_notifications(incident_id,created_at desc);
create index rate_limit_events_lookup_idx on public.rate_limit_events(scope,fingerprint_hash,created_at desc);

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path='public' as $$begin new.updated_at=now(); return new; end$$;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger incidents_touch before update on public.incidents for each row execute function public.touch_updated_at();

create or replace function public.is_staff(required_roles public.app_role[] default array['admin'::public.app_role,'operator'::public.app_role,'authority'::public.app_role])
returns boolean language sql stable set search_path='public' as $$select exists(select 1 from public.profiles p where p.user_id=(select auth.uid()) and p.active=true and p.role=any(required_roles));$$;

alter table public.profiles enable row level security;
alter table public.incidents enable row level security;
alter table public.reports enable row level security;
alter table public.evidence enable row level security;
alter table public.organizations enable row level security;
alter table public.incident_notifications enable row level security;
alter table public.access_requests enable row level security;
alter table public.audit_log enable row level security;
alter table public.rate_limit_events enable row level security;

create policy profiles_self_read on public.profiles for select to authenticated using ((select auth.uid())=user_id);
create policy profiles_admin_read on public.profiles for select to authenticated using (public.is_staff(array['admin'::public.app_role]));
create policy profiles_admin_update on public.profiles for update to authenticated using (public.is_staff(array['admin'::public.app_role])) with check (public.is_staff(array['admin'::public.app_role]));
create policy incidents_staff_read on public.incidents for select to authenticated using (public.is_staff());
create policy incidents_staff_update on public.incidents for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy reports_staff_read on public.reports for select to authenticated using (public.is_staff());
create policy reports_staff_update on public.reports for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy evidence_staff_read on public.evidence for select to authenticated using (public.is_staff());
create policy organizations_staff_read on public.organizations for select to authenticated using (public.is_staff());
create policy organizations_admin_write on public.organizations for all to authenticated using (public.is_staff(array['admin'::public.app_role])) with check (public.is_staff(array['admin'::public.app_role]));
create policy notifications_staff_read on public.incident_notifications for select to authenticated using (public.is_staff());
create policy notifications_staff_insert on public.incident_notifications for insert to authenticated with check (public.is_staff());
create policy notifications_staff_update on public.incident_notifications for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy access_requests_admin_read on public.access_requests for select to authenticated using (public.is_staff(array['admin'::public.app_role]));
create policy access_requests_admin_update on public.access_requests for update to authenticated using (public.is_staff(array['admin'::public.app_role])) with check (public.is_staff(array['admin'::public.app_role]));
create policy audit_staff_read on public.audit_log for select to authenticated using (public.is_staff());

revoke all on public.profiles,public.incidents,public.reports,public.evidence,public.organizations,public.incident_notifications,public.access_requests,public.audit_log,public.rate_limit_events from anon,authenticated;
grant select,update on public.profiles to authenticated;
grant select,update on public.incidents to authenticated;
grant select,update on public.reports to authenticated;
grant select on public.evidence to authenticated;
grant select,insert,update,delete on public.organizations to authenticated;
grant select,insert,update on public.incident_notifications to authenticated;
grant select,update on public.access_requests to authenticated;
grant select on public.audit_log to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('emergency-evidence','emergency-evidence',false,52428800,array['image/jpeg','image/png','image/webp','video/mp4','video/webm','video/quicktime'])
on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy evidence_storage_staff_read on storage.objects for select to authenticated using (bucket_id='emergency-evidence' and public.is_staff());

insert into public.organizations(name,kind,region,commune)
select x.name,x.kind,'Antofagasta','Antofagasta' from (values
 ('CGE','electricity'),('SENAPRED Antofagasta','emergency_management'),('Bomberos de Antofagasta','fire'),('SAMU Antofagasta','medical'),('Carabineros de Chile','police')
) as x(name,kind) where not exists(select 1 from public.organizations o where o.name=x.name);
