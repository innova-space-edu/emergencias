-- Innova Emergency · tablas internas cerradas a clientes e índices de FK
create index if not exists emergency_agent_jobs_incident_idx on public.emergency_agent_jobs(incident_id);
create index if not exists incident_correlations_target_idx on public.incident_correlations(target_incident_id);
create index if not exists incident_correlations_report_idx on public.incident_correlations(report_id) where report_id is not null;

drop policy if exists "No client access" on public.emergency_agent_jobs;
create policy "No client access" on public.emergency_agent_jobs for all to anon,authenticated using(false) with check(false);
drop policy if exists "No client access" on public.report_embeddings;
create policy "No client access" on public.report_embeddings for all to anon,authenticated using(false) with check(false);
drop policy if exists "No client access" on public.incident_embeddings;
create policy "No client access" on public.incident_embeddings for all to anon,authenticated using(false) with check(false);
drop policy if exists "No client access" on public.incident_correlations;
create policy "No client access" on public.incident_correlations for all to anon,authenticated using(false) with check(false);
