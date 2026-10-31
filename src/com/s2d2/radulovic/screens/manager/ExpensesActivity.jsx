import { withRsd } from '../../utils/MoneyDisplay.js';
import { showToast } from '../../ui/components/Toast.jsx';
import useBackLayer from '../../ui/components/useBackLayer.js';
import React, { useEffect, useRef, useState } from 'react';
import Session from '../../network/Session.js';
import WebUtils from '../../network/WebUtils.js';
import DailyLogUtils from '../../dailylogs/DailyLogUtils.js';
import TimeUtils from '../../utils/TimeUtils.js';
import SelectionDropdown from '../../ui/components/SelectionDropdown.jsx';
import AuthenticatedImage from '../../ui/components/AuthenticatedImage.jsx';
import Modal from '../../ui/components/Modal.jsx';
import { dateLabel } from '../../ui/components/AttendancePickers.jsx';
import './DeliveryNotesActivity.css';
import './ExpensesActivity.css';

const amountInt = value => Math.trunc(Number(String(value).replace(',', '.'))) || 0;
const money = value => new Intl.NumberFormat('sr-RS').format(value);
const icon = name => '/assets/drawable/' + name + '.svg';
export default function ExpensesActivity({ onBack }) {
  const [site, setSite] = useState(() => Session.getDefaultConstructionSite());
  const [sites, setSites] = useState([]);
  const [log, setLog] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({ advanced: 0, spent: 0, remaining: 0, advances: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sitesError, setSitesError] = useState('');
  const [retry, setRetry] = useState(0);
  const [options, setOptions] = useState(false);
  const [editor, setEditor] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [preview, setPreview] = useState(null);
  useBackLayer(!!editor, () => { setEditor(null); setError(''); }, busy);
  const camera = useRef(null), gallery = useRef(null), lock = useRef(false), urls = useRef([]);
  const [date] = useState(() => TimeUtils.formatDate(new Date()));
  useEffect(() => () => urls.current.forEach(url => URL.revokeObjectURL(url)), []);
  useEffect(() => {
    let active = true;
    setSitesError('');
    Session.getAssignedSitesFromServer({
      onSuccess(items) { if (active) setSites([...items.filter(item => item.canSelect()), ...items.filter(item => !item.canSelect())]); },
      onFailure() { if (active) setSitesError('Učitavanje gradilišta nije uspelo.'); },
    });
    return () => { active = false; };
  }, [retry]);
  useEffect(() => {
    let active = true;
    setLog(null); setExpenses([]); setError(''); setLoading(!!site);
    setSummary({ advanced: 0, spent: 0, remaining: 0, advances: [] });
    const fail = () => { if (active) { setLoading(false); setError('Učitavanje troškova nije uspelo.'); } };
    if (site) DailyLogUtils.createOrUpdateDailyLog(site, date, {
      onSuccess(dailyLog) {
        if (!active) return;
        setLog(dailyLog);
        Session.getManagerExpensesForConstructionSite(dailyLog, {
          onSuccess(items) {
            if (!active) return;
            setExpenses(items.map(item => ({ id: item.getId(), name: item.getTitle(), description: item.getDescription(), amount: item.getAmount(),
              date: item.getDate(), image: item.getUrl(), dailyLog: item.getDailyLog() })));
            const value = Session.getExpensesSummary();
            setSummary({ advanced: value.getAdvanced(), spent: value.getSpent(), remaining: value.getRemaining(), advances: value.getListOfAdvances() });
            setLoading(false);
          }, onFailure: fail,
        });
      }, onFailure: fail,
    });
    return () => { active = false; };
  }, [site, date, retry]);
  function begin(file = null) {
    const image = file ? URL.createObjectURL(file) : '';
    if (image) urls.current.push(image);
    setOptions(false); setError(''); setEditor({ name: '', description: '', amount: '-', image, file });
  }
  function selected(event) {
    const file = event.target.files[0]; event.target.value = '';
    if (file) begin(file);
  }
  function changeTotal(difference) {
    setSummary(previous => ({ ...previous, spent: previous.spent + difference, remaining: previous.remaining - difference }));
  }
  function save(name, description, amount) {
    if (!name.trim() || !amount.trim() || amount === '-') { showToast('Naziv i iznos troska su obavezna polja.'); return; }
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    const fail = () => { lock.current = false; setBusy(false); setError('Čuvanje troška nije uspelo.'); };
    const done = () => { lock.current = false; setBusy(false); setEditor(null); };
    const descriptionValue = description.trim() ? description : '-';
    try {
      const dailyLog = editor.id ? editor.dailyLog : log;
      const endpoint = 'daily-logs/' + dailyLog.getDailyLogId() + '/expenses';
      const headers = { Authorization: Session.getSessionToken() };
      if (editor.id) {
        WebUtils.sendPATCHRequest(endpoint + '/' + editor.id, JSON.stringify({ title: name, description: descriptionValue, amount, reason: 'korisnik ažurirao' }), headers, {
          onSuccess() {
            setExpenses(previous => previous.map(item => item.id === editor.id ? { ...item, name, description: descriptionValue, amount } : item));
            changeTotal(amountInt(amount) - amountInt(editor.amount)); done();
          }, onFailure: fail,
        });
      } else {
        const body = new FormData();
        body.append('title', name); body.append('description', descriptionValue); body.append('amount', amount); body.append('date', dailyLog.getDailyLogDate());
        if (editor.file) body.append('attachments[]', editor.file, 'expense.' + (editor.file.name.split('.').pop() || 'jpg'));
        WebUtils.sendPOSTRequest(endpoint, body, headers, {
          onSuccess(response) {
            try {
              const data = JSON.parse(response).data;
              const created = { id: data.id, name: data.title ?? name, description: data.description ?? descriptionValue, amount: String(data.amount ?? amount),
                date: dateLabel((data.date ?? dailyLog.getDailyLogDate()).slice(0, 10)), image: data.attachments?.[0]?.download_url || editor.image, dailyLog };
              setExpenses(previous => [created, ...previous]); changeTotal(amountInt(created.amount)); done();
            } catch { fail(); }
          }, onFailure: fail,
        });
      }
    } catch { fail(); }
  }
  function remove() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    const fail = () => { lock.current = false; setBusy(false); setError('Brisanje troška nije uspelo.'); };
    try {
      WebUtils.sendDELETERequest('daily-logs/' + removing.dailyLog.getDailyLogId() + '/expenses/' + removing.id,
        JSON.stringify({ reason: 'korisnik obrisao' }), { Authorization: Session.getSessionToken() }, {
          onSuccess() { setExpenses(previous => previous.filter(item => item.id !== removing.id)); changeTotal(-amountInt(removing.amount)); lock.current = false; setBusy(false); },
          onFailure: fail,
        });
    } catch { fail(); }
    setRemoving(null);
  }
  return <>
    {editor ? <ExpenseForm expense={editor} busy={busy} error={error} onSave={save} onClose={() => { setEditor(null); setError(''); }} onPreview={() => setPreview(editor.image)} /> :
      <section className="manager-expenses">
        <ExpenseTitle title="TROŠKOVI" subtitle="Evidencija svih troškova na gradilištu." onBack={onBack} />
        <div className="expense-add-actions"><button disabled={!log || loading} onClick={() => { setError(''); setOptions(true); }}><img src={icon('ic_costs_camera')} alt="" />Dodaj novi trošak</button>
          <button disabled={!log || loading} onClick={() => gallery.current.click()}><img src={icon('ic_costs_gallery')} alt="" />Izaberite iz galerije</button></div>
        <div className="expense-site-picker manager-site-picker"><SelectionDropdown label="Gradilište" placeholder="Izaberite gradilište" icon="ic_construction_site_crane" options={sites} selected={site} onSelected={setSite} optionEnabled={item => item.canSelect()} disabled={busy} maxMenuHeight={180} /></div>
        
        <ExpenseSummary summary={summary} />
        <div className="expense-list"><h2>OPRAVDANI TROŠKOVI</h2>
          {loading || !expenses.length ? <p className="delivery-notice">{loading ? 'Učitavanje troškova...' : 'Nema troškova za izabrani period.'}</p> : <div className="expense-scroll">{expenses.map(item =>
            <article className="expense-row" key={item.id}>
              <button className="expense-thumb" aria-label={'Račun: ' + item.name} disabled={!item.image} onClick={() => setPreview(item.image)}><Receipt image={item.image} /></button>
              <button className="delivery-details" aria-label={'Izmeni: ' + item.name} onClick={() => { setError(''); setEditor(item); }}><strong>{item.name}</strong><span>{item.description}</span><small>{item.date}</small></button>
              <div className="expense-row-end"><strong>{withRsd(item.amount)}</strong><button className="delivery-delete" aria-label={'Obriši: ' + item.name} onClick={() => { setError(''); setRemoving(item); }}><img src={icon('ic_costs_trash')} alt="" /></button></div>
            </article>)}</div>}
        </div>
      </section>}
    <input ref={camera} type="file" accept="image/*" capture="environment" hidden aria-label="Slikaj račun" onChange={selected} onCancel={() => begin()} />
    <input ref={gallery} type="file" accept="image/*" hidden aria-label="Račun iz galerije" onChange={selected} />
    {options && <Modal className="expense-option-dialog" title="Dodaj novi trošak" onClose={() => setOptions(false)} actions={<button className="text-button" onClick={() => setOptions(false)}>Otkaži</button>}>
      <div className="expense-options"><button onClick={() => { setOptions(false); camera.current.click(); }}><img src={icon('ic_costs_camera')} alt="" />Slikaj račun</button>
        <button onClick={() => begin()}><img src={icon('ic_costs_gallery')} alt="" />Unesi trošak bez slike</button></div>
    </Modal>}
    {removing && <Modal className="expense-delete-dialog" title="Brisanje troška" busy={busy} onClose={() => { setRemoving(null); setError(''); }} actions={<><button className="text-button" disabled={busy} onClick={() => { setRemoving(null); setError(''); }}>Ne</button><button className="text-button confirm-button" disabled={busy} onClick={remove}>Da</button></>}>
      <p>Da li ste sigurni da želite da obrišete ovaj trošak</p>
    </Modal>}
    {preview && <ExpenseImagePreview image={preview} onClose={() => setPreview(null)} />}
  </>;
}
function ExpenseTitle({ title, subtitle, onBack, busy }) {
  return <header className="delivery-title expense-title"><span><img src={icon('ic_wallet_black')} alt="" /></span><div><h1>{title}</h1><p>{subtitle}</p></div></header>;
}
function Receipt({ image }) {
  return image ? <AuthenticatedImage url={image} /> : <img className="expense-placeholder" src={icon('ic_costs_gallery')} alt="" />;
}
function ExpenseForm({ expense, onSave, onClose, onPreview, busy, error }) {
  const [name, setName] = useState(expense.name), [description, setDescription] = useState(expense.description), [amount, setAmount] = useState(expense.amount);
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState({});
  const touch = key => setTouched(previous => ({ ...previous, [key]: true }));
  const nameRef = useRef(null), amountRef = useRef(null);
  const nameInvalid = !name.trim() || name === '-', amountInvalid = !amount.trim() || amount === '-';
  const nameError = (submitted || touched.name) && nameInvalid;
  const amountError = (submitted || touched.amount) && amountInvalid;
  function submit(event) {
    event.preventDefault();
    if (busy) return;
    setSubmitted(true);
    const control = nameInvalid ? nameRef.current : amountInvalid ? amountRef.current : null;
    if (control) {
      requestAnimationFrame(() => {
        control.focus({ preventScroll: true });
        control.scrollIntoView({ block: 'nearest' });
      });
      return;
    }
    setSubmitted(false); setTouched({});
    onSave(name, description, amount);
  }
  return <section className="delivery-note-form expense-form"><ExpenseTitle title={expense.id ? 'IZMENI TROŠAK' : 'NOVI TROŠAK'} subtitle="Unos računa i osnovnih podataka o trošku." onBack={onClose} busy={busy} />
    <form onSubmit={submit} noValidate><div className="delivery-form-card">
      <button type="button" className="delivery-form-image" disabled={!expense.image || busy} onClick={onPreview} aria-label="Prikaži račun"><Receipt image={expense.image} /></button>
      <label className="delivery-form-field">Naziv *<input ref={nameRef} aria-label="Naziv" value={name} onChange={event => setName(event.target.value)} disabled={busy} aria-required="true" aria-invalid={!!nameError} aria-describedby={nameError ? 'expense-name-error' : undefined} onBlur={() => touch('name')} autoCapitalize="sentences" />{nameError && <span id="expense-name-error" className="delivery-field-error">Obavezno polje.</span>}</label>
      <label className="delivery-form-field">Opis (opciono)<textarea aria-label="Opis" value={description} onChange={event => setDescription(event.target.value)} disabled={busy} autoCapitalize="sentences" /></label>
      <label className="delivery-form-field">Iznos (RSD) *<input ref={amountRef} aria-label="Iznos (RSD)" inputMode="decimal" value={amount} onChange={event => setAmount(event.target.value)} onFocus={() => { if (amount === '-') setAmount(''); }} onBlur={() => { if (!amount.trim()) setAmount('-'); touch('amount'); }} disabled={busy} aria-required="true" aria-invalid={!!amountError} aria-describedby={amountError ? 'expense-amount-error' : undefined} />{amountError && <span id="expense-amount-error" className="delivery-field-error">Obavezno polje.</span>}</label>
      
    </div><div className="delivery-form-actions"><button type="button" onClick={onClose} disabled={busy}>Otkaži</button><button className="delivery-save" type="submit" disabled={busy}><img src={icon('ic_save')} alt="" />{busy ? 'Čuvanje...' : 'Sačuvaj'}</button></div></form>
  </section>;
}
function ExpenseSummary({ summary }) {
  const [open, setOpen] = useState(false);
  useBackLayer(open, () => setOpen(false));
  const root = useRef(null);
  useEffect(() => {
    if (!open) return;
    function close(event) { if (!root.current.contains(event.target)) setOpen(false); }
    function key(event) { if (event.key === 'Escape') setOpen(false); }
    document.addEventListener('pointerdown', close); document.addEventListener('keydown', key);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', key); };
  }, [open]);
  return <div className="expense-summary">
    <div className="expense-advanced"><img src={icon('ic_costs_wallet_blue')} alt="" /><h3>ZADUŽEN NOVAC</h3><strong>{money(summary.advanced)}</strong><small>RSD</small>
      <div className="expense-advances" ref={root}><button aria-expanded={open} onClick={() => setOpen(value => !value)}>Zaduženja<img src={icon(open ? 'ic_chevron_down' : 'ic_chevron_right')} alt="" /></button>
        {open && <div className="expense-advances-popup"><div><span>Datum</span><span>Iznos</span></div><section>{summary.advances.map((entry, index) => <div key={index}><span>{entry.first}</span><strong>{money(amountInt(entry.second))} RSD</strong></div>)}</section></div>}
      </div>
    </div>
    <div className="expense-spent"><img src={icon('ic_costs_receipt_green')} alt="" /><h3>OPRAVDANI TROŠKOVI</h3><strong>{money(summary.spent)}</strong><small>RSD</small><div className="expense-remaining"><span>Razlika</span><strong>{money(summary.remaining)} RSD</strong></div></div>
  </div>;
}
function ExpenseImagePreview({ image, onClose }) {
  useBackLayer(true, onClose);
  const dialog = useRef(null);
  useEffect(() => { const element = dialog.current; element.showModal(); return () => element.close(); }, []);
  return <dialog ref={dialog} className="delivery-image-preview expense-image-preview" aria-label="Račun troška" onCancel={event => { event.preventDefault(); onClose(); }}><AuthenticatedImage url={image} /><button aria-label="Zatvori" onClick={onClose}><img src={icon('ic_close_yellow')} alt="" /></button></dialog>;
}
