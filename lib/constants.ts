export const EMERGENCY_CATEGORIES = [
  ['fire','Incendio'],
  ['traffic_accident','Accidente vehicular'],
  ['medical','Emergencia médica'],
  ['flood','Inundación / anegamiento'],
  ['landslide','Aluvión / derrumbe'],
  ['earthquake_damage','Daños por sismo'],
  ['power_outage','Corte de energía'],
  ['electrical_hazard','Riesgo eléctrico'],
  ['gas_leak','Fuga de gas'],
  ['water_outage','Corte de agua'],
  ['fallen_tree','Árbol / poste caído'],
  ['missing_person','Persona desaparecida'],
  ['maritime','Emergencia marítima'],
  ['security','Riesgo de seguridad'],
  ['pollution','Contaminación'],
  ['other','Otra emergencia']
] as const;

export const STATUS_LABEL: Record<string,string> = {
  pending_sync:'Pendiente de sincronización',
  received:'Recibida',
  reviewing:'En revisión',
  verified:'Verificada',
  critical:'Crítica',
  notified:'Organismos notificados',
  responding:'En atención',
  resolved:'Resuelta',
  discarded:'Cerrada / descartada'
};

export const STATUS_COLOR: Record<string,string> = {
  pending_sync:'#eab308',
  received:'#eab308',
  reviewing:'#eab308',
  verified:'#f97316',
  critical:'#dc2626',
  notified:'#2563eb',
  responding:'#7c3aed',
  resolved:'#16a34a',
  discarded:'#111827'
};

export const STATUS_LEGEND = [
  ['received','Recibida / en revisión'],
  ['verified','Verificada'],
  ['critical','Crítica'],
  ['notified','Notificada'],
  ['responding','En atención'],
  ['resolved','Resuelta'],
  ['discarded','Cerrada / descartada']
] as const;
