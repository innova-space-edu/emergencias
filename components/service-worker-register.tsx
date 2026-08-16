'use client';
import { useEffect } from 'react';
import { syncPendingReports } from '@/lib/sync-queue';

const SW_VERSION='2026-08-16-v5';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    let cancelled=false;
    async function register(){
      if(!('serviceWorker' in navigator))return;
      try{
        const registration=await navigator.serviceWorker.register(`/sw.js?v=${SW_VERSION}`,{updateViaCache:'none'});
        await registration.update().catch(()=>{});
        if(cancelled)return;
        registration.active?.postMessage({type:'CLIENT_VERSION',version:SW_VERSION});
      }catch{}
    }
    register();
    const sync = () => syncPendingReports().catch(() => {});
    const visibility = () => { if (document.visibilityState === 'visible') { register(); sync(); } };
    window.addEventListener('online', sync);
    document.addEventListener('visibilitychange', visibility);
    sync();
    return () => {cancelled=true;window.removeEventListener('online', sync);document.removeEventListener('visibilitychange', visibility)};
  }, []);
  return null;
}
