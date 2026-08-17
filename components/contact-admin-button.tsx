'use client';
import { useState } from 'react';
export default function ContactAdminButton(){const [state,setState]=useState('');async function send(){setState('Enviando…');const r=await fetch('/api/staff/contact-admin',{method:'POST'});const j=await r.json().catch(()=>({}));setState(r.ok?'Notificación enviada al administrador.':j.error||'No se pudo notificar.')}return <div><button type="button" className="ops-contact-admin" onClick={send}>Contactar administrador</button>{state?<div className="ops-contact-state">{state}</div>:null}</div>}
