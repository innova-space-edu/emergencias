'use client';
import { deleteOfflineReport, getOfflineReports, updateOfflineReport } from '@/lib/offline-db';
import type { OfflineReport } from '@/lib/types';

export async function syncOneReport(report: OfflineReport) {
  report.state = 'syncing'; report.attempts += 1; report.lastError = undefined;
  await updateOfflineReport(report);
  let serverAccepted = false;
  try {
    const createRes = await fetch('/api/reports', {
      method:'POST', headers:{'content-type':'application/json'},
      body: JSON.stringify({
        id:report.id, secret:report.secret, category:report.category, description:report.description,
        latitude:report.latitude, longitude:report.longitude, accuracy:report.accuracy,
        capturedAt:report.capturedAt, occurredAt:report.occurredAt,
        region:report.region, commune:report.commune, locality:report.locality, addressApprox:report.addressApprox,
        dangerFire:report.dangerFire, dangerInjured:report.dangerInjured, dangerTrapped:report.dangerTrapped,
        dangerElectric:report.dangerElectric, roadBlocked:report.roadBlocked, createdOffline:report.createdOffline
      })
    });
    const createPayload = await createRes.json().catch(()=>({}));
    if (!createRes.ok) throw new Error(createPayload.error || 'No se pudo registrar la emergencia');
    serverAccepted = true;

    for (const evidence of report.evidence || []) {
      if (evidence.uploaded) continue;
      const signRes = await fetch(`/api/reports/${report.id}/evidence-url`, {
        method:'POST', headers:{'content-type':'application/json'},
        body: JSON.stringify({ secret:report.secret, fileName:evidence.name, mimeType:evidence.type, bytes:evidence.size, mediaType:evidence.mediaType, durationSeconds:evidence.durationSeconds })
      });
      if (!signRes.ok) throw new Error((await signRes.json().catch(()=>({}))).error || 'No se pudo preparar la evidencia');
      const signed = await signRes.json();
      if (!signed?.signedUrl || !signed?.path) throw new Error('Supabase no devolvió una URL de carga válida');

      const uploadRes = await fetch(signed.signedUrl, {
        method:'PUT',
        body:evidence.blob,
        headers:{'Content-Type':evidence.type || 'application/octet-stream','x-upsert':'false'}
      });
      if (!uploadRes.ok) throw new Error(`Carga de evidencia falló (${uploadRes.status})`);

      const confirm = await fetch(`/api/reports/${report.id}/evidence-confirm`, {
        method:'POST', headers:{'content-type':'application/json'},
        body: JSON.stringify({ secret:report.secret, storagePath:signed.path, mimeType:evidence.type, bytes:evidence.size, mediaType:evidence.mediaType, durationSeconds:evidence.durationSeconds })
      });
      if (!confirm.ok) throw new Error((await confirm.json().catch(()=>({}))).error || 'La evidencia se cargó pero no pudo confirmarse');
      evidence.uploaded = true; evidence.storagePath = signed.path;
      await updateOfflineReport(report);
    }

    await deleteOfflineReport(report.id);
    return { publicCode: createPayload.publicCode || null, incidentId: createPayload.incidentId || null };
  } catch (error) {
    report.state='failed';
    const message=error instanceof Error ? error.message : 'Error de sincronización';
    report.lastError=serverAccepted ? `Reporte recibido; sincronización complementaria pendiente: ${message}` : message;
    await updateOfflineReport(report);
    const wrapped=new Error(report.lastError);
    (wrapped as Error & {serverAccepted?:boolean}).serverAccepted=serverAccepted;
    throw wrapped;
  }
}

export async function syncPendingReports() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;
  const reports = await getOfflineReports();
  for (const report of reports) {
    try { await syncOneReport(report); } catch { /* permanece en cola */ }
  }
}

export async function requestBackgroundSync() {
  if (!('serviceWorker' in navigator)) return;
  const reg = await navigator.serviceWorker.ready;
  const syncManager = (reg as ServiceWorkerRegistration & { sync?: { register:(tag:string)=>Promise<void> } }).sync;
  if (syncManager) await syncManager.register('sync-emergencies');
}
