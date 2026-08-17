import { NextResponse } from 'next/server';
import { getApiStaff } from '@/lib/auth';
import { getServerSupabase } from '@/lib/supabase/server';

export const runtime='nodejs';
const CATEGORY_KINDS:Record<string,string[]>={
  fire:['fire','wildfire','emergency_management','municipality','municipal_operations','government_coordination','radio'],
  traffic_accident:['police','medical','fire','transport','municipal_transport','roads','public_works','rail','emergency_management','municipality','radio'],
  medical:['medical','health_authority','emergency_management','municipality'],
  flood:['emergency_management','municipal_operations','water','public_works','roads','water_regulator','water_resources','government_coordination','municipality','fire','environment','radio'],
  landslide:['emergency_management','municipal_operations','roads','public_works','transport','government_coordination','municipality','fire','police','radio'],
  earthquake_damage:['emergency_management','municipal_operations','municipal_works','public_works','housing_urban','government_coordination','municipality','fire','medical','radio'],
  power_outage:['electricity','energy_regulator','municipal_operations','emergency_management','government_coordination','municipality','telecom_regulator','radio'],
  electrical_hazard:['electricity','energy_regulator','fire','municipal_operations','emergency_management','municipality'],
  gas_leak:['fire','energy_regulator','emergency_management','municipality','police'],
  water_outage:['water','water_regulator','water_resources','emergency_management','government_coordination','municipality','radio'],
  fallen_tree:['municipal_environment','municipal_operations','wildfire','municipality','fire','emergency_management'],
  missing_person:['police','emergency_management','government_coordination','municipality','radio'],
  maritime:['maritime','emergency_management','police','medical','government_coordination','radio'],
  security:['police','government_coordination','municipality','emergency_management'],
  pollution:['environment','municipal_environment','municipal_cleaning','water','water_regulator','maritime','municipality','emergency_management','radio'],
  other:['emergency_management','government_coordination','municipality','municipal_operations','public_works','radio'],
};

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
  const staff=await getApiStaff();
  if(!staff)return NextResponse.json({error:'No autorizado'},{status:401});
  const {id}=await params;
  try{
    const s=await getServerSupabase();
    const {data:incident}=await s.from('incidents').select('id,public_code,title,category,ai_category,severity,status,region,commune,locality,address_approx,latitude,longitude,public_summary,reports_count').eq('id',id).single();
    if(!incident)return NextResponse.json({error:'Emergencia no encontrada'},{status:404});

    const {data:citizenReport}=await s.from('reports').select('id,category,description,region,commune,locality,address_approx,occurred_at,captured_at,danger_fire,danger_injured,danger_trapped,danger_electric,road_blocked').eq('incident_id',id).order('captured_at',{ascending:true}).limit(1).maybeSingle();
    let evidenceCount=0;
    if(citizenReport?.id){
      const {count}=await s.from('evidence').select('id',{head:true,count:'exact'}).eq('report_id',citizenReport.id);
      evidenceCount=count||0;
    }
    const citizenReportPayload=citizenReport?{...citizenReport,evidence_count:evidenceCount}:null;

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
    return NextResponse.json({ok:true,scope,region,commune,locality:locality||null,effectiveCategory,incident,citizenReport:citizenReportPayload,organizations:rows,operatorEmail:staff.user.email||staff.profile.email||null,adminEmail:process.env.ADMIN_EMAIL||process.env.EMAIL_SEND_TO||'contacto@innova-space-edu.cl',emailHistory:emailHistory||[]});
  }catch(error){console.error(error);return NextResponse.json({error:'No fue posible cargar los contactos territoriales'},{status:500})}
}
