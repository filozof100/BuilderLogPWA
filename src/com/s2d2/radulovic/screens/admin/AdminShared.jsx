import React, { useEffect, useState } from 'react';
import Session from '../../network/Session.js';
import WebUtils from '../../network/WebUtils.js';
import Role from '../../employee/Role.js';
import { DatePicker, dateLabel } from '../../ui/components/AttendancePickers.jsx';
import TimeUtils from '../../utils/TimeUtils.js';
import './Admin.css';
export const roles = [Role.SITE_MANAGER, Role.WORKER, Role.OPERATOR, Role.TRUCK_DRIVER];
export const roleLabels = { SITE_MANAGER:'Šef gradilišta', WORKER:'Radnik', OPERATOR:'Bagerista', TRUCK_DRIVER:'Vozač kamiona' };
export const roleIcons = { SITE_MANAGER:'ic_site_manager_black', WORKER:'ic_construction_worker_black', OPERATOR:'ic_excavator_driver', TRUCK_DRIVER:'ic_truck_driver_black' };
export const today = () => TimeUtils.formatDate(new Date());
export const monthStart = () => today().slice(0,8)+'01';
export const money = value => value == null ? '-' : new Intl.NumberFormat('sr-RS',{maximumFractionDigits:2}).format(value);
export function minutes(start,end) {
  if(!/^\d{2}:\d{2}$/.test(start)||!/^\d{2}:\d{2}$/.test(end)) return null;
  const toMinutes=v=>Number(v.slice(0,2))*60+Number(v.slice(3,5));
  return (toMinutes(end)-toMinutes(start)+1440)%1440;
}
export function hours(value) {
  if(value==null)return '-';
  const whole=Math.floor(value/60),remainder=value%60;
  return remainder?(whole?`${whole}h ${remainder}min`:`${remainder}min`):`${whole}h`;
}
export function Icon({name,...props}) { return <img src={'/assets/drawable/'+name+'.svg'} alt="" {...props}/>; }
export function Title({title,subtitle,icon}) { return <header className="admin-title"><span><Icon name={icon}/></span><div><h1>{title}</h1>{subtitle&&<p>{subtitle}</p>}</div></header>; }
export function Notice({children}) { return <div className="admin-notice" role="status">{children}</div>; }
export function Search({value,onChange,placeholder}) { return <label className="admin-search"><Icon name="ic_search"/><input aria-label={placeholder} placeholder={placeholder} value={value} onChange={e=>onChange(e.target.value)}/></label>; }
export function useLoad(request, deps, initial=null) {
  const [state,setState]=useState({data:initial,loading:true,error:false});
  const [retry,setRetry]=useState(0);
  useEffect(()=>{let live=true;setState(s=>({...s,loading:true,error:false}));
    request({onSuccess(data,...extra){if(live)setState({data,extra,loading:false,error:false});},onFailure(){if(live)setState({data:initial,loading:false,error:true});}});
    return()=>{live=false;};
  },[...deps,retry]);
  return {...state,reload:()=>setRetry(v=>v+1)};
}
export function mutate(method,path,data,callback) {
  try { WebUtils['send'+method+'Request'](path,JSON.stringify(data),{Authorization:Session.getSessionToken()},callback); }
  catch(error){callback.onFailure(error);}
}
export function DateField({label,value,onChange,disabled=false}) {
  const [open,setOpen]=useState(false);
  return <><label className="admin-date"><span>{label}</span><button type="button" disabled={disabled} onClick={()=>setOpen(true)}><Icon name="ic_calendar"/>{dateLabel(value)}</button></label>{open&&<DatePicker date={value} onClose={()=>setOpen(false)} onConfirm={v=>{onChange(v);setOpen(false);}}/>}</>;
}
export function DateRange({from,to,onChange}) { return <div className="admin-date-range"><DateField label="Od" value={from} onChange={v=>onChange(v,v>to?v:to)}/><DateField label="Do" value={to} onChange={v=>onChange(v<from?v:from,v)}/></div>; }
export function Value({label,value}) { return <div className="admin-value"><small>{label}</small><strong>{value??'-'}</strong></div>; }
// Material outlined vectors used by the Android details screens.
export function MaterialIcon({name,size=24,...props}) {
  const paths={
    clock:'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2ZM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8Zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7Z',
    event:'M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2Zm0 16H5V8h14v11ZM5 6V5h14v1H5Zm11.53 5.06-1.06-1.06-4.88 4.88-2.12-2.12-1.06 1.06 3.18 3.18 5.94-5.94Z',
    warning:'M1 21h22L12 2 1 21Zm3.47-2L12 5.99 19.53 19H4.47ZM11 16h2v2h-2v-2Zm0-6h2v4h-2v-4Z',
    check:'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8Zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8-1.41-1.42Z',
    edit:'M14.06 9.02l.92.92L5.92 19H5v-.92l9.06-9.06M17.66 3c-.25 0-.51.1-.7.29l-1.83 1.83 3.75 3.75 1.83-1.83a.996.996 0 0 0 0-1.41l-2.34-2.34a.99.99 0 0 0-.71-.29Zm-3.6 3.19L3 17.25V21h3.75L17.81 9.94l-3.75-3.75Z',
    down:'M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41Z',
  };
  return <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" {...props}><path fill="currentColor" d={paths[name]}/></svg>;
}
export function Summary({label,value,unit='RSD',color='blue',onClick,icon,iconSize,iconOffset=0}) {
  const defaults={
    'Dana prisutan':['event',25], 'Ukupno sati':['clock',25], 'Akontacije':['ic_wallet_black',20],
    'Za isplatu':['ic_payment',25], 'Broj gradilišta':['ic_construction_site',25],
    'Zadužen novac':['ic_wallet_black',18], 'Opravdani troškovi':['ic_document_lines_black',18], 'Razlika':['balance_scale',25],
  };
  const [asset,size]=[icon??defaults[label]?.[0]??'ic_wallet_black',iconSize??defaults[label]?.[1]??18];
  return <button type="button" className={'admin-summary '+color} onClick={onClick} disabled={!onClick}>
    <span className="admin-summary-copy"><span>{label}</span><strong>{value}</strong>{unit&&<small>{unit}</small>}</span>
    <span className="admin-summary-icon" style={{width:size,height:size,transform:`translateY(${iconOffset}px)`}}>
      {asset==='event'||asset==='clock'?<MaterialIcon name={asset} size={size}/>:<i style={{maskImage:`url(/assets/drawable/${asset}.svg)`}}/>}
    </span>
  </button>;
}

export function WorkerOwner({worker,icon}) {
  return <article className="admin-worker-owner"><Icon name={icon??roleIcons[worker.getRole()]}/><div><small>{roleLabels[worker.getRole()]?.toLocaleUpperCase('sr-Latn')}</small><strong>{worker.getFullName()}</strong></div><b style={{color:worker.isActive()?'#168a35':'#e00015'}}>{worker.isActive()?'Aktivan':'Neaktivan'}</b></article>;
}
export function AdvanceDateRange({from,to,onChange}) {
  return <div className="admin-date-range admin-advance-dates">{[['Od',from],['Do',to]].map(([label,date],i)=>onChange?<DateField key={label} label={label} value={date} onChange={v=>i?onChange(v<from?v:from,v):onChange(v,v>to?v:to)}/>:<label className="admin-date" key={label}><span>{label}</span><button type="button" disabled><Icon name="ic_calendar"/>{dateLabel(date)}</button></label>)}</div>;
}
