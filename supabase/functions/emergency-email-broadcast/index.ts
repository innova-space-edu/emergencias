import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.111.0';

function json(data:unknown,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8'}})}
function secretKey(){const modern=Deno.env.get('SUPABASE_SECRET_KEYS');if(modern){try{return JSON.parse(modern).default as string}catch{}}return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||''}
function adminClient(){const url=Deno.env.get('SUPABASE_URL')||'',key=secretKey();if(!url||!key)throw new Error('Supabase server credentials unavailable');return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})}
async function sha256(value:string){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return[...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('')}
function validUuid(v:unknown){return typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)}
function validEmail(v:string){return /^\S+@\S+\.\S+$/.test(v)}
function chunks<T>(arr:T[],size:number){const out:T[][]=[];for(let i=0;i<arr.length;i+=size)out.push(arr.slice(i,i+size));return out}

async function resend(args:{to:string[];bcc?:string[];subject:string;text:string;idempotencyKey:string}){
  const apiKey=Deno.env.get('RESEND_API_KEY')?.trim();
  const from=(Deno.env.get('EMAIL_FROM')||'Innova Emergency <contacto@innova-space-edu.cl>').trim();
  if(!apiKey)throw new Error('RESEND_API_KEY no está configurada en Supabase Edge Function Secrets');
  const payload:any={from,to:args.to,subject:args.subject,text:args.text};if(args.bcc?.length)payload.bcc=args.bcc;
  const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{authorization:`Bearer ${apiKey}`,'content-type':'application/json','Idempotency-Key':args.idempotencyKey.slice(0,256)},body:JSON.stringify(payload)});
  const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data?.message||`Resend respondió ${r.status}`);if(!data?.id)throw new Error('Resend no devolvió ID');return String(data.id);
}

async function notifyStaff(sb:any,reportId:string,secret:string){
  const {data:report}=await sb.from('reports').select('id,incident_id,submission_secret_hash').eq('id',reportId).maybeSingle();
  if(!report||report.submission_secret_hash!==await sha256(secret))throw new Error('Credencial de reporte inválida');
  const {data:already}=await sb.from('email_delivery_log').select('id').eq('incident_id',report.incident_id).eq('kind','staff_new_incident').eq('status','sent').limit(1);
  if(already?.length)return {alreadyNotified:true,sent:0};
  const {data:incident,error:incError}=await sb.from('incidents').select('id,public_code,title,category,severity,status,region,commune,locality,address_approx,public_summary,last_reported_at').eq('id',report.incident_id).single();if(incError||!incident)throw incError||new Error('Incidente no encontrado');
  const {data:profiles,error:profError}=await sb.from('profiles').select('email,role,active,email_notifications_enabled').eq('active',true).eq('email_notifications_enabled',true);if(profError)throw profError;
  const admin=(Deno.env.get('ADMIN_EMAIL')||Deno.env.get('EMAIL_SEND_TO')||'contacto@innova-space-edu.cl').trim().toLowerCase();
  const staff=[...new Set((profiles||[]).map((p:any)=>String(p.email||'').trim().toLowerCase()).filter(validEmail))];
  const others=staff.filter((e:string)=>e!==admin);
  const site=(Deno.env.get('INNOVA_EMERGENCY_URL')||'https://emergencias-4yfs.vercel.app').replace(/\/$/,'');
  const subject=`[P${incident.severity}] Nueva emergencia ${incident.public_code} — ${incident.commune||'Antofagasta'}`;
  const text=`Se registró una nueva emergencia ciudadana en Innova Emergency.\n\nCódigo: ${incident.public_code}\nTipo: ${incident.title||incident.category}\nPrioridad inicial: ${incident.severity}/5\nEstado: ${incident.status}\nComuna: ${incident.commune||'No indicada'}\nLocalidad/sector: ${incident.locality||'No indicado'}\nReferencia: ${incident.address_approx||'Ubicación registrada'}\nResumen: ${incident.public_summary||'Información en revisión'}\n\nCentro de operaciones: ${site}/operaciones?incident=${incident.id}\n\nLa información proviene de un reporte ciudadano y debe ser verificada. Innova Emergency complementa la comunicación; no reemplaza 131, 132, 133 ni SAE/SENAPRED.`;
  const batches=chunks(others,45);if(!batches.length)batches.push([]);
  let sentCount=0;
  for(let i=0;i<batches.length;i++){
    const batch=batches[i];let to:string[],bcc:string[]|undefined,recipients:string[];
    if(i===0){to=[admin];bcc=batch;recipients=[admin,...batch]}
    else{to=[batch[0]];bcc=batch.slice(1);recipients=batch}
    try{
      const providerId=await resend({to,bcc,subject,text,idempotencyKey:`staff-alert-${incident.id}-${i}`});sentCount+=recipients.length;
      await sb.from('email_delivery_log').insert(recipients.map(email=>({incident_id:incident.id,kind:'staff_new_incident',recipient:email,provider:'resend',provider_message_id:providerId,status:'sent'})));
    }catch(error){const message=error instanceof Error?error.message:'Fallo de Resend';await sb.from('email_delivery_log').insert(recipients.map(email=>({incident_id:incident.id,kind:'staff_new_incident',recipient:email,provider:'resend',status:'failed',error:message})));throw error}
  }
  return {alreadyNotified:false,sent:sentCount};
}

Deno.serve(async(req:Request)=>{
  if(req.method!=='POST')return json({error:'Método no permitido'},405);
  try{
    const body=await req.json(),reportId=String(body.reportId||''),secret=String(body.secret||'');
    if(!validUuid(reportId)||secret.length<24)return json({error:'Datos inválidos'},400);
    const sb=adminClient();
    EdgeRuntime.waitUntil(notifyStaff(sb,reportId,secret).catch(error=>console.error('staff emergency email broadcast',error)));
    return json({ok:true,queued:true},202);
  }catch(error){console.error(error);return json({error:'No fue posible iniciar la notificación'},500)}
});
