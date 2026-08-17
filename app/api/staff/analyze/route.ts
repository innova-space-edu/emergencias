import { NextRequest, NextResponse } from 'next/server';
import { getApiStaff } from '@/lib/auth';
import { getServerSupabase } from '@/lib/supabase/server';
import { classifyEmergency, type AiImageInput } from '@/lib/ai';
export const runtime='nodejs';
export const maxDuration=60;

async function loadPrivateImages(s:Awaited<ReturnType<typeof getServerSupabase>>,incidentId:string):Promise<AiImageInput[]>{
  const {data:evidence}=await s.from('evidence').select('storage_path,mime_type,bytes').eq('incident_id',incidentId).eq('media_type','image').order('created_at',{ascending:false}).limit(3);
  const images:AiImageInput[]=[];
  for(const item of evidence||[]){
    if(!item.storage_path||!String(item.mime_type||'').startsWith('image/'))continue;
    if(item.bytes&&Number(item.bytes)>5_000_000)continue;
    try{const {data}=await s.storage.from('emergency-evidence').createSignedUrl(item.storage_path,90);if(!data?.signedUrl)continue;const response=await fetch(data.signedUrl,{cache:'no-store',signal:AbortSignal.timeout(12000)});if(!response.ok)continue;const buffer=Buffer.from(await response.arrayBuffer());if(buffer.byteLength>5_000_000)continue;images.push({mimeType:item.mime_type||'image/jpeg',base64:buffer.toString('base64')})}catch{}
  }
  return images;
}

export async function POST(req:NextRequest){
  const staff=await getApiStaff();if(!staff)return NextResponse.json({error:'No autorizado'},{status:401});
  try{
    const {incidentId}=await req.json();const s=await getServerSupabase();
    const {data:incident}=await s.from('incidents').select('id,category,description_private,region,commune,status').eq('id',incidentId).single();if(!incident)return NextResponse.json({error:'Incidente no encontrado'},{status:404});
    const {data:reports}=await s.from('reports').select('id,danger_fire,danger_injured,danger_trapped,danger_electric,road_blocked,description').eq('incident_id',incidentId).order('received_at',{ascending:false}).limit(10);
    const flags=new Set<string>();for(const r of reports||[]){if(r.danger_fire)flags.add('fuego/humo');if(r.danger_injured)flags.add('personas heridas');if(r.danger_trapped)flags.add('personas atrapadas');if(r.danger_electric)flags.add('peligro eléctrico');if(r.road_blocked)flags.add('vía bloqueada')}
    const description=[incident.description_private,...(reports||[]).map((r:any)=>r.description)].filter(Boolean).join('\n').slice(0,8000),images=await loadPrivateImages(s,incidentId);
    const ai=await classifyEmergency({category:incident.category,description,dangerFlags:[...flags],images});if(!ai)return NextResponse.json({error:'Gemini no está configurado o no respondió'},{status:503});
    const {data:policy}=await s.from('ai_agent_policies').select('*').eq('active',true).eq('region',incident.region||'Antofagasta').is('commune',null).maybeSingle();const min=Number(policy?.min_confidence_auto||.9);const danger=flags.has('fuego/humo')||flags.has('personas heridas')||flags.has('personas atrapadas')||flags.has('peligro eléctrico');const conflict=incident.category!=='other'&&ai.category!==incident.category;const requiresHuman=Boolean(ai.needsHumanReview||ai.inconsistencies.length||danger||conflict||ai.severity>=4||ai.confidence<min);const decision=ai.severity>=4||danger?'urgent_human_review':requiresHuman?'human_review':'auto_triage';const now=new Date().toISOString();
    const patch={ai_category:ai.category,ai_severity:Math.max(1,Math.min(5,Number(ai.severity)||1)),ai_summary:ai.summary,ai_confidence:Math.max(0,Math.min(1,Number(ai.confidence)||0)),ai_reason:ai.reason,ai_recommended_organizations:ai.recommendedOrganizations||[],ai_decision:decision,ai_requires_human:requiresHuman,ai_processed_at:now,ai_last_agent_at:now};
    const {error}=await s.from('incidents').update(patch).eq('id',incidentId);if(error)throw error;
    await s.from('ai_agent_runs').insert({incident_id:incidentId,report_id:reports?.[0]?.id||null,model:process.env.GEMINI_MODEL||'gemini-3.6-flash',status:'completed',decision,suggested_category:ai.category,suggested_severity:ai.severity,confidence:ai.confidence,requires_human:requiresHuman,reason:ai.reason,recommended_organizations:ai.recommendedOrganizations||[],completed_at:now});
    try{await s.from('audit_log').insert({actor_user_id:staff.user.id,actor_role:staff.profile.role,action:'ai_assessment_requested',entity_type:'incident',entity_id:incidentId,metadata:{model:process.env.GEMINI_MODEL||'gemini-3.6-flash',images_analyzed:images.length,decision,requires_human:requiresHuman,inconsistencies:ai.inconsistencies}})}catch{}
    return NextResponse.json({ok:true,assessment:patch,imagesAnalyzed:images.length,inconsistencies:ai.inconsistencies});
  }catch(error){console.error(error);return NextResponse.json({error:'No fue posible analizar el incidente'},{status:500})}
}
