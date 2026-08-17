export type EmergencyGroupItem={id:string;category?:string|null;severity?:number|null;last_reported_at?:string|null;received_at?:string|null;created_at?:string|null};

function dateOf(item:EmergencyGroupItem,dateField:'last_reported_at'|'received_at'|'created_at'){
  const raw=item[dateField]||item.last_reported_at||item.received_at||item.created_at;
  return raw?new Date(raw):new Date(0);
}

export function hourKey(item:EmergencyGroupItem,dateField:'last_reported_at'|'received_at'|'created_at'='last_reported_at'){
  const d=dateOf(item,dateField);
  const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0'),h=String(d.getHours()).padStart(2,'0');
  return `${y}-${m}-${day}T${h}`;
}

export function hourLabel(key:string){
  const [date,hour]=key.split('T');const d=new Date(`${date}T${hour}:00:00`);
  const today=new Date(),yesterday=new Date();yesterday.setDate(today.getDate()-1);
  const same=(a:Date,b:Date)=>a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
  const prefix=same(d,today)?'Hoy':same(d,yesterday)?'Ayer':d.toLocaleDateString('es-CL',{day:'2-digit',month:'2-digit',year:'numeric'});
  return `${prefix} · ${hour}:00–${hour}:59`;
}

export function groupByHourAndCategory<T extends EmergencyGroupItem>(items:T[],dateField:'last_reported_at'|'received_at'|'created_at'='last_reported_at'){
  const sorted=[...items].sort((a,b)=>dateOf(b,dateField).getTime()-dateOf(a,dateField).getTime());
  const hours=new Map<string,Map<string,T[]>>();
  for(const item of sorted){
    const hk=hourKey(item,dateField),cat=item.category||'other';
    if(!hours.has(hk))hours.set(hk,new Map());const cats=hours.get(hk)!;
    if(!cats.has(cat))cats.set(cat,[]);cats.get(cat)!.push(item);
  }
  return [...hours.entries()].map(([key,cats])=>({key,label:hourLabel(key),count:[...cats.values()].reduce((n,a)=>n+a.length,0),categories:[...cats.entries()].map(([category,rows])=>({category,count:rows.length,rows:[...rows].sort((a,b)=>(Number(b.severity||0)-Number(a.severity||0))||(dateOf(b,dateField).getTime()-dateOf(a,dateField).getTime()))}))}));
}

export function hourlyCounts<T extends EmergencyGroupItem>(items:T[],dateField:'last_reported_at'|'received_at'|'created_at'='last_reported_at',hours=24){
  const cutoff=Date.now()-hours*60*60*1000;
  return groupByHourAndCategory(items.filter(i=>dateOf(i,dateField).getTime()>=cutoff),dateField);
}
