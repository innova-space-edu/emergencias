import { redirect } from 'next/navigation';
import { getServerSupabase } from '@/lib/supabase/server';

export async function requireStaff() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('user_id,email,full_name,organization,role,active').eq('user_id',user.id).maybeSingle();
  if (!profile?.active) redirect('/login?inactive=1');
  return { user, profile };
}

export async function getApiStaff() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('user_id,email,role,active').eq('user_id',user.id).maybeSingle();
  if (!profile?.active) return null;
  return { user, profile };
}
