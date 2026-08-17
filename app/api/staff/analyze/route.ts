import { NextRequest, NextResponse } from 'next/server';
import { getApiStaff } from '@/lib/auth';
import { getServerSupabase } from '@/lib/supabase/server';
import { callAgentWorker } from '@/lib/agent-worker';

export const runtime='nodejs';
export const maxDuration=60;

export async function POST(req:NextRequest){
  const staff=await getApiStaff();
  if(!staff)return NextResponse.json({error:'No autorizado'},{status:401});
  try{
    const {incidentId}=await req.json();
    if(!incidentId)return NextResponse.json({error:'Incidente requerido'},{status:400});
    const supabase=await getServerSupabase();
    const {data:{session}}=await supabase.auth.getSession();
    if(!session?.access_token)return NextResponse.json({error:'Sesión no disponible para ejecutar el agente'},{status:401});
    const r=await callAgentWorker({mode:'staff-analyze',incidentId},session.access_token);
    const text=await r.text();
    return new NextResponse(text,{status:r.status,headers:{'content-type':'application/json'}});
  }catch(error){
    console.error('staff analyze worker failed',error);
    return NextResponse.json({error:'No fue posible analizar el incidente'},{status:500});
  }
}
