'use client';
import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserSupabase } from '@/lib/supabase/browser';
export default function LoginForm(){
 const router=useRouter(); const [loading,setLoading]=useState(false); const [error,setError]=useState('');
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setLoading(true);setError('');const form=new FormData(e.currentTarget);const email=String(form.get('email')||'').trim();const password=String(form.get('password')||'');const s=getBrowserSupabase();const {data,error}=await s.auth.signInWithPassword({email,password});if(error){setError('No se pudo iniciar sesión. Revisa tus credenciales.');setLoading(false);return;}if(data.user){const {data:profile}=await s.from('profiles').select('role,active').eq('user_id',data.user.id).maybeSingle();if(!profile?.active){await s.auth.signOut();setError('La cuenta no está habilitada para acceder al Centro de operaciones.');setLoading(false);return;}}router.replace('/operaciones');router.refresh();}
 return <form className="stack-form" onSubmit={submit}><label>Correo institucional<input name="email" type="email" required autoComplete="email" /></label><label>Contraseña<input name="password" type="password" required autoComplete="current-password" /></label><label className="legal-consent"><input name="terms" type="checkbox" required/><span>He leído y acepto los <Link href="/terminos">términos y condiciones de Innova Emergency</Link>.</span></label>{error?<div className="alert danger">{error}</div>:null}<button className="btn btn-primary" disabled={loading}>{loading?'Ingresando…':'Ingresar'}</button></form>;
}
