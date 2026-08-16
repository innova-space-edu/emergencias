'use client';
import { useEffect } from 'react';
import { syncPendingReports } from '@/lib/sync-queue';
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
    const sync = () => syncPendingReports().catch(() => {});
    const visibility = () => { if (document.visibilityState === 'visible') sync(); };
    window.addEventListener('online', sync);
    document.addEventListener('visibilitychange', visibility);
    sync();
    return () => { window.removeEventListener('online', sync); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  return null;
}
