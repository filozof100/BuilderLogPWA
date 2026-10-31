import LoadFailureToast from '../../LoadFailureToast.jsx';
import { withRsd } from '../../utils/MoneyDisplay.js';
import useForegroundRefresh from '../../ui/components/useForegroundRefresh.js';
import React,{useEffect,useRef,useState} from 'react';
import Session from '../../network/Session.js';
import Modal from '../../ui/components/Modal.jsx';
import useBackLayer from '../../ui/components/useBackLayer.js';
import AuthenticatedImage from '../../ui/components/AuthenticatedImage.jsx';
import { ImagePreview } from './AdminDeliveryNoteDetails.jsx';
import './AdminDeliveryNotesActivity.css';
import './AdminConstructionSiteExpensesActivity.css';
import {Title,Notice,DateRange,Summary,Value,useLoad,money,today,monthStart} from './AdminShared.jsx';
import {Identity,WorkerTasks,dateKey} from './AdminWorkerDetailsActivity.jsx';
import AdminEmployeeForm from './AdminEmployeeForm.jsx';
import AdminAssignAdvanceToManagerActivity from './AdminAssignAdvanceToManagerActivity.jsx';
export default function AdminManagerDetailsActivity({worker,onBack,initialFrom,initialTo}) {
  const [version,setVersion]=useState(0),[from,setFrom]=useState(initialFrom || monthStart),[to,setTo]=useState(initialTo || today),[tab,setTab]=useState(0),[child,setChild]=useState(null),[preview,setPreview]=useState(null);
  useForegroundRefresh(()=>setVersion(v=>v+1),child===null);
  const info=useLoad(cb=>Session.getWorkerDetailsAdmin(worker.getId(),cb),[worker.getId(),version]);
  const current=info.data??worker;
  const sites=useLoad(cb=>Session.getAssignedSitesForManager(worker.getId(),cb),[worker.getId(),version],[]);
  const details=useLoad(cb=>Session.getManagerDetailsAdmin(worker.getId(),from,to,cb),[worker.getId(),from,to,version],[]);
  const close=()=>{setChild(null);if(!child?.expense)setVersion(v=>v+1);};useBackLayer(!!child,close);
  if(child==='edit')return <AdminEmployeeForm role={current.getRole()} worker={current} onBack={close} onSaved={close}/>;
  if(child==='tasks')return <WorkerTasks worker={current} onBack={close}/>;
  if(child==='advances')return <AdminAssignAdvanceToManagerActivity worker={current} initialFrom={from} initialTo={to} onBack={close}/>;
  if(child?.expense)return <ExpenseDetails expense={child.expense} manager={current.getFullName()} onBack={close}/>;
  const summaries=details.data.flatMap(d=>[...d.getExpensesByDate()].filter(([,v])=>v.first||v.second).map(([date,v])=>({date,site:d.getConstructionSite(),expenses:v.first,advances:v.second,total:v.first+v.second}))).sort((a,b)=>dateKey(b.date).localeCompare(dateKey(a.date)));
  const expenses=details.data.flatMap(d=>d.getExpenses()).sort((a,b)=>dateKey(b.getDate()).localeCompare(dateKey(a.getDate())));
  const advances=details.data.flatMap(d=>d.getAdvances().filter(a=>a.getAmount()).map(a=>({date:a.getDate(),site:d.getConstructionSite(),worker:a.getWorkerName(),amount:a.getAmount()}))).sort((a,b)=>dateKey(b.date).localeCompare(dateKey(a.date)));
  const spent=summaries.reduce((sum,s)=>sum+s.total,0),assigned=details.extra?.[0]??0;
  return <section className="admin-screen admin-manager-details"><Title title="AKTIVNOST ŠEFA GRADILIŠTA" subtitle="Pregled aktivnosti šefa po izabranom periodu." icon="ic_site_manager_black" onBack={onBack}/>{info.error&&null}<Identity worker={current} onEdit={()=>setChild('edit')} onTasks={()=>setChild('tasks')}/><DateRange from={from} to={to} onChange={(a,b)=>{setFrom(a);setTo(b);}}/><div className="admin-summary-grid"><Summary label="Broj gradilišta" value={sites.error?'-':sites.data.length} unit="aktivna" onClick={()=>setPreview({sites:true})}/><Summary label="Zadužen novac" value={money(assigned)} color="gold" iconOffset={3.5} onClick={()=>setChild('advances')}/><Summary label="Opravdani troškovi" value={money(spent)} color="green" iconOffset={3.5}/><Summary label="Razlika" value={money(assigned-spent)} color="red"/></div><div className="admin-detail-tabs" role="tablist">{['GRADILIŠTA','TROŠKOVI','AKONTACIJE'].map((t,i)=><button role="tab" aria-selected={tab===i} key={t} onClick={()=>setTab(i)}>{t}</button>)}</div>{details.error?null:<ManagerTable tab={tab} summaries={summaries} expenses={expenses} advances={advances} onPreview={setPreview} onExpense={expense=>setChild({expense})}/>}{preview&&<ManagerPreview preview={preview} sites={sites} onClose={()=>setPreview(null)}/>}</section>;
}
function ExpenseDetails({expense:e,manager,onBack}) {
  const [image,setImage]=useState(false);
  return <section className="admin-screen admin-expense-details"><Title title="TROŠAK" subtitle="Pregled osnovnih podataka o trošku." icon="ic_wallet_black" onBack={onBack}/>{e.getUrl()?<button className="admin-receipt" onClick={()=>setImage(true)}><AuthenticatedImage url={e.getUrl()} alt="Slika računa"/></button>:<div className="admin-empty-receipt">Trošak nema sliku računa</div>}<ExpenseValue label="Iznos" value={e.getAmount()+' RSD'}/><ExpenseValue label="Naziv" value={e.getTitle()}/><ExpenseValue label="Gradilište" value={e.getConstructionSiteName()}/><ExpenseValue label="Šef gradilišta" value={manager}/><ExpenseValue label="Datum" value={e.getDate()}/><ExpenseValue label="Opis" value={e.getDescription()}/><button type="button" className="admin-expense-back" onClick={onBack}>Nazad</button>{image&&<ImagePreview image={e.getUrl()} label="Račun troška" className="admin-expense-preview" onClose={()=>setImage(false)}/>}</section>;
}
function ExpenseValue({label,value}) {
  return <Value label={label} value={value?.trim() ? value : '-'}/>;
}

function ManagerTable({tab,summaries,expenses,advances,onPreview,onExpense}) {
  const rows=tab===0?summaries:tab===1?expenses:advances;
  const headings=tab===0?['Gradilište','Datum','Troškovi','Akontacije']:['Gradilište','Datum',tab===1?'Naziv':'Radnik','Iznos'];
  if(!rows.length)return <Notice>{tab===0?'Nema gradilišta za izabrani period.':tab===1?'Nema troškova za izabrani period.':'Nema akontacija radnika za izabrani period.'}</Notice>;
  return <div className={'admin-manager-table '+(tab===0?'sites':tab===1?'expenses':'advances')} role="table">
    <div className="admin-table-head" role="row">{headings.map(h=><span role="columnheader" key={h}>{h}</span>)}</div>
    {rows.map((r,i)=><ManagerPreviewRow key={tab+":"+i} enabled={tab!==1} onHold={()=>onPreview({...r,held:true})} onRelease={()=>onPreview(null)} onClick={()=>tab===1?onExpense(r):onPreview(r)}>
      {(tab===0?[r.site,r.date,withRsd(money(r.expenses)),withRsd(money(r.advances))]:tab===1?[r.getConstructionSiteName(),r.getDate(),r.getTitle(),withRsd(money(Number(r.getAmount())))]:[r.site,r.date,r.worker,withRsd(money(r.amount))]).map((value,j)=><span key={j}>{value||'-'}</span>)}
    </ManagerPreviewRow>)}
  </div>;
}

function ManagerPreview({preview:p,sites,onClose}) {
  return <ManagerPreviewContainer held={p.held} className={'admin-details-modal admin-manager-preview '+(p.sites?'assigned-sites':'')} title={p.sites?'DODELJENA GRADILIŠTA':p.worker?'PREGLED AKONTACIJE':'PREGLED GRADILIŠTA'} onClose={onClose} actions={p.sites?<button className="admin-primary" onClick={onClose}>Zatvori</button>:null}>
    {p.sites?<><p className="admin-assigned-description">Gradilišta dodeljena izabranom šefu gradilišta.</p><div className="admin-assigned-list">{sites.error?<LoadFailureToast message="Učitavanje dodeljenih gradilišta nije uspelo."/>:sites.loading?<Notice>Učitavanje gradilišta...</Notice>:sites.data.length?sites.data.map(s=><div className="admin-assigned-row" key={s.getId()}><span><i/></span><strong>{s.getName()}</strong></div>):<Notice>Nema dodeljenih gradilišta.</Notice>}</div></>:
      <><div className="admin-preview-info"><span>Gradilište:</span><strong>{p.site}</strong></div><div className="admin-preview-info"><span>Datum:</span><strong>{p.date}</strong></div>{p.worker&&<div className="admin-preview-info"><span>Radnik:</span><strong>{p.worker}</strong></div>}
      <div className={'admin-preview-amounts '+(p.worker?'advance':'')}>{p.worker?<Value label="Iznos" value={withRsd(money(p.amount))}/>:<><Value label="Troškovi" value={withRsd(money(p.expenses))}/><Value label="Akontacije" value={withRsd(money(p.advances))}/><Value label="Ukupno" value={withRsd(money(p.total))}/></>}</div></>}
  </ManagerPreviewContainer>;
}


function ManagerPreviewRow({enabled,onHold,onRelease,onClick,children}) {
  const press=useRef(null),suppressClick=useRef(false);
  useEffect(()=>()=>clearTimeout(press.current?.timer),[]);
  function finish() {
    const point=press.current;
    if(!point)return;
    clearTimeout(point.timer);
    press.current=null;
    if(point.held)onRelease();
  }
  function down(event) {
    if(!enabled||!event.isPrimary||event.button!==0)return;
    suppressClick.current=false;
    const point={x:event.clientX,y:event.clientY,held:false};
    point.timer=setTimeout(()=>{
      point.held=true;
      suppressClick.current=true;
      onHold();
    },500);
    press.current=point;
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function move(event) {
    const point=press.current;
    if(point&&!point.held&&Math.hypot(event.clientX-point.x,event.clientY-point.y)>8) {
      suppressClick.current=true;
      finish();
    }
  }
  return <button type="button" className="admin-finance-row manager-preview-row"
    onPointerDown={down} onPointerMove={move} onPointerUp={finish}
    onPointerCancel={()=>{suppressClick.current=true;finish();}} onLostPointerCapture={finish}
    onContextMenu={event=>{if(enabled)event.preventDefault();}}
    onClick={event=>{if(event.detail!==0&&suppressClick.current){suppressClick.current=false;return;}onClick();}}>
    {children}
  </button>;
}

function ManagerPreviewContainer({held,title,children,...props}) {
  useEffect(()=>{
    if(!held)return;
    const previous=document.body.style.overflow;
    document.body.style.overflow='hidden';
    return ()=>{document.body.style.overflow=previous;};
  },[held]);
  if(!held)return <Modal title={title} {...props}>{children}</Modal>;
  return <div className="admin-manager-held-preview">
    <div className={'app-dialog '+props.className} role="dialog" aria-label={title}>
      <div className="app-dialog-content"><h2>{title}</h2><div className="app-dialog-body">{children}</div></div>
    </div>
  </div>;
}
