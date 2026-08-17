import { NextRequest, NextResponse } from 'next/server';

export const runtime='nodejs';

let lastRequestAt=0;
const searchCache=new Map<string,{at:number;data:any}>();
const reverseCache=new Map<string,{at:number;data:any}>();

async function throttleNominatim(){
  const wait=Math.max(0,1100-(Date.now()-lastRequestAt));
  if(wait)await new Promise(r=>setTimeout(r,wait));
  lastRequestAt=Date.now();
}

function cleanRegion(value:string){
  return value.replace(/^regi[oó]n\s+(de\s+|del\s+)?/i,'').trim()||value;
}

function reverseResult(row:any){
  const a=row?.address||{};
  const road=a.road||a.pedestrian||a.residential||a.footway||a.path||a.cycleway||'';
  const number=a.house_number||'';
  const fallback=String(row?.display_name||'').split(',').slice(0,2).join(', ').trim();
  const addressApprox=[road,number].filter(Boolean).join(' ').trim()||a.amenity||a.building||fallback||null;
  const commune=a.city||a.town||a.municipality||a.county||a.village||null;
  const locality=a.suburb||a.neighbourhood||a.quarter||a.city_district||a.hamlet||a.village||null;
  const region=cleanRegion(a.state||a.region||'Antofagasta');
  return {
    lat:Number(row?.lat),
    lon:Number(row?.lon),
    displayName:row?.display_name||null,
    addressApprox,
    locality:locality&&locality!==commune?locality:null,
    commune,
    region,
    postcode:a.postcode||null,
    countryCode:a.country_code||null,
    source:'OpenStreetMap / Nominatim',
    approximate:true,
  };
}

export async function GET(req:NextRequest){
  const latRaw=req.nextUrl.searchParams.get('lat');
  const lonRaw=req.nextUrl.searchParams.get('lon');

  if(latRaw!==null&&lonRaw!==null){
    const lat=Number(latRaw),lon=Number(lonRaw);
    if(!Number.isFinite(lat)||!Number.isFinite(lon)||lat<-90||lat>90||lon<-180||lon>180){
      return NextResponse.json({error:'Coordenadas inválidas'},{status:400});
    }
    const key=`${lat.toFixed(5)},${lon.toFixed(5)}`;
    const hit=reverseCache.get(key);
    if(hit&&Date.now()-hit.at<30*24*3600_000)return NextResponse.json(hit.data);
    await throttleNominatim();
    try{
      const u=new URL('https://nominatim.openstreetmap.org/reverse');
      u.searchParams.set('lat',String(lat));u.searchParams.set('lon',String(lon));u.searchParams.set('format','jsonv2');u.searchParams.set('zoom','18');u.searchParams.set('addressdetails','1');u.searchParams.set('accept-language','es-CL,es');
      const r=await fetch(u,{headers:{'User-Agent':'InnovaEmergency/1.0 (contacto@innova-space-edu.cl)','Accept-Language':'es-CL,es;q=0.9'},cache:'no-store'});
      if(!r.ok)throw new Error('reverse-geocoder');
      const row=await r.json();
      const data={result:reverseResult(row)};
      reverseCache.set(key,{at:Date.now(),data});
      return NextResponse.json(data);
    }catch{
      return NextResponse.json({result:null,error:'No fue posible obtener una dirección aproximada para este punto'},{status:503});
    }
  }

  const q=(req.nextUrl.searchParams.get('q')||'').trim().slice(0,180);
  if(q.length<3)return NextResponse.json({results:[]});
  const key=q.toLocaleLowerCase('es-CL');
  const hit=searchCache.get(key);
  if(hit&&Date.now()-hit.at<24*3600_000)return NextResponse.json(hit.data);
  await throttleNominatim();
  try{
    const u=new URL('https://nominatim.openstreetmap.org/search');
    u.searchParams.set('q',q);u.searchParams.set('format','jsonv2');u.searchParams.set('limit','5');u.searchParams.set('countrycodes','cl');u.searchParams.set('addressdetails','1');
    const r=await fetch(u,{headers:{'User-Agent':'InnovaEmergency/1.0 (contacto@innova-space-edu.cl)','Accept-Language':'es-CL,es;q=0.9'},cache:'no-store'});
    if(!r.ok)throw new Error('geocoder');
    const rows=await r.json();
    const data={results:(rows||[]).map((x:any)=>({lat:x.lat,lon:x.lon,displayName:x.display_name,address:x.address}))};
    searchCache.set(key,{at:Date.now(),data});
    return NextResponse.json(data);
  }catch{
    return NextResponse.json({results:[],error:'Buscador temporalmente no disponible'},{status:503});
  }
}
