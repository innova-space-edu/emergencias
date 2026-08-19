import { NextRequest, NextResponse } from 'next/server';
import { getApiStaff } from '@/lib/auth';
import { getServerSupabase } from '@/lib/supabase/server';
import { sendInstitutionalMail } from '@/lib/email';
import { CANONICAL_EMERGENCY_URL } from '@/lib/operational-routing';
export const runtime='nodejs';
const ALLOWED_CHANNELS=new Set(['email','sms','whatsapp','telegram','web','radio','manual','phone','facebook','instagram','x','zello']);
const DISCLAIMER='Esta comunicación canaliza información ciudadana y no confirma la veracidad del hecho ni constituye una orden de despacho. Innova Emergency complementa los canales oficiales y no reemplaza los números y centrales operativas que correspondan, entre ellos 130 CONAF, 131 SAMU, 132 Bomberos, 133 Carabineros, 134 PDI y 137 emergencias marítimas.';

function norm(v:string){return v.trim().toLowerCase()}

export async function POST(req:NextRequest){
  const staff=await getApiStaff();if(!staff)return NextResponse.json({error:'No autorizado'},{status:401});
  try{
    const body=await req.json();const incidentId=String(body.incidentId||''),organizationId=body.organizationId?String(body.organizationId):null,requestedName=String(body.organizationName||'').slice(0,160),channel=String(body.channel||'manual');let destination=String(body.destination||'').slice(0,400);let organizationName=requestedName;
    if(!incidentId||!organizationName||!ALLOWED_CHANNELS.has(channel))return NextResponse.json({error:'Datos incompletos'},{status:400});
    const s=await getServerSupabase();const {data:incident}=await s.from('incidents').select('public_code,title,category,public_summary,address_approx,commune,locality,latitude,longitude,status,severity').eq('id',incidentId).single();if(!incident)return NextResponse.json({error:'Incidente no encontrado'},{status:404});

    if(organizationId){
      const {data:org}=await s.from('organizations').select('id,name,email,phone,website,radio_frequency,active').eq('id',organizationId).eq('active',true).maybeSingle();
      if(!org)return NextResponse.json({error:'Organismo no registrado o inactivo'},{status:400});
      organizationName=org.name;
      const {data:registered}=await s.from('organization_channels').select('channel_type,value').eq('organization_id',organizationId).eq('active',true);
      const values=new Set<string>((registered||[]).filter((x:any)=>x.channel_type===channel).map((x:any)=>norm(String(x.value||''))));
      if(channel==='email'&&org.email)values.add(norm(org.email));
      if(channel==='phone'&&org.phone)values.add(norm(org.phone));
      if(channel==='web'&&org.website)values.add(norm(org.website));
      if(channel==='radio'&&org.radio_frequency)values.add(norm(org.radio_frequency));
      if(channel!=='manual'&&destination&&values.size&&!values.has(norm(destination))){
        return NextResponse.json({error:'El destino no coincide con un canal activo registrado para este organismo'},{status:400});
      }
      if(channel==='email'&&values.size===0)return NextResponse.json({error:'Este organismo no tiene correo registrado'},{status:400});
    }

    const admin=process.env.ADMIN_EMAIL||process.env.EMAIL_SEND_TO||'contacto@innova-space-edu.cl';
    const cc=channel==='email'&&destination.toLowerCase()!==admin.toLowerCase()?[admin]:[];
    const defaultSubject=`Alerta informativa ${incident.public_code} — Innova Emergency`;
    const defaultText=`Innova Emergency canaliza un reporte ciudadano a ${organizationName}.\n\nCódigo: ${incident.public_code}\nTipo: ${incident.title||incident.category}\nPrioridad: ${incident.severity}/5\nEstado: ${incident.status}\nComuna: ${incident.commune||'No indicada'}\nLocalidad: ${incident.locality||'No indicada'}\nReferencia: ${incident.address_approx||'Ubicación registrada'}\nGPS: ${incident.latitude}, ${incident.longitude}\nResumen: ${incident.public_summary||'En revisión'}\n\nSeguimiento: ${CANONICAL_EMERGENCY_URL}\nGestionado por: ${staff.user.email||staff.profile.email||'usuario autorizado'}\n\n${DISCLAIMER}`;
    const subject=String(body.subject||defaultSubject).trim().slice(0,180)||defaultSubject;
    let messageText=String(body.messageText||defaultText).trim().slice(0,8000)||defaultText;
    if(!messageText.toLowerCase().includes('no constituye una orden oficial de despacho')&&!messageText.toLowerCase().includes('no constituye una orden de despacho'))messageText=`${messageText}\n\n${DISCLAIMER}`;
    let status:'queued'|'sent'|'failed'='queued',failureReason:string|null=null,providerMessageId:string|null=null;
    if(channel==='email'&&destination.includes('@')){
      try{
        const sent=await sendInstitutionalMail({to:destination,cc:cc.length?cc:undefined,replyTo:staff.user.email||staff.profile.email||admin,idempotencyKey:`notify-${incidentId}-${organizationId||organizationName}-${Date.now().toString().slice(0,-4)}`,subject,text:messageText});
        providerMessageId=sent.id;status='sent';
      }catch(e){status='failed';failureReason=e instanceof Error?e.message:'Fallo de correo'}
    }
    const {data,error}=await s.from('incident_notifications').insert({incident_id:incidentId,organization_id:organizationId,organization_name:organizationName,channel,destination:destination||null,status,provider_message_id:providerMessageId,sent_at:status==='sent'?new Date().toISOString():null,failure_reason:failureReason,created_by:staff.user.id,subject:channel==='email'?subject:null,message_text:channel==='email'?messageText:null,cc_recipients:cc}).select('*').single();if(error)throw error;
    const countsAsNotified=status==='sent';
    if(countsAsNotified&&!['responding','resolved','discarded'].includes(incident.status))await s.from('incidents').update({status:'notified'}).eq('id',incidentId);
    try{await s.from('audit_log').insert({actor_user_id:staff.user.id,actor_role:staff.profile.role,action:'notification_created',entity_type:'incident',entity_id:incidentId,metadata:{notification_id:data.id,organization:organizationName,channel,status,provider:channel==='email'?'resend':'manual',provider_message_id:providerMessageId,subject:channel==='email'?subject:null,cc,incident_status_after:countsAsNotified?'notified':incident.status}})}catch{}
    return NextResponse.json({ok:true,notification:data,incidentStatus:countsAsNotified&&!['responding','resolved','discarded'].includes(incident.status)?'notified':incident.status,requiresManualAction:status==='queued'});
  }catch(error){console.error(error);return NextResponse.json({error:'No fue posible registrar la notificación'},{status:500})}
}
