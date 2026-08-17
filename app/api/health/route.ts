import { NextResponse } from 'next/server';
import { callEmergencyGateway } from '@/lib/gateway';

export const dynamic='force-dynamic';
export const runtime='nodejs';

export async function GET(){
  const started=Date.now();
  let gateway=false;
  let gatewayLatencyMs:number|null=null;
  let staffEmailBroadcastConfigured=false;
  try{
    const t=Date.now();
    const r=await callEmergencyGateway('public-incidents',{method:'GET',signal:AbortSignal.timeout(5000)});
    gatewayLatencyMs=Date.now()-t;
    gateway=r.ok;
  }catch{}
  const supabaseUrl=process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/,'');
  const publishable=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(supabaseUrl&&publishable){
    try{
      const r=await fetch(`${supabaseUrl}/functions/v1/emergency-email-broadcast`,{headers:{apikey:publishable},cache:'no-store',signal:AbortSignal.timeout(4000)});
      const j=await r.json().catch(()=>({}));staffEmailBroadcastConfigured=Boolean(r.ok&&j.configured);
    }catch{}
  }
  const coreConfigured=Boolean(supabaseUrl&&publishable);
  const payload={
    ok:coreConfigured&&gateway,
    service:'innova-emergency',
    timestamp:new Date().toISOString(),
    checks:{
      app:true,
      supabaseConfigured:coreConfigured,
      emergencyGateway:gateway,
      gatewayLatencyMs,
      aiConfigured:Boolean(process.env.GEMINI_API_KEY),
      mailConfigured:Boolean(process.env.RESEND_API_KEY&&(process.env.EMAIL_FROM||'contacto@innova-space-edu.cl')),
      staffEmailBroadcastConfigured,
      mailProvider:'resend',
    },
    responseMs:Date.now()-started,
  };
  return NextResponse.json(payload,{status:payload.ok?200:503,headers:{'Cache-Control':'no-store'}});
}
