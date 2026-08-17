import { NextRequest, NextResponse, after } from 'next/server';
import { callEmergencyGateway } from '@/lib/gateway';
import { triggerReportAgent } from '@/lib/agent-worker';
import { triggerStaffEmergencyBroadcast } from '@/lib/email-broadcast';
export const runtime='nodejs';
export const maxDuration=60;
export async function POST(req:NextRequest){
  try{
    const body=await req.text();
    const r=await callEmergencyGateway('reports',{method:'POST',body});
    const text=await r.text();
    if(r.ok){
      try{
        const input=JSON.parse(body),result=JSON.parse(text);
        if(!result?.idempotent&&input?.id&&input?.secret){
          after(async()=>{await Promise.allSettled([triggerReportAgent(input.id,input.secret),triggerStaffEmergencyBroadcast(input.id,input.secret)])});
        }
      }catch{}
    }
    return new NextResponse(text,{status:r.status,headers:{'content-type':'application/json'}})
  }catch{return NextResponse.json({error:'No fue posible conectar con el receptor de emergencias'},{status:503})}
}
