import { showToast } from '../../ui/components/Toast.jsx';
import Toast from '../../ui/components/Toast.jsx';
import React, { useRef, useState } from 'react';
import Session from '../../network/Session.js';
import SelectionDropdown from '../../ui/components/SelectionDropdown.jsx';
import { dateLabel } from '../../ui/components/AttendancePickers.jsx';
import { Title, Icon, Notice, useLoad, mutate, today } from './AdminShared.jsx';
import './AdminTasksActivity.css';
import './AdminAddExpenseActivity.css';

// Send the decimal as a string, as Android's BigDecimal.toPlainString() does.
function plainAmount(value) {
  const match = /^\+?(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/.exec(value.trim().replace(',', '.'));
  if (!match || !/[1-9]/.test((match[1] || '') + (match[2] || ''))) return null;
  const whole = match[1] || '0';
  const fraction = match[2] || '';
  const digits = whole + fraction;
  const point = whole.length + Number(match[3] || 0);
  if (!Number.isSafeInteger(point) || Math.abs(point) > 10000) return null;
  const plain = point <= 0 ? '0.' + '0'.repeat(-point) + digits : point >= digits.length ? digits + '0'.repeat(point - digits.length) : digits.slice(0, point) + '.' + digits.slice(point);
  return plain.replace(/^0+(?=\d)/, '');
}
export default function AdminAddExpenseActivity({ onCancel, onBusy }) {
  const [site, setSite] = useState(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(today);
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const lock = useRef(false), form = useRef(null);
  const sites = useLoad(cb => Session.getAllSitesFromServer(cb), [], []);
  const parsed = plainAmount(amount);
  const nameError = !name.trim() || name === '-' ? 'Obavezno polje.' : '';
  const amountError = !amount.trim() || amount === '-' ? 'Obavezno polje.' : parsed === null ? 'Unesite ispravan iznos veći od 0.' : '';
  function submit(event) {
    event.preventDefault();
    if (lock.current) return;
    setSubmitted(true); setError(''); setNotice('');
    const firstInvalid = !site ? '.add-expense-site .selection-field'
      : nameError ? '[name="title"]' : amountError ? '[name="amount"]' : null;
    if (firstInvalid) {
      requestAnimationFrame(() => {
        const control = form.current?.querySelector(firstInvalid);
        control?.focus({ preventScroll: true });
        control?.scrollIntoView({ block: 'nearest' });
      });
      return;
    }
    setSubmitted(false); setTouched({});
    lock.current = true; setBusy(true); onBusy(true);
    mutate('POST', 'expenses', { construction_site_id: site.getId(), title: name.trim(), amount: parsed, date, description: description.trim() }, {
      onSuccess() {
        document.activeElement?.blur();
        setSite(null); setName(''); setAmount(''); setDescription(''); setDate(today()); setSubmitted(false); setTouched({});
        lock.current = false; setBusy(false); onBusy(false); setNotice('Uspešno dodavanje troška');
      },
      onFailure() { lock.current = false; setBusy(false); onBusy(false); showToast('Neuspešno dodavanje troška'); },
    });
  }
  return <form ref={form} className="admin-screen admin-add-expense" onSubmit={submit} noValidate>
    <Title title="NOVI TROŠAK" icon="ic_wallet_black"/>
    <div className="admin-add-expense-scroll">
      <fieldset className="admin-add-expense-fields" disabled={busy}>
        <div className={'admin-task-picker add-expense-site' + (!site ? ' placeholder' : '')}
          role="group" aria-label="Gradilište" aria-invalid={!!((submitted || touched.site) && !site)}
          aria-describedby={(submitted || touched.site) && !site ? 'expense-site-error' : undefined}
          onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setTouched(value => ({...value,site:true})); }}>
          <SelectionDropdown label="Gradilište *" placeholder="Izaberite gradilište" icon="ic_construction_site_crane" options={[...sites.data].sort((a,b) => Number(b.canSelect()) - Number(a.canSelect()))} selected={site} onSelected={setSite} disabled={busy} optionEnabled={option => option.canSelect()}/>
          {(submitted || touched.site) && !site && <small id="expense-site-error" className="error-message">Obavezno polje.</small>}
        </div>
        
        <label className="add-expense-field"><span>Naziv *</span><input name="title" placeholder="Unesite naziv" autoComplete="off" autoCapitalize="words" value={name} onChange={event => setName(event.target.value)} onBlur={() => setTouched(value => ({...value,name:true}))} aria-required="true" aria-invalid={!!((submitted || touched.name) && nameError)}/>{(submitted || touched.name) && nameError && <small className="error-message">{nameError}</small>}</label>
        <label className="add-expense-field"><span>Iznos (RSD) *</span><input name="amount" placeholder="Unesite iznos" inputMode="decimal" autoComplete="off" value={amount} onChange={event => setAmount(event.target.value)} onBlur={() => setTouched(value => ({...value,amount:true}))} aria-required="true" aria-invalid={!!((submitted || touched.amount) && amountError)}/>{(submitted || touched.amount) && amountError && <small className="error-message">{amountError}</small>}</label>
        <div className="add-expense-field"><span>Datum</span><div className="add-expense-date">{dateLabel(date)}</div></div>
        <label className="add-expense-field add-expense-description"><span>Opis (opciono)</span><textarea name="description" placeholder="Unesite opis" value={description} onChange={event => setDescription(event.target.value)}/></label>
      </fieldset>
      {error && <p className="error-message" role="alert">{error}</p>}
      <Toast message={notice} onDismiss={() => setNotice('')}/>
    </div>
    <footer className="add-expense-actions"><button type="button" disabled={busy} onClick={onCancel}>Otkaži</button><button type="submit" disabled={busy}><Icon name="ic_save"/>Sačuvaj</button></footer>
  </form>;
}
