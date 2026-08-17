-- Innova Emergency · contactos críticos Región de Antofagasta
-- Seed idempotente. No contiene secretos ni IDs generados.

update public.organizations set
  email='atencionclientes@cge.cl',
  phone='800 800 767',
  website='https://sucursalvirtual.cge.cl/',
  source_url='https://sucursalvirtual.cge.cl/solicitudes-y-reclamos',
  verified_at=now(),
  notes='CGE: canal oficial de atención y emergencias eléctricas. Cuenta de servicio publicada: @CGE_Clientes.'
where name='CGE';

update public.organizations set
  phone='+56 55 2891354',
  website='https://www.cbantofagasta.cl/',
  source_url='https://app.bomberos.cl/info_crpo_web/?id=6',
  verified_at=now(),
  notes='Cuerpo de Bomberos de Antofagasta. Dirección publicada: Antonio José de Sucre 545. Emergencias: 132.'
where name='Bomberos de Antofagasta';

update public.organizations set
  phone='131',
  website='https://www.hospitalantofagasta.gob.cl/samu/',
  source_url='https://www.hospitalantofagasta.gob.cl/samu/',
  verified_at=now(),
  notes='SAMU Antofagasta. Atención prehospitalaria 24/7. Emergencias médicas: 131.'
where name='SAMU Antofagasta';

update public.organizations set
  phone='133',
  website='https://www.carabineros.cl/',
  source_url='https://www.chileatiende.gob.cl/fichas/139663-fono-emergencias-133',
  verified_at=now(),
  notes='Carabineros de Chile. Fono Emergencias 133, gratuito y disponible 24/7. Fono Informaciones 139 para consultas no urgentes.'
where name='Carabineros de Chile';

insert into public.organization_channels(organization_id,channel_type,label,value,direct_send,automation_enabled,is_primary,active,source_url,verified_at,notes)
select o.id,v.channel_type,v.label,v.value,v.direct_send,false,v.is_primary,true,v.source_url,now(),v.notes
from public.organizations o
join (values
 ('CGE','email','Correo atención','atencionclientes@cge.cl',true,true,'https://sucursalvirtual.cge.cl/solicitudes-y-reclamos','Canal oficial publicado por CGE.'),
 ('CGE','phone','Fono clientes / emergencias','800 800 767',false,true,'https://sucursalvirtual.cge.cl/solicitudes-y-reclamos','Canal oficial de atención y emergencias eléctricas.'),
 ('CGE','web','Sucursal virtual','https://sucursalvirtual.cge.cl/',false,false,'https://sucursalvirtual.cge.cl/','Servicios en línea y estado de suministro.'),
 ('CGE','x','X / servicio','https://x.com/CGE_Clientes',false,false,'https://sucursalvirtual.cge.cl/','Cuenta de servicio indicada en el sitio oficial.'),
 ('Bomberos de Antofagasta','phone','Emergencias Bomberos','132',false,true,'https://www.bomberos.cl/historia-informacion-general','Central de alarmas / emergencias.'),
 ('Bomberos de Antofagasta','phone','Cuartel General','+56 55 2891354',false,false,'https://app.bomberos.cl/info_crpo_web/?id=6','Teléfono institucional publicado por Bomberos de Chile.'),
 ('Bomberos de Antofagasta','web','Sitio Cuerpo de Bomberos','https://www.cbantofagasta.cl/',false,false,'https://app.bomberos.cl/info_crpo_web/?id=6','Sitio informado por el registro de Bomberos de Chile.'),
 ('SAMU Antofagasta','phone','Emergencias médicas SAMU','131',false,true,'https://saludresponde.minsal.cl/fiestas-patrias-samu/','Número nacional SAMU, 24/7.'),
 ('SAMU Antofagasta','web','SAMU Antofagasta','https://www.hospitalantofagasta.gob.cl/samu/',false,false,'https://www.hospitalantofagasta.gob.cl/samu/','Información oficial del Hospital Regional de Antofagasta.'),
 ('Carabineros de Chile','phone','Emergencias Carabineros','133',false,true,'https://www.chileatiende.gob.cl/fichas/139663-fono-emergencias-133','Fono de emergencias 24/7.'),
 ('Carabineros de Chile','phone','Informaciones Carabineros','139',false,false,'https://www.chileatiende.gob.cl/fichas/139944-fono-informaciones-139','Consultas no urgentes, 24/7.'),
 ('Carabineros de Chile','web','Comisaría Virtual','https://www.comisariavirtual.cl/',false,false,'https://www.chileatiende.gob.cl/instituciones/carabineros-de-chile','Trámites y denuncias en línea cuando corresponda.')
) as v(org_name,channel_type,label,value,direct_send,is_primary,source_url,notes) on v.org_name=o.name
where not exists(
  select 1 from public.organization_channels c
  where c.organization_id=o.id and c.channel_type=v.channel_type and c.value=v.value
);

-- Normaliza los campos generales ya registrados a organization_channels.
insert into public.organization_channels(organization_id,channel_type,label,value,direct_send,automation_enabled,is_primary,active,source_url,verified_at,notes)
select o.id,x.channel_type,x.label,x.value,x.direct_send,false,x.is_primary,true,o.source_url,coalesce(o.verified_at,now()),o.notes
from public.organizations o
cross join lateral (values
 ('email','Correo',o.email,true,true),
 ('phone','Teléfono',o.phone,false,true),
 ('web','Sitio web',o.website,false,false),
 ('radio','Frecuencia radial',o.radio_frequency,false,false)
) as x(channel_type,label,value,direct_send,is_primary)
where o.active=true and x.value is not null and btrim(x.value)<>''
and not exists(
  select 1 from public.organization_channels c
  where c.organization_id=o.id and c.channel_type=x.channel_type and c.value=x.value
);
