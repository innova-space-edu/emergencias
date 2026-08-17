'use client';
import {useEffect} from 'react';
import {usePathname} from 'next/navigation';
import {getBrowserSupabase} from '@/lib/supabase/browser';

const CHANNEL='innova-emergency-public-visitors';
const VISITOR_KEY='innova-emergency-visitor-id';

function visitorId(){
  try{
    const existing=window.localStorage.getItem(VISITOR_KEY);
    if(existing)return existing;
    const created=typeof crypto!=='undefined'&&'randomUUID' in crypto?crypto.randomUUID():`visitor-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(VISITOR_KEY,created);
    return created;
  }catch{
    return typeof crypto!=='undefined'&&'randomUUID' in crypto?crypto.randomUUID():`visitor-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

export default function SiteVisitorPresence(){
  const pathname=usePathname();
  useEffect(()=>{
    if(!pathname||pathname.startsWith('/operaciones')||pathname.startsWith('/login'))return;
    const s=getBrowserSupabase();
    const key=visitorId();
    const channel=s.channel(CHANNEL,{config:{presence:{key}}});
    let subscribed=false;

    channel.subscribe(async (status:string)=>{
      if(status==='SUBSCRIBED'){
        subscribed=true;
        await channel.track({online_at:new Date().toISOString()});
      }
    });

    return()=>{
      if(subscribed)void channel.untrack().catch(()=>{});
      void s.removeChannel(channel);
    };
  },[pathname]);
  return null;
}
