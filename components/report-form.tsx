'use client';
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { EMERGENCY_CATEGORIES } from '@/lib/constants';
import { randomSecret } from '@/lib/crypto';
import { getOfflineReports, saveOfflineReport } from '@/lib/offline-db';
import { requestBackgroundSync, syncOneReport } from '@/lib/sync-queue';
import type { EvidenceDraft, OfflineReport } from '@/lib/types';
import LocationPicker from '@/components/location-picker';

type Coordinates={lat:number;lng:number;accuracy?:number};
type ReverseResult={addressApprox?:string|null;locality?:string|null;commune?:string|null;region?:string|null;displayName?:string|null;source?:string|null;approximate?:boolean};

export default function ReportForm(){
 const [coords,setCoords]=useState<Coordinates|null>(null);const [locating,setLocating]=useState(false);const [files,setFiles]=useState<EvidenceDraft[]>([]);const [status,setStatus]=useState<string>('');const [savedCode,setSavedCode]=useState('');const [pending,setPending]=useState<OfflineReport[]>([]);const [sending,setSending]=useState(false);const fileRef=useRef<HTMLInputElement|null>(null);
 const [region,setRegion]=useState('Antofagasta'),[commune,setCommune]=useState('Antofagasta'),[locality,setLocality]=useState(''),[addressApprox,setAddressApprox]=useState(''),[locationInfo,setLocationInfo]=useState('');
 const touched=useRef({region:false,commune:false,locality:false,addressApprox:false});
 const redirectTimer=useRef<number|null>(null),awaitingConfirmation=useRef(false);
 const totalBytes=useMemo(()=>files.reduce((a,b)=>a+b.size,0),[files]);

 function locate(){if(!navigator.geolocation){setStatus('Tu navegador no permite obtener GPS. Selecciona el punto manualmente en el mapa.');return;}setLocating(true);navigator.geolocation.getCurrentPosition(p=>{setCoords({lat:p.coords.latitude,lng:p.coords.longitude,accuracy:p.coords.accuracy});setLocating(false)},()=>{setStatus('No fue posible obtener GPS. Puedes seleccionar el punto manualmente.');setLocating(false)},{enableHighAccuracy:true,timeout:12000,maximumAge:15000});}
 function scheduleHomeRedirect(){if(redirectTimer.current)window.clearTimeout(redirectTimer.current);redirectTimer.current=window.setTimeout(()=>window.location.assign('/'),2800);}
 async function refreshPending(){setPending(await getOfflineReports().catch(()=>[]))}

 useEffect(()=>{locate();refreshPending();const f=()=>refreshPending();const onSwMessage=(event:MessageEvent)=>{if(event.data?.type==='REPORT_SYNCED'){refreshPending();if(event.data?.publicCode)setSavedCode(event.data.publicCode);setStatus('Emergencia recibida correctamente por la plataforma. Volviendo al inicio…');if(awaitingConfirmation.current){awaitingConfirmation.current=false;scheduleHomeRedirect();}}};window.addEventListener('online',f);window.addEventListener('offline',f);navigator.serviceWorker?.addEventListener('message',onSwMessage);return()=>{window.removeEventListener('online',f);window.removeEventListener('offline',f);navigator.serviceWorker?.removeEventListener('message',onSwMessage);if(redirectTimer.current)window.clearTimeout(redirectTimer.current)}},[]);

 useEffect(()=>{
   if(!coords)return;
   const controller=new AbortController();
   const timer=window.setTimeout(async()=>{
     setLocationInfo('Buscando dirección aproximada desde el GPS…');
     try{
       const r=await fetch(`/api/geocode?lat=${encodeURIComponent(coords.lat)}&lon=${encodeURIComponent(coords.lng)}`,{cache:'no-store',signal:controller.signal});
       const j=await r.json().catch(()=>({}));const result=j.result as ReverseResult|undefined;
       if(!r.ok||!result){setLocationInfo('GPS registrado. No fue posible completar la dirección automáticamente.');return;}
       if(!touched.current.region&&result.region)setRegion(result.region);
       if(!touched.current.commune&&result.commune)setCommune(result.commune);
       if(!touched.current.locality&&result.locality)setLocality(result.locality);
       if(!touched.current.addressApprox&&result.addressApprox)setAddressApprox(result.addressApprox);
       setLocationInfo(`Ubicación completada automáticamente desde ${result.source||'el mapa'}. Puedes corregirla antes de enviar.`);
     }catch(error){if((error as Error).name!=='AbortError')setLocationInfo('GPS registrado. La dirección puede completarse manualmente.');}
   },650);
   return()=>{window.clearTimeout(timer);controller.abort()};
 },[coords]);

 async function addFiles(e:ChangeEvent<HTMLInputElement>){const incoming=[...(e.target.files||[])];const next:EvidenceDraft[]=[];for(const file of incoming){const isVideo=file.type.startsWith('video/'),isImage=file.type.startsWith('image/');if(!isVideo&&!isImage)continue;const max=isVideo?35*1024*1024:10*1024*1024;if(file.size>max){setStatus(`${file.name}: archivo demasiado grande.`);continue;}let durationSeconds:number|undefined;if(isVideo){durationSeconds=await new Promise(resolve=>{const video=document.createElement('video');video.preload='metadata';video.onloadedmetadata=()=>{URL.revokeObjectURL(video.src);resolve(Number.isFinite(video.duration)?video.duration:undefined)};video.onerror=()=>resolve(undefined);video.src=URL.createObjectURL(file)});if(durationSeconds&&durationSeconds>31){setStatus(`${file.name}: el video supera 30 segundos.`);continue;}}next.push({id:crypto.randomUUID(),name:file.name,type:file.type,size:file.size,blob:file,mediaType:isVideo?'video':'image',durationSeconds});}setFiles(prev=>[...prev,...next].slice(0,6));if(fileRef.current)fileRef.current.value='';}

 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();if(sending)return;if(!coords){setStatus('Selecciona u obtén una ubicación antes de enviar.');return;}const form=e.currentTarget;const fd=new FormData(form);const id=crypto.randomUUID();const report:OfflineReport={id,secret:randomSecret(),category:String(fd.get('category')),description:String(fd.get('description')||''),latitude:coords.lat,longitude:coords.lng,accuracy:coords.accuracy,capturedAt:new Date().toISOString(),occurredAt:String(fd.get('occurredAt')||'')||undefined,region:region||'Antofagasta',commune:commune||'Antofagasta',locality:locality||undefined,addressApprox:addressApprox||undefined,dangerFire:fd.get('dangerFire')==='on',dangerInjured:fd.get('dangerInjured')==='on',dangerTrapped:fd.get('dangerTrapped')==='on',dangerElectric:fd.get('dangerElectric')==='on',roadBlocked:fd.get('roadBlocked')==='on',createdOffline:!navigator.onLine,state:'pending',attempts:0,evidence:files};
 awaitingConfirmation.current=true;setSending(true);await saveOfflineReport(report);await refreshPending();setSavedCode(`LOCAL-${id.slice(0,8).toUpperCase()}`);setStatus(navigator.onLine?'Reporte guardado. Confirmando recepción…':'Reporte guardado en este dispositivo. Se enviará cuando vuelva Internet.');
 try{
   if(navigator.onLine){const synced=await syncOneReport(report);setSavedCode(synced.publicCode||report.publicCode||`LOCAL-${id.slice(0,8).toUpperCase()}`);setStatus('Emergencia recibida correctamente por la plataforma. Volviendo al inicio…');await refreshPending();setFiles([]);form.reset();setLocality('');setAddressApprox('');touched.current={region:false,commune:false,locality:false,addressApprox:false};awaitingConfirmation.current=false;scheduleHomeRedirect();}
   else await requestBackgroundSync().catch(()=>{});
 }catch(error){
   await requestBackgroundSync().catch(()=>{});const syncError=error as Error & {serverAccepted?:boolean;publicCode?:string};const accepted=Boolean(syncError.serverAccepted||report.serverAccepted);if(accepted){setSavedCode(syncError.publicCode||report.publicCode||savedCode);setStatus(report.evidence.some(x=>!x.uploaded)?'Emergencia recibida correctamente. La evidencia restante seguirá cargándose automáticamente. Volviendo al inicio…':'Emergencia recibida correctamente por la plataforma. Volviendo al inicio…');awaitingConfirmation.current=false;scheduleHomeRedirect();}else{setStatus('Aún no fue posible confirmar la recepción. El reporte permanece guardado en este dispositivo y se reintentará automáticamente.');}await refreshPending();
 }finally{setSending(false)}
 }

 return <form className="panel-card stack-form" onSubmit={submit}>
   <div className="form-section"><h2>1. ¿Qué está ocurriendo?</h2><label>Tipo de emergencia<select name="category" required defaultValue=""><option value="" disabled>Selecciona una categoría</option>{EMERGENCY_CATEGORIES.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label><label>Descripción breve<textarea name="description" rows={5} maxLength={1500} placeholder="Describe lo que ves, sin exponerte a peligro."/></label></div>
   <div className="form-section"><div className="section-title-row"><h2>2. Ubicación</h2><button type="button" className="btn btn-secondary btn-sm" onClick={locate}>{locating?'Buscando GPS…':'Usar mi GPS'}</button></div><LocationPicker value={coords} onChange={setCoords}/><div className="two-cols"><label>Región<input name="region" value={region} onChange={e=>{touched.current.region=true;setRegion(e.target.value)}}/></label><label>Comuna / ciudad<input name="commune" value={commune} onChange={e=>{touched.current.commune=true;setCommune(e.target.value)}}/></label></div><div className="two-cols"><label>Sector / localidad<input name="locality" value={locality} onChange={e=>{touched.current.locality=true;setLocality(e.target.value)}} placeholder="Ej. Centro, La Chimba"/></label><label>Dirección aproximada<input name="addressApprox" value={addressApprox} onChange={e=>{touched.current.addressApprox=true;setAddressApprox(e.target.value)}} placeholder="Calle, intersección o referencia"/></label></div>{coords?<div className="gps-readout">GPS: {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)} {coords.accuracy?`· precisión aprox. ${Math.round(coords.accuracy)} m`:''}</div>:null}{locationInfo?<div className="muted tiny">{locationInfo}</div>:null}</div>
   <div className="form-section"><h2>3. Riesgos observados</h2><div className="check-grid"><label><input type="checkbox" name="dangerFire"/> Fuego / humo</label><label><input type="checkbox" name="dangerInjured"/> Personas heridas</label><label><input type="checkbox" name="dangerTrapped"/> Personas atrapadas</label><label><input type="checkbox" name="dangerElectric"/> Peligro eléctrico</label><label><input type="checkbox" name="roadBlocked"/> Vía bloqueada</label></div></div>
   <div className="form-section"><h2>4. Evidencia privada</h2><p className="muted">Las fotografías y videos no son visibles para ciudadanos. Solo administrador, operadores y autoridades autorizadas.</p><input ref={fileRef} type="file" accept="image/*,video/*" multiple onChange={addFiles}/><div className="evidence-list">{files.map(f=><div key={f.id}><span>{f.mediaType==='video'?'🎥':'📷'} {f.name}</span><button type="button" className="text-button" onClick={()=>setFiles(p=>p.filter(x=>x.id!==f.id))}>Quitar</button></div>)}</div>{files.length?<span className="muted tiny">{files.length} archivo(s) · {(totalBytes/1024/1024).toFixed(1)} MB</span>:null}</div>
   <button className="btn btn-danger btn-xl" type="submit" disabled={sending}>{sending?'Enviando y confirmando…':'Enviar emergencia'}</button>
   {savedCode?<div className="receipt"><b>{savedCode}</b><span>{status}</span></div>:status?<div className="alert warning">{status}</div>:null}
   {pending.length?<div className="pending-box"><div className="section-title-row"><h3>Envíos pendientes en este dispositivo</h3><button type="button" className="text-button" onClick={refreshPending}>Actualizar</button></div>{pending.map(r=><div className="pending-item" key={r.id}><div><b>{r.publicCode||EMERGENCY_CATEGORIES.find(x=>x[0]===r.category)?.[1]||r.category}</b><small>{new Date(r.capturedAt).toLocaleString('es-CL')} · {r.evidence.length} evidencia(s)</small>{r.lastError?<small>{r.lastError}</small>:null}</div><span className={`pending-state ${r.state}`}>{r.serverAccepted?'Recibida · completando':navigator.onLine?r.state==='failed'?'Reintentará':'En cola':'Esperando señal'}</span></div>)}</div>:null}
 </form>;
}
