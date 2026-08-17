-- Innova Emergency · red institucional y operativa de Antofagasta
-- Fuentes públicas oficiales verificadas 2026-08-17.
-- Este seed es idempotente y NO habilita automatización de correos por sí mismo.

begin;
create temporary table tmp_ie_orgs(
 name text,kind text,email text,phone text,website text,source_url text,notes text,priority smallint
) on commit drop;
insert into tmp_ie_orgs values
('Alcaldía de Antofagasta','municipal_authority','alcaldia.ima@imantof.cl','+56 55 2887413','https://www.municipalidadantofagasta.cl/index.php/home/municipalidad/alcalde','https://www.municipalidadantofagasta.cl/index.php?Itemid=175','Alcaldía municipal. Canal de escalamiento institucional; no sustituye a servicios operativos de emergencia.',200),
('Concejo Municipal de Antofagasta','municipal_authority',null,null,'https://www.municipalidadantofagasta.cl/index.php?Itemid=175','https://www.municipalidadantofagasta.cl/index.php?Itemid=175','Concejales y concejalas con contactos institucionales publicados. Escalamiento/canal político, no despacho operativo.',220),
('Municipalidad de Antofagasta - Operaciones','municipal_operations','christian.mirandad@imantof.cl','+56 55 2887275','https://mail.municipalidadantofagasta.cl/index.php/home/municipalidad/direcciones-municipales/direccion-de-operaciones','https://mail.municipalidadantofagasta.cl/index.php/home/municipalidad/direcciones-municipales/direccion-de-operaciones','Mantención de alumbrado público, apoyo técnico y capacidades operativas municipales.',5),
('Municipalidad de Antofagasta - Obras Municipales','municipal_works','juan.galvezb@imantof.cl','+56 55 2887361','https://www.municipalidadantofagasta.cl/index.php/home/tramites/permiso-de-obras?id=58&view=category','https://www.municipalidadantofagasta.cl/index.php/home/tramites/permiso-de-obras?id=58&view=category','Inspección y fiscalización técnica de obras municipales y obras donde el municipio actúa como unidad técnica.',15),
('Municipalidad de Antofagasta - Aseo','municipal_cleaning','natalia.caceresp@imantof.cl','+56 55 2887811','https://mail.municipalidadantofagasta.cl/index.php/home/municipalidad/direcciones-municipales/direccion-de-aseo','https://mail.municipalidadantofagasta.cl/index.php/home/municipalidad/direcciones-municipales/direccion-de-aseo','Aseo, retiro de residuos y apoyo logístico municipal ante contingencias.',20),
('Municipalidad de Antofagasta - Medio Ambiente y Ornato','municipal_environment','francisco.gonzalezz@imantof.cl','+56 55 2887745','https://www.municipalidadantofagasta.cl/index.php/home/municipalidad/direcciones-municipales/direccion-de-medio-ambiente','https://www.municipalidadantofagasta.cl/index.php/home/municipalidad/direcciones-municipales/direccion-de-medio-ambiente','Áreas verdes, arbolado urbano, ornato y materias ambientales municipales.',10),
('Municipalidad de Antofagasta - Tránsito y Transporte Público','municipal_transport','rodrigo.munozo@imantof.cl','+56 55 2887136','https://www.municipalidadantofagasta.cl/','https://www.municipalidadantofagasta.cl/','Gestión municipal de tránsito y derivación de problemas de calzada/infraestructura vial urbana.',20),
('Delegación Presidencial Regional de Antofagasta','government_coordination',null,'+56 55 2461010','https://dprantofagasta.dpr.gob.cl/','https://dprantofagasta.dpr.gob.cl/','Coordinación regional del Gobierno y articulación de servicios públicos. Usar como escalamiento, no como sustituto del primer respondedor.',40),
('Gobierno Regional de Antofagasta','government_coordination','infoweb@goreantofagasta.cl','+56 55 2357500','https://goreantofagasta.cl/','https://goreantofagasta.cl/','Gobierno Regional. Canal institucional de coordinación y escalamiento regional.',50),
('SEREMI de Gobierno - Antofagasta','government_information','Catalina.gonzalez@msgg.gob.cl','+56 55 22532450','https://msgg.gob.cl/wp/autoridades-en-regiones/','https://msgg.gob.cl/wp/autoridades-en-regiones/','Vocería y coordinación comunicacional regional del Gobierno.',90),
('SEREMI de Desarrollo Social y Familia - Antofagasta','social_support',null,'+56 55 2449353','https://www.desarrollosocialyfamilia.gob.cl/','https://www.desarrollosocialyfamilia.gob.cl/','Apoyo social y coordinación de medidas para población afectada/vulnerable.',70),
('SEREMI de Economía, Fomento y Turismo - Antofagasta','economic_support','jmenares@economia.cl','+56 2 24733626','https://www.economia.gob.cl/ministerio-de-economia-fomento-y-turismo/autoridades/secretarios-regionales-ministeriales','https://www.economia.gob.cl/ministerio-de-economia-fomento-y-turismo/autoridades/secretarios-regionales-ministeriales','Coordinación económica y productiva regional; contacto de secretaría institucional publicado.',180),
('SEREMI de Salud - Antofagasta','health_authority',null,'+56 55 2655011','https://www.minsal.cl/secretarias-regionales-ministeriales-de-salud/','https://www.minsal.cl/secretarias-regionales-ministeriales-de-salud/','Autoridad sanitaria regional. Escalamiento de riesgos sanitarios y salud pública.',30),
('SEREMI de Energía - Antofagasta','energy_regulator',null,'+56 2 23656605','https://energia.gob.cl/regiones/antofagasta','https://energia.gob.cl/regiones/antofagasta','Autoridad sectorial de energía. Para cortes/riesgos operativos se prioriza CGE y fiscalización SEC.',60),
('SEC - Dirección Regional Antofagasta','energy_regulator',null,'+56 2 32631961','https://www.sec.cl/direcciones-regionales-de-sec/','https://www.sec.cl/direcciones-regionales-de-sec/','Fiscalización eléctrica y de combustibles; recibe reclamos por cortes, riesgos eléctricos y gas.',50),
('Superintendencia de Servicios Sanitarios (SISS)','water_regulator',null,'800 381 800','https://www.siss.gob.cl/','https://www.chileatiende.gob.cl/fichas/4674-reclamo-contra-empresas-sanitarias-responsables-de-los-servicios-de-agua-potable-y-alcantarillado-urbano','Fiscaliza concesionarias sanitarias y recibe reclamos por agua potable y alcantarillado.',50),
('SEREMI de Obras Públicas - Antofagasta','public_works',null,'+56 55 2422207','https://antofagasta.mop.gob.cl/','https://antofagasta.mop.gob.cl/seremi-antofagasta/','Coordina y supervigila infraestructura pública regional y servicios operativos MOP.',30),
('Dirección Regional de Vialidad - Antofagasta','roads',null,null,'https://vialidad.mop.gob.cl/','https://antofagasta.mop.gob.cl/','Conservación y recuperación de conectividad vial regional ante contingencias.',20),
('Dirección General de Aguas - Antofagasta','water_resources','rosa.manquez@mop.gov.cl','+56 55 2422266','https://dga.mop.gob.cl/','https://dga.mop.gob.cl/','Gestión y fiscalización de recursos hídricos regionales; correo de agente de expedientes publicado.',60),
('SEREMI MINVU - Antofagasta','housing_urban',null,null,'https://www.minvu.gob.cl/sobre-minvu/seremi/','https://www.minvu.gob.cl/sobre-minvu/seremi/','Autoridad regional de vivienda y urbanismo. Escalamiento para daños urbanos/habitacionales.',60),
('SERVIU Región de Antofagasta','housing_urban',null,'+56 55 2415107','https://serviuantofagasta.minvu.gob.cl/','https://www.minvu.gob.cl/sobre-minvu/oficinas-de-atencion-presencial/','Infraestructura urbana y habitacional; OIRS regional publicada.',40),
('SEREMI de Transportes y Telecomunicaciones - Antofagasta','transport',null,'+56 2 24213612','https://www.mtt.gob.cl/organismos/secretarias-regionales/','https://www.mtt.gob.cl/organismos/secretarias-regionales/','Coordinación regional de transporte y telecomunicaciones.',40),
('SUBTEL - Macro Zona Norte Antofagasta','telecom_regulator',null,null,'https://www.subtel.gob.cl/','https://www.subtel.gob.cl/','Fiscalización/seguimiento de telecomunicaciones y coordinación de continuidad de redes en emergencias.',60),
('SEREMI del Medio Ambiente - Antofagasta','environment','oficinadepartesantofagasta@mma.gob.cl','+56 55 2533814','https://mma.gob.cl/antofagasta/','https://mma.gob.cl/antofagasta/','Autoridad ambiental regional. OIRS/Oficina de Partes oficial.',40),
('SMA - Oficina Regional Antofagasta','environment','oficina.antofagasta@sma.gob.cl','+56 55 2530385','https://portal.sma.gob.cl/index.php/oficinas-regionales/','https://portal.sma.gob.cl/index.php/oficinas-regionales/','Fiscalización ambiental y evaluación de denuncias ambientales.',30),
('CONAF Región de Antofagasta','wildfire',null,'+56 55 2383320','https://www.conaf.cl/','https://www.conaf.cl/','Apoyo ante incendios de vegetación, arbolado/riesgo forestal y coordinación de recursos.',30),
('Policía de Investigaciones de Chile (PDI)','police',null,'134','https://www.pdichile.cl/','https://www.chileatiende.gob.cl/fichas/1795-denunciar-un-delito','Emergencias por delitos flagrantes con peligro para personas o bienes: 134.',20),
('DIRECTEMAR - Capitanía de Puerto de Antofagasta','maritime',null,'+56 55 2630000','https://www.directemar.cl/capitania-de-puerto-de-antofagasta','https://www.directemar.cl/gobernaciones-maritimas/region-de-antofagasta','Autoridad marítima local para emergencias y contingencias en borde costero/mar.',5),
('DGAC - Aeropuerto Andrés Sabella Antofagasta','aviation','aro.antofagasta@dgac.gob.cl','+56 2 23307821','https://aipchile.dgac.gob.cl/designador/SCFA','https://aipchile.dgac.gob.cl/designador/SCFA','ARO/AIS H24 del Aeropuerto Andrés Sabella; coordinación operacional aeronáutica.',10),
('Ferrocarril de Antofagasta (FCAB)','rail','conectados@fcab.cl','+56 55 2206100','https://www.fcab.cl/','https://www.fcab.cl/','Operador ferroviario regional; útil para incidentes que afecten infraestructura o cruces ferroviarios.',20);

insert into public.organizations(name,kind,region,commune,email,phone,website,active,source_url,verified_at,notes)
select s.name,s.kind,'Antofagasta','Antofagasta',s.email,s.phone,s.website,true,s.source_url,now(),s.notes
from tmp_ie_orgs s
where not exists (
 select 1 from public.organizations o
 where lower(o.name)=lower(s.name) and coalesce(o.commune,'')='Antofagasta'
);

update public.organizations o
set kind=s.kind,region='Antofagasta',commune='Antofagasta',email=s.email,phone=s.phone,website=s.website,
    active=true,source_url=s.source_url,verified_at=now(),notes=s.notes
from tmp_ie_orgs s
where lower(o.name)=lower(s.name) and coalesce(o.commune,'')='Antofagasta';

insert into public.organization_coverage(organization_id,locality_id,priority,active)
select o.id,l.id,s.priority,true
from tmp_ie_orgs s
join public.organizations o on lower(o.name)=lower(s.name) and o.region='Antofagasta' and o.commune='Antofagasta'
cross join public.territorial_localities l
where l.active=true and l.region='Antofagasta' and l.commune='Antofagasta'
on conflict (organization_id,locality_id) do update set priority=excluded.priority,active=true;

commit;
