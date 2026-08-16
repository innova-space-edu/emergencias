export async function callEmergencyGateway(path:string, init:RequestInit={}) {
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key) throw new Error('Supabase no configurado');
  const headers=new Headers(init.headers);
  headers.set('apikey',key);
  if(init.body && !headers.has('content-type')) headers.set('content-type','application/json');
  return fetch(`${url}/functions/v1/emergency-gateway/${path.replace(/^\//,'')}`,{...init,headers,cache:'no-store'});
}
