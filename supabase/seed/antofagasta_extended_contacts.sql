-- Innova Emergency · contactos ampliados Antofagasta
-- Seed idempotente. No contiene secretos.

-- Aguas Antofagasta
insert into public.organizations(name,kind,region,commune,email,phone,website,active,source_url,verified_at,notes)
select 'Aguas Antofagasta','water','Antofagasta','Antofagasta','atencion.clientes@aguasantofagasta.cl','600 700 0101','https://www.aguasantofagasta.cl/',true,'https://www.aguasantofagasta.cl/',now(),'Sanitaria regional. Fono cliente 600 700 0101; X @Aguas_Antof. El correo fue incorporado desde información pública aportada por administración y debe revisarse periódicamente.'
where not exists(select 1 from public.organizations where lower(name)=lower('Aguas Antofagasta') and commune='Antofagasta');

update public.organizations set kind='water',email='atencion.clientes@aguasantofagasta.cl',phone='600 700 0101',website='https://www.aguasantofagasta.cl/',source_url='https://www.aguasantofagasta.cl/',verified_at=now(),active=true where lower(name)=lower('Aguas Antofagasta') and commune='Antofagasta';

with org as (select id from public.organizations where lower(name)=lower('Aguas Antofagasta') and commune='Antofagasta' order by created_at limit 1)
insert into public.organization_channels(organization_id,channel_type,label,value,direct_send,automation_enabled,is_primary,active,source_url,verified_at,notes)
select id,v.type,v.label,v.value,v.direct_send,v.automation,v.is_primary,true,v.source,now(),v.notes from org cross join lateral (values
 ('email','Correo atención clientes','atencion.clientes@aguasantofagasta.cl',true,true,true,'https://www.aguasantofagasta.cl/','Preaviso automático autorizado; revisar vigencia periódicamente.'),
 ('phone','Fono cliente','600 700 0101',false,false,true,'https://www.aguasantofagasta.cl/',null),
 ('web','Sitio oficial','https://www.aguasantofagasta.cl/',false,false,false,'https://www.aguasantofagasta.cl/',null),
 ('x','X / Twitter','https://x.com/Aguas_Antof',false,false,false,'https://x.com/Aguas_Antof',null)
) as v(type,label,value,direct_send,automation,is_primary,source,notes)
on conflict (organization_id,channel_type,value) do update set direct_send=excluded.direct_send,automation_enabled=excluded.automation_enabled,is_primary=excluded.is_primary,active=true,source_url=excluded.source_url,verified_at=excluded.verified_at,notes=excluded.notes;

-- Municipalidad de Antofagasta - Seguridad Pública / OIRS
update public.organizations set website='https://www.municipalidadantofagasta.cl/',source_url='https://www.municipalidadantofagasta.cl/',verified_at=now(),notes='Dirección de Seguridad Pública. OIRS: oirs@imantof.cl. Informaciones: (+56 55) 2887190 y 2887196. Dirección municipal: Avenida Séptimo de Línea 3505.' where name='Municipalidad de Antofagasta - Seguridad Pública' and commune='Antofagasta';

with org as (select id from public.organizations where name='Municipalidad de Antofagasta - Seguridad Pública' and commune='Antofagasta' limit 1)
insert into public.organization_channels(organization_id,channel_type,label,value,direct_send,automation_enabled,is_primary,active,source_url,verified_at,notes)
select id,v.type,v.label,v.value,v.direct_send,v.automation,v.is_primary,true,'https://www.municipalidadantofagasta.cl/',now(),v.notes from org cross join lateral (values
 ('email','OIRS municipal','oirs@imantof.cl',true,true,true,'Preaviso informativo; no reemplaza despacho oficial.'),
 ('phone','Informaciones OIRS','+56 55 2887190',false,false,false,null),
 ('phone','Informaciones OIRS alternativo','+56 55 2887196',false,false,false,null),
 ('web','Sitio oficial','https://www.municipalidadantofagasta.cl/',false,false,false,'Sitio oficial vigente.')
) as v(type,label,value,direct_send,automation,is_primary,notes)
on conflict (organization_id,channel_type,value) do update set direct_send=excluded.direct_send,automation_enabled=excluded.automation_enabled,is_primary=excluded.is_primary,active=true,source_url=excluded.source_url,verified_at=excluded.verified_at,notes=excluded.notes;

-- Dirección Municipal de Gestión del Riesgo de Desastres
insert into public.organizations(name,kind,region,commune,email,phone,website,active,source_url,verified_at,notes)
select 'Municipalidad de Antofagasta - Gestión del Riesgo de Desastres','municipality','Antofagasta','Antofagasta','cristian.burgosm@imantof.cl','+56 55 2887829','https://www.municipalidadantofagasta.cl/',true,'https://mail.municipalidadantofagasta.cl/index.php/home/municipalidad/direcciones-municipales/direccion-de-gestion-del-riesgo-de-desastres',now(),'Dirección municipal especializada en mitigación, preparación, respuesta y recuperación ante emergencias y desastres.'
where not exists(select 1 from public.organizations where lower(name)=lower('Municipalidad de Antofagasta - Gestión del Riesgo de Desastres') and commune='Antofagasta');

with org as (select id from public.organizations where name='Municipalidad de Antofagasta - Gestión del Riesgo de Desastres' and commune='Antofagasta' limit 1)
insert into public.organization_channels(organization_id,channel_type,label,value,direct_send,automation_enabled,is_primary,active,source_url,verified_at,notes)
select id,v.type,v.label,v.value,v.direct_send,v.automation,v.is_primary,true,'https://mail.municipalidadantofagasta.cl/index.php/home/municipalidad/direcciones-municipales/direccion-de-gestion-del-riesgo-de-desastres',now(),v.notes from org cross join lateral (values
 ('email','Dirección de Gestión del Riesgo','cristian.burgosm@imantof.cl',true,true,true,'Contacto institucional publicado por la Municipalidad.'),
 ('phone','Dirección de Gestión del Riesgo','+56 55 2887829',false,false,true,'Contacto institucional publicado por la Municipalidad.'),
 ('web','Ficha oficial','https://mail.municipalidadantofagasta.cl/index.php/home/municipalidad/direcciones-municipales/direccion-de-gestion-del-riesgo-de-desastres',false,false,false,'Funciones y datos de contacto oficiales.')
) as v(type,label,value,direct_send,automation,is_primary,notes)
on conflict (organization_id,channel_type,value) do update set direct_send=excluded.direct_send,automation_enabled=excluded.automation_enabled,is_primary=excluded.is_primary,active=true,source_url=excluded.source_url,verified_at=excluded.verified_at,notes=excluded.notes;

-- Radio Canal 95 / CNC Medios: difusión secundaria, nunca sustituto de autoridad
insert into public.organizations(name,kind,region,commune,email,phone,website,radio_frequency,active,source_url,verified_at,notes)
select 'Radio Canal 95 Antofagasta','radio','Antofagasta','Antofagasta','patricia.lopez@cncmedios.cl','+56 55 2289595','https://www.canal95.cl/','88.1 FM',true,'https://www.canal95.cl/contacto',now(),'Radio Canal 95 pertenece a CNC Medios. Antofagasta 88.1 FM. Correo/teléfono incorporados desde información pública aportada por administración; automatización desactivada.'
where not exists(select 1 from public.organizations where lower(name)=lower('Radio Canal 95 Antofagasta') and commune='Antofagasta');

with org as (select id from public.organizations where lower(name)=lower('Radio Canal 95 Antofagasta') and commune='Antofagasta' order by created_at limit 1)
insert into public.organization_channels(organization_id,channel_type,label,value,direct_send,automation_enabled,is_primary,active,source_url,verified_at,notes)
select id,v.type,v.label,v.value,v.direct_send,false,v.is_primary,true,v.source,now(),v.notes from org cross join lateral (values
 ('email','Contacto CNC Medios','patricia.lopez@cncmedios.cl',true,true,'https://www.canal95.cl/contacto','Envío manual disponible; automatización desactivada por ser medio secundario.'),
 ('phone','Teléfono estudio','+56 55 2289595',false,true,'https://www.canal95.cl/contacto',null),
 ('web','Sitio oficial','https://www.canal95.cl/',false,false,'https://www.canal95.cl/',null),
 ('radio','Frecuencia Antofagasta','88.1 FM',false,false,'https://www.canal95.cl/contacto',null)
) as v(type,label,value,direct_send,is_primary,source,notes)
on conflict (organization_id,channel_type,value) do update set direct_send=excluded.direct_send,automation_enabled=false,is_primary=excluded.is_primary,active=true,source_url=excluded.source_url,verified_at=excluded.verified_at,notes=excluded.notes;

-- Prealerta automática regional por email: la habilitación final depende también de automation_enabled del canal.
update public.ai_agent_policies set auto_prealert_enabled=true,allowed_channel_types=array['email']::text[],updated_at=now() where active=true and region='Antofagasta' and commune is null;
