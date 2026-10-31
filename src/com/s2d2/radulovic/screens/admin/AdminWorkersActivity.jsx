import LoadFailureToast from '../../LoadFailureToast.jsx';
import { showToast } from '../../ui/components/Toast.jsx';
import React,{useLayoutEffect,useRef,useState} from 'react';
import Session from '../../network/Session.js';
import Modal from '../../ui/components/Modal.jsx';
import useBackLayer from '../../ui/components/useBackLayer.js';
import {Icon,Title,Search,Notice,useLoad,mutate,roles,roleIcons,roleLabels} from './AdminShared.jsx';
import AdminEmployeeForm from './AdminEmployeeForm.jsx';
import AdminWorkerDetailsActivity from './AdminWorkerDetailsActivity.jsx';
const tabs=['SVI','ŠEFOVI GRADILIŠTA','RADNICI','BAGERISTI','VOZAČI KAMIONA'];
export default function AdminWorkersActivity({onBack}) {
  const [tab,setTab]=useState(0),[search,setSearch]=useState(''),[child,setChild]=useState(null),[remove,setRemove]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const workers=useLoad(cb=>Session.getAllWorkersFromServerAdmin(cb),[],[]);
  const listScroll=useRef(0),restoreScroll=useRef(false);
  function openDetails(worker){listScroll.current=window.scrollY;setChild(worker);}
  const close=()=>{restoreScroll.current=child!=='add';setChild(null);if(child==='add')workers.reload();};
  useLayoutEffect(()=>{
    if(!child&&restoreScroll.current){
      const restore=()=>window.scrollTo(0,listScroll.current);
      restore();restoreScroll.current=false;
      // Restore again after the browser applies its Back-history scroll position.
      const frame=requestAnimationFrame(restore);
      return ()=>cancelAnimationFrame(frame);
    }
  },[child]);
  useBackLayer(!!child,close);
  const list=workers.data.filter(w=>(!tab||w.getRole()===roles[tab-1])&&w.getFullName().toLowerCase().includes(search.trim().toLowerCase())).sort((a,b)=>Number(b.isActive())-Number(a.isActive())||roles.indexOf(a.getRole())-roles.indexOf(b.getRole())||a.getFullName().localeCompare(b.getFullName()));
  function deleteWorker(){if(busy)return;setBusy(true);setError('');mutate('DELETE','workers/'+remove.getId(),{reason:'Admin obrisao'},{onSuccess(){setBusy(false);setRemove(null);workers.reload();},onFailure(){setBusy(false);showToast('Neuspešno brisanje zaposlenog.');}});}
  if(child==='add')return <AddEmployee onBack={close} onChanged={workers.reload}/>;
  if(child)return <AdminWorkerDetailsActivity worker={child} onBack={close}/>;
  return <section className="admin-screen admin-workers"><Title title="ZAPOSLENI" subtitle="Pregled i upravljanje zaposlenima." icon="ic_workers_black_no_bg_original_proportions" onBack={onBack}/><Search value={search} onChange={setSearch} placeholder="Pretraži zaposlene..."/><button type="button" className="admin-primary admin-add-worker" onClick={()=>setChild('add')}><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z"/></svg><span>Dodaj zaposlenog</span></button><div className="admin-worker-tabs" role="tablist">{tabs.map((label,i)=><button key={label} role="tab" aria-selected={tab===i} onClick={()=>setTab(i)}>{label}</button>)}</div>{workers.loading?<Notice>Učitavanje zaposlenih...</Notice>:workers.error?<LoadFailureToast message="Učitavanje zaposlenih nije uspelo."/>:!list.length?<Notice>Nema dostupnih zaposlenih.</Notice>:<div className="admin-worker-list">{list.map(w=><article key={w.getId()} className={'admin-worker-row '+(!w.isActive()?'inactive':'')}><button className="admin-worker-open" onClick={()=>openDetails(w)}><span><Icon name={roleIcons[w.getRole()]}/></span><div><strong>{w.getFullName()}</strong><small>{roleLabels[w.getRole()]}</small></div></button><button aria-label={'Obriši '+w.getFullName()} onClick={()=>{setRemove(w);setError('');}}><Icon name="ic_costs_trash"/></button></article>)}</div>}{remove&&<Modal className="admin-delete" title="Obriši zaposlenog?" busy={busy} onClose={()=>setRemove(null)} actions={<><button className="text-button" disabled={busy} onClick={()=>setRemove(null)}>Otkaži</button><button className="admin-danger" disabled={busy} onClick={deleteWorker}>{busy?'Brisanje...':'Obriši'}</button></>}><p>Da li ste sigurni da želite da obrišete zaposlenog {remove.getFullName()}?</p>{error&&<p className="error-message">{error}</p>}</Modal>}</section>;
}
function AddEmployee({onBack,onChanged}) {
  const [selected,setSelected]=useState(null),[open,setOpen]=useState(false);
  // Android finishes the role chooser when opening the form; reuse its history entry.
  if(open)return <AdminEmployeeForm role={selected} onBack={onBack} onSaved={onChanged}/>;
  return <section className="admin-screen admin-form admin-add-employee"><Title title="DODAJ ZAPOLSENOG" subtitle="Izaberite ulogu novog zaposlenog." icon="ic_workers_black_no_bg_original_proportions" onBack={onBack}/><div className="admin-card admin-role-choices"><h2>Uloga</h2>{roles.map(role=><button key={role} aria-pressed={selected===role} onClick={()=>setSelected(role)}><Icon name={roleIcons[role]}/><strong>{roleLabels[role]}</strong><img className="app-chevron" src="/assets/drawable/ic_chevron_right.svg" alt="" /></button>)}</div><footer><button className="admin-primary" disabled={!selected} onClick={()=>setOpen(true)}>Nastavi</button></footer></section>;
}
