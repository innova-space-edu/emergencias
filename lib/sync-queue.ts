'use client';
import { deleteOfflineReport, getOfflineReports, updateOfflineReport } from '@/lib/offline-db';
import type { OfflineReport } from '@/lib/types';

type SyncError = Error & { serverAccepted?: boolean; publicCode?: string };
type PendingSyncResult = { id:string; publicCode:string|null; incidentId:string|null; serverAccepted:true };
let pendingSyncPromise:Promise<PendingSyncResult[]>|null=null;

function reportBody(report: OfflineReport) {
  return JSON.stringify({
    id:report.id, secret:report.secret, category:report.category, description:report.description,
    latitude:report.latitude, longitude:report.longitude, accuracy:report.accuracy,
    capturedAt:report.capturedAt, occurredAt:report.occurredAt,
    region:report.region, commune:report.commune, locality:report.locality, addressApprox:report.addressApprox,
    dangerFire:report.dangerFire, dangerInjured:report.dangerInjured, dangerTrapped:report.dangerTrapped,
    dangerElectric:report.dangerElectric, roadBlocked:report.roadBlocked, createdOffline:report.createdOffline,
    syncAttempts:report.attempts,
  });
}

async function wait(ms:number){return new Promise(resolve=>setTimeout(resolve,ms))}

async function createOrConfirm(report: OfflineReport) {
  let lastError: Error | null = null;
  for (let attempt=0; attempt<2; attempt++) {
    try {
      const response = await fetch('/api/reports', {
        method:'POST',
        headers:{'content-type':'application/json','cache-control':'no-cache'},
        body:reportBody(report),
        cache:'no-store',
      });
      const text = await response.text();
      let payload:any = {};
      try { payload = text ? JSON.parse(text) : {}; } catch { payload = {}; }
      if (response.ok) return payload;
      lastError = new Error(payload.error || `No se pudo registrar la emergencia (${response.status})`);
      if (response.status < 500 && response.status !== 408 && response.status !== 429) break;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('No se pudo conectar con el receptor de emergencias');
    }
    if (attempt===0) await wait(700);
  }
  throw lastError || new Error('No se pudo confirmar la recepción');
}

export async function syncOneReport(report: OfflineReport) {
  report.state = report.serverAccepted ? 'accepted' : 'syncing';
  report.attempts = (report.attempts || 0) + 1;
  report.lastError = undefined;
  await updateOfflineReport(report);

  try {
    if (!report.serverAccepted) {
      const payload = await createOrConfirm(report);
      report.serverAccepted = true;
      report.publicCode = payload.publicCode || report.publicCode;
      report.incidentId = payload.incidentId || report.incidentId;
      report.acceptedAt = report.acceptedAt || new Date().toISOString();
      report.state = 'accepted';
      report.lastError = undefined;
      await updateOfflineReport(report);
    }

    for (const evidence of report.evidence || []) {
      if (evidence.uploaded) continue;
      const signRes = await fetch(`/api/reports/${report.id}/evidence-url`, {
        method:'POST', headers:{'content-type':'application/json','cache-control':'no-cache'}, cache:'no-store',
        body: JSON.stringify({ secret:report.secret, fileName:evidence.name, mimeType:evidence.type, bytes:evidence.size, mediaType:evidence.mediaType, durationSeconds:evidence.durationSeconds })
      });
      const signPayload = await signRes.json().catch(()=>({}));
      if (!signRes.ok) throw new Error(signPayload.error || 'No se pudo preparar la evidencia');
      if (!signPayload?.signedUrl || !signPayload?.path) throw new Error('No se recibió una URL válida para la evidencia');

      const uploadRes = await fetch(signPayload.signedUrl, {
        method:'PUT', body:evidence.blob,
        headers:{'Content-Type':evidence.type || 'application/octet-stream','x-upsert':'false'},
      });
      if (!uploadRes.ok) throw new Error(`La evidencia quedó pendiente de carga (${uploadRes.status})`);

      const confirm = await fetch(`/api/reports/${report.id}/evidence-confirm`, {
        method:'POST', headers:{'content-type':'application/json','cache-control':'no-cache'}, cache:'no-store',
        body: JSON.stringify({ secret:report.secret, storagePath:signPayload.path, mimeType:evidence.type, bytes:evidence.size, mediaType:evidence.mediaType, durationSeconds:evidence.durationSeconds })
      });
      const confirmPayload = await confirm.json().catch(()=>({}));
      if (!confirm.ok) throw new Error(confirmPayload.error || 'La evidencia se cargó pero falta confirmarla');
      evidence.uploaded = true;
      evidence.storagePath = signPayload.path;
      await updateOfflineReport(report);
    }

    const result={ publicCode: report.publicCode || null, incidentId: report.incidentId || null, serverAccepted:true as const };
    await deleteOfflineReport(report.id);
    return result;
  } catch (error) {
    const message=error instanceof Error ? error.message : 'Error de sincronización';
    report.state = report.serverAccepted ? 'accepted' : 'failed';
    report.lastError = report.serverAccepted ? `Emergencia recibida. Pendiente: ${message}` : message;
    await updateOfflineReport(report);
    const wrapped:SyncError=new Error(report.lastError);
    wrapped.serverAccepted=Boolean(report.serverAccepted);
    wrapped.publicCode=report.publicCode;
    throw wrapped;
  }
}

export function syncPendingReports():Promise<PendingSyncResult[]> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return Promise.resolve([]);
  if (pendingSyncPromise) return pendingSyncPromise;
  pendingSyncPromise=(async()=>{
    const reports = await getOfflineReports();
    const completed:PendingSyncResult[]=[];
    for (const report of reports) {
      try {
        const result=await syncOneReport(report);
        completed.push({id:report.id,publicCode:result.publicCode,incidentId:result.incidentId,serverAccepted:true});
      } catch { /* queda persistido para el siguiente intento */ }
    }
    return completed;
  })().finally(()=>{pendingSyncPromise=null});
  return pendingSyncPromise;
}

export async function requestBackgroundSync() {
  if (typeof navigator==='undefined' || !('serviceWorker' in navigator)) return;
  const reg = await navigator.serviceWorker.ready;
  const syncManager = (reg as ServiceWorkerRegistration & { sync?: { register:(tag:string)=>Promise<void> } }).sync;
  if (syncManager) await syncManager.register('sync-emergencies');
  else reg.active?.postMessage('SYNC_NOW');
}
