import LoadFailureToast from '../../LoadFailureToast.jsx';
import { AdminTaskRow } from './AdminTaskRow.jsx';
import { showToast } from '../../ui/components/Toast.jsx';
import { useAdminTaskEditor } from './AdminEditTaskActivity.jsx';
import { withRsd } from '../../utils/MoneyDisplay.js';
import useForegroundRefresh from '../../ui/components/useForegroundRefresh.js';
import { TaskDetails } from '../manager/TasksActivity.jsx';
import React,{useEffect,useRef,useState} from 'react';
import Session from '../../network/Session.js';
import Role from '../../employee/Role.js';
import TimeUtils from '../../utils/TimeUtils.js';
import useBackLayer from '../../ui/components/useBackLayer.js';
import Modal from '../../ui/components/Modal.jsx';
import {Title,Icon,MaterialIcon,Notice,Value,Summary,DateRange,WorkerOwner,AdvanceDateRange,useLoad,mutate,roleIcons,roleLabels,today,monthStart,money,minutes,hours} from './AdminShared.jsx';
import AdminEmployeeForm from './AdminEmployeeForm.jsx';
import AdminWorkerPaymentsActivity from './AdminWorkerPaymentsActivity.jsx';
import AdminManagerDetailsActivity from './AdminManagerDetailsActivity.jsx';
export default function AdminWorkerDetailsActivity(props) {
  return props.worker.getRole()===Role.SITE_MANAGER?<AdminManagerDetailsActivity {...props}/>:<WorkerDetails {...props}/>;
}
export function Identity({worker,onEdit,onTasks}) {
  const phone=worker.getPhoneNumber()?.trim();
  return <article className="admin-card admin-identity"><div className="admin-identity-top"><div><small>Ime i prezime</small><strong>{worker.getFullName()}</strong><p>{roleLabels[worker.getRole()]} • <span style={{color:worker.isActive()?'#0e8a3a':'#e00015'}}>{worker.isActive()?'Aktivan':'Neaktivan'}</span></p></div><div className="admin-identity-actions">{onEdit&&<button onClick={onEdit}><MaterialIcon name="edit" size={17}/>Izmeni</button>}<div><small>Broj telefona</small>{phone?<a href={'tel:'+phone}>{phone}</a>:<b>-</b>}</div></div></div>{worker.getHourlyRate&&<p className="admin-hourly-rate">Cena radnog sata: {money(worker.getHourlyRate())} RSD/h</p>}{onTasks&&<button className="admin-identity-tasks" onClick={onTasks}><Icon name="ic_tasks_black"/>Zadaci<Icon className="admin-task-chevron" name="ic_chevron_right"/></button>}</article>;
}
const estimatedMinutes=(start,end,driver=false)=>driver&&!/^\d{2}:\d{2}$/.test(start)?0:!/^\d{2}:\d{2}$/.test(end)?480:minutes(start,end)??0;
function WorkerDetails({worker,onBack,initialFrom,initialTo}) {
  const [version,setVersion]=useState(0),[from,setFrom]=useState(initialFrom || monthStart),[to,setTo]=useState(initialTo || today),[child,setChild]=useState(null),[expanded,setExpanded]=useState(null);
  useForegroundRefresh(()=>setVersion(v=>v+1),child===null);
  const info=useLoad(cb=>Session.getWorkerDetailsAdmin(worker.getId(),cb),[worker.getId(),version]);
  const current=info.data??worker,role=current.getRole(),driver=role!==Role.WORKER,truck=role===Role.TRUCK_DRIVER;
  const attendance=useLoad(cb=>Session.getWorkerAttendancesAdmin(worker.getId(),from,to,cb),[worker.getId(),from,to,version],[]);
  const logs=useLoad(cb=>driver?Session[truck?'getTruckDriverLogsAdmin':'getExcavatorDriverLogsAdmin'](worker.getId(),from,to,cb):cb.onSuccess([]),[worker.getId(),from,to,version],[]);
  const salary=useLoad(cb=>Session.getWorkerSalaryAdmin(worker.getId(),cb),[worker.getId(),version]);
  const close=()=>{setChild(null);setVersion(v=>v+1);};useBackLayer(!!child,close);
  if(child==='edit')return <AdminEmployeeForm worker={current} role={role} onBack={close} onSaved={close}/>;
  if(child==='payments')return <AdminWorkerPaymentsActivity worker={current} initialFrom={from} initialTo={to} onBack={close}/>;
  if(child==='advances')return <WorkerAdvances worker={current} rows={attendance.data} from={from} to={to} onBack={close}/>;
  if(child==='tasks')return <WorkerTasks worker={current} onBack={close}/>;
  const rows=driver?logs.data:attendance.data;
  const totals=rows.reduce((sum,a)=>sum+estimatedMinutes(driver?TimeUtils.convertTime(a.getManagerStartedAt()):a.getStartedAt(),driver?TimeUtils.convertTime(a.getManagerFinishedAt()):a.getFinishedAt(),driver),0);
  const operatorTotal=driver?logs.data.reduce((sum,a)=>sum+estimatedMinutes(TimeUtils.convertTime(truck?a.getDriverStartedAt():a.getOperatorStartedAt()),TimeUtils.convertTime(truck?a.getDriverFinishedAt():a.getOperatorFinishedAt()),true),0):0;
  return <section data-role={role} className={'admin-screen admin-worker-details '+(driver?'admin-driver-details':'admin-plain-worker-details')}><Title title={truck?'AKTIVNOST VOZAČA KAMIONA':driver?'AKTIVNOST BAGERISTE':'AKTIVNOST RADNIKA'} subtitle={'Pregled aktivnosti '+(truck?'vozača':driver?'bageriste':'zaposlenog')+' po izabranom periodu.'} icon={roleIcons[role]} onBack={onBack}/>{!driver&&info.error&&<LoadFailureToast message="Učitavanje podataka radnika nije uspelo."/>}<Identity worker={current} onEdit={()=>setChild('edit')} onTasks={driver?()=>setChild('tasks'):null}/><DateRange from={from} to={to} onChange={(a,b)=>{setFrom(a);setTo(b);setExpanded(null);}}/><div className="admin-summary-grid"><Summary label="Dana prisutan" value={driver?new Set(rows.map(a=>a.getDate())).size:rows.length} unit="dana"/>{driver?<div className="admin-hours-summary"><h2>Ukupno sati<MaterialIcon name="clock" size={18}/></h2><p>Šef <strong>{hours(totals)}</strong></p><p>{truck?'Vozač':'Bagerista'} <strong>{hours(operatorTotal)}</strong></p></div>:<Summary label="Ukupno sati" value={hours(totals)} unit="sati" color="green"/>}<Summary label="Akontacije" value={attendance.error?'-':withRsd(money(attendance.data.reduce((sum,a)=>sum+(Number(a.getAdvance())||0),0)))} color="gold" unit="iznos" iconSize={driver?30:20} onClick={()=>setChild('advances')}/><Summary label="Za isplatu" value={withRsd(money(salary.data?.getOutstanding()))} unit="ukupno dugovanje" color="red" icon={driver?'ic_wallet_black':'ic_payment'} iconSize={driver?30:25} onClick={()=>setChild('payments')}/></div><h2>Evidencija aktivnosti</h2>{driver&&attendance.error&&<LoadFailureToast message="Učitavanje akontacija nije uspelo."/>}{salary.error&&<LoadFailureToast message="Učitavanje ukupnog dugovanja nije uspelo."/>}{logs.error&&null}{<div className="admin-activity-list">{rows.map((a,i)=><ActivityEntry key={i} entry={a} driver={driver} truck={truck} expanded={expanded===i} onToggle={()=>setExpanded(expanded===i?null:i)}/>)}</div>}</section>;
}
function ActivityEntry({entry:a,driver,truck,expanded,onToggle}) {
  const card=useRef(null);
  useEffect(()=>{
    if(!expanded)return;
    const timer=setTimeout(()=>card.current?.scrollIntoView({block:'nearest',inline:'nearest',behavior:'smooth'}),50);
    return ()=>clearTimeout(timer);
  },[expanded]);
  const start=driver?TimeUtils.convertTime(a.getManagerStartedAt()):a.getStartedAt();
  const end=driver?TimeUtils.convertTime(a.getManagerFinishedAt()):a.getFinishedAt();
  const incomplete=!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(end);
  const driverStart=driver?TimeUtils.convertTime(truck?a.getDriverStartedAt():a.getOperatorStartedAt()):null;
  const driverEnd=driver?TimeUtils.convertTime(truck?a.getDriverFinishedAt():a.getOperatorFinishedAt()):null;
  return <article ref={card} className={'admin-activity-card '+(driver?'driver ':'')+(truck?'truck ':'')+(expanded?'expanded':'')}>
    <button type="button" className="admin-activity-header" aria-label="Detalji evidencije" aria-expanded={expanded} onClick={onToggle}>
      <span>{a.getDate()}</span><span className={'admin-entry-status '+(incomplete?'warning':'complete')}>
        {(truck||incomplete)&&<MaterialIcon name={incomplete?'warning':'check'} size={truck?28:20}/>}</span>
      {!truck&&<strong>{a.getConstructionSiteName()||'-'}</strong>}
    </button>
    {expanded&&<>{driver?<div className="admin-time-blocks"><TimeBlock title="Šef" start={start} end={end} total={hours(estimatedMinutes(start,end,true))}/><TimeBlock title={truck?'Vozač':'Bagerista'} start={driverStart} end={driverEnd} total={hours(estimatedMinutes(driverStart,driverEnd,true))}/></div>:<div className="admin-values"><Value label="Od" value={start}/><Value label="Do" value={end}/><Value label="Ukupno" value={hours(estimatedMinutes(start,end))}/><Value label="Akontacija" value={withRsd(a.getAdvance())}/></div>}
    {truck&&<div className="admin-values admin-kilometers"><Value label="Km početak" value={a.getStartKm()}/><Value label="Km kraj" value={a.getEndKm()}/></div>}</>}
  </article>;
}
function TimeBlock({title,start,end,total}) {
  return <div className="admin-time-block"><h2>{title}</h2><div><Value label="Od" value={start}/><Value label="Do" value={end}/><Value label="Ukupno" value={total}/></div></div>;
}

function WorkerAdvances({worker,rows,from,to,onBack}) {
  const amount=value=>{const text=String(value??'');const number=Number(text.replace(',','.'));return text.trim()&&Number.isFinite(number)?number.toLocaleString('sr-RS',{maximumFractionDigits:2}):text||'-';};
  const [selected,setSelected]=useState(null);const advances=rows.filter(a=>Number(a.getAdvance())).sort((a,b)=>dateKey(b.getDate()).localeCompare(dateKey(a.getDate())));
  return <section className="admin-screen admin-worker-advances"><Title title="AKONTACIJE" subtitle="Pregled akontacija zaposlenog." icon="ic_wallet_black" onBack={onBack}/><WorkerOwner worker={worker}/><AdvanceDateRange from={from} to={to}/><h2>Akontacije</h2>{advances.length?<div className="admin-advance-list">{advances.map((a,i)=><button className="admin-finance-row" key={i} onClick={()=>setSelected(a)}><Value label="Datum" value={a.getDate()||'-'}/><Value label="Gradilište" value={a.getConstructionSiteName()||'-'}/><Value label="Iznos" value={withRsd(amount(a.getAdvance()))}/></button>)}</div>:<Notice>Nema akontacija za izabrani period.</Notice>}{selected&&<Modal className="admin-advance-details" title={<><span className="admin-advance-dialog-icon"><Icon name="ic_wallet_black"/></span><span>Detalji akontacije</span></>} onClose={()=>setSelected(null)} actions={<button className="text-button" onClick={()=>setSelected(null)}>Zatvori</button>}><Value label="Gradilište" value={selected.getConstructionSiteName()||'-'}/><Value label="Datum" value={selected.getDate()||'-'}/><Value label="Iznos" value={withRsd(amount(selected.getAdvance()))}/></Modal>}</section>;
}
export function dateKey(date) {return date?.slice(6,10)+date?.slice(3,5)+date?.slice(0,2);}
export function WorkerTasks({worker,onBack}) {
  const [removed,setRemoved]=useState([]);
  const [removing,setRemoving]=useState(null);
  const [busy,setBusy]=useState(false);
  const deleting=useRef(false);
  const tasks=useLoad(cb=>Session.getAllTasksFromServerAdmin(worker,null,{
    onSuccess(general,workerTasks){setRemoved([]);cb.onSuccess(workerTasks);},onFailure:cb.onFailure,
  }),[worker.getId()],[]);
  const { editing, editTask, editor } = useAdminTaskEditor(tasks.reload);
  useForegroundRefresh(tasks.reload, !editing);
  const [group,setGroup]=useState(null),[selected,setSelected]=useState(null);
  function remove() {
    if(deleting.current)return;
    deleting.current=true;setBusy(true);
    const taskId=removing.getId();
    mutate('DELETE','tasks/'+taskId,{reason:'Admin obrisao'},{
      onSuccess(){setRemoved(ids=>[...ids,taskId]);deleting.current=false;setBusy(false);setRemoving(null);showToast('Zadatak je obrisan');},
      onFailure(){deleting.current=false;setBusy(false);showToast('Brisanje zadatka nije uspelo');},
    });
  }
  return <>{editor}<section className="admin-screen admin-worker-tasks" style={editing ? { display: 'none' } : undefined}>
    <Title title="ZADACI" subtitle="Pregled zadataka zaposlenog." icon="ic_tasks_black" onBack={onBack}/>
    <WorkerOwner worker={worker} icon={worker.getRole()===Role.OPERATOR?'ic_excavator_black':undefined}/>
    {tasks.error?<LoadFailureToast message="Učitavanje zadataka nije uspelo."/>:[false,true].map(done=>{
      const list=tasks.data.filter(t=>t.isCompleted()===done&&!removed.includes(t.getId()));
      return <div className={'admin-task-group '+(done?'complete completed':'incomplete')} key={String(done)}>
        <button type="button" className="admin-group" aria-expanded={group===done} onClick={()=>setGroup(group===done?null:done)}>
          <div><strong>{done?'Završeni':'Nezavršeni'}</strong><small>{tasks.loading?'Učitavanje zadataka...':'Broj zadataka: '+list.length}</small></div>
          <Icon name={group===done?'ic_chevron_down':'ic_chevron_right'}/>
        </button>
        {group===done&&!tasks.loading&&(!list.length?<Notice>Nema zadataka.</Notice>:list.map(task=><AdminTaskRow key={task.getId()} task={task} onOpen={setSelected} onEdit={task=>editTask(task,'Za: '+worker.getFullName())} onDelete={setRemoving}/>))}
      </div>;
    })}
    {selected && <TaskDetails task={{ name: selected.getTitle(), description: selected.getDescription(), assignedAt: selected.getDateCreated() }} onClose={() => setSelected(null)}/>}
    {removing && <Modal className="admin-task-delete" title="Obriši zadatak?" busy={busy} onClose={()=>setRemoving(null)} actions={<>
      <button type="button" disabled={busy} onClick={()=>setRemoving(null)}>Otkaži</button>
      <button type="button" className="admin-task-delete-confirm" disabled={busy} onClick={remove}>{busy?'Brisanje...':'Obriši'}</button>
    </>}><p>Da li ste sigurni da želite da obrišete zadatak {removing.getTitle()}?</p></Modal>}
  </section></>;
}
