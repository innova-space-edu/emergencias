-- Innova Emergency · orquestador de eventos y correlación de reportes
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema extensions;
create extension if not exists vector with schema extensions;
create extension if not exists pg_trgm with schema extensions;

alter table public.reports add column if not exists validation_state text not null default 'pending';
alter table public.reports add column if not exists quality_score numeric(4,3);
alter table public.reports add column if not exists abuse_score numeric(4,3);
alter table public.reports add column if not exists correlation_score numeric(5,4);
alter table public.reports add column if not exists correlation_method text;
alter table public.reports add column if not exists agent_processed_at timestamptz;

alter table public.incidents add column if not exists canonical_incident_id uuid references public.incidents(id) on delete set null;
alter table public.incidents add column if not exists correlation_status text not null default 'canonical';
alter table public.incidents add column if not exists merged_at timestamptz;
alter table public.evidence add column if not exists content_sha256 text;
alter table public.incident_notifications add column if not exists notification_kind text not null default 'manual';
alter table public.incident_notifications add column if not exists reports_count_at_send integer;
alter table public.incident_notifications add column if not exists severity_at_send smallint;

create table if not exists public.emergency_agent_jobs(
 id uuid primary key default gen_random_uuid(),
 report_id uuid not null unique references public.reports(id) on delete cascade,
 incident_id uuid references public.incidents(id) on delete cascade,
 job_token uuid not null default gen_random_uuid(),
 report_secret text,
 status text not null default 'pending' check(status in('pending','processing','retry','completed','dead')),
 attempts integer not null default 0,
 next_attempt_at timestamptz not null default now(),
 started_at timestamptz,
 completed_at timestamptz,
 last_error text,
 last_request_id bigint,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.emergency_agent_jobs enable row level security;
revoke all on public.emergency_agent_jobs from anon,authenticated;
grant select,insert,update,delete on public.emergency_agent_jobs to service_role;

create table if not exists public.report_embeddings(
 report_id uuid primary key references public.reports(id) on delete cascade,
 embedding extensions.vector(768) not null,
 model text not null default 'gemini-embedding-2',
 source_hash text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.report_embeddings enable row level security;
revoke all on public.report_embeddings from anon,authenticated;
grant select,insert,update,delete on public.report_embeddings to service_role;

create table if not exists public.incident_embeddings(
 incident_id uuid primary key references public.incidents(id) on delete cascade,
 embedding extensions.vector(768) not null,
 model text not null default 'gemini-embedding-2',
 source_hash text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.incident_embeddings enable row level security;
revoke all on public.incident_embeddings from anon,authenticated;
grant select,insert,update,delete on public.incident_embeddings to service_role;

create table if not exists public.incident_correlations(
 id uuid primary key default gen_random_uuid(),
 source_incident_id uuid not null references public.incidents(id) on delete cascade,
 target_incident_id uuid not null references public.incidents(id) on delete cascade,
 report_id uuid references public.reports(id) on delete set null,
 score numeric(5,4),
 method text not null,
 reason text,
 merged boolean not null default false,
 created_at timestamptz not null default now(),
 unique(source_incident_id,target_incident_id,report_id)
);
alter table public.incident_correlations enable row level security;
revoke all on public.incident_correlations from anon,authenticated;
grant select,insert,update,delete on public.incident_correlations to service_role;

create index if not exists emergency_agent_jobs_due_idx on public.emergency_agent_jobs(status,next_attempt_at) where status in('pending','retry');
create index if not exists reports_validation_idx on public.reports(validation_state,received_at desc);
create index if not exists reports_reporter_session_idx on public.reports(reporter_session_hash,received_at desc) where reporter_session_hash is not null;
create index if not exists incidents_canonical_idx on public.incidents(canonical_incident_id) where canonical_incident_id is not null;
create index if not exists evidence_sha_idx on public.evidence(content_sha256) where content_sha256 is not null;

create or replace function public.find_related_incidents(p_report_id uuid,p_radius_m integer default 800,p_hours integer default 6,p_limit integer default 12)
returns table(incident_id uuid,public_code text,category text,distance_m double precision,minutes_apart double precision,category_exact boolean,category_compatible boolean,text_similarity real,vector_similarity double precision,score double precision)
language sql security definer set search_path=public,extensions as $$
with src as(
 select r.id,r.incident_id,r.category,r.description,r.location,r.received_at,re.embedding
 from public.reports r left join public.report_embeddings re on re.report_id=r.id where r.id=p_report_id
),base as(
 select i.id,i.public_code,i.category,
 st_distance(src.location::geography,i.location::geography) distance_m,
 abs(extract(epoch from(i.last_reported_at-src.received_at)))/60.0 minutes_apart,
 (i.category=src.category) category_exact,
 ((src.category in('power_outage','electrical_hazard') and i.category in('power_outage','electrical_hazard')) or
  (src.category in('traffic_accident','medical') and i.category in('traffic_accident','medical'))) category_compatible,
 extensions.similarity(lower(coalesce(src.description,'')),lower(coalesce(i.description_private,i.public_summary,'')))::real text_similarity,
 case when src.embedding is not null and ie.embedding is not null then 1-(src.embedding <=> ie.embedding) else null end vector_similarity
 from src join public.incidents i on i.id<>src.incident_id
 left join public.incident_embeddings ie on ie.incident_id=i.id
 where i.status in('received','reviewing','verified','critical','notified','responding')
 and i.canonical_incident_id is null
 and i.last_reported_at>=src.received_at-make_interval(hours=>p_hours)
 and st_dwithin(src.location::geography,i.location::geography,p_radius_m)
)
select id,public_code,category,distance_m,minutes_apart,category_exact,category_compatible,text_similarity,vector_similarity,
 greatest(0.0,1.0-distance_m/greatest(p_radius_m,1)::double precision)*0.30
 +case when category_exact then 0.25 when category_compatible then 0.14 else 0 end
 +greatest(0.0,1.0-minutes_apart/greatest(p_hours*60,1)::double precision)*0.12
 +least(1.0,greatest(0.0,text_similarity::double precision))*0.09
 +coalesce(least(1.0,greatest(0.0,vector_similarity))*0.24,0.0) score
from base order by score desc,distance_m asc limit greatest(1,least(p_limit,50));
$$;
revoke all on function public.find_related_incidents(uuid,integer,integer,integer) from public,anon,authenticated;
grant execute on function public.find_related_incidents(uuid,integer,integer,integer) to service_role;

create or replace function public.merge_report_into_incident(p_report_id uuid,p_target_incident_id uuid,p_score numeric,p_method text,p_reason text)
returns boolean language plpgsql security definer set search_path=public as $$
declare v_source uuid;v_source_count integer;v_target_count integer;v_has_activity boolean;
begin
 select incident_id into v_source from public.reports where id=p_report_id for update;
 if v_source is null or v_source=p_target_incident_id then return false;end if;
 select count(*) into v_source_count from public.reports where incident_id=v_source;
 select exists(select 1 from public.incident_notifications where incident_id=v_source and status in('sent','delivered','confirmed'))
 or exists(select 1 from public.ai_agent_runs where incident_id=v_source and status='completed') into v_has_activity;
 insert into public.incident_correlations(source_incident_id,target_incident_id,report_id,score,method,reason,merged)
 values(v_source,p_target_incident_id,p_report_id,p_score,p_method,p_reason,false)
 on conflict(source_incident_id,target_incident_id,report_id) do update set score=excluded.score,method=excluded.method,reason=excluded.reason;
 if v_source_count<>1 or v_has_activity then return false;end if;
 update public.reports set incident_id=p_target_incident_id,correlation_score=p_score,correlation_method=p_method where id=p_report_id;
 update public.evidence set incident_id=p_target_incident_id where report_id=p_report_id;
 select count(*) into v_target_count from public.reports where incident_id=p_target_incident_id;
 update public.incidents t set reports_count=v_target_count,last_reported_at=greatest(t.last_reported_at,s.last_reported_at),severity=greatest(t.severity,s.severity),updated_at=now()
 from public.incidents s where t.id=p_target_incident_id and s.id=v_source;
 update public.incidents set status='discarded',canonical_incident_id=p_target_incident_id,correlation_status='merged',merged_at=now(),updated_at=now() where id=v_source;
 update public.incident_correlations set merged=true where source_incident_id=v_source and target_incident_id=p_target_incident_id and report_id=p_report_id;
 return true;
end;$$;
revoke all on function public.merge_report_into_incident(uuid,uuid,numeric,text,text) from public,anon,authenticated;
grant execute on function public.merge_report_into_incident(uuid,uuid,numeric,text,text) to service_role;

create or replace function public.arm_emergency_agent_job(p_report_id uuid,p_secret text)
returns boolean language plpgsql security definer set search_path=public as $$
begin
 if p_secret is null or length(p_secret)<24 then return false;end if;
 update public.emergency_agent_jobs set report_secret=p_secret,status=case when status='dead' then 'retry' else status end,next_attempt_at=now(),updated_at=now() where report_id=p_report_id and status<>'completed';
 return found;
end;$$;
revoke all on function public.arm_emergency_agent_job(uuid,text) from public,anon,authenticated;
grant execute on function public.arm_emergency_agent_job(uuid,text) to service_role;

create or replace function private.enqueue_emergency_agent_job()
returns trigger language plpgsql security definer set search_path=public,private as $$
begin
 insert into public.emergency_agent_jobs(report_id,incident_id) values(new.id,new.incident_id) on conflict(report_id) do nothing;
 return new;
end;$$;
drop trigger if exists trg_enqueue_emergency_agent_job on public.reports;
create trigger trg_enqueue_emergency_agent_job after insert on public.reports for each row execute function private.enqueue_emergency_agent_job();

create or replace function private.invoke_emergency_orchestrator(p_job_id uuid,p_token uuid)
returns bigint language plpgsql security definer set search_path=public,extensions,private as $$
declare v_request bigint;
begin
 select net.http_post(url:='https://gwldnuekmwpwfnustqlu.supabase.co/functions/v1/emergency-orchestrator',headers:=jsonb_build_object('Content-Type','application/json'),body:=jsonb_build_object('jobId',p_job_id,'token',p_token),timeout_milliseconds:=5000) into v_request;
 update public.emergency_agent_jobs set last_request_id=v_request,updated_at=now() where id=p_job_id;
 return v_request;
exception when others then
 update public.emergency_agent_jobs set last_error=left(sqlerrm,2000),status='retry',next_attempt_at=now()+interval '1 minute',updated_at=now() where id=p_job_id and status<>'completed';
 return null;
end;$$;

create or replace function private.dispatch_armed_emergency_agent_job()
returns trigger language plpgsql security definer set search_path=public,private as $$
begin
 if new.report_secret is not null and new.status in('pending','retry') and(old.report_secret is distinct from new.report_secret or old.status is distinct from new.status) then
  perform private.invoke_emergency_orchestrator(new.id,new.job_token);
 end if;
 return new;
end;$$;
drop trigger if exists trg_dispatch_armed_emergency_agent_job on public.emergency_agent_jobs;
create trigger trg_dispatch_armed_emergency_agent_job after update of report_secret,status on public.emergency_agent_jobs for each row execute function private.dispatch_armed_emergency_agent_job();

create or replace function private.kick_emergency_agent_jobs()
returns integer language plpgsql security definer set search_path=public,private as $$
declare r record;v_count integer:=0;
begin
 update public.emergency_agent_jobs set status='retry',next_attempt_at=now(),last_error=coalesce(last_error,'')||' | procesamiento expirado',updated_at=now() where status='processing' and started_at<now()-interval '10 minutes';
 for r in select id,job_token from public.emergency_agent_jobs where status in('pending','retry') and report_secret is not null and next_attempt_at<=now() order by created_at limit 20 loop
  perform private.invoke_emergency_orchestrator(r.id,r.job_token);v_count:=v_count+1;
 end loop;
 return v_count;
end;$$;

do $$ declare v_job bigint; begin
 select jobid into v_job from cron.job where jobname='innova-emergency-agent-retry' limit 1;
 if v_job is not null then perform cron.unschedule(v_job);end if;
 perform cron.schedule('innova-emergency-agent-retry','* * * * *','select private.kick_emergency_agent_jobs();');
end $$;

create or replace function private.stamp_incident_notification_context()
returns trigger language plpgsql security definer set search_path=public,private as $$
declare v_count integer;v_severity smallint;v_prior integer;
begin
 select reports_count,severity into v_count,v_severity from public.incidents where id=new.incident_id;
 new.reports_count_at_send:=coalesce(new.reports_count_at_send,v_count);
 new.severity_at_send:=coalesce(new.severity_at_send,v_severity);
 if new.notification_kind='manual' and new.created_by is null then
  select count(*) into v_prior from public.incident_notifications where incident_id=new.incident_id and organization_id is not distinct from new.organization_id and channel=new.channel and status in('sent','delivered','confirmed');
  if v_prior=0 then new.notification_kind:='initial_auto';else new.notification_kind:='auto_update';end if;
 end if;
 return new;
end;$$;
drop trigger if exists trg_stamp_incident_notification_context on public.incident_notifications;
create trigger trg_stamp_incident_notification_context before insert on public.incident_notifications for each row execute function private.stamp_incident_notification_context();
