import { NextResponse } from 'next/server';
import { getApiStaff } from '@/lib/auth';
import { getServerSupabase } from '@/lib/supabase/server';
import { sendInstitutionalMail } from '@/lib/email';
export const runtime='nodejs';
export async function POST(){
  const staff=await getApiStaff();if(!staff)return NextResponse.json({error:'No autorizado'},{status:401});
  const target=process.env.ADMIN_EMAIL||process.env.GMAIL_USER||'contacto@innova-space-edu.cl';
  try{
    await sendInstitutionalMail({to:target,subject:'Solicitud de contacto desde Innova Emergency',text:`Un usuario del Centro de operaciones solicita contacto con el administrador.\n\nUsuario: ${staff.profile.full_name||staff.user.email||'Usuario'}\nCorreo: ${staff.user.email||'No disponible'}\nRol: ${staff.profile.role}\nOrganización: ${staff.profile.organization||'No indicada'}\nFecha: ${new Date().toISOString()}`});
    try{const s=await getServerSupabase();await s.from('audit_log').insert({actor_user_id:staff.user.id,actor_role:staff.profile.role,action:'admin_contact_requested',entity_type:'staff_contact',entity_id:staff.user.id,metadata:{target}})}catch{}
    return NextResponse.json({ok:true});
  }catch(error){console.error(error);return NextResponse.json({error:'No se pudo enviar la notificación. Revisa la configuración de Gmail.'},{status:503})}
}
