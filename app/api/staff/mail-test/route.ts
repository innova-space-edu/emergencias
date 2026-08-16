import { NextResponse } from 'next/server';
import { getApiStaff } from '@/lib/auth';
import { sendInstitutionalMail, verifyInstitutionalMail } from '@/lib/email';

export const runtime='nodejs';

export async function POST(){
  const staff=await getApiStaff();
  if(!staff || staff.profile.role!=='admin') return NextResponse.json({error:'No autorizado'},{status:401});
  try{
    await verifyInstitutionalMail();
    const target=process.env.ADMIN_EMAIL || staff.user.email || staff.profile.email;
    if(!target) return NextResponse.json({error:'No hay correo de destino configurado'},{status:400});
    await sendInstitutionalMail({
      to:target,
      subject:'Prueba de correo — Innova Emergencias',
      text:'La configuración SMTP de Innova Emergencias está funcionando correctamente. Este mensaje fue generado desde el panel de administración.'
    });
    return NextResponse.json({ok:true,target});
  }catch(error){
    console.error('mail-test',error);
    return NextResponse.json({error:error instanceof Error?error.message:'No fue posible autenticar con Gmail'},{status:503});
  }
}
