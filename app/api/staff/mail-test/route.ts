import { NextResponse } from 'next/server';
import { getApiStaff } from '@/lib/auth';
import { sendInstitutionalMail, verifyInstitutionalMail } from '@/lib/email';

export const runtime='nodejs';

export async function POST(){
  const staff=await getApiStaff();
  if(!staff || staff.profile.role!=='admin') return NextResponse.json({error:'No autorizado'},{status:401});
  try{
    await verifyInstitutionalMail();
    const target=process.env.ADMIN_EMAIL||process.env.EMAIL_SEND_TO||staff.user.email||staff.profile.email;
    if(!target) return NextResponse.json({error:'No hay correo de destino configurado'},{status:400});
    const sent=await sendInstitutionalMail({to:target,replyTo:target,idempotencyKey:`mail-test-${Date.now().toString().slice(0,-4)}`,subject:'Prueba de correo — Innova Emergency',text:'La integración de Resend de Innova Emergency está funcionando correctamente. Este mensaje fue generado desde el panel de administración.'});
    return NextResponse.json({ok:true,target,provider:'resend',providerMessageId:sent.id});
  }catch(error){
    console.error('mail-test',error);
    return NextResponse.json({error:error instanceof Error?error.message:'No fue posible enviar con Resend'},{status:503});
  }
}
