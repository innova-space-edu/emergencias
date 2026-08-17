'use client';
import { useEffect, useMemo, useState } from 'react';

type Channel={id?:string;channel_type:string;label?:string|null;value:string;direct_send?:boolean;verified_at?:string|null};
type Org={id:string;name:string;kind:string;commune:string;email?:string|null;phone?:string|null;website?:string|null;radio_frequency?:string|null;channels:Channel[]};

function normalizeChannels(org:Org){
  const rows=[...(org.channels||[])];
  const has=(t:string,v?:string|null)=>Boolean(v)&&rows.some(c=>c.channel_type===t&&c.value===v);
  if(org.email&&!has('email',org.email))rows.push({channel_type:'email',label:'Correo',value:org.email,direct_send:true});
  if(org.phone&&!has('phone',org.phone))rows.push({channel_type:'phone',label:'Teléfono',value:org.phone});
  if(org.website&&!has('web',org.website))rows.push({channel_type:'web',label:'Sitio web',value:org.website});
  if(org.radio_frequency&&!has('radio',org.radio_frequency))rows.push({channel_type:'radio',label:'Frecuencia radial',value:org.radio_frequency});
  return rows;
}
function actionLabel(type:string){return type==='email'?'Enviar correo':type==='phone'?'Llamar':type==='whatsapp'?'Abrir WhatsApp':type==='facebook'?'Abrir Facebook':type==='instagram'?'Abrir Instagram':type==='x'?'Abrir X':type==='web'?'Abrir sitio':type==='radio'?'Registrar aviso por radio':type==='zello'?'Abrir Zello':type==='sms'?'Registrar SMS':'Registrar contacto'}
function hrefFor(type:string,value:string){const v=value.trim();if(type==='phone')return `tel:${v.replace(/[^+\d]/g,'')}`;if(type==='whatsapp')return `https://wa.me/${v.replace(/\D/g,'')}`;if(['facebook','instagram','x','web','zello'].includes(type)&&/^https?:\/\//i.test(v))return v;return null}

export default function IncidentRouting({incidentId,onChanged}:{incidentId:string;onChanged?:()=>void}){
  const [orgs,setOrgs]=useState<Org[]>([]),[selected,setSelected]=useState(''),[scope,setScope]=useState(''),[location,setLocation]=useState(''),[state,setState]=useState(''),[loading,setLoading]=useState(true);
  async function load(){setLoading(true);try{const r=await fetch(`/api/staff/incidents/${incidentId}/routing-options`,{cache:'no-store'}),j=await r.json();if(r.ok){setOrgs(j.organizations||[]);setScope(j.scope||'');setLocation(j.locality||j.commune||'');setSelected((j.organizations||[])[0]?.id||'')}else setState(j.error||'No fue posible cargar contactos.')}catch{setState('No fue posible cargar contactos.')}finally{setLoading(false)}}
  useEffect(()=>{load()},[incidentId]);
  const org=useMemo(()=>orgs.find(o=>o.id===selected)||null,[orgs,selected]);
  const channels=useMemo(()=>org?normalizeChannels(org):[],[org]);
  async function act(ch:Channel){if(!org)return;setState(ch.channel_type==='email'?'Enviando correo…':'Registrando canal…');const href=hrefFor(ch.channel_type,ch.value);if(href)window.open(href,'_blank','noopener,noreferrer');const r=await fetch('/api/staff/notify',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({incidentId,organizationId:org.id,organizationName:org.name,channel:ch.channel_type,destination:ch.value})});const j=await r.json().catch(()=>({}));if(!r.ok){setState(j.error||'No fue posible registrar el contacto.');return}if(ch.channel_type==='email'&&j.notification?.status==='sent')setState(`Correo enviado a ${org.name}.`);else if(ch.channel_type==='email'&&j.notification?.status==='failed')setState(`El correo falló: ${j.notification?.failure_reason||'revisa Gmail'}.`);else setState(`${actionLabel(ch.channel_type)} abierto/registrado. Falta confirmación manual de recepción.`);onChanged?.()}
  return <section className="detail-section incident-routing"><div className="section-title-row"><div><h4>Canalizar / notificar</h4><small className="muted">{scope==='locality'?`Contactos con cobertura en ${location}`:`Respaldo por comuna: ${location}`}</small></div><a className="text-button" href="/operaciones/directorio">Directorio territorial</a></div>
    {loading?<p className="muted">Buscando contactos territoriales…</p>:orgs.length===0?<div className="alert warning">No hay contactos verificados con cobertura para esta ubicación. Revisa el Directorio territorial.</div>:<><label className="stack-label">Organismo / radio<select value={selected} onChange={e=>setSelected(e.target.value)}>{orgs.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select></label>{org?<div className="routing-channel-grid">{channels.length?channels.map((ch,i)=><button key={`${ch.channel_type}-${ch.value}-${i}`} type="button" className={`btn ${ch.channel_type==='email'?'btn-primary':'btn-secondary'}`} onClick={()=>act(ch)}><span>{actionLabel(ch.channel_type)}</span><small>{ch.value}</small></button>):<p className="muted">Este contacto no tiene canales verificados.</p>}</div>:null}</>}
    {state?<p className="muted tiny routing-state">{state}</p>:null}
  </section>
}
