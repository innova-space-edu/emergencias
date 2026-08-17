import { NextRequest, NextResponse } from 'next/server';
import { getApiStaff } from '@/lib/auth';
import { getServerSupabase } from '@/lib/supabase/server';
import { sendInstitutionalMail } from '@/lib/email';
export const runtime='nodejs';
export async function POST(req:NextRequest){
  const staff=await getApiStaff();if(!staff)return NextResponse.json({error:'No autorizado'},{status:401});
  try{
    const body=await req.json();const incidentId=String(body.incidentId||''),organizationId=body.organizationId?String(body.organizationId):null,organizationName=String(body.organizationName||'').slice(0,160),channel=String(body.channel||'manual'),destination=String(body.destination||'').slice(0,240);
    if(!incidentId||!organizationName||!['email','sms','whatsapp','web','radio','manual'].includes(channel))return NextResponse.json({error:'Datos incompletos'},{status:400});
    const s=await getServerSupabase();const {data:incident}=await s.from('incidents').select('public_code,title,category,public_summary,address_approx,commune,locality,latitude,longitude,status').eq('id',incidentId).single();if(!incident)return NextResponse.json({error:'Incidente no encontrado'},{status:404});
    let status:'queued'|'sent'|'failed'='queued',failureReason:string|null=null;
    if(channel==='email'&&destination.includes('@')){try{await sendInstitutionalMail({to:destination,subject:`Alerta informativa ${incident.public_code} — Innova Emergency`,text:`Innova Emergency canaliza un reporte ciudadano. Esta comunicación no confirma que el hecho sea verdadero y no constituye una orden de despacho.\n\nCódigo: ${incident.public_code}\nTipo: ${incident.title||incident.category}\nEstado: ${incident.status}\nComuna: ${incident.commune||'No indicada'}\nLocalidad: ${incident.locality||'No indicada'}\nReferencia: ${incident.address_approx||'Ubicación registrada'}\nGPS: ${incident.latitude}, ${incident.longitude}\nResumen público: ${incident.public_summary||'En revisión'}\n\nEsta plataforma complementa la comunicación ciudadana y no reemplaza 131 SAMU, 132 Bomberos, 133 Carabineros ni SAE/SENAPRED.`});status='sent'}catch(e){status='failed';failureReason=e instanceof Error?e.message:'Fallo de correo'}}
    const {data,error}=await s.from('incident_notifications').insert({incident_id:incidentId,organization_id:organizationId,organization_name:organizationName,channel,destination:destination||null,status,sent_at:status==='sent'?new Date().toISOString():null,failure_reason:failureReason,created_by:staff.user.id}).select('*').single();if(error)throw error;
    const countsAsNotified=status==='sent';
    if(countsAsNotified&&!['responding','resolved','discarded'].includes(incident.status))await s.from('incidents').update({status:'notified'}).eq('id',incidentId);
    try{await s.from('audit_log').insert({actor_user_id:staff.user.id,actor_role:staff.profile.role,action:'notification_created',entity_type:'incident',entity_id:incidentId,metadata:{notification_id:data.id,organization:organizationName,channel,status,incident_status_after:countsAsNotified?'notified':incident.status}})}catch{}
    return NextResponse.json({ok:true,notification:data,incidentStatus:countsAsNotified&&!['responding','resolved','discarded'].includes(incident.status)?'notified':incident.status,requiresManualAction:status==='queued'});
  }catch(error){console.error(error);return NextResponse.json({error:'No fue posible registrar la notificación'},{status:500})}
}
