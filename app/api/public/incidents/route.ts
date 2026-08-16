import { NextResponse } from 'next/server';
import { callEmergencyGateway } from '@/lib/gateway';
export const runtime='nodejs';
export async function GET(){
  try{const r=await callEmergencyGateway('public-incidents');const body=await r.text();return new NextResponse(body,{status:r.status,headers:{'content-type':'application/json','cache-control':'public, s-maxage=15, stale-while-revalidate=30'}})}
  catch{return NextResponse.json({incidents:[],error:'Mapa temporalmente no disponible'},{status:503})}
}
