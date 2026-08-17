-- Innova Emergency · canales oficiales de autoridades y servicios de Antofagasta
-- Fuentes públicas verificadas 2026-08-17.
-- Idempotente. Los nuevos correos se incorporan para envío manual; automation_enabled queda false.

begin;
create temporary table tmp_ie_channels(
 org_name text,channel_type text,label text,value text,direct_send boolean,
 automation_enabled boolean,is_primary boolean,source_url text,notes text
) on commit drop;

insert into tmp_ie_channels values
('Alcaldía de Antofagasta','email','Correo Alcaldía','alcaldia.ima@imantof.cl',true,false,true,'https://www.municipalidadantofagasta.cl/index.php?Itemid=175','Canal institucional; envío manual.'),
('Alcaldía de Antofagasta','phone','Teléfono Alcaldía','+56 55 2887413',false,false,true,'https://www.municipalidadantofagasta.cl/index.php?Itemid=175',null),
('Alcaldía de Antofagasta','email','Oficina de Partes Municipal','oficina.partes@imantof.cl',true,false,false,'https://www.municipalidadantofagasta.cl/','Canal formal municipal; automatización desactivada.'),
('Alcaldía de Antofagasta','web','Sitio oficial','https://www.municipalidadantofagasta.cl/index.php/home/municipalidad/alcalde',false,false,false,'https://www.municipalidadantofagasta.cl/index.php?Itemid=175',null),

('Concejo Municipal de Antofagasta','web','Concejo Municipal','https://www.municipalidadantofagasta.cl/index.php?Itemid=175',false,false,false,'https://www.municipalidadantofagasta.cl/index.php?Itemid=175','Escalamiento institucional; no es despacho operativo.'),
('Concejo Municipal de Antofagasta','email','Patricio Aguirre Ramírez','patricio.aguirrer@imantof.cl',true,false,false,'https://www.municipalidadantofagasta.cl/index.php?Itemid=175','Contacto institucional; sin automatización.'),
('Concejo Municipal de Antofagasta','phone','Patricio Aguirre Ramírez','+56 9 34698064',false,false,false,'https://www.municipalidadantofagasta.cl/index.php?Itemid=175',null),
('Concejo Municipal de Antofagasta','email','Camilo Kong Pineda','camilo.kongp@imantof.cl',true,false,false,'https://www.municipalidadantofagasta.cl/index.php?Itemid=175','Contacto institucional; sin automatización.'),
('Concejo Municipal de Antofagasta','phone','Camilo Kong Pineda','+56 9 44755576',false,false,false,'https://www.municipalidadantofagasta.cl/index.php?Itemid=175',null),
('Concejo Municipal de Antofagasta','email','Waldo Valderrama Salazar','waldo.valderras@imantof.cl',true,false,false,'https://www.municipalidadantofagasta.cl/index.php?Itemid=175','Contacto institucional; sin automatización.'),
('Concejo Municipal de Antofagasta','phone','Waldo Valderrama Salazar','+56 9 32265860',false,false,false,'https://www.municipalidadantofagasta.cl/index.php?Itemid=175',null),
('Concejo Municipal de Antofagasta','email','Claudio Aguirre Vergara','claudio.aguirrev@imantof.cl',true,false,false,'https://www.municipalidadantofagasta.cl/index.php?Itemid=175','Contacto institucional; sin automatización.'),
('Concejo Municipal de Antofagasta','phone','Claudio Aguirre Vergara','+56 9 32516063',false,false,false,'https://www.municipalidadantofagasta.cl/index.php?Itemid=175',null),
('Concejo Municipal de Antofagasta','email','María Tapia Zepeda','maria.tapiaz@imantof.cl',true,false,false,'https://www.municipalidadantofagasta.cl/index.php?Itemid=175','Contacto institucional; sin automatización.'),
('Concejo Municipal de Antofagasta','phone','María Tapia Zepeda','+56 9 32410592',false,false,false,'https://www.municipalidadantofagasta.cl/index.php?Itemid=175',null),
('Concejo Municipal de Antofagasta','email','Carolina Rivera González','carolina.riverag@imantof.cl',true,false,false,'https://www.municipalidadantofagasta.cl/index.php?Itemid=175','Contacto institucional; sin automatización.'),
('Concejo Municipal de Antofagasta','phone','Carolina Rivera González','+56 9 23825508',false,false,false,'https://www.municipalidadantofagasta.cl/index.php?Itemid=175',null),
('Concejo Municipal de Antofagasta','email','Ignacio Pozo Piña','Ignacio.pozop@imantof.cl',true,false,false,'https://www.municipalidadantofagasta.cl/index.php?Itemid=175','Contacto institucional; sin automatización.'),
('Concejo Municipal de Antofagasta','phone','Ignacio Pozo Piña','+56 9 44755544',false,false,false,'https://www.municipalidadantofagasta.cl/index.php?Itemid=175',null),
('Concejo Municipal de Antofagasta','email','Dinko Rendic Véliz','dinko.rendicv@imantof.cl',true,false,false,'https://www.municipalidadantofagasta.cl/index.php?Itemid=175','Contacto institucional; sin automatización.'),
('Concejo Municipal de Antofagasta','phone','Dinko Rendic Véliz','+56 9 38637104',false,false,false,'https://www.municipalidadantofagasta.cl/index.php?Itemid=175',null),
('Concejo Municipal de Antofagasta','email','Karina Guzmán Arias','karina.guzmana@imantof.cl',true,false,false,'https://www.municipalidadantofagasta.cl/index.php?Itemid=175','Contacto institucional; sin automatización.'),
('Concejo Municipal de Antofagasta','phone','Karina Guzmán Arias','+56 9 88273404',false,false,false,'https://www.municipalidadantofagasta.cl/index.php?Itemid=175',null),
('Concejo Municipal de Antofagasta','email','Norma Leiva Escalona','norma.leivae@imantof.cl',true,false,false,'https://www.municipalidadantofagasta.cl/index.php?Itemid=175','Contacto institucional; sin automatización.'),
('Concejo Municipal de Antofagasta','phone','Norma Leiva Escalona','+56 9 32268851',false,false,false,'https://www.municipalidadantofagasta.cl/index.php?Itemid=175',null),

('Municipalidad de Antofagasta - Operaciones','email','Dirección de Operaciones','christian.mirandad@imantof.cl',true,false,true,'https://mail.municipalidadantofagasta.cl/index.php/home/municipalidad/direcciones-municipales/direccion-de-operaciones','Envío manual disponible.'),
('Municipalidad de Antofagasta - Operaciones','phone','Dirección de Operaciones','+56 55 2887275',false,false,true,'https://mail.municipalidadantofagasta.cl/index.php/home/municipalidad/direcciones-municipales/direccion-de-operaciones',null),
('Municipalidad de Antofagasta - Operaciones','phone','Alumbrado público municipal','+56 55 2887378',false,false,false,'https://www.municipalidadantofagasta.cl/','Alumbrado público; no reemplaza a distribuidora eléctrica.'),
('Municipalidad de Antofagasta - Operaciones','web','Ficha oficial','https://mail.municipalidadantofagasta.cl/index.php/home/municipalidad/direcciones-municipales/direccion-de-operaciones',false,false,false,'https://mail.municipalidadantofagasta.cl/index.php/home/municipalidad/direcciones-municipales/direccion-de-operaciones',null),
('Municipalidad de Antofagasta - Obras Municipales','email','Dirección de Obras Municipales','juan.galvezb@imantof.cl',true,false,true,'https://www.municipalidadantofagasta.cl/index.php/home/tramites/permiso-de-obras?id=58&view=category','Envío manual disponible.'),
('Municipalidad de Antofagasta - Obras Municipales','phone','Dirección de Obras Municipales','+56 55 2887361',false,false,true,'https://www.municipalidadantofagasta.cl/index.php/home/tramites/permiso-de-obras?id=58&view=category',null),
('Municipalidad de Antofagasta - Obras Municipales','web','Sitio oficial','https://www.municipalidadantofagasta.cl/index.php/home/tramites/permiso-de-obras?id=58&view=category',false,false,false,'https://www.municipalidadantofagasta.cl/index.php/home/tramites/permiso-de-obras?id=58&view=category',null),
('Municipalidad de Antofagasta - Aseo','email','Dirección de Aseo','natalia.caceresp@imantof.cl',true,false,true,'https://mail.municipalidadantofagasta.cl/index.php/home/municipalidad/direcciones-municipales/direccion-de-aseo','Envío manual disponible.'),
('Municipalidad de Antofagasta - Aseo','phone','Dirección de Aseo','+56 55 2887811',false,false,true,'https://mail.municipalidadantofagasta.cl/index.php/home/municipalidad/direcciones-municipales/direccion-de-aseo',null),
('Municipalidad de Antofagasta - Aseo','web','Ficha oficial','https://mail.municipalidadantofagasta.cl/index.php/home/municipalidad/direcciones-municipales/direccion-de-aseo',false,false,false,'https://mail.municipalidadantofagasta.cl/index.php/home/municipalidad/direcciones-municipales/direccion-de-aseo',null),
('Municipalidad de Antofagasta - Medio Ambiente y Ornato','email','Dirección de Medio Ambiente y Ornato','francisco.gonzalezz@imantof.cl',true,false,true,'https://www.municipalidadantofagasta.cl/index.php/home/municipalidad/direcciones-municipales/direccion-de-medio-ambiente','Envío manual disponible.'),
('Municipalidad de Antofagasta - Medio Ambiente y Ornato','phone','Dirección de Medio Ambiente y Ornato','+56 55 2887745',false,false,true,'https://www.municipalidadantofagasta.cl/index.php/home/municipalidad/direcciones-municipales/direccion-de-medio-ambiente',null),
('Municipalidad de Antofagasta - Medio Ambiente y Ornato','web','Ficha oficial','https://www.municipalidadantofagasta.cl/index.php/home/municipalidad/direcciones-municipales/direccion-de-medio-ambiente',false,false,false,'https://www.municipalidadantofagasta.cl/index.php/home/municipalidad/direcciones-municipales/direccion-de-medio-ambiente',null),
('Municipalidad de Antofagasta - Tránsito y Transporte Público','email','Dirección de Tránsito','rodrigo.munozo@imantof.cl',true,false,true,'https://www.municipalidadantofagasta.cl/','Envío manual disponible.'),
('Municipalidad de Antofagasta - Tránsito y Transporte Público','phone','Dirección de Tránsito','+56 55 2887136',false,false,true,'https://www.municipalidadantofagasta.cl/',null),
('Municipalidad de Antofagasta - Tránsito y Transporte Público','web','Sitio municipal','https://www.municipalidadantofagasta.cl/',false,false,false,'https://www.municipalidadantofagasta.cl/',null),

('Delegación Presidencial Regional de Antofagasta','phone','Mesa central','+56 55 2461010',false,false,true,'https://dprantofagasta.dpr.gob.cl/',null),
('Delegación Presidencial Regional de Antofagasta','web','Sitio oficial','https://dprantofagasta.dpr.gob.cl/',false,false,false,'https://dprantofagasta.dpr.gob.cl/',null),
('Gobierno Regional de Antofagasta','email','Contacto institucional','infoweb@goreantofagasta.cl',true,false,true,'https://goreantofagasta.cl/','Envío manual disponible.'),
('Gobierno Regional de Antofagasta','phone','Mesa central','+56 55 2357500',false,false,true,'https://goreantofagasta.cl/',null),
('Gobierno Regional de Antofagasta','web','Sitio oficial','https://goreantofagasta.cl/',false,false,false,'https://goreantofagasta.cl/',null),
('SEREMI de Gobierno - Antofagasta','email','SEREMI de Gobierno','Catalina.gonzalez@msgg.gob.cl',true,false,true,'https://msgg.gob.cl/wp/autoridades-en-regiones/','Envío manual disponible.'),
('SEREMI de Gobierno - Antofagasta','phone','Teléfono regional','+56 55 22532450',false,false,true,'https://msgg.gob.cl/wp/autoridades-en-regiones/',null),
('SEREMI de Gobierno - Antofagasta','web','Sitio oficial','https://msgg.gob.cl/wp/autoridades-en-regiones/',false,false,false,'https://msgg.gob.cl/wp/autoridades-en-regiones/',null),
('SEREMI de Desarrollo Social y Familia - Antofagasta','phone','Teléfono regional','+56 55 2449353',false,false,true,'https://www.desarrollosocialyfamilia.gob.cl/',null),
('SEREMI de Desarrollo Social y Familia - Antofagasta','web','Sitio oficial','https://www.desarrollosocialyfamilia.gob.cl/',false,false,false,'https://www.desarrollosocialyfamilia.gob.cl/',null),
('SEREMI de Economía, Fomento y Turismo - Antofagasta','email','Secretaría regional','jmenares@economia.cl',true,false,true,'https://www.economia.gob.cl/ministerio-de-economia-fomento-y-turismo/autoridades/secretarios-regionales-ministeriales','Envío manual disponible.'),
('SEREMI de Economía, Fomento y Turismo - Antofagasta','phone','Teléfono regional','+56 2 24733626',false,false,true,'https://www.economia.gob.cl/ministerio-de-economia-fomento-y-turismo/autoridades/secretarios-regionales-ministeriales',null),
('SEREMI de Economía, Fomento y Turismo - Antofagasta','web','Sitio oficial','https://www.economia.gob.cl/ministerio-de-economia-fomento-y-turismo/autoridades/secretarios-regionales-ministeriales',false,false,false,'https://www.economia.gob.cl/ministerio-de-economia-fomento-y-turismo/autoridades/secretarios-regionales-ministeriales',null),
('SEREMI de Salud - Antofagasta','phone','Teléfono regional','+56 55 2655011',false,false,true,'https://www.minsal.cl/secretarias-regionales-ministeriales-de-salud/',null),
('SEREMI de Salud - Antofagasta','web','Sitio oficial','https://www.minsal.cl/secretarias-regionales-ministeriales-de-salud/',false,false,false,'https://www.minsal.cl/secretarias-regionales-ministeriales-de-salud/',null),
('SEREMI de Energía - Antofagasta','phone','Teléfono regional','+56 2 23656605',false,false,true,'https://energia.gob.cl/regiones/antofagasta',null),
('SEREMI de Energía - Antofagasta','web','Sitio oficial','https://energia.gob.cl/regiones/antofagasta',false,false,false,'https://energia.gob.cl/regiones/antofagasta',null),
('SEC - Dirección Regional Antofagasta','phone','Dirección Regional SEC','+56 2 32631961',false,false,true,'https://www.sec.cl/direcciones-regionales-de-sec/',null),
('SEC - Dirección Regional Antofagasta','phone','FONO SEC','600 6000 732',false,false,false,'https://energia.gob.cl/regiones/antofagasta','Cortes, riesgos eléctricos y combustibles.'),
('SEC - Dirección Regional Antofagasta','web','Sitio oficial','https://www.sec.cl/direcciones-regionales-de-sec/',false,false,false,'https://www.sec.cl/direcciones-regionales-de-sec/',null),
('Superintendencia de Servicios Sanitarios (SISS)','phone','Atención SISS','800 381 800',false,false,true,'https://www.chileatiende.gob.cl/fichas/4674-reclamo-contra-empresas-sanitarias-responsables-de-los-servicios-de-agua-potable-y-alcantarillado-urbano',null),
('Superintendencia de Servicios Sanitarios (SISS)','web','Sitio oficial','https://www.siss.gob.cl/',false,false,false,'https://www.chileatiende.gob.cl/fichas/4674-reclamo-contra-empresas-sanitarias-responsables-de-los-servicios-de-agua-potable-y-alcantarillado-urbano',null),
('SEREMI de Obras Públicas - Antofagasta','phone','Teléfono regional','+56 55 2422207',false,false,true,'https://antofagasta.mop.gob.cl/seremi-antofagasta/',null),
('SEREMI de Obras Públicas - Antofagasta','web','Sitio oficial','https://antofagasta.mop.gob.cl/',false,false,false,'https://antofagasta.mop.gob.cl/seremi-antofagasta/',null),
('Dirección Regional de Vialidad - Antofagasta','web','Dirección de Vialidad','https://vialidad.mop.gob.cl/',false,false,true,'https://antofagasta.mop.gob.cl/','Conservación y recuperación de conectividad vial.'),
('Dirección General de Aguas - Antofagasta','email','Contacto regional publicado','rosa.manquez@mop.gov.cl',true,false,true,'https://dga.mop.gob.cl/','Envío manual disponible.'),
('Dirección General de Aguas - Antofagasta','phone','Teléfono regional','+56 55 2422266',false,false,true,'https://dga.mop.gob.cl/',null),
('Dirección General de Aguas - Antofagasta','web','Sitio oficial','https://dga.mop.gob.cl/',false,false,false,'https://dga.mop.gob.cl/',null),
('SEREMI MINVU - Antofagasta','web','Sitio oficial','https://www.minvu.gob.cl/sobre-minvu/seremi/',false,false,true,'https://www.minvu.gob.cl/sobre-minvu/seremi/',null),
('SERVIU Región de Antofagasta','phone','OIRS / atención regional','+56 55 2415107',false,false,true,'https://www.minvu.gob.cl/sobre-minvu/oficinas-de-atencion-presencial/',null),
('SERVIU Región de Antofagasta','web','Sitio oficial','https://serviuantofagasta.minvu.gob.cl/',false,false,false,'https://www.minvu.gob.cl/sobre-minvu/oficinas-de-atencion-presencial/',null),
('SEREMI de Transportes y Telecomunicaciones - Antofagasta','phone','Teléfono regional','+56 2 24213612',false,false,true,'https://www.mtt.gob.cl/organismos/secretarias-regionales/',null),
('SEREMI de Transportes y Telecomunicaciones - Antofagasta','web','Sitio oficial','https://www.mtt.gob.cl/organismos/secretarias-regionales/',false,false,false,'https://www.mtt.gob.cl/organismos/secretarias-regionales/',null),
('SUBTEL - Macro Zona Norte Antofagasta','web','Sitio oficial','https://www.subtel.gob.cl/',false,false,true,'https://www.subtel.gob.cl/','Fiscalización y continuidad de telecomunicaciones.'),
('SEREMI del Medio Ambiente - Antofagasta','email','Oficina de Partes','oficinadepartesantofagasta@mma.gob.cl',true,false,true,'https://mma.gob.cl/antofagasta/','Envío manual disponible.'),
('SEREMI del Medio Ambiente - Antofagasta','phone','Teléfono regional','+56 55 2533814',false,false,true,'https://mma.gob.cl/antofagasta/',null),
('SEREMI del Medio Ambiente - Antofagasta','web','Sitio oficial','https://mma.gob.cl/antofagasta/',false,false,false,'https://mma.gob.cl/antofagasta/',null),
('SMA - Oficina Regional Antofagasta','email','Oficina Regional','oficina.antofagasta@sma.gob.cl',true,false,true,'https://portal.sma.gob.cl/index.php/oficinas-regionales/','Envío manual disponible.'),
('SMA - Oficina Regional Antofagasta','phone','Teléfono regional','+56 55 2530385',false,false,true,'https://portal.sma.gob.cl/index.php/oficinas-regionales/',null),
('SMA - Oficina Regional Antofagasta','web','Sitio oficial','https://portal.sma.gob.cl/index.php/oficinas-regionales/',false,false,false,'https://portal.sma.gob.cl/index.php/oficinas-regionales/',null),
('CONAF Región de Antofagasta','phone','Oficina regional','+56 55 2383320',false,false,true,'https://www.conaf.cl/',null),
('CONAF Región de Antofagasta','web','Sitio oficial','https://www.conaf.cl/',false,false,false,'https://www.conaf.cl/',null),
('Policía de Investigaciones de Chile (PDI)','phone','Emergencias PDI','134',false,false,true,'https://www.chileatiende.gob.cl/fichas/1795-denunciar-un-delito','Delitos flagrantes con peligro para personas o bienes.'),
('Policía de Investigaciones de Chile (PDI)','web','Sitio oficial','https://www.pdichile.cl/',false,false,false,'https://www.chileatiende.gob.cl/fichas/1795-denunciar-un-delito',null),
('DIRECTEMAR - Capitanía de Puerto de Antofagasta','phone','Capitanía de Puerto','+56 55 2630000',false,false,true,'https://www.directemar.cl/gobernaciones-maritimas/region-de-antofagasta',null),
('DIRECTEMAR - Capitanía de Puerto de Antofagasta','phone','SAR / apoyo marítimo','+56 55 2630037',false,false,false,'https://www.directemar.cl/gobernaciones-maritimas/region-de-antofagasta','Canal complementario; verificar vigencia periódicamente.'),
('DIRECTEMAR - Capitanía de Puerto de Antofagasta','web','Sitio oficial','https://www.directemar.cl/capitania-de-puerto-de-antofagasta',false,false,false,'https://www.directemar.cl/gobernaciones-maritimas/region-de-antofagasta',null),
('DGAC - Aeropuerto Andrés Sabella Antofagasta','email','ARO/AIS H24','aro.antofagasta@dgac.gob.cl',true,false,true,'https://aipchile.dgac.gob.cl/designador/SCFA','Envío manual disponible.'),
('DGAC - Aeropuerto Andrés Sabella Antofagasta','phone','ARO/AIS H24','+56 2 23307821',false,false,true,'https://aipchile.dgac.gob.cl/designador/SCFA',null),
('DGAC - Aeropuerto Andrés Sabella Antofagasta','phone','ARO/AIS H24 alternativo','+56 2 23307822',false,false,false,'https://aipchile.dgac.gob.cl/designador/SCFA',null),
('DGAC - Aeropuerto Andrés Sabella Antofagasta','phone','ARO celular H24','+56 9 42885328',false,false,false,'https://aipchile.dgac.gob.cl/designador/SCFA',null),
('DGAC - Aeropuerto Andrés Sabella Antofagasta','phone','OIRS Aeropuerto Andrés Sabella','+56 2 23307805',false,false,false,'https://www.dgac.gob.cl/oirs/Oficinas.html',null),
('DGAC - Aeropuerto Andrés Sabella Antofagasta','web','Ficha AIP SCFA','https://aipchile.dgac.gob.cl/designador/SCFA',false,false,false,'https://aipchile.dgac.gob.cl/designador/SCFA',null),
('Ferrocarril de Antofagasta (FCAB)','email','Contacto institucional','conectados@fcab.cl',true,false,true,'https://www.fcab.cl/','Envío manual disponible.'),
('Ferrocarril de Antofagasta (FCAB)','phone','Mesa central','+56 55 2206100',false,false,true,'https://www.fcab.cl/',null),
('Ferrocarril de Antofagasta (FCAB)','phone','Consultas / reclamos','+56 2 29257525',false,false,false,'https://www.fcab.cl/',null),
('Ferrocarril de Antofagasta (FCAB)','web','Sitio oficial','https://www.fcab.cl/',false,false,false,'https://www.fcab.cl/',null);

insert into public.organization_channels(
 organization_id,channel_type,label,value,direct_send,automation_enabled,is_primary,active,source_url,verified_at,notes,updated_at
)
select o.id,s.channel_type,s.label,s.value,s.direct_send,s.automation_enabled,s.is_primary,true,s.source_url,now(),s.notes,now()
from tmp_ie_channels s
join public.organizations o on lower(o.name)=lower(s.org_name) and o.region='Antofagasta' and o.commune='Antofagasta'
on conflict (organization_id,channel_type,value) do update
set label=excluded.label,direct_send=excluded.direct_send,automation_enabled=excluded.automation_enabled,
    is_primary=excluded.is_primary,active=true,source_url=excluded.source_url,verified_at=excluded.verified_at,
    notes=excluded.notes,updated_at=now();

with org as (
 select id from public.organizations
 where name='Municipalidad de Antofagasta - Gestión del Riesgo de Desastres' and commune='Antofagasta'
 limit 1
)
insert into public.organization_channels(
 organization_id,channel_type,label,value,direct_send,automation_enabled,is_primary,active,source_url,verified_at,notes,updated_at
)
select id,'email','Oficina de Partes Municipal','oficina.partes@imantof.cl',true,false,false,true,
'https://www.municipalidadantofagasta.cl/',now(),'Escalamiento formal; no sustituye al canal operativo de DGRD.',now()
from org
on conflict (organization_id,channel_type,value) do update
set label=excluded.label,direct_send=true,automation_enabled=false,active=true,source_url=excluded.source_url,verified_at=now(),notes=excluded.notes,updated_at=now();

update public.organizations
set source_url='https://www.senapred.cl/regiones/',website='https://www.senapred.cl/regiones/',verified_at=now(),
    notes='Dirección Regional SENAPRED Antofagasta. Coordinación de prevención y respuesta ante desastres.'
where name='SENAPRED Antofagasta';

commit;
