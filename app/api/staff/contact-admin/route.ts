import { NextResponse } from 'next/server';
import { getApiStaff } from '@/lib/auth';
import { getServerSupabase } from '@/lib/supabase/server';
import { sendInstitutionalMail } from '@/lib/email';
export const runtime='nodejs';
export async function POST(){
  const staff=await getApiStaff();if(!staff)return NextResponse.json({error:'No autorizado'},{status:401});
  const target=process.env.ADMIN_EMAIL||process.env.EMAIL_SEND_TO||'contacto@innova-space-edu.cl';
  try{
    const sent=await sendInstitutionalMail({to:target,replyTo:staff.user.email||staff.profile.email||target,idempotencyKey:`admin-contact-${staff.user.id}-${Date.now().toString().slice(0,-4)}`,subject:'Solicitud de contacto desde Innova Emergency',text:`Un usuario del Centro de operaciones solicita contacto con el administrador.\n\nCorreo: ${staff.user.email||staff.profile.email||'No disponible'}\nRol: ${staff.profile.role}\nFecha: ${new Date().toISOString()}`});
    try{const s=await getServerSupabase();await s.from('audit_log').insert({actor_user_id:staff.user.id,actor_role:staff.profile.role,action:'admin_contact_requested',entity_type:'staff_contact',entity_id:staff.user.id,metadata:{target,provider:'resend',provider_message_id:sent.id}})}catch{}
    return NextResponse.json({ok:true,providerMessageId:sent.id});
  }catch(error){console.error(error);return NextResponse.json({error:'No se pudo enviar la notificación. Revisa la configuración de Resend.'},{status:503})}
}
