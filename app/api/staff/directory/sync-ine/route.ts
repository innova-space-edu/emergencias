import { NextResponse } from 'next/server';
import { getApiStaff } from '@/lib/auth';
import { getServerSupabase } from '@/lib/supabase/server';

export const runtime='nodejs';
export const maxDuration=60;
const INE_QUERY='https://services5.arcgis.com/hUyD8u3TeZLKPe4T/ArcGIS/rest/services/Censo2024_v2/FeatureServer/7/query';

function localityType(name:string,commune:string){
  return name.trim().toLocaleLowerCase('es')===commune.trim().toLocaleLowerCase('es')?'commune_center':'other';
}

export async function POST(){
  const staff=await getApiStaff();
  if(!staff)return NextResponse.json({error:'No autorizado'},{status:401});
  if(staff.profile.role!=='admin')return NextResponse.json({error:'Solo el administrador puede sincronizar la base territorial'},{status:403});
  try{
    const params=new URLSearchParams({where:'COD_REGION=2',outFields:'COD_REGION,REGION,PROVINCIA,COMUNA,COD_LOCALIDAD,LOCALIDAD,ID_LOCALIDAD',returnGeometry:'false',resultRecordCount:'2000',f:'json'});
    const response=await fetch(`${INE_QUERY}?${params.toString()}`,{headers:{accept:'application/json'},cache:'no-store',signal:AbortSignal.timeout(25000)});
    if(!response.ok)return NextResponse.json({error:`INE respondió ${response.status}`},{status:502});
    const payload=await response.json();
    if(payload?.error)return NextResponse.json({error:payload.error.message||'INE devolvió un error'},{status:502});
    const features=Array.isArray(payload?.features)?payload.features:[];
    const unique=new Map<string,any>();
    for(const feature of features){
      const a=feature?.attributes||{},region=String(a.REGION||'Antofagasta').trim(),province=String(a.PROVINCIA||'').trim()||null,commune=String(a.COMUNA||'').trim(),locality=String(a.LOCALIDAD||'').trim();
      if(!commune||!locality)continue;
      const key=`${region}|${commune}|${locality}`.toLocaleLowerCase('es');
      unique.set(key,{region:'Antofagasta',province,commune,locality,locality_type:localityType(locality,commune),source_name:'INE Chile · Censo 2024 · Localidades_CPV24',source_url:'https://censo2024.ine.gob.cl/resultados/',verified_at:new Date().toISOString(),active:true});
    }
    const rows=[...unique.values()];
    if(!rows.length)return NextResponse.json({error:'La fuente INE no devolvió localidades para la Región de Antofagasta'},{status:502});
    const s=await getServerSupabase();
    const chunkSize=250;let saved=0;
    for(let i=0;i<rows.length;i+=chunkSize){
      const chunk=rows.slice(i,i+chunkSize);
      const {error}=await s.from('territorial_localities').upsert(chunk,{onConflict:'region,commune,locality'});
      if(error)throw error;saved+=chunk.length;
    }
    try{await s.from('audit_log').insert({actor_user_id:staff.user.id,actor_role:staff.profile.role,action:'territorial_localities_synced_ine',entity_type:'territorial_directory',entity_id:'Antofagasta',metadata:{source:'INE Censo 2024 Localidades_CPV24',features_received:features.length,localities_saved:saved}})}catch{}
    return NextResponse.json({ok:true,received:features.length,saved,source:'INE Censo 2024 · Localidades_CPV24'});
  }catch(error){console.error(error);return NextResponse.json({error:'No fue posible sincronizar las localidades oficiales del INE'},{status:500})}
}
