type WorkerBody={mode:'report'|'staff-analyze'|'process-pending';reportId?:string;secret?:string;incidentId?:string;limit?:number};

export async function callAgentWorker(body:WorkerBody){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/,'');
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key)throw new Error('Supabase no configurado');
  return fetch(`${url}/functions/v1/agent-worker`,{
    method:'POST',
    headers:{apikey:key,'content-type':'application/json'},
    body:JSON.stringify(body),
    cache:'no-store',
    signal:AbortSignal.timeout(55000),
  });
}

export async function triggerReportAgent(reportId:string,secret:string){
  try{
    const r=await callAgentWorker({mode:'report',reportId,secret});
    if(!r.ok)console.error('Supabase agent-worker report failed',r.status,(await r.text()).slice(0,800));
  }catch(error){console.error('Supabase agent-worker unavailable',error)}
}
