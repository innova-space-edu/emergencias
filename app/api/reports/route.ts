import { NextRequest, NextResponse } from 'next/server';
import { callEmergencyGateway } from '@/lib/gateway';

export const runtime='nodejs';
export const maxDuration=60;

export async function POST(req:NextRequest){
  try{
    const body=await req.text();
    const r=await callEmergencyGateway('reports',{method:'POST',body});
    const text=await r.text();
    return new NextResponse(text,{status:r.status,headers:{'content-type':'application/json'}})
  }catch{
    return NextResponse.json({error:'No fue posible conectar con el receptor de emergencias'},{status:503})
  }
}
