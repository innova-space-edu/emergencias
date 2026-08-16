create index if not exists incidents_last_reported_idx on public.incidents (last_reported_at desc);
