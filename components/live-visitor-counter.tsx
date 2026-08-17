'use client';
import {useEffect,useState} from 'react';
import {createPortal} from 'react-dom';
import {getBrowserSupabase} from '@/lib/supabase/browser';

const CHANNEL='innova-emergency-public-visitors';

export default function LiveVisitorCounter(){
  const [count,setCount]=useState(0);
  const [connected,setConnected]=useState(false);
  const [target,setTarget]=useState<Element|null>(null);

  useEffect(()=>{
    const findTarget=()=>setTarget(document.querySelector('.admin-dashboard-hero .admin-hero-actions'));
    findTarget();
    const observer=new MutationObserver(findTarget);
    observer.observe(document.body,{childList:true,subtree:true});
    return()=>observer.disconnect();
  },[]);

  useEffect(()=>{
    const s=getBrowserSupabase();
    const channel=s.channel(CHANNEL);
    const sync=()=>{
      const state=channel.presenceState() as Record<string,unknown[]>;
      setCount(Object.keys(state).length);
    };
    channel.on('presence',{event:'sync'},sync).subscribe(status=>{
      if(status==='SUBSCRIBED'){
        setConnected(true);
        sync();
      }else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'||status==='CLOSED'){
        setConnected(false);
      }
    });
    return()=>{void s.removeChannel(channel)};
  },[]);

  if(!target)return null;
  return createPortal(
    <span className="live-chip" title="Navegadores públicos conectados ahora mediante Supabase Realtime Presence">
      <i/>{connected?`${count.toLocaleString('es-CL')} visitante${count===1?'':'s'} en línea`:'Conectando contador…'}
    </span>,
    target
  );
}
