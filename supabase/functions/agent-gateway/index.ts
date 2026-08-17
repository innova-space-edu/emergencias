import { createClient } from 'npm:@supabase/supabase-js@2.111.0';

const cors={
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods':'POST, OPTIONS',
  'Content-Type':'application/json; charset=utf-8',
};
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:cors});
const clean=(v:unknown,max=2000)=>typeof v==='string'?v.trim().slice(0,max):'';
const validUuid=(v:unknown)=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
function secretKey(){const modern=Deno.env.get('SUPABASE_SECRET_KEYS');if(modern){try{return JSON.parse(modern).default as string}catch{}}return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||''}
function db(){const url=Deno.env.get('SUPABASE_URL')||'',key=secretKey();if(!url||!key)throw new Error('Supabase server credentials unavailable');return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})}
async function sha256(value:string){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('')}
async function verifyReport(sb:any,reportId:string,secret:string){if(!validUuid(reportId)||secret.length<24)return null;const {data}=await sb.from('reports').select('id,incident_id,submission_secret_hash').eq('id',reportId).maybeSingle();if(!data)return null;return data.submission_secret_hash===await sha256(secret)?data:null}
const categoryKinds:Record<string,string[]>={
 fire:['fire','emergency_management','municipality','radio'],
 traffic_accident:['police','medical','fire','emergency_management','municipality','radio'],
 medical:['medical','emergency_management','municipality'],
 flood:['emergency_management','municipality','fire','radio'],
 landslide:['emergency_management','municipality','fire','police','radio'],
 earthquake_damage:['emergency_management','municipality','fire','medical','radio'],
 power_outage:['electricity','emergency_management','municipality','radio'],
 electrical_hazard:['electricity','fire','emergency_management','municipality'],
 gas_leak:['fire','emergency_management','municipality','police'],
 water_outage:['municipality','emergency_management','radio'],
 fallen_tree:['municipality','fire','emergency_management'],
 missing_person:['police','emergency_management','municipality','radio'],
 maritime:['emergency_management','police','medical','radio'],
 security:['police','municipality','emergency_management'],
 pollution:['municipality','emergency_management','radio'],
 other:['emergency_management','municipality']
};
function asAssessment(body:any){const a=body.assessment||{};return {category:clean(a.category,80),severity:Math.min(5,Math.max(1,Number(a.severity)||1)),summary:clean(a.summary,800),confidence:Math.min(1,Math.max(0,Number(a.confidence)||0)),recommendedOrganizations:Array.isArray(a.recommendedOrganizations)?a.recommendedOrganizations.map((x:any)=>clean(x,120)).filter(Boolean).slice(0,12):[],reason:clean(a.reason,1800),needsHumanReview:Boolean(a.needsHumanReview),inconsistencies:Array.isArray(a.inconsistencies)?a.inconsistencies.map((x:any)=>clean(x,300)).filter(Boolean).slice(0,10):[]}}
async function policyFor(sb:any,region:string,commune:string){const {data:specific}=await sb.from('ai_agent_policies').select('*').eq('active',true).eq('region',region).eq('commune',commune).maybeSingle();if(specific)return specific;const {data:regional}=await sb.from('ai_agent_policies').select('*').eq('active',true).eq('region',region).is('commune',null).maybeSingle();return regional||{auto_triage_enabled:true,min_confidence_auto:.9,max_severity_auto:3,auto_prealert_enabled:false,allowed_channel_types:['email']}}
async function routeOrganizations(sb:any,incident:any,category:string){
 const region=incident.region||'Antofagasta',commune=incident.commune||'Antofagasta',locality=incident.locality||'';
 let locIds:string[]=[];
 if(locality){const {data}=await sb.from('territorial_localities').select('id').eq('active',true).eq('region',region).eq('commune',commune).ilike('locality',locality).limit(5);locIds=(data||[]).map((x:any)=>x.id)}
 if(!locIds.length){const {data}=await sb.from('territorial_localities').select('id').eq('active',true).eq('region',region).eq('commune',commune).limit(50);locIds=(data||[]).map((x:any)=>x.id)}
 let orgIds:string[]=[];if(locIds.length){const {data}=await sb.from('organization_coverage').select('organization_id,priority').eq('active',true).in('locality_id',locIds).order('priority',{ascending:true});orgIds=[...new Set((data||[]).map((x:any)=>x.organization_id))] as string[]}
 const kinds=categoryKinds[category]||categoryKinds.other;
 let q=sb.from('organizations').select('id,name,kind,region,commune,email,phone,website,radio_frequency,active').eq('active',true).eq('region',region).in('kind',kinds).limit(60);if(orgIds.length)q=q.in('id',orgIds);else q=q.or(`commune.eq.${commune},kind.eq.emergency_management`);
 const {data:orgs}=await q;const ordered=(orgs||[]).sort((a:any,b:any)=>kinds.indexOf(a.kind)-kinds.indexOf(b.kind)).slice(0,15);
 const ids=ordered.map((o:any)=>o.id);let channels:any[]=[];if(ids.length){const {data}=await sb.from('organization_channels').select('*').eq('active',true).in('organization_id',ids).order('is_primary',{ascending:false});channels=data||[]}
 return ordered.map((o:any)=>({...o,channels:channels.filter((c:any)=>c.organization_id===o.id)}));
}
async function assess(sb:any,body:any){
 const reportId=clean(body.reportId,60),secret=clean(body.secret,200),report=await verifyReport(sb,reportId,secret);if(!report)return json({error:'Credencial de reporte inválida'},403);
 const assessment=asAssessment(body);if(!assessment.category||!assessment.summary)return json({error:'Evaluación IA incompleta'},400);
 const {data:incident}=await sb.from('incidents').select('*').eq('id',report.incident_id).single();if(!incident)return json({error:'Incidente no encontrado'},404);
 const policy=await policyFor(sb,incident.region||'Antofagasta',incident.commune||'Antofagasta');
 const danger=Boolean(body.dangerFire||body.dangerInjured||body.dangerTrapped||body.dangerElectric);
 const categoryConflict=incident.category!=='other'&&assessment.category!==incident.category;
 const requiresHuman=Boolean(assessment.needsHumanReview||assessment.inconsistencies.length||categoryConflict||danger||assessment.severity>=4||assessment.confidence<Number(policy.min_confidence_auto||.9));
 const decision=assessment.severity>=4||danger?'urgent_human_review':requiresHuman?'human_review':'auto_triage';
 const routed=await routeOrganizations(sb,incident,assessment.category);
 const recommendedNames=[...new Set([...assessment.recommendedOrganizations,...routed.map((o:any)=>o.name)])].slice(0,15);
 const safeSeverity=Math.max(Number(incident.severity||1),assessment.severity);
 const patch:any={ai_category:assessment.category,ai_severity:assessment.severity,ai_summary:assessment.summary,ai_confidence:assessment.confidence,ai_reason:assessment.reason,ai_recommended_organizations:recommendedNames,ai_decision:decision,ai_requires_human:requiresHuman,ai_processed_at:new Date().toISOString(),ai_last_agent_at:new Date().toISOString()};
 if(decision==='auto_triage'&&policy.auto_triage_enabled){patch.severity=safeSeverity;if(incident.category==='other'||assessment.confidence>=.96)patch.category=assessment.category;if(incident.status==='received')patch.status='reviewing'}
 if(decision==='urgent_human_review'&&!['notified','responding','resolved','discarded'].includes(incident.status)){patch.status='critical';patch.severity=Math.max(4,safeSeverity)}
 await sb.from('incidents').update(patch).eq('id',incident.id);
 const {data:run,error:runError}=await sb.from('ai_agent_runs').insert({incident_id:incident.id,report_id:reportId,model:clean(body.model,100)||null,status:'completed',decision,suggested_category:assessment.category,suggested_severity:assessment.severity,confidence:assessment.confidence,requires_human:requiresHuman,reason:assessment.reason,recommended_organizations:recommendedNames,completed_at:new Date().toISOString()}).select('*').single();if(runError)throw runError;
 const actions:any[]=[{run_id:run.id,incident_id:incident.id,action_type:'classification',status:'executed',payload:{declaredCategory:incident.category,suggestedCategory:assessment.category,severity:assessment.severity,confidence:assessment.confidence,inconsistencies:assessment.inconsistencies}}];
 if(requiresHuman)actions.push({run_id:run.id,incident_id:incident.id,action_type:'human_review',status:'requires_approval',payload:{priority:decision==='urgent_human_review'?'urgent':'normal',reason:assessment.reason}});
 for(const org of routed.slice(0,10))actions.push({run_id:run.id,incident_id:incident.id,organization_id:org.id,action_type:'routing',status:'suggested',payload:{organization:org.name,kind:org.kind,commune:org.commune}});
 const allowed=Array.isArray(policy.allowed_channel_types)?policy.allowed_channel_types:['email'];const autoPrealerts:any[]=[];
 for(const org of routed){for(const ch of org.channels||[]){if(!ch.automation_enabled||!ch.direct_send||!allowed.includes(ch.channel_type))continue;const auto=Boolean(policy.auto_prealert_enabled&&decision==='auto_triage');const action={run_id:run.id,incident_id:incident.id,organization_id:org.id,channel_id:ch.id,action_type:'prealert',status:auto?'queued':'requires_approval',payload:{organization:org.name,channel:ch.channel_type,destination:ch.value,publicCode:incident.public_code,category:assessment.category,severity:safeSeverity,summary:assessment.summary,commune:incident.commune,locality:incident.locality,addressApprox:incident.address_approx,latitude:incident.latitude,longitude:incident.longitude}};actions.push(action);if(auto)autoPrealerts.push({...action.payload,organizationId:org.id,channelId:ch.id})}}
 if(actions.length)await sb.from('ai_agent_actions').insert(actions);
 const {data:queued}=await sb.from('ai_agent_actions').select('id,organization_id,channel_id,payload').eq('run_id',run.id).eq('action_type','prealert').eq('status','queued');
 return json({ok:true,runId:run.id,incidentId:incident.id,publicCode:incident.public_code,decision,requiresHuman,recommendedOrganizations:recommendedNames,autoPrealerts:(queued||[]).map((x:any)=>({...x.payload,actionId:x.id,organizationId:x.organization_id,channelId:x.channel_id}))});
}
async function recordPrealert(sb:any,body:any){const reportId=clean(body.reportId,60),secret=clean(body.secret,200),report=await verifyReport(sb,reportId,secret);if(!report)return json({error:'Credencial de reporte inválida'},403);const actionId=clean(body.actionId,60);if(!validUuid(actionId))return json({error:'Acción inválida'},400);const {data:action}=await sb.from('ai_agent_actions').select('*').eq('id',actionId).eq('incident_id',report.incident_id).eq('action_type','prealert').single();if(!action)return json({error:'Acción no encontrada'},404);const success=Boolean(body.success),status=success?'executed':'failed',now=new Date().toISOString();await sb.from('ai_agent_actions').update({status,executed_at:success?now:null,error:success?null:clean(body.error,600)}).eq('id',actionId);const p=action.payload||{};await sb.from('incident_notifications').insert({incident_id:report.incident_id,organization_id:action.organization_id||null,organization_name:clean(p.organization,160)||'Contacto territorial',channel:clean(p.channel,30)||'email',destination:clean(p.destination,240)||null,status:success?'sent':'failed',sent_at:success?now:null,failure_reason:success?null:clean(body.error,600),created_by:null});if(success){const {data:i}=await sb.from('incidents').select('status').eq('id',report.incident_id).single();if(i&&!['responding','resolved','discarded'].includes(i.status))await sb.from('incidents').update({status:'notified'}).eq('id',report.incident_id)}return json({ok:true,status})}

Deno.serve(async(req:Request)=>{if(req.method==='OPTIONS')return new Response('ok',{headers:cors});if(req.method!=='POST')return json({error:'Método no permitido'},405);try{const sb=db(),url=new URL(req.url),parts=url.pathname.split('/').filter(Boolean),idx=parts.indexOf('agent-gateway'),route=idx>=0?parts.slice(idx+1):[];const body=await req.json();if(route[0]==='assess')return await assess(sb,body);if(route[0]==='record-prealert')return await recordPrealert(sb,body);return json({error:'Ruta no encontrada'},404)}catch(error){console.error(error);return json({error:'Error interno del agente'},500)}});
