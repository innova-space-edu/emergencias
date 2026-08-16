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
  pending_sync:'Pendiente de sincronización', received:'Recibida', reviewing:'En revisión', verified:'Verificada', critical:'Crítica', notified:'Organismos notificados', responding:'En atención', resolved:'Resuelta', discarded:'Descartada'
};
