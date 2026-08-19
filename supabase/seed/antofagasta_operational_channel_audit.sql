-- Innova Emergency · auditoría de canales operativos de Antofagasta
-- Verificación 2026-08-19.
-- Objetivo: separar canales que reciben emergencias/averías de correos de coordinación,
-- directores, OIRS, autoridades políticas y fiscalizadores.
-- No agrega WhatsApp ni Telegram sin una fuente oficial que los publique como receptores de emergencias.

begin;

-- 1) Ningún correo institucional genérico debe equivaler por sí solo a una central de despacho.
-- Se mantienen disponibles para envío MANUAL, pero se desactiva la automatización.
update public.organization_channels c
set automation_enabled=false,
    is_primary=false,
    notes=concat_ws(' ',nullif(c.notes,''),'Canal de coordinación/escalamiento: no equivale a central operativa de emergencia.'),
    updated_at=now()
from public.organizations o
where c.organization_id=o.id
  and c.active=true
  and c.channel_type='email'
  and (
    o.name in (
      'SENAPRED Antofagasta',
      'Alcaldía de Antofagasta',
      'Concejo Municipal de Antofagasta',
      'Municipalidad de Antofagasta - Seguridad Pública',
      'Municipalidad de Antofagasta - Gestión del Riesgo de Desastres',
      'Municipalidad de Antofagasta - Operaciones',
      'Municipalidad de Antofagasta - Obras Municipales',
      'Municipalidad de Antofagasta - Aseo',
      'Municipalidad de Antofagasta - Medio Ambiente y Ornato',
      'Municipalidad de Antofagasta - Tránsito y Transporte Público',
      'Delegación Presidencial Regional de Antofagasta',
      'Gobierno Regional de Antofagasta',
      'SEREMI de Gobierno - Antofagasta',
      'SEREMI de Desarrollo Social y Familia - Antofagasta',
      'SEREMI de Economía, Fomento y Turismo - Antofagasta',
      'SEREMI de Salud - Antofagasta',
      'SEREMI de Energía - Antofagasta',
      'SEREMI de Obras Públicas - Antofagasta',
      'SEREMI MINVU - Antofagasta',
      'SEREMI de Transportes y Telecomunicaciones - Antofagasta',
      'SEREMI del Medio Ambiente - Antofagasta'
    )
    or lower(coalesce(c.label,'')) ~ '(director|alcald|concejal|seremi|gabinete|oirs|oficina de partes)'
  );

-- CGE y Aguas: los correos pueden mantenerse para atención y trazabilidad manual,
-- pero los canales operativos publicados para fallas son teléfono/web/app.
update public.organization_channels c
set automation_enabled=false,
    is_primary=false,
    notes=concat_ws(' ',nullif(c.notes,''),'Correo de atención; para averías se prioriza el canal operativo publicado por la empresa.'),
    updated_at=now()
from public.organizations o
where c.organization_id=o.id
  and c.channel_type='email'
  and o.name in ('CGE','Aguas Antofagasta');

-- 2) Canales operativos verificados.
-- CGE: fono y servicio web "¿Estás sin luz?".
with org as (select id from public.organizations where name='CGE' and active=true order by created_at limit 1)
insert into public.organization_channels(organization_id,channel_type,label,value,direct_send,automation_enabled,is_primary,active,source_url,verified_at,notes)
select id,v.type,v.label,v.value,false,false,v.primary,true,v.source,now(),v.notes from org cross join lateral (values
 ('phone','Emergencias / fono clientes','800 800 767',true,'https://sucursalvirtual.cge.cl/','Canal operativo publicado por CGE para incidencias y atención.'),
 ('web','Reportar corte: ¿Estás sin luz?','https://sucursalvirtual.cge.cl/estas-sin-luz',true,'https://sucursalvirtual.cge.cl/estas-sin-luz','Permite informar una interrupción cuando CGE aún no la ha detectado.')
) as v(type,label,value,primary,source,notes)
on conflict (organization_id,channel_type,value) do update
set label=excluded.label,is_primary=excluded.is_primary,active=true,source_url=excluded.source_url,verified_at=excluded.verified_at,notes=excluded.notes,automation_enabled=false;

-- Aguas Antofagasta: fono cliente/operativo. No se inventa WhatsApp.
with org as (select id from public.organizations where name='Aguas Antofagasta' and active=true order by created_at limit 1)
insert into public.organization_channels(organization_id,channel_type,label,value,direct_send,automation_enabled,is_primary,active,source_url,verified_at,notes)
select id,'phone','Fono atención / reporte de servicio','600 700 0101',false,false,true,true,'https://www.aguasantofagasta.cl/',now(),'Canal telefónico publicado para atención de la sanitaria; priorizar frente a correos generales.' from org
on conflict (organization_id,channel_type,value) do update
set label=excluded.label,is_primary=true,active=true,source_url=excluded.source_url,verified_at=excluded.verified_at,notes=excluded.notes,automation_enabled=false;

-- Primeros respondedores y centrales nacionales.
create temporary table tmp_operational_numbers(org_name text,label text,value text,source_url text,notes text) on commit drop;
insert into tmp_operational_numbers values
 ('CONAF Región de Antofagasta','Incendios forestales CONAF','130','https://www.conaf.cl/incendios/','Número de emergencia para alertar incendios forestales.'),
 ('Bomberos de Antofagasta','Emergencias Bomberos','132','https://www.bomberos.cl/','Central de emergencias Bomberos.'),
 ('SAMU Antofagasta','Emergencias médicas SAMU','131','https://saludresponde.minsal.cl/','Emergencias médicas prehospitalarias.'),
 ('Carabineros de Chile','Emergencias Carabineros','133','https://www.chileatiende.gob.cl/fichas/139663-fono-emergencias-133','Fono de emergencias policiales.'),
 ('Policía de Investigaciones de Chile (PDI)','Emergencias PDI','134','https://www.pdichile.cl/','Nivel de emergencia PDI.'),
 ('DIRECTEMAR - Capitanía de Puerto de Antofagasta','Emergencias marítimas','137','https://www.directemar.cl/directemar/preguntas-frecuentes/mrcc/1-existe-algun-numero-unico-para-comunicarse-con-la-autoridad-maritima','Número único gratuito de emergencias marítimas; deriva a la Autoridad Marítima local.');

insert into public.organization_channels(organization_id,channel_type,label,value,direct_send,automation_enabled,is_primary,active,source_url,verified_at,notes)
select o.id,'phone',n.label,n.value,false,false,true,true,n.source_url,now(),n.notes
from tmp_operational_numbers n
join public.organizations o on lower(o.name)=lower(n.org_name) and o.active=true
on conflict (organization_id,channel_type,value) do update
set label=excluded.label,is_primary=true,active=true,source_url=excluded.source_url,verified_at=excluded.verified_at,notes=excluded.notes,automation_enabled=false;

-- 3) Autopistas de Antofagasta: verdadera central de emergencia vial 24/7.
insert into public.organizations(name,kind,region,commune,phone,website,active,source_url,verified_at,notes)
select 'Autopistas de Antofagasta','roads','Antofagasta','Antofagasta','600 360 0087','https://autopistasdeantofagasta.cl/asistencia-en-ruta/',true,'https://autopistasdeantofagasta.cl/asistencia-en-ruta/',now(),'Concesionaria vial. Fono de emergencias y asistencia en ruta 24 horas; Postes SOS conectados al Centro de Control.'
where not exists(select 1 from public.organizations where lower(name)=lower('Autopistas de Antofagasta') and active=true);

update public.organizations set
  kind='roads',phone='600 360 0087',website='https://autopistasdeantofagasta.cl/asistencia-en-ruta/',
  source_url='https://autopistasdeantofagasta.cl/asistencia-en-ruta/',verified_at=now(),active=true,
  notes='Concesionaria vial. Fono de emergencias y asistencia en ruta 24 horas; Postes SOS conectados al Centro de Control.'
where lower(name)=lower('Autopistas de Antofagasta');

with org as (select id from public.organizations where lower(name)=lower('Autopistas de Antofagasta') and active=true order by created_at limit 1)
insert into public.organization_channels(organization_id,channel_type,label,value,direct_send,automation_enabled,is_primary,active,source_url,verified_at,notes)
select id,v.type,v.label,v.value,false,false,v.primary,true,'https://autopistasdeantofagasta.cl/asistencia-en-ruta/',now(),v.notes from org cross join lateral (values
 ('phone','Emergencias 24/7','600 360 0087',true,'Fono operativo de emergencias y asistencia vial 24 horas.'),
 ('web','Asistencia en ruta','https://autopistasdeantofagasta.cl/asistencia-en-ruta/',false,'Información oficial de asistencia y Postes SOS.')
) as v(type,label,value,primary,notes)
on conflict (organization_id,channel_type,value) do update
set label=excluded.label,is_primary=excluded.is_primary,active=true,source_url=excluded.source_url,verified_at=excluded.verified_at,notes=excluded.notes,automation_enabled=false;

-- Cobertura comunal para que el agente pueda considerarla en Antofagasta.
with org as (select id from public.organizations where lower(name)=lower('Autopistas de Antofagasta') and active=true limit 1),
loc as (select id from public.territorial_localities where active=true and region='Antofagasta' and commune='Antofagasta')
insert into public.organization_coverage(organization_id,locality_id,priority,active)
select org.id,loc.id,4,true from org cross join loc
on conflict (organization_id,locality_id) do update set priority=least(public.organization_coverage.priority,excluded.priority),active=true;

-- 4) SENAPRED regional: conservar contacto, pero expresamente como coordinación.
update public.organizations set
  email='senapredantofagasta@senapred.gob.cl',phone='+56 2 2401 8400',website='https://www.senapred.cl/regiones/',
  source_url='https://www.senapred.cl/regiones/',verified_at=now(),
  notes='Dirección Regional SENAPRED Antofagasta. Contacto de coordinación regional; no se presenta como central pública de despacho.'
where name='SENAPRED Antofagasta';

with org as (select id from public.organizations where name='SENAPRED Antofagasta' and active=true limit 1)
insert into public.organization_channels(organization_id,channel_type,label,value,direct_send,automation_enabled,is_primary,active,source_url,verified_at,notes)
select id,v.type,v.label,v.value,v.direct,false,false,true,'https://www.senapred.cl/regiones/',now(),v.notes from org cross join lateral (values
 ('email','Correo regional de coordinación','senapredantofagasta@senapred.gob.cl',true,'Coordinación regional; envío manual. No equivale a una central de despacho.'),
 ('phone','Teléfono Dirección Regional','+56 2 2401 8400',false,'Coordinación regional; no está publicado como fono de despacho de emergencias.')
) as v(type,label,value,direct,notes)
on conflict (organization_id,channel_type,value) do update
set label=excluded.label,direct_send=excluded.direct_send,automation_enabled=false,is_primary=false,active=true,source_url=excluded.source_url,verified_at=excluded.verified_at,notes=excluded.notes;

commit;
