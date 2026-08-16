'use client';
import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { Map as MapLibreMap, Marker as MapLibreMarker } from 'maplibre-gl';
type Coordinates={lat:number;lng:number;accuracy?:number};
const fallbackStyle:any={version:8,sources:{osm:{type:'raster',tiles:['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],tileSize:256,attribution:'© OpenStreetMap contributors'}},layers:[{id:'osm',type:'raster',source:'osm'}]};
export default function LocationPicker({value,onChange}:{value:Coordinates|null;onChange:(v:Coordinates)=>void}){
 const host=useRef<HTMLDivElement|null>(null),mapRef=useRef<MapLibreMap|null>(null),markerRef=useRef<MapLibreMarker|null>(null);const [fallback,setFallback]=useState(false);
 useEffect(()=>{if(!host.current||mapRef.current)return;const map=new maplibregl.Map({container:host.current,style:process.env.NEXT_PUBLIC_MAP_STYLE_URL||'https://tiles.openfreemap.org/styles/liberty',center:[value?.lng??-70.3975,value?.lat??-23.6509],zoom:value?15:11.5,attributionControl:true});map.addControl(new maplibregl.NavigationControl({showCompass:false}),'top-right');map.addControl(new maplibregl.FullscreenControl(),'top-right');let swapped=false;map.on('error',()=>{if(swapped)return;swapped=true;setFallback(true);try{map.setStyle(fallbackStyle)}catch{}});map.on('click',e=>onChange({lat:e.lngLat.lat,lng:e.lngLat.lng}));mapRef.current=map;return()=>{map.remove();mapRef.current=null}},[]);
 useEffect(()=>{const map=mapRef.current;if(!map||!value)return;if(!markerRef.current){markerRef.current=new maplibregl.Marker({draggable:true}).setLngLat([value.lng,value.lat]).addTo(map);markerRef.current.on('dragend',()=>{const p=markerRef.current!.getLngLat();onChange({lat:p.lat,lng:p.lng})})}else markerRef.current.setLngLat([value.lng,value.lat]);map.flyTo({center:[value.lng,value.lat],zoom:Math.max(map.getZoom(),14),essential:true});},[value,onChange]);
 return <div className="location-picker-wrap"><div className="location-picker" ref={host}/>{fallback?<span className="picker-fallback">Mapa de respaldo activo</span>:null}<span className="picker-hint">Toca el mapa o arrastra el marcador para ajustar el punto.</span></div>;
}
