import { NextRequest, NextResponse } from 'next/server';
import { callEmergencyGateway } from '@/lib/gateway';
import { sendInstitutionalMail } from '@/lib/email';
export const runtime='nodejs';
export async function POST(req:NextRequest){
  try{
    const body=await req.json();
    const r=await callEmergencyGateway('access-request',{method:'POST',body:JSON.stringify(body)});
    const payload=await r.json().catch(()=>({}));
    if(!r.ok)return NextResponse.json(payload,{status:r.status});
    const admin=process.env.ADMIN_EMAIL||process.env.EMAIL_SEND_TO||'contacto@innova-space-edu.cl';
    try{await sendInstitutionalMail({to:admin,replyTo:String(body.email||'').trim()||undefined,idempotencyKey:`access-request-${payload.id||Date.now()}`,subject:`Solicitud de acceso — ${String(body.organization||'Institución')}`,text:`Nueva solicitud de acceso a Innova Emergency\n\nNombre: ${body.fullName||''}\nCorreo: ${body.email||''}\nInstitución: ${body.organization||''}\nCargo: ${body.position||''}\nRol solicitado: ${body.requestedRole||''}\n\n${body.message||''}`})}catch(error){console.warn('Solicitud guardada, correo Resend no enviado',error)}
    return NextResponse.json({ok:true,id:payload.id});
  }catch{return NextResponse.json({error:'No fue posible registrar la solicitud'},{status:503})}
}
