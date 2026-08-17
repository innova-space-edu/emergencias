function config(){
  const base=process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/,'');
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return {base,key};
}
async function invoke(body:unknown,authorization?:string){
  const {base,key}=config();if(!base||!key)return;
  try{
    const headers:Record<string,string>={'content-type':'application/json','apikey':key};
    if(authorization)headers.authorization=`Bearer ${authorization}`;
    const r=await fetch(`${base}/functions/v1/emergency-email-broadcast`,{method:'POST',headers,body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
    if(!r.ok)console.warn('staff email broadcast trigger failed',r.status,await r.text().catch(()=>''));
  }catch(error){console.warn('staff email broadcast trigger error',error)}
}
export async function triggerStaffEmergencyBroadcast(reportId:string,secret:string){if(!reportId||!secret)return;await invoke({mode:'new-incident',reportId,secret})}
export async function triggerStaffEventBroadcast(incidentId:string,event:'critical'|'responding'|'resolved',accessToken:string){if(!incidentId||!accessToken)return;await invoke({mode:'staff-event',incidentId,event},accessToken)}
