-- El mapa público NO usa Data API directa. Se sirve por emergency-gateway con columnas filtradas.
revoke all privileges on table public.incidents from anon;
revoke all privileges on table public.incident_notifications from anon;
