import LoadFailureToast from '../../LoadFailureToast.jsx';
import { withRsd } from '../../utils/MoneyDisplay.js';
import useForegroundRefresh from '../../ui/components/useForegroundRefresh.js';
import { showToast } from '../../ui/components/Toast.jsx';
import React,{useState,useRef} from 'react';
import Session from '../../network/Session.js';
import Modal from '../../ui/components/Modal.jsx';
import useBackLayer from '../../ui/components/useBackLayer.js';
import {Title,Notice,WorkerOwner,AdvanceDateRange,Summary,useLoad,mutate,today,money} from './AdminShared.jsx';
import {dateLabel} from '../../ui/components/AttendancePickers.jsx';
export default function AdminWorkerPaymentsActivity({worker,initialFrom,initialTo,onBack}) {
  const [from,setFrom]=useState(initialFrom),[to,setTo]=useState(initialTo),[version,setVersion]=useState(0),[editor,setEditor]=useState(false),[settle,setSettle]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');const lock=useRef(false);
  useForegroundRefresh(()=>setVersion(v=>v+1));
  const balance=useLoad(cb=>Session.getWorkerSalaryAdmin(worker.getId(),cb),[worker.getId(),version]);
  const payments=useLoad(cb=>Session.getWorkerPayments(from,to,worker.getId(),cb),[worker.getId(),from,to,version],[]);
  useBackLayer(editor,()=>setEditor(false),busy);
  function save(amount,note,date=today()){if(lock.current)return;lock.current=true;setBusy(true);setError('');mutate('POST','worker-payments',{worker_id:worker.getId(),amount,date,note},{onSuccess(){lock.current=false;setBusy(false);setEditor(false);setSettle(false);setVersion(v=>v+1);showToast('Uspešno evidentiranje isplate');},onFailure(){lock.current=false;setBusy(false);showToast('Neuspešno evidentiranje isplate');}});}
  if(editor)return <PaymentForm busy={busy} error={error} onBack={()=>setEditor(false)} onSave={save}/>;
  const b=balance.data;
  return <section className="admin-screen admin-payments"><Title title="ISPLATE" subtitle="Pregled isplata zaposlenom." icon="ic_payment" onBack={onBack}/><WorkerOwner worker={worker}/><AdvanceDateRange from={from} to={to} onChange={(a,b)=>{setFrom(a);setTo(b);}}/><h2>Ukupan obračun</h2><div className="admin-summary-grid"><Summary unit="" icon="ic_wallet_black" iconSize={18} label="Ukupna zarada" value={withRsd(money(b?.getEarned()))}/><Summary unit="" icon="ic_wallet_black" iconSize={18} label="Isplaćeno" value={withRsd(money(b?.getPayments()))} color="green"/><Summary unit="" icon="ic_wallet_black" iconSize={18} label="Akontacije" value={withRsd(money(b?.getAdvances()))} color="gold"/><Summary unit="" icon="ic_wallet_black" iconSize={18} label="Preostalo" value={withRsd(money(b?.getOutstanding()))} color="red"/></div><div className="admin-payment-actions"><button className="admin-primary" onClick={()=>{setError('');setEditor(true);}}>＋ Nova isplata</button><button disabled={busy||!(b?.getOutstanding()>0n)} onClick={()=>{setError('');setSettle(true);}}>✓ Izmiri saldo</button></div><h2>Isplate za period</h2>{balance.error&&<LoadFailureToast message="Učitavanje ukupnog dugovanja nije uspelo."/>}{payments.loading?<div className="admin-payments-loading" role="status" aria-label="Učitavanje isplata"><svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18"/></svg></div>:payments.error?<LoadFailureToast message="Učitavanje isplata nije uspelo."/>:!payments.data.length?<Notice>Nema evidentiranih isplata za izabrani period.</Notice>:payments.data.map(p=>{const note=p.getNote()?.trim();return <article className="admin-finance-row" key={p.getId()}><div><strong>{p.getDate()}</strong>{note&&note.toLowerCase()!=='null'&&<small>{note}</small>}</div><b>{money(p.getAmount())} RSD</b></article>;})}{settle&&<Modal className="admin-settle-dialog" title={<><span className="admin-settle-icon"><DoneAll/></span><span>Izmiri saldo</span></>} busy={busy} onClose={()=>setSettle(false)} actions={<><button className="text-button" disabled={busy} onClick={()=>setSettle(false)}>Otkaži</button><button className="text-button confirm-button" disabled={busy} onClick={()=>save(Number(b.getOutstanding()),'Izmirenje salda')}><DoneAll/>Izmiri</button></>}><p>Preostali iznos za isplatu će biti 0.</p>{error&&<p className="error-message">{error}</p>}</Modal>}</section>;
}
function DoneAll() {
  return <svg className="admin-done-all" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m18 7-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17l-4.18-4.17L6.07 13.41 11.66 19 23.66 7l-1.42-1.41zM.41 13.41 6 19l1.41-1.41L1.83 12 .41 13.41z"/></svg>;
}
function PaymentForm({busy,error,onBack,onSave}) {
  const [amount,setAmount]=useState(''),[date]=useState(today),[note,setNote]=useState(''),[touched,setTouched]=useState(false),[submitted,setSubmitted]=useState(false);
  const amountInput=useRef(null);
  const validation=paymentAmountError(amount);
  const visibleError=(touched||submitted)?validation:null;
  function submit(event) {
    event.preventDefault();
    if(busy)return;
    setSubmitted(true);
    if(validation){
      amountInput.current.focus({preventScroll:true});
      requestAnimationFrame(()=>amountInput.current?.closest('.admin-field').scrollIntoView({block:'nearest'}));
      return;
    }
    setSubmitted(false);setTouched(false);
    onSave(Number(amount.trim().replace(',','.')),note.trim(),date);
  }
  return <section className="admin-screen admin-form admin-payment-form"><Title title="NOVA ISPLATA" icon="ic_payment" onBack={()=>{if(!busy)onBack();}}/><form noValidate onSubmit={submit}><div className="admin-payment-fields-scroll"><fieldset className="admin-form-fields admin-card" disabled={busy}><label className="admin-field">Datum isplate<input aria-label="Datum isplate" readOnly value={dateLabel(date)}/></label><label className="admin-field">Iznos (RSD) *<input ref={amountInput} name="amount" aria-label="Iznos (RSD) *" placeholder="Unesite iznos" inputMode="decimal" required aria-invalid={!!visibleError} aria-describedby={visibleError?'payment-amount-error':undefined} value={amount} onChange={e=>setAmount(e.target.value)} onBlur={()=>setTouched(true)}/>{visibleError&&<span id="payment-amount-error" className="payment-field-error">{visibleError}</span>}</label><label className="admin-field">Napomena (opciono)<input aria-label="Napomena" placeholder="Unesite napomenu" value={note} onChange={e=>setNote(e.target.value)}/></label></fieldset></div>{error&&<p className="error-message" role="alert">{error}</p>}<footer><button type="button" disabled={busy} onClick={onBack}>Otkaži</button><button type="submit" className="admin-primary" disabled={busy}><img src="/assets/drawable/ic_save.svg" alt=""/>Sačuvaj</button></footer></form></section>;
}

// Android validates BigDecimal amounts as positive, exact cents within a Long.
function paymentAmountError(value) {
  const text=value.trim().replace(',','.');
  if(!text||text==='-')return 'Obavezno polje.';
  const invalid='Unesite ispravan iznos veći od 0.';
  const match=/^\+?(\d+(?:\.\d*)?|\.\d+)(?:[eE]([+-]?\d+))?$/.exec(text);
  if(!match)return invalid;
  const [whole,fraction='']=match[1].split('.');
  const digits=(whole+fraction).replace(/^0+/,'').replace(/0+$/,'');
  if(!digits)return invalid;
  const trailing=(whole+fraction).match(/0*$/)[0].length;
  const scale=Number(match[2]||0)-fraction.length+2+trailing;
  if(scale<0||digits.length+scale>19)return invalid;
  const cents=BigInt(digits)*10n**BigInt(scale);
  return cents>9223372036854775807n?invalid:null;
}
