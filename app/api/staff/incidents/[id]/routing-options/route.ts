import { NextResponse } from 'next/server';
import { getApiStaff } from '@/lib/auth';
import { getServerSupabase } from '@/lib/supabase/server';

export const runtime='nodejs';
const CATEGORY_KINDS:Record<string,string[]>={
  fire:['fire','emergency_management','municipality','radio'],
  traffic_accident:['police','medical','fire','emergency_management','municipality','radio'],
  medical:['medical','emergency_management','municipality'],
  flood:['emergency_management','water','municipality','fire','radio'],
  landslide:['emergency_management','municipality','fire','police','radio'],
  earthquake_damage:['emergency_management','municipality','fire','medical','radio'],
  power_outage:['electricity','emergency_management','municipality','radio'],
  electrical_hazard:['electricity','fire','emergency_management','municipality'],
  gas_leak:['fire','emergency_management','municipality','police'],
  water_outage:['water','emergency_management','municipality','radio'],
  fallen_tree:['municipality','fire','emergency_management'],
  missing_person:['police','emergency_management','municipality','radio'],
  maritime:['emergency_management','police','medical','radio'],
  security:['police','municipality','emergency_management'],
  pollution:['municipality','emergency_management','water','radio'],
  other:['emergency_management','municipality','radio'],
};

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
  const staff=await getApiStaff();
  if(!staff)return NextResponse.json({error:'No autorizado'},{status:401});
  const {id}=await params;
  try{
    const s=await getServerSupabase();
    const {data:incident}=await s.from('incidents').select('id,public_code,title,category,ai_category,severity,status,region,commune,locality,address_approx,latitude,longitude,public_summary').eq('id',id).single();
    if(!incident)return NextResponse.json({error:'Emergencia no encontrada'},{status:404});
    const region=incident.region||'Antofagasta',commune=incident.commune||'Antofagasta',locality=String(incident.locality||'').trim();
    const effectiveCategory=incident.ai_category||incident.category||'other';
    const kinds=CATEGORY_KINDS[effectiveCategory]||CATEGORY_KINDS.other;
    let localityIds:string[]=[];
    if(locality){
      const {data}=await s.from('territorial_localities').select('id,locality').eq('active',true).eq('region',region).eq('commune',commune).ilike('locality',locality).limit(20);
      localityIds=(data||[]).map((x:any)=>x.id);
    }
    let scope:'locality'|'commune'='locality';
    if(!localityIds.length){
      scope='commune';
      const {data}=await s.from('territorial_localities').select('id').eq('active',true).eq('region',region).eq('commune',commune).limit(500);
      localityIds=(data||[]).map((x:any)=>x.id);
    }
    let organizationIds:string[]=[];
    const coveragePriority=new Map<string,number>();
    if(localityIds.length){
      const {data}=await s.from('organization_coverage').select('organization_id,priority').eq('active',true).in('locality_id',localityIds).order('priority',{ascending:true});
      for(const row of data||[]){
        organizationIds.push(row.organization_id);
        coveragePriority.set(row.organization_id,Math.min(coveragePriority.get(row.organization_id)??999,Number(row.priority||999)));
      }
      organizationIds=[...new Set(organizationIds)];
    }
    let orgQuery=s.from('organizations').select('id,name,kind,region,commune,email,phone,website,radio_frequency,source_url,verified_at,notes,active').eq('active',true).eq('region',region).in('kind',kinds);
    if(organizationIds.length)orgQuery=orgQuery.in('id',organizationIds);else orgQuery=orgQuery.eq('commune',commune);
    const {data:orgs,error:orgError}=await orgQuery;if(orgError)throw orgError;
    const ids=(orgs||[]).map((o:any)=>o.id);
    let channels:any[]=[];
    if(ids.length){const {data,error}=await s.from('organization_channels').select('id,organization_id,channel_type,label,value,direct_send,automation_enabled,is_primary,verified_at,source_url,notes,active').eq('active',true).in('organization_id',ids).order('is_primary',{ascending:false});if(error)throw error;channels=data||[]}
    const rows=(orgs||[]).map((o:any)=>({...o,coverage_priority:coveragePriority.get(o.id)??100,channels:channels.filter((c:any)=>c.organization_id===o.id)})).filter((o:any)=>o.channels.length||o.email||o.phone||o.website||o.radio_frequency).sort((a:any,b:any)=>(kinds.indexOf(a.kind)-kinds.indexOf(b.kind))||(a.coverage_priority-b.coverage_priority)||a.name.localeCompare(b.name,'es'));
    const {data:emailHistory}=await s.from('incident_notifications').select('id,organization_name,destination,status,provider_message_id,sent_at,created_at,failure_reason,subject,message_text,cc_recipients').eq('incident_id',id).eq('channel','email').order('created_at',{ascending:false}).limit(10);
    return NextResponse.json({ok:true,scope,region,commune,locality:locality||null,effectiveCategory,incident,organizations:rows,operatorEmail:staff.user.email||staff.profile.email||null,adminEmail:process.env.ADMIN_EMAIL||process.env.EMAIL_SEND_TO||'contacto@innova-space-edu.cl',emailHistory:emailHistory||[]});
  }catch(error){console.error(error);return NextResponse.json({error:'No fue posible cargar los contactos territoriales'},{status:500})}
}
