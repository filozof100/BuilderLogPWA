import LoadFailureToast from '../../LoadFailureToast.jsx';
import { showToast } from '../../ui/components/Toast.jsx';
import Toast from '../../ui/components/Toast.jsx';
import React,{useState,useRef} from 'react';
import Session from '../../network/Session.js';
import Role from '../../employee/Role.js';
import Modal from '../../ui/components/Modal.jsx';
import {Title,Notice,roleLabels,roleIcons,useLoad,mutate} from './AdminShared.jsx';
const names={WORKER:['NOVI RADNIK','IZMENA PODATAKA ZA RADNIKA','radnika'],OPERATOR:['NOVI BAGERISTA','IZMENA PODATAKA ZA BAGERISTU','bageristu'],TRUCK_DRIVER:['NOVI VOZAČ KAMIONA','IZMENA PODATAKA ZA VOZAČA KAMIONA','vozača kamiona'],SITE_MANAGER:['NOVI ŠEF GRADILIŠTA','IZMENA PODATAKA ZA ŠEFA','šefa gradilišta']};
export default function AdminEmployeeForm({role,worker,onBack,onSaved}) {
  const manager=role===Role.SITE_MANAGER,plain=role===Role.WORKER,editing=!!worker;
  const blank=()=>({first_name:worker?.getFirstName()??'',last_name:worker?.getLastName()??'',username:worker?.getUsername()??'',password:!editing&&!plain?'password':'',hourly_rate:String(worker?.getHourlyRate?.()??''),phone:worker?.getPhoneNumber()??'',email:worker?.getEmail()??'',is_active:worker?.isActive()??true});
  const [fields,setFields]=useState(blank),[ids,setIds]=useState([]),[picker,setPicker]=useState(false),[draft,setDraft]=useState([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const [touched,setTouched]=useState({}),[submitted,setSubmitted]=useState(false);
  const form=useRef(null),lock=useRef(false);
  const requiredKeys=editing?[]:['first_name','last_name',...(!plain?['username','password']:[])];
  if(manager)requiredKeys.push('construction_site_ids');else requiredKeys.push('hourly_rate');
  const validationKeys=[...requiredKeys,'email'];
  const message=key=>employeeFieldError(key,key==='construction_site_ids'?(ids.length?'selected':''):fields[key],requiredKeys.includes(key));
  const visibleError=key=>(submitted||touched[key])?message(key):null;
  const touch=key=>setTouched(previous=>({...previous,[key]:true}));
  const errorProps=key=>({'aria-invalid':!!visibleError(key),'aria-describedby':visibleError(key)?'employee-error-'+key:undefined,onBlur:()=>touch(key)});
  const fieldError=key=>visibleError(key)&&<span className="employee-field-error" id={'employee-error-'+key}>{visibleError(key)}</span>;
  const sites=useLoad(cb=>{
    if(!manager){cb.onSuccess([]);return;}
    const load=assigned=>Session.getAllSitesFromServer({onSuccess:all=>{setIds(assigned.map(s=>s.getId()));cb.onSuccess([...new Map([...all,...assigned].map(s=>[s.getId(),s])).values()].sort((a,b)=>a.getName().localeCompare(b.getName())));},onFailure:cb.onFailure});
    if(editing)Session.getAssignedSitesForManager(worker.getId(),{onSuccess:load,onFailure:cb.onFailure});else load([]);
  },[role,worker?.getId()],[]);
  function change(key,value){setFields(f=>({...f,[key]:value}));setNotice('');}
  function submit(event){event.preventDefault();if(lock.current)return;setError('');setNotice('');
    setSubmitted(true);
    const invalid=validationKeys.find(key=>message(key));
    if(invalid){
      requestAnimationFrame(()=>{
        const control=form.current?.elements.namedItem(invalid);
        control?.focus({preventScroll:true});
        control?.closest('.admin-field')?.scrollIntoView({block:'nearest'});
      });
      return;
    }
    if(manager&&(sites.loading||sites.error||!ids.length)){setError('Proverite obavezna polja i izbor gradilišta.');return;}
    const body={email:fields.email.trim(),phone:fields.phone.trim(),is_active:fields.is_active};
    if(manager)body.construction_site_ids=ids;else body.hourly_rate=Number(fields.hourly_rate);
    if(!editing)Object.assign(body,{first_name:fields.first_name.trim(),last_name:fields.last_name.trim(),username:plain?fields.first_name.trim()+fields.last_name.trim():fields.username.trim(),password:plain?'no_needed_for_plain_worker':fields.password.trim(),role:role===Role.TRUCK_DRIVER?'driver':role.toLowerCase()});
    setTouched({});setSubmitted(false);
    lock.current=true;setBusy(true);
    mutate(editing?'PATCH':'POST',editing?'workers/'+worker.getId():'workers',body,{onSuccess(){lock.current=false;setBusy(false);showToast(editing ? 'Podaci uspešno ažurirani' : ({WORKER:'Radnik uspešno dodat',SITE_MANAGER:'Šef gradilišta uspešno dodat u sistem',OPERATOR:'Bagerista uspešno dodat u sistem',TRUCK_DRIVER:'Vozač kamiona uspešno dodat u sistem'})[role]);onSaved();if(!editing){setFields(blank());setIds([]);form.current?.querySelector('input')?.blur();}},onFailure(){lock.current=false;setBusy(false);showToast(editing ? 'Neuspešno ažuriranje podataka' : ({WORKER:'Neuspešno dodavanje radnika',SITE_MANAGER:'Neuspešno dodavanje šefa gradilišta',OPERATOR:'Neuspešno dodavanje bageriste',TRUCK_DRIVER:'Neuspešno dodavanje vozača kamiona'})[role]);}});
  }
  const field=(key,label,placeholder,type='text',readOnly=false)=><label className="admin-field" key={key}>{label}<input name={key} aria-label={label} {...errorProps(key)} type={type} value={fields[key]} readOnly={readOnly} required={label.endsWith('*')} placeholder={placeholder} inputMode={key==='hourly_rate'?'numeric':undefined} maxLength={key==='hourly_rate'?7:undefined} onChange={e=>change(key,key==='hourly_rate'?e.target.value.replace(/\D/g,'').slice(0,7):e.target.value)}/>{fieldError(key)}</label>;
  return <section className={"admin-screen admin-form admin-employee-form"+(editing?" admin-edit-employee":"")} data-role={role}><Title title={names[role][editing?1:0]} subtitle={editing?'Izmena podataka za '+names[role][2]+(manager?'.':' u sistemu.'):'Dodavanje novog '+(role===Role.OPERATOR?'bageriste':names[role][2])} icon={roleIcons[role]} onBack={()=>{if(!busy)onBack();}}/><form ref={form} noValidate onSubmit={submit} autoComplete="off"><div className="admin-employee-fields-scroll"><fieldset disabled={busy} className="admin-card admin-form-fields">{field('first_name',editing?'Ime':'Ime *','Unesite ime','text',editing)}{field('last_name',editing?'Prezime':'Prezime *','Unesite prezime','text',editing)}{!plain&&field('username',editing?'Korisničko ime':'Korisničko ime *','Unesite korisničko ime','text',editing)}{!plain&&!editing&&<Password value={fields.password} onChange={v=>change('password',v)} inputProps={errorProps('password')} error={fieldError('password')}/>}{manager&&<div className="admin-field admin-assigned-sites"><span>Dodeljena gradilišta *</span><button type="button" name="construction_site_ids" {...errorProps('construction_site_ids')} disabled={sites.loading} className={'admin-select-sites'+(!ids.length?' empty':'')} onClick={()=>{setDraft([...ids]);setPicker(true);}}>{sites.loading?'Učitavanje gradilišta...':sites.error?'Ponovo otvorite izbor gradilišta':ids.length?'Izabrano: '+ids.length:'Izaberite gradilišta'}<img className="app-chevron" src="/assets/drawable/ic_chevron_right.svg" alt="" /></button>{fieldError('construction_site_ids')}{ids.length>0&&<div className="admin-site-chips">{sites.data.filter(s=>ids.includes(s.getId())).map(s=><div key={s.getId()}><span>{s.getName()}</span><button type="button" disabled={sites.loading} aria-label={'Ukloni gradilište '+s.getName()} onClick={()=>setIds(ids.filter(id=>id!==s.getId()))}><img src="/assets/drawable/ic_close_yellow.svg" alt="" /></button></div>)}</div>}</div>}<div className="admin-field">Status<div className="admin-status">{[true,false].map(active=><button type="button" key={String(active)} aria-pressed={fields.is_active===active} onClick={()=>change('is_active',active)}>{active?'Aktivan':'Neaktivan'}</button>)}</div></div><label className="admin-field">Uloga<input readOnly value={roleLabels[role]}/></label>{!manager&&field('hourly_rate','Radni sat (RSD/h) *','Unesite iznos radnog sata')}{field('phone','Telefon (opciono)','Unesite telefon','tel')}{field('email','Email (opciono)','Unesite email','email')}</fieldset></div>{error&&<p role="alert" className="error-message">{error}</p>}<Toast message={notice} onDismiss={() => setNotice('')}/><footer><button className="admin-primary" disabled={busy} type="submit"><img src="/assets/drawable/ic_save.svg" alt=""/>{editing ? "Sačuvaj izmene" : "Sačuvaj " + names[role][2]}</button></footer></form>{picker&&<Modal className="admin-site-picker" title="Dodeljena gradilišta" onClose={()=>setPicker(false)} actions={<><button className="text-button" onClick={()=>setPicker(false)}>Otkaži</button><button className="text-button confirm-button" disabled={!draft.length} onClick={()=>{setIds(draft);setPicker(false);}}>Potvrdi</button></>}><p>Izaberite jedno ili više gradilišta.</p>{sites.error?<LoadFailureToast message="Učitavanje gradilišta nije uspelo."/>:sites.loading||!sites.data.length?<div className="admin-site-message">{sites.loading?'Učitavanje gradilišta...':sites.error?'Učitavanje gradilišta nije uspelo.':'Nema dostupnih gradilišta.'}</div>:<div className="admin-site-options">{sites.data.map(s=><label key={s.getId()} className={draft.includes(s.getId())?'selected':''}><input type="checkbox" checked={draft.includes(s.getId())} onChange={e=>setDraft(e.target.checked?[...draft,s.getId()]:draft.filter(id=>id!==s.getId()))}/><span className="admin-site-checkbox" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></span><span>{s.getName()}</span></label>)}</div>}</Modal>}</section>;
}
function Password({value,onChange,inputProps,error}) {const [show,setShow]=useState(false);return <label className="admin-field">Lozinka *<span className={'admin-password'+(error?' invalid':'')}><input name="password" aria-label="Lozinka *" {...inputProps} autoComplete="new-password" required type={show?'text':'password'} value={value} onChange={e=>onChange(e.target.value)}/><button type="button" aria-label={show?'Sakrij lozinku':'Prikaži lozinku'} onClick={()=>setShow(!show)}><img src={'/assets/material/'+(show?'visibility_off':'visibility')+'.svg'} alt="" width="24" height="24"/></button></span>{error}</label>;}


function employeeFieldError(key,value,required) {
  const text=String(value??'').trim();
  if(required&&(!text||text==='-'))return 'Obavezno polje.';
  if(key==='email'&&text&&!/^[a-zA-Z0-9+._%\-]{1,256}@[a-zA-Z0-9][a-zA-Z0-9\-]{0,64}(?:\.[a-zA-Z0-9][a-zA-Z0-9\-]{0,25})+$/.test(text))return 'Unesite ispravnu email adresu.';
  if(key==='hourly_rate'&&(!/^[+-]?\d+$/.test(text)||Number(text)<=0||Number(text)>2147483647))return 'Unesite iznos veći od 0.';
  return null;
}
