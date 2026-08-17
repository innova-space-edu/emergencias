import { NextRequest, NextResponse } from 'next/server';
import { getApiStaff } from '@/lib/auth';
import { getServerSupabase } from '@/lib/supabase/server';

export const runtime='nodejs';
const CATEGORIES=new Set(['fire','traffic_accident','medical','flood','landslide','earthquake_damage','power_outage','electrical_hazard','gas_leak','water_outage','fallen_tree','missing_person','maritime','security','pollution','other']);
export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const staff=await getApiStaff();if(!staff)return NextResponse.json({error:'No autorizado'},{status:401});const {id}=await params;
 try{const body=await req.json(),category=String(body.category||''),severity=Number(body.severity);if(!CATEGORIES.has(category)||!Number.isInteger(severity)||severity<1||severity>5)return NextResponse.json({error:'Categoría o prioridad inválida'},{status:400});const s=await getServerSupabase();const {data:before}=await s.from('incidents').select('id,public_code,category,severity,status').eq('id',id).single();if(!before)return NextResponse.json({error:'Emergencia no encontrada'},{status:404});const patch:any={category,severity};if(severity>=4&&!['notified','responding','resolved','discarded'].includes(before.status))patch.status='critical';const {data,error}=await s.from('incidents').update(patch).eq('id',id).select('*').single();if(error)throw error;try{await s.from('audit_log').insert({actor_user_id:staff.user.id,actor_role:staff.profile.role,action:'incident_triage_changed',entity_type:'incident',entity_id:id,metadata:{public_code:before.public_code,category_from:before.category,category_to:category,severity_from:before.severity,severity_to:severity,status_after:data.status}})}catch{}return NextResponse.json({ok:true,incident:data})}catch(error){console.error(error);return NextResponse.json({error:'No fue posible actualizar el triage'},{status:500})}
}
