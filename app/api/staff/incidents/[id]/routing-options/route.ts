import { NextResponse } from 'next/server';
import { getApiStaff } from '@/lib/auth';
import { getServerSupabase } from '@/lib/supabase/server';
import { deriveOperationalRouting, inferChannelPurpose, PURPOSE_RANK } from '@/lib/operational-routing';

export const runtime='nodejs';

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
  const staff=await getApiStaff();
  if(!staff)return NextResponse.json({error:'No autorizado'},{status:401});
  const {id}=await params;
  try{
    const s=await getServerSupabase();
    const {data:incident}=await s.from('incidents').select('id,public_code,title,category,ai_category,ai_severity,ai_summary,ai_confidence,ai_reason,ai_requires_human,ai_decision,severity,status,region,commune,locality,address_approx,latitude,longitude,public_summary,reports_count').eq('id',id).single();
    if(!incident)return NextResponse.json({error:'Emergencia no encontrada'},{status:404});

    const {data:reports,error:reportsError}=await s.from('reports')
      .select('id,category,description,region,commune,locality,address_approx,occurred_at,captured_at,received_at,danger_fire,danger_injured,danger_trapped,danger_electric,road_blocked')
      .eq('incident_id',id)
      .order('received_at',{ascending:true})
      .limit(20);
    if(reportsError)throw reportsError;

    const reportIds=(reports||[]).map((r:any)=>r.id);
    const evidenceByReport=new Map<string,number>();
    let evidenceCount=0;
    if(reportIds.length){
      const {data:evidence,error:evidenceError}=await s.from('evidence').select('id,report_id').in('report_id',reportIds);
      if(evidenceError)throw evidenceError;
      evidenceCount=(evidence||[]).length;
      for(const ev of evidence||[])evidenceByReport.set(ev.report_id,(evidenceByReport.get(ev.report_id)||0)+1);
    }
    const citizenReports=(reports||[]).map((r:any)=>({...r,evidence_count:evidenceByReport.get(r.id)||0}));
    const citizenReport=citizenReports[0]||null;

    const region=incident.region||'Antofagasta';
    const commune=incident.commune||'Antofagasta';
    const locality=String(incident.locality||'').trim();
    const effectiveCategory=incident.ai_category||incident.category||'other';
    const routingProfile=deriveOperationalRouting(effectiveCategory,citizenReports);
    const kinds=routingProfile.kinds;

    let localityIds:string[]=[];
    if(locality){
      const {data}=await s.from('territorial_localities').select('id,locality').eq('active',true).eq('region',region).eq('commune',commune).ilike('locality',locality).limit(20);
      localityIds=(data||[]).map((x:any)=>x.id);
    }
    let scope:'locality'|'commune'=localityIds.length?'locality':'commune';
    if(!localityIds.length){
      const {data}=await s.from('territorial_localities').select('id').eq('active',true).eq('region',region).eq('commune',commune).limit(500);
      localityIds=(data||[]).map((x:any)=>x.id);
    }

    const coveragePriority=new Map<string,number>();
    if(localityIds.length){
      const {data}=await s.from('organization_coverage').select('organization_id,priority').eq('active',true).in('locality_id',localityIds).order('priority',{ascending:true});
      for(const row of data||[])coveragePriority.set(row.organization_id,Math.min(coveragePriority.get(row.organization_id)??999,Number(row.priority||999)));
    }

    let orgQuery=s.from('organizations')
      .select('id,name,kind,region,commune,email,phone,website,radio_frequency,source_url,verified_at,notes,active')
      .eq('active',true)
      .eq('region',region)
      .in('kind',kinds)
      .limit(80);
    if(commune)orgQuery=orgQuery.or(`commune.eq.${commune},commune.is.null`);
    const {data:orgs,error:orgError}=await orgQuery;
    if(orgError)throw orgError;

    const ids=(orgs||[]).map((o:any)=>o.id);
    let channels:any[]=[];
    if(ids.length){
      const {data,error}=await s.from('organization_channels')
        .select('id,organization_id,channel_type,label,value,direct_send,automation_enabled,is_primary,verified_at,source_url,notes,active')
        .eq('active',true)
        .in('organization_id',ids)
        .order('is_primary',{ascending:false});
      if(error)throw error;
      channels=data||[];
    }

    const rows=(orgs||[]).map((o:any)=>{
      const enriched=(channels||[])
        .filter((c:any)=>c.organization_id===o.id)
        .map((c:any)=>{
          const purpose=inferChannelPurpose(o,c);
          return {...c,purpose,purpose_rank:PURPOSE_RANK[purpose]};
        })
        .sort((a:any,b:any)=>a.purpose_rank-b.purpose_rank||Number(Boolean(b.is_primary))-Number(Boolean(a.is_primary)));
      const bestPurpose=enriched.length?Math.min(...enriched.map((c:any)=>Number(c.purpose_rank))):9;
      return {...o,coverage_priority:coveragePriority.get(o.id)??100,operational_rank:bestPurpose,channels:enriched};
    })
      .filter((o:any)=>o.channels.length||o.email||o.phone||o.website||o.radio_frequency)
      .sort((a:any,b:any)=>a.operational_rank-b.operational_rank||(kinds.indexOf(a.kind)-kinds.indexOf(b.kind))||(a.coverage_priority-b.coverage_priority)||a.name.localeCompare(b.name,'es'))
      .slice(0,20);

    const {data:emailHistory}=await s.from('incident_notifications')
      .select('id,organization_name,destination,status,provider_message_id,sent_at,created_at,failure_reason,subject,message_text,cc_recipients')
      .eq('incident_id',id)
      .eq('channel','email')
      .order('created_at',{ascending:false})
      .limit(10);

    return NextResponse.json({
      ok:true,
      scope,
      region,
      commune,
      locality:locality||null,
      effectiveCategory,
      routingProfile:{category:routingProfile.category,label:routingProfile.label,reason:routingProfile.reason,dangerFlags:routingProfile.dangerFlags},
      agentContext:{reportsCount:citizenReports.length,evidenceCount,dangerFlags:routingProfile.dangerFlags,descriptions:citizenReports.map((r:any)=>r.description).filter(Boolean).slice(0,10)},
      incident,
      citizenReport,
      citizenReports,
      organizations:rows,
      operatorEmail:staff.user.email||staff.profile.email||null,
      adminEmail:process.env.ADMIN_EMAIL||process.env.EMAIL_SEND_TO||'contacto@innova-space-edu.cl',
      emailHistory:emailHistory||[],
    });
  }catch(error){
    console.error(error);
    return NextResponse.json({error:'No fue posible cargar los contactos territoriales'},{status:500});
  }
}
