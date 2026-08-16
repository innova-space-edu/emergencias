'use client';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { getBrowserSupabase } from '@/lib/supabase/browser';
import { STATUS_COLOR, STATUS_LABEL } from '@/lib/constants';

type Filters={code:string;commune:string;locality:string;status:string;from:string;to:string};
const EMPTY:Filters={code:'',commune:'',locality:'',status:'',from:'',to:''};
const PAGE_SIZE=50;

export default function IncidentHistory(){
  const [draft,setDraft]=useState<Filters>(EMPTY),[filters,setFilters]=useState<Filters>(EMPTY),[rows,setRows]=useState<any[]>([]),[page,setPage]=useState(0),[count,setCount]=useState(0),[loading,setLoading]=useState(true),[error,setError]=useState('');
  const pages=useMemo(()=>Math.max(1,Math.ceil(count/PAGE_SIZE)),[count]);
  useEffect(()=>{let cancelled=false;(async()=>{setLoading(true);setError('');try{
    const s=getBrowserSupabase();
    let q=s.from('incidents').select('id,public_code,title,category,status,severity,region,commune,locality,address_approx,reports_count,first_reported_at,last_reported_at,resolved_at',{count:'exact'});
    if(filters.code.trim())q=q.ilike('public_code',`%${filters.code.trim()}%`);
    if(filters.commune.trim())q=q.ilike('commune',`%${filters.commune.trim()}%`);
    if(filters.locality.trim())q=q.ilike('locality',`%${filters.locality.trim()}%`);
    if(filters.status)q=q.eq('status',filters.status);
    if(filters.from)q=q.gte('last_reported_at',new Date(`${filters.from}T00:00:00`).toISOString());
    if(filters.to)q=q.lte('last_reported_at',new Date(`${filters.to}T23:59:59.999`).toISOString());
    const {data,error,count}=await q.order('last_reported_at',{ascending:false}).range(page*PAGE_SIZE,page*PAGE_SIZE+PAGE_SIZE-1);
    if(error)throw error;if(!cancelled){setRows(data||[]);setCount(count||0)}
  }catch(e){if(!cancelled)setError(e instanceof Error?e.message:'No se pudo cargar el historial')}finally{if(!cancelled)setLoading(false)}})();return()=>{cancelled=true}},[filters,page]);
  function submit(e:FormEvent){e.preventDefault();setPage(0);setFilters({...draft})}
  function clear(){setDraft(EMPTY);setFilters(EMPTY);setPage(0)}
  return <div className="content-shell ops-page history-shell">
    <div className="page-heading"><span className="eyebrow">ARCHIVO OPERATIVO</span><h1>Historial general de emergencias</h1><p>Todas las emergencias registradas, incluidas las finalizadas. Ordenadas de más nuevas a más antiguas.</p></div>
    <form className="history-filters panel-card" onSubmit={submit}>
      <label>Código<input value={draft.code} onChange={e=>setDraft({...draft,code:e.target.value})} placeholder="EMG-..."/></label>
      <label>Comuna<input value={draft.commune} onChange={e=>setDraft({...draft,commune:e.target.value})} placeholder="Antofagasta"/></label>
      <label>Localidad / sector<input value={draft.locality} onChange={e=>setDraft({...draft,locality:e.target.value})} placeholder="Centro, La Chimba..."/></label>
      <label>Estado<select value={draft.status} onChange={e=>setDraft({...draft,status:e.target.value})}><option value="">Todos</option>{Object.entries(STATUS_LABEL).filter(([s])=>s!=='pending_sync').map(([s,l])=><option key={s} value={s}>{l}</option>)}</select></label>
      <label>Desde<input type="date" value={draft.from} onChange={e=>setDraft({...draft,from:e.target.value})}/></label>
      <label>Hasta<input type="date" value={draft.to} onChange={e=>setDraft({...draft,to:e.target.value})}/></label>
      <div className="history-filter-actions"><button className="btn btn-primary" type="submit">Filtrar</button><button className="btn btn-secondary" type="button" onClick={clear}>Limpiar</button></div>
    </form>
    <div className="history-summary"><b>{count.toLocaleString('es-CL')} emergencia(s)</b><span>Página {page+1} de {pages}</span></div>
    {error?<div className="alert danger">{error}</div>:null}
    <div className="history-list">
      {loading?<div className="panel-card">Cargando historial…</div>:rows.length===0?<div className="panel-card muted">No hay emergencias con esos filtros.</div>:rows.map(r=><article className="history-row" key={r.id}>
        <div className="history-state"><i style={{background:STATUS_COLOR[r.status]||'#64748b'}}/><span>{STATUS_LABEL[r.status]||r.status}</span></div>
        <div className="history-main"><div><b>{r.public_code}</b><strong>{r.title||r.category}</strong></div><p>{r.address_approx||r.locality||r.commune||'Ubicación registrada'}</p><small>{r.commune||'—'}{r.locality?` · ${r.locality}`:''} · {r.reports_count||0} reporte(s)</small></div>
        <div className="history-dates"><span><b>Última actividad</b>{new Date(r.last_reported_at).toLocaleString('es-CL')}</span><span><b>Finalizada</b>{r.resolved_at?new Date(r.resolved_at).toLocaleString('es-CL'):'—'}</span></div>
      </article>)}
    </div>
    <div className="history-pagination"><button className="btn btn-secondary" disabled={page===0||loading} onClick={()=>setPage(p=>Math.max(0,p-1))}>← Más nuevas</button><button className="btn btn-secondary" disabled={page+1>=pages||loading} onClick={()=>setPage(p=>p+1)}>Más antiguas →</button></div>
  </div>;
}
