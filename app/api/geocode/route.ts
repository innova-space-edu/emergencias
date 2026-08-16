import { NextRequest, NextResponse } from 'next/server';
export const runtime='nodejs';
let lastRequestAt=0;
const cache=new Map<string,{at:number;data:any}>();
export async function GET(req:NextRequest){
  const q=(req.nextUrl.searchParams.get('q')||'').trim().slice(0,180);
  if(q.length<3)return NextResponse.json({results:[]});
  const key=q.toLocaleLowerCase('es-CL');const hit=cache.get(key);if(hit&&Date.now()-hit.at<24*3600_000)return NextResponse.json(hit.data);
  const wait=Math.max(0,1050-(Date.now()-lastRequestAt));if(wait)await new Promise(r=>setTimeout(r,wait));lastRequestAt=Date.now();
  try{
    const u=new URL('https://nominatim.openstreetmap.org/search');u.searchParams.set('q',q);u.searchParams.set('format','jsonv2');u.searchParams.set('limit','5');u.searchParams.set('countrycodes','cl');u.searchParams.set('addressdetails','1');
    const r=await fetch(u,{headers:{'User-Agent':'InnovaEmergencias/1.0 (contacto@innova-space-edu.cl)','Accept-Language':'es-CL,es;q=0.9'},cache:'no-store'});if(!r.ok)throw new Error('geocoder');
    const rows=await r.json();const data={results:(rows||[]).map((x:any)=>({lat:x.lat,lon:x.lon,displayName:x.display_name,address:x.address}))};cache.set(key,{at:Date.now(),data});return NextResponse.json(data);
  }catch{return NextResponse.json({results:[],error:'Buscador temporalmente no disponible'},{status:503})}
}
