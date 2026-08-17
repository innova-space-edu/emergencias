import { classifyEmergency } from '@/lib/ai';
import { callAgentGateway } from '@/lib/agent-gateway';
import { sendInstitutionalMail } from '@/lib/email';

type ReportInput={id:string;secret:string;category:string;description?:string;region?:string;commune?:string;locality?:string;addressApprox?:string;dangerFire?:boolean;dangerInjured?:boolean;dangerTrapped?:boolean;dangerElectric?:boolean;roadBlocked?:boolean};

function dangerFlags(r:ReportInput){return [r.dangerFire?'fuego/humo':'',r.dangerInjured?'personas heridas':'',r.dangerTrapped?'personas atrapadas':'',r.dangerElectric?'peligro eléctrico':'',r.roadBlocked?'vía bloqueada':''].filter(Boolean)}

export async function runEmergencyAgent(report:ReportInput){
  try{
    if(!report?.id||!report?.secret)return;
    const assessment=await classifyEmergency({category:report.category||'other',description:report.description||'',dangerFlags:dangerFlags(report)});
    if(!assessment)return;
    const model=process.env.GEMINI_MODEL||'gemini-3.6-flash';
    const r=await callAgentGateway('assess',{reportId:report.id,secret:report.secret,assessment,model,dangerFire:Boolean(report.dangerFire),dangerInjured:Boolean(report.dangerInjured),dangerTrapped:Boolean(report.dangerTrapped),dangerElectric:Boolean(report.dangerElectric),roadBlocked:Boolean(report.roadBlocked)});
    if(!r.ok){console.error('Agent gateway assess failed',r.status,await r.text());return}
    const result=await r.json() as {autoPrealerts?:Array<{actionId:string;organization:string;channel:string;destination:string;publicCode:string;category:string;severity:number;summary:string;commune?:string;locality?:string;addressApprox?:string;latitude?:number;longitude?:number}>};
    const admin=process.env.ADMIN_EMAIL||process.env.EMAIL_SEND_TO||'contacto@innova-space-edu.cl';
    for(const item of result.autoPrealerts||[]){
      if(item.channel!=='email'||!item.destination?.includes('@'))continue;
      let success=false,error='';
      try{
        await sendInstitutionalMail({to:item.destination,cc:item.destination.toLowerCase()===admin.toLowerCase()?undefined:[admin],replyTo:admin,idempotencyKey:`agent-prealert-${item.actionId}`,subject:`Prealerta ciudadana ${item.publicCode} — Innova Emergency`,text:`Innova Emergency canaliza automáticamente un reporte ciudadano clasificado por su agente de triage. Este mensaje es una PREALERTA y no confirma que el hecho sea verdadero ni constituye una orden de despacho.\n\nCódigo: ${item.publicCode}\nCategoría sugerida: ${item.category}\nPrioridad: ${item.severity}/5\nComuna: ${item.commune||'No indicada'}\nLocalidad/sector: ${item.locality||'No indicado'}\nReferencia: ${item.addressApprox||'Ubicación registrada'}\nResumen: ${item.summary}\n\nRevise el caso en Innova Emergency. Esta plataforma complementa la comunicación ciudadana y no reemplaza 131 SAMU, 132 Bomberos, 133 Carabineros ni SAE/SENAPRED.`});
        success=true;
      }catch(e){error=e instanceof Error?e.message:'Fallo de correo'}
      try{await callAgentGateway('record-prealert',{reportId:report.id,secret:report.secret,actionId:item.actionId,success,error})}catch{}
    }
  }catch(error){console.error('Emergency agent failed',error)}
}
