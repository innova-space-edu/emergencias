import { NextResponse } from 'next/server';
import { callEmergencyGateway } from '@/lib/gateway';
export const runtime='nodejs';

export async function GET(){
  try{
    const r=await callEmergencyGateway('public-incidents');
    const payload=await r.json().catch(()=>({incidents:[]}));
    if(!r.ok) return NextResponse.json(payload,{status:r.status});
    const cutoff=Date.now()-24*60*60*1000;
    const incidents=Array.isArray(payload.incidents)
      ? payload.incidents.filter((i:any)=>i?.status!=='discarded' && new Date(i.last_reported_at||0).getTime()>=cutoff)
      : [];
    return NextResponse.json({incidents,windowHours:24},{headers:{'cache-control':'public, s-maxage=15, stale-while-revalidate=30'}});
  }catch{
    return NextResponse.json({incidents:[],error:'Mapa temporalmente no disponible'},{status:503});
  }
}
