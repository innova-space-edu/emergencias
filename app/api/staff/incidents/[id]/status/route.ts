import { NextRequest, NextResponse, after } from 'next/server';
import { getApiStaff } from '@/lib/auth';
import { getServerSupabase } from '@/lib/supabase/server';
import { triggerStaffEventBroadcast } from '@/lib/email-broadcast';

export const runtime='nodejs';
const ALLOWED=new Set(['received','reviewing','verified','critical','notified','responding','resolved','discarded']);

export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}){
  const staff=await getApiStaff();
  if(!staff)return NextResponse.json({error:'No autorizado'},{status:401});
  const {id}=await params;
  try{
    const body=await req.json();
    const status=String(body.status||'');
    if(!ALLOWED.has(status))return NextResponse.json({error:'Estado inválido'},{status:400});
    const s=await getServerSupabase();
    const {data:before}=await s.from('incidents').select('id,public_code,status,resolved_at').eq('id',id).single();
    if(!before)return NextResponse.json({error:'Emergencia no encontrada'},{status:404});
    const patch:any={status,resolved_at:status==='resolved'?new Date().toISOString():null};
    const {data,error}=await s.from('incidents').update(patch).eq('id',id).select('id,public_code,status,resolved_at').single();
    if(error)throw error;
    try{await s.from('audit_log').insert({actor_user_id:staff.user.id,actor_role:staff.profile.role,action:status==='resolved'?'incident_resolved':'incident_status_changed',entity_type:'incident',entity_id:id,metadata:{from:before.status,to:status,public_code:before.public_code}})}catch{}
    if(before.status!==status&&['critical','responding','resolved'].includes(status)){
      const {data:{session}}=await s.auth.getSession();
      if(session?.access_token)after(()=>triggerStaffEventBroadcast(id,status as 'critical'|'responding'|'resolved',session.access_token));
    }
    return NextResponse.json({ok:true,incident:data});
  }catch(error){console.error(error);return NextResponse.json({error:'No fue posible actualizar la emergencia'},{status:500})}
}
