export async function triggerStaffEmergencyBroadcast(reportId:string,secret:string){
  const base=process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/,'');
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!base||!key||!reportId||!secret)return;
  try{
    const r=await fetch(`${base}/functions/v1/emergency-email-broadcast`,{method:'POST',headers:{'content-type':'application/json','apikey':key},body:JSON.stringify({reportId,secret}),signal:AbortSignal.timeout(15000)});
    if(!r.ok)console.warn('staff email broadcast trigger failed',r.status,await r.text().catch(()=>''));
  }catch(error){console.warn('staff email broadcast trigger error',error)}
}
