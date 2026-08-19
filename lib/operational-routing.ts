export type ChannelPurpose='emergency'|'outage_report'|'operations'|'coordination'|'complaint'|'escalation'|'information';

export const CANONICAL_EMERGENCY_URL='https://emergencias.innova-space-edu.cl/';

export const PURPOSE_LABEL:Record<ChannelPurpose,string>={
  emergency:'Emergencia / despacho',
  outage_report:'Reporte de avería',
  operations:'Operaciones',
  coordination:'Coordinación',
  complaint:'Reclamo / fiscalización',
  escalation:'Escalamiento',
  information:'Información',
};

export const PURPOSE_RANK:Record<ChannelPurpose,number>={
  emergency:0,
  outage_report:1,
  operations:2,
  coordination:3,
  complaint:4,
  escalation:5,
  information:6,
};

const emergencyNumbers=new Set(['130','131','132','133','134','137','138']);
const regulatorKinds=new Set(['energy_regulator','water_regulator','telecom_regulator']);
const operationalKinds=new Set(['municipal_operations','municipal_works','municipal_cleaning','municipal_environment','municipal_transport','roads','public_works','rail']);
const escalationKinds=new Set(['municipal_authority','government_information','government_coordination','social_support','economic_support']);

function digits(value:string){return value.replace(/\D/g,'');}

export function inferChannelPurpose(org:{name?:string;kind?:string},channel:{channel_type:string;label?:string|null;value:string;notes?:string|null}):ChannelPurpose{
  const kind=String(org.kind||'');
  const type=String(channel.channel_type||'');
  const text=`${org.name||''} ${channel.label||''} ${channel.notes||''} ${channel.value||''}`.toLowerCase();
  const d=digits(channel.value||'');
  if(type==='phone'&&emergencyNumbers.has(d))return 'emergency';
  if(type==='phone'&&d.endsWith('6003600087'))return 'emergency';
  if(/emergenc|central de alarma|centro de control|rescate|sos|24\s*h|24\/7/.test(text)&&['phone','whatsapp','telegram','web'].includes(type))return 'emergency';
  if((kind==='electricity'||kind==='water')&&['phone','web','whatsapp','telegram','x'].includes(type))return 'outage_report';
  if(/sin luz|corte|fuga|aver[ií]a|reportar/.test(text)&&['phone','web','whatsapp','telegram'].includes(type))return 'outage_report';
  if(operationalKinds.has(kind))return 'operations';
  if(kind==='fire'||kind==='medical'||kind==='police'||kind==='maritime'||kind==='aviation'||kind==='wildfire'){
    if(type==='phone')return 'emergency';
    return 'coordination';
  }
  if(regulatorKinds.has(kind))return 'complaint';
  if(/oirs|oficina de partes|reclamo|denuncia administrativa|atenci[oó]n ciudadana/.test(text))return 'complaint';
  if(/alcald|concejal|director|seremi|gabinete|secretar[ií]a regional|vocería|voceria/.test(text)||escalationKinds.has(kind))return 'escalation';
  if(kind==='emergency_management'||kind==='municipality'||kind==='health_authority')return 'coordination';
  if(type==='email')return 'information';
  return 'information';
}

export const CATEGORY_KINDS:Record<string,string[]>={
  fire:['fire','wildfire','emergency_management','municipal_operations','municipality','police'],
  traffic_accident:['police','medical','fire','roads','municipal_transport','public_works','rail','emergency_management','municipal_operations','municipality'],
  medical:['medical','fire','police','health_authority','emergency_management'],
  flood:['emergency_management','municipal_operations','water','public_works','roads','water_regulator','water_resources','fire','police','municipality','environment'],
  landslide:['municipal_operations','municipal_works','roads','public_works','municipal_transport','emergency_management','police','fire','municipality'],
  earthquake_damage:['fire','medical','police','emergency_management','municipal_operations','municipal_works','public_works','housing_urban','municipality'],
  power_outage:['electricity','municipal_operations','energy_regulator','emergency_management','telecom_regulator','municipality'],
  electrical_hazard:['electricity','fire','police','municipal_operations','energy_regulator','emergency_management'],
  gas_leak:['fire','police','medical','energy_regulator','emergency_management','municipality'],
  water_outage:['water','municipal_operations','water_regulator','water_resources','emergency_management','municipality'],
  fallen_tree:['municipal_environment','municipal_operations','fire','wildfire','police','emergency_management','municipality'],
  missing_person:['police','emergency_management','government_coordination','municipality'],
  maritime:['maritime','medical','police','fire','emergency_management'],
  security:['police','emergency_management','municipality'],
  pollution:['environment','municipal_environment','municipal_cleaning','water','water_regulator','maritime','emergency_management','municipality'],
  other:['municipal_operations','municipal_works','emergency_management','municipality','public_works','roads','police','fire'],
};

export type RoutingInputReport={description?:string|null;road_blocked?:boolean;danger_fire?:boolean;danger_injured?:boolean;danger_trapped?:boolean;danger_electric?:boolean};

export function deriveOperationalRouting(category:string,reports:RoutingInputReport[]){
  const declared=category||'other';
  const text=reports.map(r=>r.description||'').join(' ').toLowerCase();
  const roadBlocked=reports.some(r=>Boolean(r.road_blocked));
  const flags:string[]=[];
  if(reports.some(r=>r.danger_fire))flags.push('fuego/humo');
  if(reports.some(r=>r.danger_injured))flags.push('personas heridas');
  if(reports.some(r=>r.danger_trapped))flags.push('personas atrapadas');
  if(reports.some(r=>r.danger_electric))flags.push('peligro eléctrico');
  if(roadBlocked)flags.push('vía bloqueada');

  const roadDamage=/socav|socav[oó]n|hundim|subsid|colapso\s+(?:de\s+)?(?:calzada|pavimento|v[ií]a)|bache|calzada\s+cedid|pavimento\s+cedid|derrumbe|deslizamiento/.test(text);
  if((declared==='other'||declared==='landslide')&&(roadDamage||roadBlocked)){
    return {
      category:'landslide',
      label:'Infraestructura vial / posible socavón o derrumbe',
      kinds:CATEGORY_KINDS.landslide,
      reason:roadDamage
        ?'La descripción contiene señales de daño o colapso de calzada. Se priorizan unidades operativas, obras/vialidad y respuesta de seguridad si la vía está afectada.'
        :'El formulario marca vía bloqueada. Se priorizan operaciones municipales, obras/vialidad y seguridad antes que autoridades de escalamiento.',
      dangerFlags:flags,
    };
  }
  return {
    category:declared,
    label:declared,
    kinds:CATEGORY_KINDS[declared]||CATEGORY_KINDS.other,
    reason:'La derivación usa categoría, riesgos declarados, ubicación y canales operativos verificados; contactos políticos o institucionales quedan como escalamiento.',
    dangerFlags:flags,
  };
}
