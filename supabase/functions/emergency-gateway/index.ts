import { createClient } from 'npm:@supabase/supabase-js@2.111.0';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8',
};

const categories = new Set([
  'fire','traffic_accident','medical','flood','landslide','earthquake_damage','power_outage',
  'electrical_hazard','gas_leak','water_outage','fallen_tree','missing_person','maritime','security','pollution','other'
]);

const labels: Record<string,string> = {
  fire:'Incendio', traffic_accident:'Accidente vehicular', medical:'Emergencia médica', flood:'Inundación / anegamiento',
  landslide:'Aluvión / derrumbe', earthquake_damage:'Daños por sismo', power_outage:'Corte de energía', electrical_hazard:'Riesgo eléctrico',
  gas_leak:'Fuga de gas', water_outage:'Corte de agua', fallen_tree:'Árbol / poste caído', missing_person:'Persona desaparecida',
  maritime:'Emergencia marítima', security:'Riesgo de seguridad', pollution:'Contaminación', other:'Otra emergencia'
};

function json(data: unknown, status=200) { return new Response(JSON.stringify(data), { status, headers: cors }); }
function cleanText(v: unknown, max=1500) { return typeof v === 'string' ? v.trim().slice(0,max) : ''; }
function validUuid(v: unknown) { return typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v); }
function number(v: unknown) { const n=Number(v); return Number.isFinite(n) ? n : NaN; }
function secretKey() {
  const modern=Deno.env.get('SUPABASE_SECRET_KEYS');
  if (modern) { try { return JSON.parse(modern).default as string; } catch {} }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
}
function adminClient() {
  const url=Deno.env.get('SUPABASE_URL') || '';
  const key=secretKey();
  if (!url || !key) throw new Error('Supabase server credentials unavailable');
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
async function sha256(value:string) {
  const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
function ipOf(req:Request){return (req.headers.get('cf-connecting-ip')||req.headers.get('x-forwarded-for')||'unknown').split(',')[0].trim().slice(0,80)}
function severityFor(body:any){
  if (body.dangerTrapped) return 5;
  if (body.dangerInjured && (body.dangerFire || body.dangerElectric)) return 5;
  if (body.dangerFire || body.dangerElectric || body.category==='gas_leak' || body.category==='landslide') return 4;
  if (body.dangerInjured || body.category==='medical' || body.category==='flood') return 4;
  if (body.category==='traffic_accident' || body.roadBlocked) return 3;
  if (body.category==='power_outage' || body.category==='water_outage') return 2;
  return 2;
}
function haversine(lat1:number, lon1:number, lat2:number, lon2:number){
  const R=6371000, dLat=(lat2-lat1)*Math.PI/180, dLon=(lon2-lon1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(a));
}
async function rateLimit(sb:any, req:Request, scope:string, max:number, minutes:number){
  const fp=await sha256(`${scope}:${ipOf(req)}`), since=new Date(Date.now()-minutes*60000).toISOString();
  const {count}=await sb.from('rate_limit_events').select('id',{head:true,count:'exact'}).eq('scope',scope).eq('fingerprint_hash',fp).gte('created_at',since);
  if ((count||0)>=max) return false;
  await sb.from('rate_limit_events').insert({scope,fingerprint_hash:fp});
  return true;
}
function publicSummary(category:string, locality:string, commune:string){
  const where=locality||commune||'ubicación registrada';
  return `Reporte ciudadano de ${labels[category] || 'emergencia'} en ${where}. Información en revisión.`;
}

async function getPublicIncidents(sb:any){
  const {data,error}=await sb.from('incidents')
    .select('id,public_code,category,title,public_summary,severity,status,latitude,longitude,region,commune,locality,address_approx,reports_count,first_reported_at,last_reported_at,resolved_at,incident_notifications(organization_name,channel,status,sent_at,delivered_at,confirmed_at)')
    .neq('status','discarded').order('last_reported_at',{ascending:false}).limit(1500);
  if(error) throw error;
  return (data||[]).map((row:any)=>({
    id:row.id, public_code:row.public_code, category:row.category, title:row.title, public_summary:row.public_summary,
    severity:row.severity, status:row.status, latitude:row.latitude, longitude:row.longitude, region:row.region,
    commune:row.commune, locality:row.locality, address_approx:row.address_approx, reports_count:row.reports_count,
    first_reported_at:row.first_reported_at, last_reported_at:row.last_reported_at, resolved_at:row.resolved_at,
    notifications:(row.incident_notifications||[]).map((n:any)=>({organization:n.organization_name,channel:n.channel,status:n.status,sent_at:n.sent_at,delivered_at:n.delivered_at,confirmed_at:n.confirmed_at}))
  }));
}

async function createReport(sb:any, req:Request, body:any){
  if (!(await rateLimit(sb,req,'report',30,60))) return json({error:'Demasiados reportes desde esta conexión. Intenta más tarde.'},429);
  if(!validUuid(body.id) || typeof body.secret!=='string' || body.secret.length<24) return json({error:'Identificador de reporte inválido'},400);
  if(!categories.has(body.category)) return json({error:'Categoría inválida'},400);
  const lat=number(body.latitude), lng=number(body.longitude);
  if(!Number.isFinite(lat)||!Number.isFinite(lng)||lat < -90||lat>90||lng < -180||lng>180) return json({error:'Ubicación inválida'},400);
  const secretHash=await sha256(body.secret);
  const {data:existing}=await sb.from('reports').select('id,incident_id,submission_secret_hash').eq('id',body.id).maybeSingle();
  if(existing){
    if(existing.submission_secret_hash!==secretHash) return json({error:'El reporte ya existe con otra credencial'},409);
    const {data:incident}=await sb.from('incidents').select('public_code').eq('id',existing.incident_id).maybeSingle();
    return json({ok:true,id:body.id,incidentId:existing.incident_id,publicCode:incident?.public_code,idempotent:true});
  }
  const now=new Date().toISOString(), cutoff=new Date(Date.now()-30*60000).toISOString();
  const severity=severityFor(body), commune=cleanText(body.commune,120)||'Antofagasta', locality=cleanText(body.locality,160);
  const bboxLat=0.003, bboxLng=0.0035;
  const {data:candidates}=await sb.from('incidents').select('id,latitude,longitude,reports_count,severity,status')
    .eq('category',body.category).in('status',['received','reviewing','verified','critical','notified','responding'])
    .gte('last_reported_at',cutoff).gte('latitude',lat-bboxLat).lte('latitude',lat+bboxLat).gte('longitude',lng-bboxLng).lte('longitude',lng+bboxLng).limit(30);
  let incident=(candidates||[]).find((x:any)=>haversine(lat,lng,Number(x.latitude),Number(x.longitude))<=150) || null;
  if(!incident){
    const {data:newIncident,error}=await sb.from('incidents').insert({
      category:body.category, title:labels[body.category]||'Emergencia', public_summary:publicSummary(body.category,locality,commune),
      description_private:cleanText(body.description), severity, status:'received', location:`POINT(${lng} ${lat})`,
      region:cleanText(body.region,120)||'Antofagasta', commune, locality:locality||null, address_approx:cleanText(body.addressApprox,240)||null,
      reports_count:1, first_reported_at:now, last_reported_at:now
    }).select('id,public_code').single();
    if(error) throw error;
    incident=newIncident;
  }else{
    await sb.from('incidents').update({reports_count:Number(incident.reports_count||1)+1,last_reported_at:now,severity:Math.max(Number(incident.severity||1),severity)}).eq('id',incident.id);
  }
  const {error:reportError}=await sb.from('reports').insert({
    id:body.id,incident_id:incident.id,submission_secret_hash:secretHash,category:body.category,description:cleanText(body.description),location:`POINT(${lng} ${lat})`,
    region:cleanText(body.region,120)||'Antofagasta',commune,locality:locality||null,address_approx:cleanText(body.addressApprox,240)||null,
    occurred_at:body.occurredAt||null,captured_at:body.capturedAt||now,sync_attempts:Math.max(0,Number(body.syncAttempts||0)),client_created_offline:Boolean(body.createdOffline),
    danger_fire:Boolean(body.dangerFire),danger_injured:Boolean(body.dangerInjured),danger_trapped:Boolean(body.dangerTrapped),danger_electric:Boolean(body.dangerElectric),road_blocked:Boolean(body.roadBlocked),
    reporter_session_hash:await sha256(`${ipOf(req)}:${body.id}`)
  });
  if(reportError) throw reportError;
  return json({ok:true,id:body.id,incidentId:incident.id,publicCode:incident.public_code});
}

async function verifyReportSecret(sb:any, id:string, secret:string){
  if(!validUuid(id)||typeof secret!=='string'||secret.length<24) return null;
  const {data}=await sb.from('reports').select('id,incident_id,submission_secret_hash').eq('id',id).maybeSingle();
  if(!data) return null;
  return data.submission_secret_hash===await sha256(secret) ? data : null;
}
function safeFileName(name:string){return name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/-+/g,'-').slice(-100)||'evidence.bin'}
async function createEvidenceUrl(sb:any, req:Request, id:string, body:any){
  if(!(await rateLimit(sb,req,'evidence_url',80,60))) return json({error:'Demasiadas cargas preparadas'},429);
  const report=await verifyReportSecret(sb,id,body.secret); if(!report) return json({error:'Credencial de reporte inválida'},403);
  const mediaType=body.mediaType==='video'?'video':body.mediaType==='image'?'image':''; if(!mediaType)return json({error:'Tipo de evidencia inválido'},400);
  const mime=cleanText(body.mimeType,100), bytes=Number(body.bytes||0), duration=Number(body.durationSeconds||0);
  if(mediaType==='image' && (!mime.startsWith('image/')||bytes<=0||bytes>10*1024*1024)) return json({error:'Imagen inválida o demasiado grande'},400);
  if(mediaType==='video' && (!mime.startsWith('video/')||bytes<=0||bytes>35*1024*1024||duration>31)) return json({error:'Video inválido, demasiado grande o mayor a 30 segundos'},400);
  const path=`${id}/${crypto.randomUUID()}-${safeFileName(cleanText(body.fileName,140))}`;
  const {data,error}=await sb.storage.from('emergency-evidence').createSignedUploadUrl(path,{upsert:false});
  if(error) throw error;
  return json({ok:true,path,token:data.token,signedUrl:data.signedUrl});
}
async function confirmEvidence(sb:any, id:string, body:any){
  const report=await verifyReportSecret(sb,id,body.secret); if(!report) return json({error:'Credencial de reporte inválida'},403);
  const path=cleanText(body.storagePath,300); if(!path.startsWith(`${id}/`))return json({error:'Ruta de evidencia inválida'},400);
  const folder=id, file=path.slice(id.length+1);
  const {data:list,error:listError}=await sb.storage.from('emergency-evidence').list(folder,{limit:100,search:file});
  if(listError) throw listError;
  if(!(list||[]).some((x:any)=>x.name===file)) return json({error:'La evidencia aún no existe en Storage'},409);
  const {data:existing}=await sb.from('evidence').select('id').eq('storage_path',path).maybeSingle();
  if(existing) return json({ok:true,id:existing.id,idempotent:true});
  const {data,error}=await sb.from('evidence').insert({report_id:id,incident_id:report.incident_id,storage_path:path,media_type:body.mediaType,mime_type:cleanText(body.mimeType,100),bytes:Number(body.bytes||0),duration_seconds:Number(body.durationSeconds||0)||null,status:'uploaded'}).select('id').single();
  if(error) throw error;
  return json({ok:true,id:data.id});
}
async function accessRequest(sb:any, req:Request, body:any){
  if(!(await rateLimit(sb,req,'access_request',8,60)))return json({error:'Demasiadas solicitudes'},429);
  const email=cleanText(body.email,180).toLowerCase(), fullName=cleanText(body.fullName,120), organization=cleanText(body.organization,160);
  if(!fullName||!organization||!/^\S+@\S+\.\S+$/.test(email))return json({error:'Datos incompletos'},400);
  const role=body.requestedRole==='operator'?'operator':'authority';
  const {data,error}=await sb.from('access_requests').insert({full_name:fullName,email,organization,position:cleanText(body.position,120)||null,requested_role:role,message:cleanText(body.message,1500)||null}).select('id').single();
  if(error) throw error;
  return json({ok:true,id:data.id});
}

Deno.serve(async (req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
  try{
    const sb=adminClient(), url=new URL(req.url), parts=url.pathname.split('/').filter(Boolean);
    const baseIndex=parts.indexOf('emergency-gateway'), route=baseIndex>=0?parts.slice(baseIndex+1):[];
    if(req.method==='GET' && route[0]==='public-incidents') return json({incidents:await getPublicIncidents(sb)});
    if(req.method==='POST' && route[0]==='reports' && route.length===1) return createReport(sb,req,await req.json());
    if(req.method==='POST' && route[0]==='reports' && route[2]==='evidence-url') return createEvidenceUrl(sb,req,route[1],await req.json());
    if(req.method==='POST' && route[0]==='reports' && route[2]==='evidence-confirm') return confirmEvidence(sb,route[1],await req.json());
    if(req.method==='POST' && route[0]==='access-request') return accessRequest(sb,req,await req.json());
    return json({error:'Ruta no encontrada'},404);
  }catch(error){console.error(error);return json({error:'Error interno de la plataforma'},500)}
});
