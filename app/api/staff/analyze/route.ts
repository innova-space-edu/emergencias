import { NextRequest, NextResponse } from 'next/server';
import { getApiStaff } from '@/lib/auth';
import { getServerSupabase } from '@/lib/supabase/server';
import { classifyEmergency } from '@/lib/ai';
export const runtime='nodejs';
export async function POST(req:NextRequest){
  const staff=await getApiStaff();if(!staff)return NextResponse.json({error:'No autorizado'},{status:401});
  try{
    const {incidentId}=await req.json();const s=await getServerSupabase();
    const {data:incident}=await s.from('incidents').select('id,category,description_private').eq('id',incidentId).single();if(!incident)return NextResponse.json({error:'Incidente no encontrado'},{status:404});
    const {data:reports}=await s.from('reports').select('danger_fire,danger_injured,danger_trapped,danger_electric,road_blocked,description').eq('incident_id',incidentId).order('received_at',{ascending:false}).limit(10);
    const flags=new Set<string>();for(const r of reports||[]){if(r.danger_fire)flags.add('fuego/humo');if(r.danger_injured)flags.add('personas heridas');if(r.danger_trapped)flags.add('personas atrapadas');if(r.danger_electric)flags.add('peligro eléctrico');if(r.road_blocked)flags.add('vía bloqueada')}
    const description=[incident.description_private,...(reports||[]).map((r:any)=>r.description)].filter(Boolean).join('\n').slice(0,8000);
    const ai=await classifyEmergency({category:incident.category,description,dangerFlags:[...flags]});if(!ai)return NextResponse.json({error:'Gemini no está configurado en Vercel'},{status:503});
    const patch={ai_category:ai.category,ai_severity:Math.max(1,Math.min(5,Number(ai.severity)||1)),ai_summary:`${ai.summary}${ai.recommendedOrganizations?.length?` Organismos sugeridos: ${ai.recommendedOrganizations.join(', ')}.`:''}`,ai_confidence:Math.max(0,Math.min(1,Number(ai.confidence)||0)),ai_processed_at:new Date().toISOString()};
    const {error}=await s.from('incidents').update(patch).eq('id',incidentId);if(error)throw error;
    try{await s.from('audit_log').insert({actor_user_id:staff.user.id,actor_role:staff.profile.role,action:'ai_assessment_requested',entity_type:'incident',entity_id:incidentId,metadata:{model:process.env.GEMINI_MODEL||'gemini-3.6-flash'}})}catch{}
    return NextResponse.json({ok:true,assessment:patch});
  }catch(error){console.error(error);return NextResponse.json({error:'No fue posible analizar el incidente'},{status:500})}
}
