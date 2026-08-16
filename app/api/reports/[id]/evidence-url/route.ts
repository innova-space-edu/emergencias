import { NextRequest, NextResponse } from 'next/server';
import { callEmergencyGateway } from '@/lib/gateway';
export const runtime='nodejs';
export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}){const {id}=await params;try{const r=await callEmergencyGateway(`reports/${encodeURIComponent(id)}/evidence-url`,{method:'POST',body:await req.text()});return new NextResponse(await r.text(),{status:r.status,headers:{'content-type':'application/json'}})}catch{return NextResponse.json({error:'No se pudo preparar la evidencia'},{status:503})}}
