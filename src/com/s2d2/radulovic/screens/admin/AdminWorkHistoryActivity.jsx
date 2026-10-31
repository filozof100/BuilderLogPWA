import LoadFailureToast from '../../LoadFailureToast.jsx';
import { withRsd } from '../../utils/MoneyDisplay.js';
import React,{useState} from 'react';
import Session from '../../network/Session.js';
import SelectionDropdown from '../../ui/components/SelectionDropdown.jsx';
import {Title,Search,Notice,DateField,Value,useLoad,today,minutes,hours,roleLabels,roles} from './AdminShared.jsx';
const allSites={isAllSites:true,getId:()=>-1,getName:()=> 'Sva gradilišta'};
export default function AdminWorkHistoryActivity({onBack, initialSite = null, lockSite = false}) {
  const [site,setSite]=useState(initialSite),[date,setDate]=useState(today),[search,setSearch]=useState(''),[expanded,setExpanded]=useState(null);
  const sites=useLoad(cb=>Session.getAllSitesFromServer(cb),[],[]);
  const attendance=useLoad(cb=>{
    if(!site){cb.onSuccess({rows:[],absent:[]});return;}
    if(site===allSites) Session.getLiveWorkerAttendancesAllSites(date,{onSuccess:(map,absent)=>cb.onSuccess({rows:[...map.values()].flat(),absent}),onFailure:cb.onFailure});
    else Session.getLiveWorkerAttendancesPerSite(date,site.getId(),{onSuccess:rows=>cb.onSuccess({rows,absent:[]}),onFailure:cb.onFailure});
  },[site,date],{rows:[],absent:[]});
  const match=w=>w.getFullName().toLowerCase().includes(search.trim().toLowerCase());
  const rank=a=>a.getMachine()?.getType()==='excavator'?1:a.getMachine()?.getType()==='truck'?2:0;
  const rows=attendance.data.rows.filter(a=>match(a.getWorker())).sort((a,b)=>rank(a)-rank(b)||a.getWorker().getFullName().localeCompare(b.getWorker().getFullName()));
  const groups=new Map(sites.data.map(s=>[s.getId(),{name:s.getName(),rows:[]} ]));
  rows.forEach(a=>{if(!groups.has(a.getConstructionSiteId()))groups.set(a.getConstructionSiteId(),{name:a.getConstructionSiteName(),rows:[]});groups.get(a.getConstructionSiteId()).rows.push(a);});
  const grouped=[...groups].sort((a,b)=>a[1].name.localeCompare(b[1].name));
  const absent=attendance.data.absent.filter(match).sort((a,b)=>['WORKER','OPERATOR','TRUCK_DRIVER','SITE_MANAGER'].indexOf(a.getRole())-['WORKER','OPERATOR','TRUCK_DRIVER','SITE_MANAGER'].indexOf(b.getRole())||a.getFullName().localeCompare(b.getFullName()));
  if(absent.length)grouped.push(['absent',{name:'Nisu radili',rows:absent}]);
  return <section className="admin-screen admin-live"><Title title="EVIDENCIJA RADA" subtitle="Prisustvo radnika po gradilištu i datumu." icon="ic_clock" onBack={onBack}/><SelectionDropdown label="Gradilište" placeholder="Izaberite gradilište" icon="ic_construction_site_crane" options={[allSites,...sites.data]} selected={site} disabled={lockSite} onSelected={s=>{setSite(s);setExpanded(null);}}/>{sites.error&&null}<div className="admin-live-date"><DateField label="Datum" value={date} onChange={d=>{setDate(d);setExpanded(null);}}/><button className="admin-primary" onClick={()=>{setDate(today());setExpanded(null);attendance.reload();}}>DANAS</button></div><Search value={search} onChange={setSearch} placeholder="Pretraži radnike..."/>{!site?<Notice>Nije odabrano gradilište.</Notice>:attendance.loading?<Notice>Učitavanje evidencije rada...</Notice>:attendance.error?<LoadFailureToast message="Učitavanje evidencije rada nije uspelo."/>:site===allSites?<div className="admin-live-groups">{grouped.map(([id,g])=><React.Fragment key={id}><button className={'admin-group '+(id==='absent'?'absent':'')} aria-expanded={expanded===id} onClick={()=>setExpanded(expanded===id?null:id)}><strong>{g.name}</strong><span>{new Set(g.rows.map(a=>id==='absent'?a.getId():a.getWorkerId())).size}</span><img className="selection-chevron" src={'/assets/drawable/ic_chevron_' + (expanded===id?'down':'right') + '.svg'} alt="" /></button>{expanded===id&&(g.rows.length?g.rows.map((a,i)=><AttendanceRow key={i} attendance={id==='absent'?null:a} worker={id==='absent'?a:a.getWorker()}/>):<Notice>Nema evidentiranih radnika za izabrani datum.</Notice>)}</React.Fragment>)}</div>:rows.length?rows.map((a,i)=><AttendanceRow key={i} attendance={a} worker={a.getWorker()}/>):<Notice>Nema evidentiranih radnika za izabrani datum.</Notice>}</section>;
}
function AttendanceRow({attendance:a,worker}) { return <article className="admin-attendance"><header><i className={a?'present':'absent'}/><strong>{worker.getFullName()}</strong>{a?<b>RADIO</b>:<small>{roleLabels[worker.getRole()]}</small>}</header>{a&&<><small>{a.getMachine()?.getType()==='excavator'?'Bagerista':a.getMachine()?.getType()==='truck'?'Vozač kamiona':'Radnik'}</small><div className="admin-values"><Value label="Od" value={a.getStartedAt()}/><Value label="Do" value={a.getFinishedAt()}/><Value label="Ukupno sati" value={hours(minutes(a.getStartedAt(),a.getFinishedAt()))}/><Value label="Akontacija" value={Number(a.getAdvance())?withRsd(Number(a.getAdvance())):'-'}/></div></>}</article>; }
