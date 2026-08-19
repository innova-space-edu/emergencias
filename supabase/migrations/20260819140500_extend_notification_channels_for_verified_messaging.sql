-- Alinea la restricción de incident_notifications con los canales soportados por la API.
-- Telegram solo debe registrarse cuando el directorio contenga un canal oficial verificado.
alter table public.incident_notifications
  drop constraint if exists incident_notifications_channel_check;

alter table public.incident_notifications
  add constraint incident_notifications_channel_check
  check (channel in (
    'email','sms','whatsapp','telegram','web','radio','manual','phone',
    'facebook','instagram','x','zello'
  ));
