type WorkerBody={mode:'report'|'staff-analyze'|'process-pending';reportId?:string;secret?:string;incidentId?:string;limit?:number};
type RouterBody={mode:'report'|'staff-route'|'process-pending';reportId?:string;secret?:string;incidentId?:string;limit?:number};

async function callAutoRouter(url:string,key:string,body:RouterBody,accessToken?:string){
  const headers:Record<string,string>={apikey:key,'content-type':'application/json'};
  if(accessToken)headers.authorization=`Bearer ${accessToken}`;
  const r=await fetch(`${url}/functions/v1/auto-router`,{
    method:'POST',headers,body:JSON.stringify(body),cache:'no-store',signal:AbortSignal.timeout(30000),
  });
  if(!r.ok)console.error('Supabase auto-router failed',r.status,(await r.text()).slice(0,800));
  return r;
}

export async function callAgentWorker(body:WorkerBody,accessToken?:string){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/,'');
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key)throw new Error('Supabase no configurado');
  const headers:Record<string,string>={apikey:key,'content-type':'application/json'};
  if(accessToken)headers.authorization=`Bearer ${accessToken}`;
  const response=await fetch(`${url}/functions/v1/agent-worker`,{
    method:'POST',
    headers,
    body:JSON.stringify(body),
    cache:'no-store',
    signal:AbortSignal.timeout(55000),
  });
  if(response.ok){
    try{
      const payload=await response.clone().json().catch(()=>({}));
      let routerBody:RouterBody|null=null;
      if(body.mode==='report'&&body.reportId&&body.secret)routerBody={mode:'report',reportId:body.reportId,secret:body.secret};
      else if(body.mode==='staff-analyze'&&payload?.incidentId)routerBody={mode:'staff-route',incidentId:String(payload.incidentId)};
      else if(body.mode==='process-pending')routerBody={mode:'process-pending',limit:body.limit};
      if(routerBody)await callAutoRouter(url,key,routerBody,accessToken);
    }catch(error){console.error('No fue posible ejecutar la derivación automática',error)}
  }
  return response;
}

export async function triggerReportAgent(reportId:string,secret:string){
  try{
    const r=await callAgentWorker({mode:'report',reportId,secret});
    if(!r.ok)console.error('Supabase agent-worker report failed',r.status,(await r.text()).slice(0,800));
  }catch(error){console.error('Supabase agent-worker unavailable',error)}
}
