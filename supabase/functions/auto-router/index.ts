import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import {createClient} from 'npm:@supabase/supabase-js@2.111.0';

const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Content-Type':'application/json; charset=utf-8'};
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:cors});
const ACTIVE=['received','reviewing','verified','critical','notified','responding'];
const categoryKinds:Record<string,string[]>={
 fire:['fire','wildfire','emergency_management','municipality','municipal_operations','government_coordination','radio'],
 traffic_accident:['police','medical','fire','transport','municipal_transport','roads','public_works','rail','emergency_management','municipality','radio'],
 medical:['medical','health_authority','emergency_management','municipality'],
 flood:['emergency_management','municipal_operations','water','public_works','roads','water_regulator','water_resources','government_coordination','municipality','fire','environment','radio'],
 landslide:['emergency_management','municipal_operations','roads','public_works','transport','government_coordination','municipality','fire','police','radio'],
 earthquake_damage:['emergency_management','municipal_operations','municipal_works','public_works','housing_urban','government_coordination','municipality','fire','medical','radio'],
 power_outage:['electricity','energy_regulator','municipal_operations','emergency_management','government_coordination','municipality','telecom_regulator','radio'],
 electrical_hazard:['electricity','energy_regulator','fire','municipal_operations','emergency_management','municipality'],
 gas_leak:['fire','energy_regulator','emergency_management','municipality','police'],
 water_outage:['water','water_regulator','water_resources','emergency_management','government_coordination','municipality','radio'],
 fallen_tree:['municipal_environment','municipal_operations','wildfire','municipality','fire','emergency_management'],
 missing_person:['police','emergency_management','government_coordination','municipality','radio'],
 maritime:['maritime','emergency_management','police','medical','government_coordination','radio'],
 security:['police','government_coordination','municipality','emergency_management'],
 pollution:['environment','municipal_environment','municipal_cleaning','water','water_regulator','maritime','municipality','emergency_management','radio'],
 other:['emergency_management','government_coordination','municipality','municipal_operations','public_works','radio'],
};

function secretKey(){const modern=Deno.env.get('SUPABASE_SECRET_KEYS');if(modern){try{return JSON.parse(modern).default as string}catch{}}return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||''}
function db(){const url=Deno.env.get('SUPABASE_URL')||'',key=secretKey();if(!url||!key)throw new Error('Supabase server credentials unavailable');return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})}
function validUuid(v:unknown){return typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)}
function validEmail(v:string){return /^\S+@\S+\.\S+$/.test(v)}
async function sha256(value:string){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return[...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('')}
async function authenticateStaff(sb:any,req:Request){const auth=req.headers.get('authorization')||'';const token=auth.toLowerCase().startsWith('bearer ')?auth.slice(7):'';if(!token)return null;const {data:{user}}=await sb.auth.getUser(token);if(!user)return null;const {data:profile}=await sb.from('profiles').select('user_id,email,role,active').eq('user_id',user.id).maybeSingle();return profile?.active?{user,profile}:null}
async function verifyReport(sb:any,reportId:string,secret:string){if(!validUuid(reportId)||secret.length<24)return null;const {data}=await sb.from('reports').select('id,incident_id,submission_secret_hash').eq('id',reportId).maybeSingle();if(!data)return null;return data.submission_secret_hash===await sha256(secret)?data:null}
async function policyFor(sb:any,region:string,commune:string){const {data:specific}=await sb.from('ai_agent_policies').select('*').eq('active',true).eq('region',region).eq('commune',commune).maybeSingle();if(specific)return specific;const {data:regional}=await sb.from('ai_agent_policies').select('*').eq('active',true).eq('region',region).is('commune',null).maybeSingle();return regional||{auto_prealert_enabled:false,allowed_channel_types:['email'],min_confidence_auto:.9,max_severity_auto:3}}

async function resendAuthority(args:{to:string;cc?:string;subject:string;text:string;idempotencyKey:string}){
 const apiKey=Deno.env.get('RESEND_API_KEY')?.trim();const from=(Deno.env.get('EMAIL_FROM')||'Innova Emergency <contacto@innova-space-edu.cl>').trim();if(!apiKey)throw new Error('RESEND_API_KEY no configurada');
 const payload:any={from,to:[args.to],subject:args.subject,text:args.text};if(args.cc&&args.cc.toLowerCase()!==args.to.toLowerCase())payload.cc=[args.cc];if(args.cc)payload.reply_to=args.cc;
 const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{authorization:`Bearer ${apiKey}`,'content-type':'application/json','Idempotency-Key':args.idempotencyKey.slice(0,256)},body:JSON.stringify(payload),signal:AbortSignal.timeout(20000)});
 const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data?.message||`Resend respondió ${r.status}`);if(!data?.id)throw new Error('Resend no devolvió ID');return String(data.id);
}

async function candidatesFor(sb:any,incident:any){
 const category=incident.ai_category||incident.category||'other';const kinds=categoryKinds[category]||categoryKinds.other;
 let q=sb.from('organizations').select('id,name,kind,region,commune,source_url,verified_at').eq('active',true).eq('region',incident.region||'Antofagasta').in('kind',kinds).limit(50);
 if(incident.commune)q=q.or(`commune.eq.${incident.commune},commune.is.null`);
 const {data:orgs,error}=await q;if(error)throw error;if(!orgs?.length)return [];
 const ids=orgs.map((o:any)=>o.id);
 const {data:channels}=await sb.from('organization_channels').select('id,organization_id,channel_type,label,value,direct_send,automation_enabled,is_primary,source_url,verified_at,notes').in('organization_id',ids).eq('active',true).order('is_primary',{ascending:false}).order('verified_at',{ascending:false});
 let localityIds:string[]=[];
 if(incident.locality&&incident.commune){const {data:locs}=await sb.from('territorial_localities').select('id').eq('active',true).eq('region',incident.region||'Antofagasta').eq('commune',incident.commune).ilike('locality',incident.locality).limit(5);localityIds=(locs||[]).map((x:any)=>x.id)}
 const priority=new Map<string,number>();
 if(localityIds.length){const {data:cov}=await sb.from('organization_coverage').select('organization_id,priority').in('organization_id',ids).in('locality_id',localityIds).eq('active',true);for(const c of cov||[])priority.set(c.organization_id,Math.min(priority.get(c.organization_id)??999,Number(c.priority||999)))}
 return orgs.map((o:any)=>({...o,kindRank:Math.max(0,kinds.indexOf(o.kind)),coveragePriority:priority.get(o.id)??100,channels:(channels||[]).filter((c:any)=>c.organization_id===o.id)})).sort((a:any,b:any)=>a.kindRank-b.kindRank||a.coveragePriority-b.coveragePriority||a.name.localeCompare(b.name,'es')).slice(0,12);
}

function channelSummary(org:any){return (org.channels||[]).map((c:any)=>({id:c.id,type:c.channel_type,label:c.label,value:c.value,automationEnabled:c.automation_enabled,isPrimary:c.is_primary,verifiedAt:c.verified_at,sourceUrl:c.source_url}));}

async function routeIncident(sb:any,incidentId:string){
 const {data:incident,error:incError}=await sb.from('incidents').select('*').eq('id',incidentId).single();if(incError||!incident)throw incError||new Error('Incidente no encontrado');
 const {data:run}=await sb.from('ai_agent_runs').select('*').eq('incident_id',incidentId).eq('status','completed').order('completed_at',{ascending:false}).limit(1).maybeSingle();if(!run)return {incidentId,skipped:true,reason:'Sin análisis IA completado'};
 const candidates=await candidatesFor(sb,incident);const primary=candidates.find((o:any)=>o.kind!=='radio')||candidates[0];
 const recommended=[...new Set([...(Array.isArray(incident.ai_recommended_organizations)?incident.ai_recommended_organizations:[]),...candidates.map((o:any)=>o.name)])].slice(0,20);await sb.from('incidents').update({ai_recommended_organizations:recommended}).eq('id',incidentId);
 const {data:existingRoutes}=await sb.from('ai_agent_actions').select('organization_id').eq('run_id',run.id).eq('action_type','routing');const routedSet=new Set((existingRoutes||[]).map((x:any)=>x.organization_id));
 const routingRows=candidates.filter((o:any)=>!routedSet.has(o.id)).map((o:any,i:number)=>({run_id:run.id,incident_id:incidentId,organization_id:o.id,action_type:'routing',status:'suggested',payload:{rank:i+1,primary:o.id===primary?.id,organization:o.name,kind:o.kind,commune:o.commune,coveragePriority:o.coveragePriority,channels:channelSummary(o)}}));if(routingRows.length)await sb.from('ai_agent_actions').insert(routingRows);
 if(!primary)return {incidentId,runId:run.id,skipped:true,reason:'Sin organización territorial compatible'};
 const policy=await policyFor(sb,incident.region||'Antofagasta',incident.commune||'Antofagasta');const confidence=Number(incident.ai_confidence??run.confidence??0);const severity=Number(incident.ai_severity??incident.severity??5);const automatic=Boolean(policy.auto_prealert_enabled&&incident.ai_decision==='auto_triage'&&!incident.ai_requires_human&&confidence>=Number(policy.min_confidence_auto||.9)&&severity<=Number(policy.max_severity_auto||3));
 const allowed=new Set<string>(Array.isArray(policy.allowed_channel_types)?policy.allowed_channel_types:['email']);const email=(primary.channels||[]).find((c:any)=>c.channel_type==='email'&&c.direct_send&&c.automation_enabled&&validEmail(String(c.value||'')));
 const {data:preExisting}=await sb.from('ai_agent_actions').select('id,status').eq('run_id',run.id).eq('organization_id',primary.id).eq('action_type','prealert').limit(1).maybeSingle();
 if(!automatic||!email||!allowed.has('email')){
  if(!preExisting)await sb.from('ai_agent_actions').insert({run_id:run.id,incident_id:incidentId,organization_id:primary.id,channel_id:email?.id||null,action_type:'prealert',status:'requires_approval',payload:{organization:primary.name,reason:!automatic?'Caso requiere revisión o política automática no aplicable':!email?'Canal automático no habilitado':'Tipo de canal no autorizado',channels:channelSummary(primary)}});
  return {incidentId,runId:run.id,primary:{id:primary.id,name:primary.name,kind:primary.kind},automatic:false,requiresApproval:true};
 }
 const {data:already}=await sb.from('incident_notifications').select('id,status,provider_message_id').eq('incident_id',incidentId).eq('organization_id',primary.id).eq('channel','email').in('status',['sent','delivered','confirmed']).order('created_at',{ascending:false}).limit(1).maybeSingle();
 if(already){if(!preExisting)await sb.from('ai_agent_actions').insert({run_id:run.id,incident_id:incidentId,organization_id:primary.id,channel_id:email.id,action_type:'prealert',status:'skipped',payload:{organization:primary.name,reason:'Ya existía un correo enviado',notificationId:already.id}});return {incidentId,runId:run.id,primary:{id:primary.id,name:primary.name,kind:primary.kind},automatic:true,alreadySent:true,notificationId:already.id};}
 const admin=(Deno.env.get('ADMIN_EMAIL')||Deno.env.get('EMAIL_SEND_TO')||'contacto@innova-space-edu.cl').trim();const site=(Deno.env.get('INNOVA_EMERGENCY_URL')||'https://emergencias-4yfs.vercel.app').replace(/\/$/,'');const subject=`[PREAVISO P${severity}] ${incident.public_code} · ${incident.title||incident.ai_category||incident.category} · ${incident.commune||'Antofagasta'}`;const gps=Number.isFinite(Number(incident.latitude))&&Number.isFinite(Number(incident.longitude))?`${Number(incident.latitude).toFixed(6)}, ${Number(incident.longitude).toFixed(6)}`:'No disponible';
 const text=`PREAVISO INFORMATIVO AUTOMÁTICO — INNOVA EMERGENCY\n\nOrganismo priorizado: ${primary.name}\nCódigo: ${incident.public_code}\nTipo: ${incident.title||incident.ai_category||incident.category}\nPrioridad IA: ${severity}/5\nConfianza IA: ${Math.round(confidence*100)}%\nComuna: ${incident.commune||'No indicada'}\nLocalidad/sector: ${incident.locality||'No indicado'}\nDirección aproximada: ${incident.address_approx||'No indicada'}\nGPS: ${gps}\nResumen: ${incident.ai_summary||incident.public_summary||'Información en revisión'}\n\nCentro de operaciones: ${site}/operaciones?incident=${incident.id}\n\nEste correo es un preaviso generado automáticamente a partir de un reporte ciudadano. No certifica la veracidad del hecho ni constituye una orden oficial de despacho. Innova Emergency complementa la comunicación y no reemplaza 131 SAMU, 132 Bomberos, 133 Carabineros ni SAE/SENAPRED.`;
 try{
  const providerId=await resendAuthority({to:email.value,cc:admin,subject,text,idempotencyKey:`ai-prealert-${incident.id}-${primary.id}`});const now=new Date().toISOString();const {data:notif,error:notifError}=await sb.from('incident_notifications').insert({incident_id:incident.id,organization_id:primary.id,organization_name:primary.name,channel:'email',destination:email.value,status:'sent',provider_message_id:providerId,sent_at:now,subject,message_text:text,cc_recipients:admin&&admin.toLowerCase()!==String(email.value).toLowerCase()?[admin]:[]}).select('id').single();if(notifError)throw notifError;
  if(preExisting)await sb.from('ai_agent_actions').update({status:'executed',channel_id:email.id,payload:{organization:primary.name,destination:email.value,notificationId:notif.id,provider:'resend',providerMessageId:providerId},executed_at:now,error:null}).eq('id',preExisting.id);else await sb.from('ai_agent_actions').insert({run_id:run.id,incident_id:incidentId,organization_id:primary.id,channel_id:email.id,action_type:'prealert',status:'executed',payload:{organization:primary.name,destination:email.value,notificationId:notif.id,provider:'resend',providerMessageId:providerId},executed_at:now});
  if(['received','reviewing','verified'].includes(incident.status))await sb.from('incidents').update({status:'notified'}).eq('id',incidentId);
  return {incidentId,runId:run.id,primary:{id:primary.id,name:primary.name,kind:primary.kind},automatic:true,sent:true,notificationId:notif.id,providerMessageId:providerId};
 }catch(error){const message=error instanceof Error?error.message:'Fallo de preaviso';const now=new Date().toISOString();await sb.from('incident_notifications').insert({incident_id:incident.id,organization_id:primary.id,organization_name:primary.name,channel:'email',destination:email.value,status:'failed',failure_reason:message,subject,message_text:text,cc_recipients:admin&&admin.toLowerCase()!==String(email.value).toLowerCase()?[admin]:[]});if(preExisting)await sb.from('ai_agent_actions').update({status:'failed',channel_id:email.id,error:message,executed_at:now}).eq('id',preExisting.id);else await sb.from('ai_agent_actions').insert({run_id:run.id,incident_id:incidentId,organization_id:primary.id,channel_id:email.id,action_type:'prealert',status:'failed',payload:{organization:primary.name,destination:email.value},error:message,executed_at:now});throw error;}
}

Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 if(req.method==='GET')return json({ok:true,resend:Boolean(Deno.env.get('RESEND_API_KEY')),policy:'territorial-primary-authority'});
 if(req.method!=='POST')return json({error:'Método no permitido'},405);
 const sb=db();
 try{
  const body=await req.json();const mode=String(body.mode||'');
  if(mode==='report'){const report=await verifyReport(sb,String(body.reportId||''),String(body.secret||''));if(!report)return json({error:'Credencial de reporte inválida'},403);return json({ok:true,...await routeIncident(sb,String(report.incident_id))});}
  const staff=await authenticateStaff(sb,req);if(!staff)return json({error:'No autorizado'},401);
  if(mode==='staff-route'){const incidentId=String(body.incidentId||'');if(!validUuid(incidentId))return json({error:'Incidente inválido'},400);return json({ok:true,...await routeIncident(sb,incidentId)});}
  if(mode==='process-pending'){const limit=Math.max(1,Math.min(10,Number(body.limit)||5));const {data}=await sb.from('incidents').select('id,public_code').in('status',ACTIVE).not('ai_processed_at','is',null).order('ai_last_agent_at',{ascending:false}).limit(limit);const results:any[]=[];for(const x of data||[]){try{results.push({publicCode:x.public_code,ok:true,...await routeIncident(sb,x.id)})}catch(e){results.push({publicCode:x.public_code,ok:false,error:e instanceof Error?e.message:'Error'})}}return json({ok:true,results});}
  return json({error:'Modo inválido'},400);
 }catch(error){console.error('auto-router',error);return json({error:error instanceof Error?error.message:'No fue posible derivar la emergencia'},500);}
});