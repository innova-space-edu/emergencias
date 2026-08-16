'use client';
import { useRouter } from 'next/navigation';
import { getBrowserSupabase } from '@/lib/supabase/browser';
export default function LogoutButton(){const router=useRouter();return <button className="text-button" onClick={async()=>{await getBrowserSupabase().auth.signOut();router.replace('/login');router.refresh();}}>Cerrar sesión</button>}
