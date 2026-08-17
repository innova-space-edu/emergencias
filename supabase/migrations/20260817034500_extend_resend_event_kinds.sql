alter table public.email_delivery_log drop constraint if exists email_delivery_log_kind_check;
alter table public.email_delivery_log add constraint email_delivery_log_kind_check check (kind in ('staff_new_incident','staff_critical','staff_responding','staff_resolved','authority_notification','admin_contact','access_request','mail_test','agent_prealert'));
