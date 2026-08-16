import { NextRequest, NextResponse } from 'next/server';
import { getApiStaff } from '@/lib/auth';
import { getServerSupabase } from '@/lib/supabase/server';
export const runtime='nodejs';
export async function POST(req:NextRequest){
  const staff=await getApiStaff();if(!staff)return NextResponse.json({error:'No autorizado'},{status:401});
  try{const {path,evidenceId}=await req.json();if(typeof path!=='string'||!path||path.includes('..'))return NextResponse.json({error:'Ruta inválida'},{status:400});const s=await getServerSupabase();const {data,error}=await s.storage.from('emergency-evidence').createSignedUrl(path,600);if(error||!data?.signedUrl)return NextResponse.json({error:'No se pudo abrir la evidencia'},{status:403});try{await s.from('audit_log').insert({actor_user_id:staff.user.id,actor_role:staff.profile.role,action:'evidence_view_url_created',entity_type:'evidence',entity_id:String(evidenceId||''),metadata:{path}})}catch{}return NextResponse.json({url:data.signedUrl,expiresIn:600})}catch{return NextResponse.json({error:'No se pudo abrir la evidencia'},{status:500})}
}
