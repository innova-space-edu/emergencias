'use client';

type Slice={label:string;value:number;color:string};
export default function AdminDonut({title,total,slices,centerLabel}:{title:string;total:number;slices:Slice[];centerLabel?:string}){
 const clean=slices.filter(s=>Number(s.value)>0);let cursor=0;const stops=clean.map(s=>{const start=total?cursor/total*360:0;cursor+=Number(s.value);const end=total?cursor/total*360:0;return `${s.color} ${start}deg ${end}deg`});const background=stops.length?`conic-gradient(${stops.join(',')})`:'conic-gradient(#e6edf3 0deg 360deg)';
 return <article className="modern-donut-card"><div className="modern-donut-head"><h3>{title}</h3><span>{total.toLocaleString('es-CL')} total</span></div><div className="modern-donut-body"><div className="modern-donut" style={{background}}><div><b>{total.toLocaleString('es-CL')}</b><small>{centerLabel||'registros'}</small></div></div><div className="modern-donut-legend">{clean.length?clean.slice(0,8).map(s=><div key={s.label}><i style={{background:s.color}}/><span>{s.label}</span><b>{s.value.toLocaleString('es-CL')}</b><small>{total?Math.round(s.value/total*100):0}%</small></div>):<p className="muted">Sin datos todavía.</p>}</div></div></article>
}
