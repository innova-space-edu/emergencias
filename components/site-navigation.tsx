'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function SiteNavigation(){
  const [open,setOpen]=useState(false);
  useEffect(()=>{
    const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false)};
    window.addEventListener('keydown',onKey);
    return()=>window.removeEventListener('keydown',onKey);
  },[]);
  const close=()=>setOpen(false);
  return <>
    <nav className="topnav desktop-topnav" aria-label="Navegación principal">
      <Link href="/mapa">Mapa</Link>
      <Link className="nav-emergency" href="/reportar">Reportar emergencia</Link>
      <Link href="/acceso">Solicitar acceso</Link>
      <Link className="nav-operations" href="/login">Centro de operaciones</Link>
    </nav>
    <div className="mobile-top-actions">
      <Link className="mobile-report-btn" href="/reportar"><span className="mobile-report-long">Reportar emergencia</span><span className="mobile-report-short">Reportar</span></Link>
      <button className="mobile-menu-toggle" type="button" aria-expanded={open} aria-controls="mobile-main-menu" aria-label={open?'Cerrar menú':'Abrir menú'} onClick={()=>setOpen(v=>!v)}>{open?'×':'☰'}</button>
    </div>
    {open?<div className="mobile-nav-backdrop" onClick={close} aria-hidden="true"/>:null}
    <nav id="mobile-main-menu" className={`mobile-nav-panel ${open?'open':''}`} aria-label="Navegación móvil">
      <div className="mobile-nav-head"><div><b>Innova Emergency</b><small>Navegación</small></div><button type="button" onClick={close} aria-label="Cerrar menú">×</button></div>
      <Link href="/mapa" onClick={close}><span>Mapa de emergencias</span><small>Ver incidentes públicos en tiempo real</small></Link>
      <Link className="mobile-nav-danger" href="/reportar" onClick={close}><span>Reportar emergencia</span><small>GPS, descripción, fotografías y videos</small></Link>
      <Link href="/acceso" onClick={close}><span>Solicitar acceso institucional</span><small>Organizaciones, autoridades y operadores</small></Link>
      <Link className="mobile-nav-operations" href="/login" onClick={close}><span>Centro de operaciones</span><small>Administrador · Operador · Autoridad</small></Link>
    </nav>
  </>;
}
