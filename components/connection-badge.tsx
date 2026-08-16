'use client';
import { useEffect, useState } from 'react';
export default function ConnectionBadge() {
  const [online,setOnline]=useState(true);
  useEffect(()=>{const update=()=>setOnline(navigator.onLine);update();window.addEventListener('online',update);window.addEventListener('offline',update);return()=>{window.removeEventListener('online',update);window.removeEventListener('offline',update)}},[]);
  return <span className={`connection-badge ${online?'online':'offline'}`}>{online?'● En línea':'● Sin conexión'}</span>;
}
