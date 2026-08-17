-- Innova Emergency · evita bucles de reintento inmediato
create or replace function private.dispatch_armed_emergency_agent_job()
returns trigger language plpgsql security definer set search_path=public,private as $$
begin
  if new.report_secret is not null
     and new.status in ('pending','retry')
     and new.next_attempt_at<=now()
     and (old.report_secret is distinct from new.report_secret
          or old.status is distinct from new.status
          or old.next_attempt_at is distinct from new.next_attempt_at) then
    perform private.invoke_emergency_orchestrator(new.id,new.job_token);
  end if;
  return new;
end;
$$;
