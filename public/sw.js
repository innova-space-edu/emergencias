const CACHE='innova-emergencias-shell-v2';
const MAP_CACHE='innova-emergencias-map-v1';
const SHELL=['/','/reportar','/mapa','/acceso','/login','/manifest.webmanifest'];
const DB='innova-emergencias-offline',STORE='reports';

self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).catch(()=>{}));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('innova-emergencias-')&&!([CACHE,MAP_CACHE].includes(k))).map(k=>caches.delete(k))))]));});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const u=new URL(event.request.url);
  if(u.hostname.includes('openfreemap.org')||u.hostname==='tile.openstreetmap.org'){
    event.respondWith(caches.open(MAP_CACHE).then(async c=>{const cached=await c.match(event.request);const network=fetch(event.request).then(r=>{if(r.ok)c.put(event.request,r.clone());return r;}).catch(()=>cached);return cached||network;}));
    return;
  }
  if(event.request.mode==='navigate') event.respondWith(fetch(event.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));return r;}).catch(()=>caches.match(event.request).then(r=>r||caches.match('/'))));
});
function openDb(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE,{keyPath:'id'});};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function allReports(){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly'),r=tx.objectStore(STORE).getAll();r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error);});}
async function putReport(report){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(report);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});}
async function delReport(id){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(id);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});}
async function syncOne(r){
  r.state='syncing';r.attempts=(r.attempts||0)+1;await putReport(r);
  const created=await fetch('/api/reports',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id:r.id,secret:r.secret,category:r.category,description:r.description,latitude:r.latitude,longitude:r.longitude,accuracy:r.accuracy,capturedAt:r.capturedAt,occurredAt:r.occurredAt,region:r.region,commune:r.commune,locality:r.locality,addressApprox:r.addressApprox,dangerFire:r.dangerFire,dangerInjured:r.dangerInjured,dangerTrapped:r.dangerTrapped,dangerElectric:r.dangerElectric,roadBlocked:r.roadBlocked,createdOffline:r.createdOffline})});
  if(!created.ok) throw new Error('No se pudo registrar');
  for(const e of r.evidence||[]){
    if(e.uploaded) continue;
    const sign=await fetch(`/api/reports/${r.id}/evidence-url`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({secret:r.secret,fileName:e.name,mimeType:e.type,bytes:e.size,mediaType:e.mediaType,durationSeconds:e.durationSeconds})});
    if(!sign.ok) throw new Error('No se pudo preparar evidencia'); const s=await sign.json();
    const up=await fetch(s.signedUrl,{method:'PUT',body:e.blob,headers:{'Content-Type':e.type||'application/octet-stream','x-upsert':'false'}});if(!up.ok)throw new Error('Carga de evidencia falló');
    const confirm=await fetch(`/api/reports/${r.id}/evidence-confirm`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({secret:r.secret,storagePath:s.path,mimeType:e.type,bytes:e.size,mediaType:e.mediaType,durationSeconds:e.durationSeconds})});if(!confirm.ok)throw new Error('No se confirmó evidencia');
    e.uploaded=true;e.storagePath=s.path;await putReport(r);
  }
  await delReport(r.id);
}
async function runSync(){const rs=await allReports();for(const r of rs){try{await syncOne(r);}catch(e){r.state='failed';r.lastError=String(e?.message||e);await putReport(r);}}}
self.addEventListener('sync',event=>{if(event.tag==='sync-emergencies')event.waitUntil(runSync());});
self.addEventListener('message',event=>{if(event.data==='SYNC_NOW')event.waitUntil(runSync());});
