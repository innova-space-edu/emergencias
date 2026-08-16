'use client';
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type * as Leaflet from 'leaflet';
import { STATUS_COLOR, STATUS_LABEL, STATUS_LEGEND } from '@/lib/constants';
import { getBrowserSupabase } from '@/lib/supabase/browser';
import type { PublicIncident } from '@/lib/types';

type Mode='public'|'preview'|'staff';
function categoryLabel(v:string){const map:Record<string,string>={fire:'Incendio',traffic_accident:'Accidente vehicular',medical:'Emergencia médica',flood:'Inundación',landslide:'Aluvión / derrumbe',earthquake_damage:'Daños por sismo',power_outage:'Corte de energía',electrical_hazard:'Riesgo eléctrico',gas_leak:'Fuga de gas',water_outage:'Corte de agua',fallen_tree:'Árbol / poste caído',missing_person:'Persona desaparecida',maritime:'Emergencia marítima',security:'Riesgo de seguridad',pollution:'Contaminación',other:'Otra emergencia'};return map[v]||v}
function pointColor(status:string){return STATUS_COLOR[status]||'#eab308'}
const ACTIVE_STATUSES=['received','reviewing','verified','critical','notified','responding'];

export default function EmergencyMap({mode='public',onSelect,refreshToken=0}:{mode?:Mode;onSelect?:(id:string)=>void;refreshToken?:number}){
 const container=useRef<HTMLDivElement|null>(null),mapRef=useRef<Leaflet.Map|null>(null),pointsRef=useRef<Leaflet.LayerGroup|null>(null);const [incidents,setIncidents]=useState<PublicIncident[]>([]);const [selected,setSelected]=useState<string|null>(null);const [panelOpen,setPanelOpen]=useState(mode!=='preview');const [panelExpanded,setPanelExpanded]=useState(false);const [loading,setLoading]=useState(true);const [mapError,setMapError]=useState(false);const [mapUnavailable,setMapUnavailable]=useState(false);const [search,setSearch]=useState('');const [searching,setSearching]=useState(false);const [searchResults,setSearchResults]=useState<any[]>([]);
 const selectedIncident=useMemo(()=>incidents.find(i=>i.id===selected)||null,[incidents,selected]);
 const load=useCallback(async()=>{setLoading(true);try{
   if(mode==='staff'){
     const s=getBrowserSupabase();
     const {data}=await s.from('incidents').select('id,public_code,category,title,public_summary,severity,status,latitude,longitude,region,commune,locality,address_approx,reports_count,first_reported_at,last_reported_at,resolved_at,incident_notifications(organization_name,channel,status,sent_at,delivered_at,confirmed_at)').in('status',ACTIVE_STATUSES).order('last_reported_at',{ascending:false}).limit(600);
     setIncidents((data||[]) as unknown as PublicIncident[]);
   }else{
     const r=await fetch('/api/public/incidents',{cache:'no-store'});const j=await r.json();if(r.ok&&Array.isArray(j.incidents))setIncidents(mode==='preview'?j.incidents.slice(0,100):j.incidents.slice(0,600));
   }
 }finally{setLoading(false)}},[mode,refreshToken]);
 useEffect(()=>{load();const t=setInterval(load,30000);return()=>clearInterval(t)},[load]);

 useEffect(()=>{
   if(!container.current||mapRef.current)return;
   let cancelled=false;let map:Leaflet.Map|undefined;
   (async()=>{try{
     const L=await import('leaflet');if(cancelled||!container.current)return;
     map=L.map(container.current,{zoomControl:true,attributionControl:true,preferCanvas:false}).setView([-23.6509,-70.3975],mode==='preview'?11:12);
     const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors',crossOrigin:true,updateWhenIdle:true,keepBuffer:2});
     tiles.on('tileerror',()=>setMapError(true));tiles.on('load',()=>setMapError(false));tiles.addTo(map);
     pointsRef.current=L.layerGroup().addTo(map);mapRef.current=map;window.setTimeout(()=>map?.invalidateSize(),120);
   }catch{setMapUnavailable(true)}})();
   return()=>{cancelled=true;map?.remove();mapRef.current=null;pointsRef.current=null};
 },[mode]);

 useEffect(()=>{
   const map=mapRef.current,group=pointsRef.current;if(!map||!group)return;
   let alive=true;(async()=>{const L=await import('leaflet');if(!alive)return;group.clearLayers();for(const i of incidents){if(!Number.isFinite(i.latitude)||!Number.isFinite(i.longitude))continue;const marker=L.circleMarker([i.latitude,i.longitude],{radius:i.severity>=5?11:i.severity>=3?9:8,color:'#fff',weight:3,fillColor:pointColor(i.status),fillOpacity:1});marker.bindTooltip(`${i.public_code} · ${categoryLabel(i.category)} · ${STATUS_LABEL[i.status]||i.status}`,{direction:'top'});marker.on('click',()=>{setSelected(i.id);setPanelOpen(true);onSelect?.(i.id)});group.addLayer(marker)}})().catch(()=>setMapUnavailable(true));return()=>{alive=false};
 },[incidents,onSelect]);

 useEffect(()=>{window.setTimeout(()=>mapRef.current?.invalidateSize(),200)},[panelOpen,panelExpanded]);
 async function geocode(e:FormEvent){e.preventDefault();if(search.trim().length<3)return;setSearching(true);try{const r=await fetch(`/api/geocode?q=${encodeURIComponent(search.trim())}`);const j=await r.json();setSearchResults(j.results||[]);if(j.results?.[0]){const x=j.results[0];mapRef.current?.setView([Number(x.lat),Number(x.lon)],16)}}finally{setSearching(false)}}
 function focusIncident(i:PublicIncident){setSelected(i.id);setPanelOpen(true);mapRef.current?.setView([i.latitude,i.longitude],16);onSelect?.(i.id)}
 function useMyLocation(){if(!navigator.geolocation)return;navigator.geolocation.getCurrentPosition(p=>mapRef.current?.setView([p.coords.latitude,p.coords.longitude],16),()=>{}, {enableHighAccuracy:true,timeout:12000,maximumAge:15000})}
 function fullscreen(){const el=container.current?.parentElement;if(el?.requestFullscreen)el.requestFullscreen().catch(()=>{})}

 if(mapUnavailable)return <div className={`emergency-map-shell ${mode==='preview'?'preview':''}`}><div className="map-unavailable"><b>El mapa interactivo no está disponible en este navegador.</b><span>Los reportes y coordenadas siguen funcionando. Puedes usar GPS y abrir puntos en Google Maps desde los detalles.</span></div></div>;

 return <div className={`emergency-map-shell ${mode==='preview'?'preview':''} ${panelOpen?'panel-open':''}`}>
   <div className="map-canvas leaflet-universal-map" ref={container}/>
   {mode!=='preview'?<><button className="map-gps-button" type="button" onClick={useMyLocation} title="Ir a mi ubicación">⌖</button><button className="map-fullscreen-button" type="button" onClick={fullscreen} title="Pantalla completa">⛶</button></>:null}
   {mode!=='preview'?<div className="map-search-wrap"><form className="map-search" onSubmit={geocode}><input value={search} onChange={e=>{setSearch(e.target.value);if(e.target.value.length<3)setSearchResults([])}} placeholder="Buscar calle, dirección o sector"/><button>{searching?'…':'Buscar'}</button></form>{searchResults.length?<div className="map-search-results">{searchResults.map((r,i)=><button key={`${r.lat}-${r.lon}-${i}`} onClick={()=>{mapRef.current?.setView([Number(r.lat),Number(r.lon)],17);setSearchResults([])}}>{r.displayName}</button>)}</div>:null}</div>:null}
   {mode!=='preview'?<button className="panel-toggle" onClick={()=>setPanelOpen(v=>!v)}>{panelOpen?'Ocultar panel':mode==='staff'?'Mostrar activas':'Mostrar emergencias'}</button>:null}
   {panelOpen&&mode!=='preview'?<aside className={`map-panel ${panelExpanded?'expanded':''}`}>
     <div className="map-panel-head"><div><span className="eyebrow">{mode==='staff'?'EMERGENCIAS ACTIVAS':'ÚLTIMAS 24 HORAS'}</span><h2>{selectedIncident?selectedIncident.public_code:mode==='staff'?'Operación activa':'Mapa ciudadano'}</h2></div><div className="map-panel-controls"><button className="icon-button" title={panelExpanded?'Reducir panel':'Ampliar panel'} onClick={()=>setPanelExpanded(v=>!v)}>{panelExpanded?'↘':'↗'}</button><button className="icon-button" title="Cerrar panel" onClick={()=>setPanelOpen(false)}>×</button></div></div>
     <div className="status-legend">{STATUS_LEGEND.filter(([s])=>s!=='discarded'||mode==='staff').map(([s,l])=><span key={s}><i style={{background:STATUS_COLOR[s]}}/>{l}</span>)}</div>
     {selectedIncident?<div className="incident-public-card"><span className={`severity-pill s${selectedIncident.severity}`}>Prioridad {selectedIncident.severity}/5</span><h3>{selectedIncident.title||categoryLabel(selectedIncident.category)}</h3><p>{selectedIncident.public_summary||'Información pública en revisión.'}</p><dl><div><dt>Estado</dt><dd><span className="state-dot" style={{background:pointColor(selectedIncident.status)}}/> {STATUS_LABEL[selectedIncident.status]||selectedIncident.status}</dd></div><div><dt>Ubicación</dt><dd>{selectedIncident.address_approx||selectedIncident.locality||selectedIncident.commune||'Coordenadas registradas'}</dd></div><div><dt>Reportes asociados</dt><dd>{selectedIncident.reports_count}</dd></div><div><dt>Última actualización</dt><dd>{new Date(selectedIncident.last_reported_at).toLocaleString('es-CL')}</dd></div></dl><h4>Canalización / notificaciones</h4><div className="notification-list">{selectedIncident.notifications.length?selectedIncident.notifications.map((n,i)=><div key={`${n.organization}-${i}`}><b>{n.organization}</b><span>{n.channel} · {n.status}</span></div>):<span className="muted">Sin notificaciones registradas todavía.</span>}</div><div className="map-card-actions"><button className="btn btn-secondary btn-sm" onClick={()=>mapRef.current?.setView([selectedIncident.latitude,selectedIncident.longitude],17)}>Centrar punto</button><button className="btn btn-secondary btn-sm" onClick={()=>window.open(`https://www.google.com/maps?q=${selectedIncident.latitude},${selectedIncident.longitude}`,'_blank','noopener,noreferrer')}>Abrir en Google Maps</button><button className="text-button" onClick={()=>setSelected(null)}>Volver a la lista</button></div></div>:<div className="incident-list">{loading?<p>Cargando incidentes…</p>:incidents.length===0?<p className="muted">{mode==='staff'?'No hay emergencias activas.':'No hay emergencias públicas en las últimas 24 horas.'}</p>:incidents.map(i=><button key={i.id} onClick={()=>focusIncident(i)}><span className="dot" style={{background:pointColor(i.status)}}></span><div><b>{i.title||categoryLabel(i.category)}</b><small>{i.commune||i.locality||'Ubicación registrada'} · {STATUS_LABEL[i.status]||i.status}</small></div></button>)}</div>}
   </aside>:null}
   {mapError&&mode!=='preview'?<div className="map-fallback-banner">Algunas imágenes del mapa no pudieron cargar. El GPS y los puntos continúan activos.</div>:null}
 </div>;
}
