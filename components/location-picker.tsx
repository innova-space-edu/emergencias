'use client';
import { useEffect, useRef, useState } from 'react';
import type * as Leaflet from 'leaflet';

type Coordinates={lat:number;lng:number;accuracy?:number};

export default function LocationPicker({value,onChange}:{value:Coordinates|null;onChange:(v:Coordinates)=>void}){
  const host=useRef<HTMLDivElement|null>(null);
  const mapRef=useRef<Leaflet.Map|null>(null);
  const markerRef=useRef<Leaflet.Marker|null>(null);
  const [mapUnavailable,setMapUnavailable]=useState(false);
  const [tileProblem,setTileProblem]=useState(false);

  useEffect(()=>{
    if(!host.current||mapRef.current)return;
    let cancelled=false;
    let map:Leaflet.Map|undefined;
    (async()=>{
      try{
        const L=await import('leaflet');
        if(cancelled||!host.current)return;
        map=L.map(host.current,{zoomControl:true,attributionControl:true,preferCanvas:false}).setView([value?.lat??-23.6509,value?.lng??-70.3975],value?15:12);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
          maxZoom:19,
          attribution:'© OpenStreetMap contributors',
          crossOrigin:true,
          updateWhenIdle:true,
          keepBuffer:2,
        }).on('tileerror',()=>setTileProblem(true)).addTo(map);
        map.on('click',(e:Leaflet.LeafletMouseEvent)=>onChange({lat:e.latlng.lat,lng:e.latlng.lng}));
        mapRef.current=map;
        window.setTimeout(()=>map?.invalidateSize(),120);
      }catch{
        setMapUnavailable(true);
      }
    })();
    return()=>{cancelled=true;map?.remove();mapRef.current=null;markerRef.current=null};
  // El mapa se crea una sola vez; value se sincroniza en el efecto siguiente.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  useEffect(()=>{
    const map=mapRef.current;
    if(!map||!value)return;
    (async()=>{
      const L=await import('leaflet');
      if(!markerRef.current){
        const icon=L.divIcon({
          className:'leaflet-emergency-marker-wrap',
          html:'<span class="leaflet-emergency-marker"><span></span></span>',
          iconSize:[34,44],
          iconAnchor:[17,42],
        });
        markerRef.current=L.marker([value.lat,value.lng],{draggable:true,icon}).addTo(map);
        markerRef.current.on('dragend',()=>{
          const p=markerRef.current!.getLatLng();
          onChange({lat:p.lat,lng:p.lng});
        });
      }else markerRef.current.setLatLng([value.lat,value.lng]);
      map.setView([value.lat,value.lng],Math.max(map.getZoom(),15),{animate:false});
    })().catch(()=>setMapUnavailable(true));
  },[value,onChange]);

  function fullscreen(){
    const el=host.current?.parentElement;
    if(el?.requestFullscreen)el.requestFullscreen().catch(()=>{});
  }

  if(mapUnavailable){
    return <div className="location-picker-fallback-text"><b>Mapa no disponible en este navegador.</b><span>La ubicación GPS sigue registrada y puedes completar sector y dirección manualmente.</span>{value?<code>{value.lat.toFixed(6)}, {value.lng.toFixed(6)}</code>:null}</div>;
  }

  return <div className="location-picker-wrap">
    <div className="location-picker" ref={host}/>
    <button type="button" className="leaflet-fullscreen-button" onClick={fullscreen} aria-label="Ampliar mapa">⛶</button>
    {tileProblem?<span className="picker-fallback">Problema cargando algunas calles. El GPS y el punto siguen activos.</span>:null}
    <span className="picker-hint">Toca el mapa o arrastra el marcador para ajustar el punto.</span>
  </div>;
}
