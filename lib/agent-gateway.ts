export async function callAgentGateway(path:string,body:unknown){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key)throw new Error('Supabase no configurado');
  return fetch(`${url}/functions/v1/agent-gateway/${path.replace(/^\//,'')}`,{method:'POST',headers:{apikey:key,'content-type':'application/json'},body:JSON.stringify(body),cache:'no-store',signal:AbortSignal.timeout(30000)});
}
