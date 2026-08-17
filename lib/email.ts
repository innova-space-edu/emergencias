type MailArgs={
  to:string|string[];
  subject:string;
  text:string;
  html?:string;
  cc?:string|string[];
  bcc?:string|string[];
  replyTo?:string;
  idempotencyKey?:string;
};

type ResendResponse={id?:string;message?:string;name?:string};

function requiredConfig(){
  const apiKey=process.env.RESEND_API_KEY?.trim();
  const from=(process.env.EMAIL_FROM||'Innova Emergency <contacto@innova-space-edu.cl>').trim();
  if(!apiKey)throw new Error('RESEND_API_KEY no está configurada');
  if(!from)throw new Error('EMAIL_FROM no está configurado');
  return {apiKey,from};
}
function list(value?:string|string[]){if(!value)return undefined;return Array.isArray(value)?value.filter(Boolean):[value]}

export function institutionalMailConfigured(){
  return Boolean(process.env.RESEND_API_KEY&&(process.env.EMAIL_FROM||'contacto@innova-space-edu.cl'));
}

export async function verifyInstitutionalMail(){
  requiredConfig();
  return true;
}

export async function sendInstitutionalMail(args:MailArgs){
  const {apiKey,from}=requiredConfig();
  const payload:any={from,to:list(args.to),subject:args.subject,text:args.text};
  if(args.html)payload.html=args.html;
  const cc=list(args.cc);if(cc?.length)payload.cc=cc;
  const bcc=list(args.bcc);if(bcc?.length)payload.bcc=bcc;
  if(args.replyTo)payload.reply_to=args.replyTo;
  const headers:Record<string,string>={'content-type':'application/json','authorization':`Bearer ${apiKey}`};
  if(args.idempotencyKey)headers['Idempotency-Key']=args.idempotencyKey.slice(0,256);
  const response=await fetch('https://api.resend.com/emails',{method:'POST',headers,body:JSON.stringify(payload),signal:AbortSignal.timeout(20000)});
  const data=(await response.json().catch(()=>({}))) as ResendResponse;
  if(!response.ok)throw new Error(data.message||`Resend respondió ${response.status}`);
  if(!data.id)throw new Error('Resend no devolvió identificador de mensaje');
  return {provider:'resend' as const,id:data.id};
}
