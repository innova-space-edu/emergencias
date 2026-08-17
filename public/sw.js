const CACHE='innova-emergencias-shell-v6';
const MAP_CACHE='innova-emergencias-map-v2';
const SHELL=['/','/reportar','/mapa','/acceso','/login','/manifest.webmanifest'];
const DB='innova-emergencias-offline',STORE='reports';

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(async c=>{
    for(const path of SHELL){try{const r=await fetch(path,{cache:'reload'});const html=String(r.headers.get('content-type')||'').includes('text/html');if(r.ok&&(html||path.endsWith('.webmanifest')))await c.put(path,r.clone())}catch{}}
  }));
  self.skipWaiting();
});
self.addEventListener('activate',event=>{event.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('innova-emergencias-')&&!([CACHE,MAP_CACHE].includes(k))).map(k=>caches.delete(k))))]))});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const u=new URL(event.request.url);
  if(u.origin===self.location.origin&&u.pathname.startsWith('/_next/'))return;
  if(u.hostname.includes('openfreemap.org')||u.hostname==='tile.openstreetmap.org'){
    event.respondWith(caches.open(MAP_CACHE).then(async c=>{const cached=await c.match(event.request);const network=fetch(event.request).then(r=>{if(r.ok)c.put(event.request,r.clone());return r}).catch(()=>cached);return cached||network}));return;
  }
  if(event.request.mode==='navigate'){
    event.respondWith((async()=>{
      try{
        const r=await fetch(event.request,{cache:'no-store'});
        if(r.ok&&String(r.headers.get('content-type')||'').includes('text/html')){const copy=r.clone();await caches.open(CACHE).then(c=>c.put(event.request,copy)).catch(()=>{})}
        return r;
      }catch{
        return (await caches.match(event.request))||(await caches.match('/'))||new Response('<!doctype html><meta charset="utf-8"><title>Sin conexión</title><main style="font-family:system-ui;padding:2rem"><h1>Sin conexión</h1><p>Tu reporte guardado seguirá protegido y se intentará enviar al recuperar Internet.</p></main>',{headers:{'content-type':'text/html; charset=utf-8'}});
      }
    })());
  }
});

function openDb(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE,{keyPath:'id'})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function allReports(){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly'),r=tx.objectStore(STORE).getAll();r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error)})}
async function putReport(report){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(report);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)})}
async function delReport(id){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(id);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)})}
async function notify(data){const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});for(const client of clients)client.postMessage(data)}
async function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms))}
function payloadFor(r){return JSON.stringify({id:r.id,secret:r.secret,category:r.category,description:r.description,latitude:r.latitude,longitude:r.longitude,accuracy:r.accuracy,capturedAt:r.capturedAt,occurredAt:r.occurredAt,region:r.region,commune:r.commune,locality:r.locality,addressApprox:r.addressApprox,dangerFire:r.dangerFire,dangerInjured:r.dangerInjured,dangerTrapped:r.dangerTrapped,dangerElectric:r.dangerElectric,roadBlocked:r.roadBlocked,createdOffline:r.createdOffline,syncAttempts:r.attempts||0})}

async function createOrConfirm(r){let last=null;for(let attempt=0;attempt<2;attempt++){try{const res=await fetch('/api/reports',{method:'POST',headers:{'content-type':'application/json','cache-control':'no-cache'},body:payloadFor(r),cache:'no-store'});const text=await res.text();let data={};try{data=text?JSON.parse(text):{}}catch{}if(res.ok)return data;last=new Error(data.error||`No se pudo registrar (${res.status})`);if(res.status<500&&res.status!==408&&res.status!==429)break}catch(e){last=e instanceof Error?e:new Error('Error de conexión')}if(attempt===0)await sleep(700)}throw last||new Error('No se pudo confirmar recepción')}
async function syncOne(r){
  r.attempts=(r.attempts||0)+1;r.lastError=undefined;r.state=r.serverAccepted?'accepted':'syncing';await putReport(r);
  try{
    if(!r.serverAccepted){const created=await createOrConfirm(r);r.serverAccepted=true;r.publicCode=created.publicCode||r.publicCode;r.incidentId=created.incidentId||r.incidentId;r.acceptedAt=r.acceptedAt||new Date().toISOString();r.state='accepted';await putReport(r);await notify({type:'REPORT_ACCEPTED',id:r.id,publicCode:r.publicCode||null})}
    for(const e of r.evidence||[]){if(e.uploaded)continue;const sign=await fetch(`/api/reports/${r.id}/evidence-url`,{method:'POST',headers:{'content-type':'application/json','cache-control':'no-cache'},cache:'no-store',body:JSON.stringify({secret:r.secret,fileName:e.name,mimeType:e.type,bytes:e.size,mediaType:e.mediaType,durationSeconds:e.durationSeconds})});const s=await sign.json().catch(()=>({}));if(!sign.ok||!s.signedUrl||!s.path)throw new Error(s.error||'No se pudo preparar evidencia');const up=await fetch(s.signedUrl,{method:'PUT',body:e.blob,headers:{'Content-Type':e.type||'application/octet-stream','x-upsert':'false'}});if(!up.ok)throw new Error(`Evidencia pendiente (${up.status})`);const confirm=await fetch(`/api/reports/${r.id}/evidence-confirm`,{method:'POST',headers:{'content-type':'application/json','cache-control':'no-cache'},cache:'no-store',body:JSON.stringify({secret:r.secret,storagePath:s.path,mimeType:e.type,bytes:e.size,mediaType:e.mediaType,durationSeconds:e.durationSeconds})});const cp=await confirm.json().catch(()=>({}));if(!confirm.ok)throw new Error(cp.error||'Falta confirmar evidencia');e.uploaded=true;e.storagePath=s.path;await putReport(r)}
    const code=r.publicCode||null;await delReport(r.id);await notify({type:'REPORT_SYNCED',id:r.id,publicCode:code});return true;
  }catch(e){r.state=r.serverAccepted?'accepted':'failed';r.lastError=r.serverAccepted?`Emergencia recibida. Pendiente: ${String(e&&e.message||e)}`:String(e&&e.message||e);await putReport(r);return false}
}
let runningSync=null;
function runSync(){if(runningSync)return runningSync;runningSync=(async()=>{const rs=await allReports();let failed=0;for(const r of rs)if(!(await syncOne(r)))failed++;if(failed)throw new Error(`${failed} reporte(s) continúan pendientes`)})().finally(()=>{runningSync=null});return runningSync}
self.addEventListener('sync',event=>{if(event.tag==='sync-emergencies')event.waitUntil(runSync())});
self.addEventListener('message',event=>{if(event.data==='SYNC_NOW'||event.data&&event.data.type==='SYNC_NOW')event.waitUntil(runSync().catch(()=>{}))});
